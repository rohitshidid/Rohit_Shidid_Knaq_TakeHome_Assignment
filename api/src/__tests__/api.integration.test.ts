import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { prisma } from '../db';
import { runIngest } from '../ingest/run';

const ALICE = 'Bearer tok_alice_brookfield'; // Brookfield Properties

let app: FastifyInstance;

beforeAll(async () => {
  // Deterministic state: rebuild alerts (all `new`) from the source messages.
  await prisma.alert.deleteMany({});
  await runIngest();
  app = buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('auth + multi-tenancy', () => {
  it('rejects a missing token with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/alerts' });
    expect(res.statusCode).toBe(401);
  });

  it('scopes the alert list to the caller company', async () => {
    const res = await app.inject({ method: 'GET', url: '/alerts', headers: { authorization: ALICE } });
    expect(res.statusCode).toBe(200);
    const alerts = res.json() as { company: string }[];
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.company === 'Brookfield Properties')).toBe(true);
  });

  it('404s a device owned by another company', async () => {
    // ELV-003 belongs to Hines, not Brookfield.
    const res = await app.inject({ method: 'GET', url: '/devices/ELV-003', headers: { authorization: ALICE } });
    expect(res.statusCode).toBe(404);
  });
});

describe('status transitions (server-enforced)', () => {
  async function firstNewAlertId(): Promise<string> {
    const res = await app.inject({ method: 'GET', url: '/alerts?status=new', headers: { authorization: ALICE } });
    return (res.json() as { id: string }[])[0]!.id;
  }

  it('acknowledges a new alert, then 409s a second acknowledge', async () => {
    const id = await firstNewAlertId();

    const ack1 = await app.inject({ method: 'POST', url: `/alerts/${id}/acknowledge`, headers: { authorization: ALICE } });
    expect(ack1.statusCode).toBe(200);
    expect((ack1.json() as { status: string }).status).toBe('acknowledged');

    const ack2 = await app.inject({ method: 'POST', url: `/alerts/${id}/acknowledge`, headers: { authorization: ALICE } });
    expect(ack2.statusCode).toBe(409);
  });

  it('409s resolving a new alert (must acknowledge first)', async () => {
    const id = await firstNewAlertId();
    const res = await app.inject({
      method: 'POST',
      url: `/alerts/${id}/resolve`,
      headers: { authorization: ALICE, 'content-type': 'application/json' },
      payload: { resolution_type: 'fixed', root_cause: 'x', action_taken: 'y' },
    });
    expect(res.statusCode).toBe(409);
  });
});
