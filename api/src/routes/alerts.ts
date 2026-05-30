import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { AppError } from '../errors';
import { Prisma } from '../generated/prisma/client';

const SEVERITIES = ['warning', 'critical'] as const;
const STATUSES = ['new', 'acknowledged', 'resolved', 'dismissed'] as const;
type Severity = (typeof SEVERITIES)[number];
type Status = (typeof STATUSES)[number];

// Accept both repeated params (?severity=a&severity=b) and comma lists (?severity=a,b).
function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => String(x).split(','));
  if (typeof v === 'string') return v.split(',');
  return [];
}
const clean = (xs: string[]): string[] => xs.map((s) => s.trim()).filter(Boolean);

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

// Accept epoch-ms or ISO-8601; reject anything else with a 400.
function parseDate(v: unknown, field: string): Date | undefined {
  const s = str(v);
  if (!s) return undefined;
  const ms = /^\d+$/.test(s) ? Number(s) : Date.parse(s);
  if (Number.isNaN(ms)) throw new AppError(400, 'bad_request', `Invalid '${field}' date: ${s}`);
  return new Date(ms);
}

// Fields the queue needs alongside each alert.
const alertInclude = {
  device: { select: { id: true, name: true, location: true, type: true, company: true } },
  assignedTo: { select: { id: true, name: true, role: true } },
} satisfies Prisma.AlertInclude;

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.get('/alerts', { preHandler: authenticate }, async (request) => {
    const query = request.query as Record<string, unknown>;

    const severities = clean(toList(query['severity']));
    for (const s of severities) {
      if (!SEVERITIES.includes(s as Severity)) throw new AppError(400, 'bad_request', `Invalid severity: ${s}`);
    }
    const statuses = clean(toList(query['status']));
    for (const s of statuses) {
      if (!STATUSES.includes(s as Status)) throw new AppError(400, 'bad_request', `Invalid status: ${s}`);
    }

    const deviceId = str(query['device_id']);
    const assignedTo = str(query['assigned_to']);
    const search = str(query['q']);
    const from = parseDate(query['from'], 'from');
    const to = parseDate(query['to'], 'to');

    // Always scoped to the caller's company.
    const where: Prisma.AlertWhereInput = { company: request.user.company };
    if (severities.length > 0) where.severity = { in: severities as Severity[] };
    if (statuses.length > 0) where.status = { in: statuses as Status[] };
    if (deviceId) where.deviceId = deviceId;
    if (assignedTo === 'unassigned') where.assignedToId = null;
    else if (assignedTo) where.assignedToId = assignedTo;
    if (search) {
      where.OR = [
        { alertType: { contains: search, mode: 'insensitive' } },
        { deviceId: { contains: search, mode: 'insensitive' } },
        { device: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (from || to) {
      const range: Prisma.DateTimeFilter = {};
      if (from) range.gte = from;
      if (to) range.lte = to;
      where.triggeredAt = range;
    }

    return prisma.alert.findMany({
      where,
      include: alertInclude,
      orderBy: [{ severity: 'desc' }, { triggeredAt: 'desc' }], // critical first, newest first
    });
  });
}
