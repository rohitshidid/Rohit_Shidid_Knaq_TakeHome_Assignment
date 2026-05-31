import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { AppError } from '../errors';
import { Prisma } from '../generated/prisma/client';
import { z } from 'zod';
import { acknowledgeAlert, assignAlert, resolveAlert, addNote } from '../services/triage';

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

// Request-body schemas for the mutations.
const assignBody = z.object({ assignee_id: z.string().min(1), note: z.string().optional() });
const resolveBody = z.object({
  resolution_type: z.enum(['fixed', 'false_alarm', 'known_issue', 'deferred', 'cannot_reproduce']),
  root_cause: z.string().min(1),
  action_taken: z.string().min(1),
  preventive_measures: z.string().optional(),
  time_spent_minutes: z.number().int().nonnegative().optional(),
});
const noteBody = z.object({ note: z.string().min(1) });
const bulkAckBody = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) });
const bulkAssignBody = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  assignee_id: z.string().min(1),
  note: z.string().optional(),
});

interface BulkResult {
  requested: number;
  succeeded: string[];
  failed: { id: string; code: string; message: string }[];
}

function zodMsg(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`).join('; ');
}

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

  app.get('/alerts/:id', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const alert = await prisma.alert.findFirst({
      where: { id, company: request.user.company },
      include: {
        device: {
          select: { id: true, name: true, location: true, type: true, company: true, timezone: true },
        },
        assignedTo: { select: { id: true, name: true, role: true } },
        timeline: { orderBy: { timestamp: 'asc' } },
      },
    });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    return alert;
  });

  // --- Triage mutations: return the updated alert, enforce transitions server-side ---

  app.post('/alerts/:id/acknowledge', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    return acknowledgeAlert(id, request.user);
  });

  app.post('/alerts/:id/assign', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const body = assignBody.safeParse(request.body);
    if (!body.success) throw new AppError(400, 'bad_request', zodMsg(body.error));
    return assignAlert(id, request.user, { assigneeId: body.data.assignee_id, note: body.data.note });
  });

  app.post('/alerts/:id/resolve', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const body = resolveBody.safeParse(request.body);
    if (!body.success) throw new AppError(400, 'bad_request', zodMsg(body.error));
    return resolveAlert(id, request.user, {
      resolutionType: body.data.resolution_type,
      rootCause: body.data.root_cause,
      actionTaken: body.data.action_taken,
      preventiveMeasures: body.data.preventive_measures,
      timeSpentMinutes: body.data.time_spent_minutes,
    });
  });

  app.post('/alerts/:id/notes', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const body = noteBody.safeParse(request.body);
    if (!body.success) throw new AppError(400, 'bad_request', zodMsg(body.error));
    return addNote(id, request.user, body.data.note);
  });

  // --- Bulk mutations: apply per item, report partial success (200) ---

  app.post('/alerts/bulk/acknowledge', { preHandler: authenticate }, async (request): Promise<BulkResult> => {
    const body = bulkAckBody.safeParse(request.body);
    if (!body.success) throw new AppError(400, 'bad_request', zodMsg(body.error));

    const succeeded: string[] = [];
    const failed: BulkResult['failed'] = [];
    for (const id of body.data.ids) {
      try {
        await acknowledgeAlert(id, request.user);
        succeeded.push(id);
      } catch (e) {
        if (e instanceof AppError) failed.push({ id, code: e.code, message: e.message });
        else throw e;
      }
    }
    return { requested: body.data.ids.length, succeeded, failed };
  });

  app.post('/alerts/bulk/assign', { preHandler: authenticate }, async (request): Promise<BulkResult> => {
    const body = bulkAssignBody.safeParse(request.body);
    if (!body.success) throw new AppError(400, 'bad_request', zodMsg(body.error));

    // Validate the (shared) assignee once for a clean error.
    const assignee = await prisma.user.findFirst({
      where: { id: body.data.assignee_id, company: request.user.company },
    });
    if (!assignee) throw new AppError(400, 'bad_request', 'assignee_id is not a user in your company');

    const succeeded: string[] = [];
    const failed: BulkResult['failed'] = [];
    for (const id of body.data.ids) {
      try {
        await assignAlert(id, request.user, { assigneeId: body.data.assignee_id, note: body.data.note });
        succeeded.push(id);
      } catch (e) {
        if (e instanceof AppError) failed.push({ id, code: e.code, message: e.message });
        else throw e;
      }
    }
    return { requested: body.data.ids.length, succeeded, failed };
  });
}
