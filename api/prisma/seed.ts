import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { prisma } from '../src/db';
import type { DeviceType } from '../src/generated/prisma/enums';

/** Shape of one entry in data/devices.json (snake_case as provided). */
interface DeviceJson {
  device_id: string;
  type: DeviceType;
  company: string;
  name: string;
  location: string;
  timezone: string;
  floor_count?: number;
  installed_date: string;
  reading_types: string[];
  alert_thresholds: Record<string, number>;
}

// Read the device registry from the repo-root data/ folder.
const here = dirname(fileURLToPath(import.meta.url)); // api/prisma
const devicesPath = resolve(here, '../../data/devices.json'); // repo-root/data
const devices = JSON.parse(readFileSync(devicesPath, 'utf8')) as DeviceJson[];

// 6 seeded users across the 3 companies. Alice is the frontend's "current user"
// (token matches NEXT_PUBLIC_API_TOKEN in .env.example).
const users = [
  { name: 'Alice Chen', role: 'Building Manager', company: 'Brookfield Properties', token: 'tok_alice_brookfield' },
  { name: 'Bob Martinez', role: 'Field Technician', company: 'Brookfield Properties', token: 'tok_bob_brookfield' },
  { name: 'Carol Nguyen', role: 'Building Manager', company: 'Hines', token: 'tok_carol_hines' },
  { name: 'Dan Okafor', role: 'Field Technician', company: 'Hines', token: 'tok_dan_hines' },
  { name: 'Emi Tanaka', role: 'Building Manager', company: 'Mitsui Fudosan', token: 'tok_emi_mitsui' },
  { name: 'Frank Mueller', role: 'Field Technician', company: 'Mitsui Fudosan', token: 'tok_frank_mitsui' },
];

async function main() {
  // Devices — upsert so re-running the seed is idempotent.
  for (const d of devices) {
    const data = {
      type: d.type,
      company: d.company,
      name: d.name,
      location: d.location,
      timezone: d.timezone,
      floorCount: d.floor_count ?? null,
      installedDate: new Date(d.installed_date),
      readingTypes: d.reading_types,
      alertThresholds: d.alert_thresholds,
    };
    await prisma.device.upsert({
      where: { id: d.device_id },
      update: data,
      create: { id: d.device_id, ...data },
    });
  }

  // Users — upsert on the unique token.
  for (const u of users) {
    await prisma.user.upsert({
      where: { token: u.token },
      update: { name: u.name, role: u.role, company: u.company },
      create: u,
    });
  }

  const [deviceTotal, userTotal] = await Promise.all([
    prisma.device.count(),
    prisma.user.count(),
  ]);

  console.log(`Devices seeded: ${devices.length} (total in db: ${deviceTotal})`);
  console.log(`Users seeded:   ${users.length} (total in db: ${userTotal})`);
  console.table(users.map((u) => ({ name: u.name, company: u.company, token: u.token })));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
