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
} from './validate';

// api/src/ingest → repo-root/data/sensor_messages.json (three levels up)
const here = dirname(fileURLToPath(import.meta.url));
const messagesPath = resolve(here, '../../../data/sensor_messages.json');

async function loadDeviceMap(): Promise<Map<string, DeviceInfo>> {
  const devices = await prisma.device.findMany({ select: { id: true, readingTypes: true } });
  return new Map(devices.map((d) => [d.id, { readingTypes: d.readingTypes }]));
}

export async function runIngest(): Promise<void> {
  const raw = JSON.parse(readFileSync(messagesPath, 'utf8')) as RawMessage[];

  const devices = await loadDeviceMap();
  if (devices.size === 0) {
    throw new Error('No devices in the DB — run `npm run seed` before ingest.');
  }

  // Idempotency: clear the previous run's dead-letter rows. (Valid rows will
  // dedup on their content hash when we store them in 1.4 / 1.5.)
  await prisma.rejectedMessage.deleteMany({});

  const valid: Normalized[] = [];
  const rejected: { raw: RawMessage; reason: string }[] = [];

  for (const msg of raw) {
    const result = validateMessage(msg, devices);
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

  // TODO (1.4): store readings — dedup on content hash + flag threshold breaches.
  // TODO (1.5): store alerts + link recoveries to open alerts.

  printSummary(raw.length, valid, rejected);
}

function printSummary(
  total: number,
  valid: Normalized[],
  rejected: { reason: string }[],
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
}
