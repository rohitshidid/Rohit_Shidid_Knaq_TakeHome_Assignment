import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import {
  validateMessage,
  type RawMessage,
  type DeviceInfo,
  type Normalized,
  type NormalizedReading,
  type NormalizedAlert,
} from './validate';
import { storeReadings, type ReadingStoreResult } from './readings';
import { storeAlerts, type AlertStoreResult } from './alerts';

// api/src/ingest → repo-root/data/sensor_messages.json (three levels up)
const here = dirname(fileURLToPath(import.meta.url));
const messagesPath = resolve(here, '../../../data/sensor_messages.json');

export async function runIngest(): Promise<void> {
  const raw = JSON.parse(readFileSync(messagesPath, 'utf8')) as RawMessage[];

  const devicesRaw = await prisma.device.findMany({
    select: { id: true, company: true, readingTypes: true, alertThresholds: true },
  });
  if (devicesRaw.length === 0) {
    throw new Error('No devices in the DB — run `npm run seed` before ingest.');
  }
  const deviceInfo = new Map<string, DeviceInfo>(
    devicesRaw.map((d) => [d.id, { readingTypes: d.readingTypes }]),
  );
  const thresholdsByDevice = new Map<string, Record<string, number>>(
    devicesRaw.map((d) => [d.id, d.alertThresholds as Record<string, number>]),
  );
  const companyByDevice = new Map<string, string>(devicesRaw.map((d) => [d.id, d.company]));

  // Idempotency: clear the previous run's dead-letter rows.
  await prisma.rejectedMessage.deleteMany({});

  const valid: Normalized[] = [];
  const rejected: { raw: RawMessage; reason: string }[] = [];

  for (const msg of raw) {
    const result = validateMessage(msg, deviceInfo);
    if (result.ok) valid.push(result.value);
    else rejected.push({ raw: msg, reason: result.reason });
  }

  // Persist the dead-letter — log malformed messages, never drop them.
  if (rejected.length > 0) {
    await prisma.rejectedMessage.createMany({
      data: rejected.map((r) => ({
        raw: r.raw as Prisma.InputJsonValue,
        reason: r.reason,
        messageType: typeof r.raw['message_type'] === 'string' ? (r.raw['message_type'] as string) : null,
        deviceId: typeof r.raw['device_id'] === 'string' ? (r.raw['device_id'] as string) : null,
      })),
    });
  }

  // Store readings (dedup + breach flag).
  const readings = valid.filter((v): v is NormalizedReading => v.kind === 'reading');
  const readingResult = await storeReadings(readings, thresholdsByDevice);

  // Store alerts + link recoveries to the open alerts they close.
  const alertMsgs = valid.filter((v): v is NormalizedAlert => v.kind === 'alert');
  const recoveryMsgs = valid.filter((v): v is NormalizedAlert => v.kind === 'recovery');
  const alertResult = await storeAlerts(alertMsgs, recoveryMsgs, companyByDevice);

  printSummary(raw.length, valid, rejected, readingResult, alertResult);
}

function printSummary(
  total: number,
  valid: Normalized[],
  rejected: { reason: string }[],
  readingResult: ReadingStoreResult,
  alertResult: AlertStoreResult,
): void {
  const readings = valid.filter((v) => v.kind === 'reading').length;
  const alerts = valid.filter((v) => v.kind === 'alert').length;
  const recoveries = valid.filter((v) => v.kind === 'recovery').length;

  const reasons = new Map<string, number>();
  for (const r of rejected) reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1);

  console.log('Ingest summary');
  console.log(`  total messages : ${total}`);
  console.log(`  valid          : ${valid.length}  (readings ${readings}, alerts ${alerts}, recoveries ${recoveries})`);
  console.log(`  rejected       : ${rejected.length}`);
  if (reasons.size > 0) {
    console.log('  rejected reasons:');
    for (const [reason, count] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${count} x  ${reason}`);
    }
  }
  console.log(
    `  readings rows  : stored ${readingResult.stored}, deduped ${readingResult.deduped}, breaches ${readingResult.breaches}`,
  );
  console.log(
    `  alerts         : stored ${alertResult.stored}, recoveries linked ${alertResult.recoveriesLinked}, orphan recoveries ${alertResult.orphanRecoveries}`,
  );
}
