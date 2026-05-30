import { createHash } from 'node:crypto';
import { prisma } from '../db';
import type { NormalizedReading } from './validate';

interface ReadingRow {
  deviceId: string;
  metric: string;
  value: number;
  tsUtc: Date;
  isBreach: boolean;
  breachBound: string | null;
  breachLimit: number | null;
  contentHash: string;
}

export interface ReadingStoreResult {
  stored: number;
  deduped: number;
  breaches: number;
}

/** Stable dedup key for one metric sample. Same device+metric+instant+value = dup. */
function hashRow(deviceId: string, metric: string, tsMs: number, value: number): string {
  return createHash('sha1').update(`${deviceId}|${metric}|${tsMs}|${value}`).digest('hex');
}

/** Compare a value to the device's `<metric>_high` / `<metric>_low` thresholds. */
function computeBreach(
  metric: string,
  value: number,
  thresholds: Record<string, number>,
): { isBreach: boolean; breachBound: string | null; breachLimit: number | null } {
  const high = thresholds[`${metric}_high`];
  const low = thresholds[`${metric}_low`];
  if (typeof high === 'number' && value > high) return { isBreach: true, breachBound: 'high', breachLimit: high };
  if (typeof low === 'number' && value < low) return { isBreach: true, breachBound: 'low', breachLimit: low };
  return { isBreach: false, breachBound: null, breachLimit: null };
}

/**
 * Expand reading messages to one row per metric, dedup on content hash, flag
 * threshold breaches, and store. Readings are raw append-only signal with no
 * human state, so we rebuild the table each run (idempotent + deterministic).
 */
export async function storeReadings(
  readings: NormalizedReading[],
  thresholdsByDevice: Map<string, Record<string, number>>,
): Promise<ReadingStoreResult> {
  const byHash = new Map<string, ReadingRow>();
  let expanded = 0;

  for (const r of readings) {
    const thresholds = thresholdsByDevice.get(r.deviceId) ?? {};
    for (const input of r.inputs) {
      expanded += 1;
      const breach = computeBreach(input.metric, input.value, thresholds);
      const contentHash = hashRow(r.deviceId, input.metric, r.tsMs, input.value);
      // Identical hash overwrites with identical data → in-batch dedup.
      byHash.set(contentHash, {
        deviceId: r.deviceId,
        metric: input.metric,
        value: input.value,
        tsUtc: new Date(r.tsMs),
        contentHash,
        ...breach,
      });
    }
  }

  const rows = [...byHash.values()];

  await prisma.sensorReading.deleteMany({});
  await prisma.sensorReading.createMany({ data: rows });

  return {
    stored: rows.length,
    deduped: expanded - rows.length,
    breaches: rows.filter((row) => row.isBreach).length,
  };
}
