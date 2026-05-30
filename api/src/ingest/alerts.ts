import { createHash } from 'node:crypto';
import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import type { NormalizedAlert } from './validate';

interface AlertRec {
  deviceId: string;
  company: string;
  alertType: string;
  severity: 'warning' | 'critical';
  threshold: number | null;
  readingValue: number | null;
  readingName: string | null;
  triggeredAt: number; // epoch ms
  recoveredAt: number | null; // epoch ms once linked
  contentHash: string;
}

export interface AlertStoreResult {
  stored: number;
  recoveriesLinked: number;
  orphanRecoveries: number;
}

/** Dedup key for an alert: same device + type + instant + severity = duplicate. */
function alertHash(deviceId: string, alertType: string, tsMs: number, severity: string): string {
  return createHash('sha1').update(`${deviceId}|${alertType}|${tsMs}|${severity}`).digest('hex');
}

const groupKey = (deviceId: string, alertType: string): string => `${deviceId}|${alertType}`;

/**
 * Turn device alerts into Alert rows (status defaults to `new`, with a `created`
 * timeline entry) and link recoveries to the open alert they close. Upserts on
 * the content hash so re-ingesting never wipes accumulated triage state.
 */
export async function storeAlerts(
  alerts: NormalizedAlert[],
  recoveries: NormalizedAlert[],
  companyByDevice: Map<string, string>,
): Promise<AlertStoreResult> {
  // Group alerts by device+type, oldest-first.
  const groups = new Map<string, AlertRec[]>();
  for (const a of alerts) {
    const rec: AlertRec = {
      deviceId: a.deviceId,
      company: companyByDevice.get(a.deviceId) ?? 'UNKNOWN',
      alertType: a.alertType,
      severity: a.severity,
      threshold: a.threshold,
      readingValue: a.readingValue,
      readingName: a.readingName,
      triggeredAt: a.tsMs,
      recoveredAt: null,
      contentHash: alertHash(a.deviceId, a.alertType, a.tsMs, a.severity),
    };
    const arr = groups.get(groupKey(a.deviceId, a.alertType));
    if (arr) arr.push(rec);
    else groups.set(groupKey(a.deviceId, a.alertType), [rec]);
  }
  for (const recs of groups.values()) recs.sort((x, y) => x.triggeredAt - y.triggeredAt);

  // Match each recovery (oldest-first) to the earliest still-open alert before it.
  const recoveriesByKey = new Map<string, number[]>();
  for (const r of recoveries) {
    const arr = recoveriesByKey.get(groupKey(r.deviceId, r.alertType));
    if (arr) arr.push(r.tsMs);
    else recoveriesByKey.set(groupKey(r.deviceId, r.alertType), [r.tsMs]);
  }

  let recoveriesLinked = 0;
  let orphanRecoveries = 0;
  for (const [k, tsList] of recoveriesByKey) {
    const recs = groups.get(k) ?? [];
    for (const ts of [...tsList].sort((a, b) => a - b)) {
      const target = recs.find((ar) => ar.recoveredAt === null && ar.triggeredAt <= ts);
      if (target) {
        target.recoveredAt = ts;
        recoveriesLinked += 1;
      } else {
        orphanRecoveries += 1; // recovery with no open alert before it
      }
    }
  }

  // Upsert. Create seeds the timeline; update refreshes raw fields + recovered_at
  // only — status / assignee / resolution / timeline are left untouched.
  let stored = 0;
  for (const recs of groups.values()) {
    for (const ar of recs) {
      const recoveredAt = ar.recoveredAt === null ? null : new Date(ar.recoveredAt);
      const timeline: Prisma.AlertTimelineCreateWithoutAlertInput[] = [
        { action: 'created', timestamp: new Date(ar.triggeredAt) },
      ];
      if (recoveredAt) {
        timeline.push({
          action: 'recovered',
          timestamp: recoveredAt,
          note: 'Device reported the condition cleared',
        });
      }

      const rawFields = {
        deviceId: ar.deviceId,
        company: ar.company,
        alertType: ar.alertType,
        severity: ar.severity,
        threshold: ar.threshold,
        readingValue: ar.readingValue,
        readingName: ar.readingName,
        triggeredAt: new Date(ar.triggeredAt),
        recoveredAt,
      };

      await prisma.alert.upsert({
        where: { contentHash: ar.contentHash },
        update: rawFields,
        create: { ...rawFields, contentHash: ar.contentHash, timeline: { create: timeline } },
      });
      stored += 1;
    }
  }

  return { stored, recoveriesLinked, orphanRecoveries };
}
