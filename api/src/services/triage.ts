import { prisma } from '../db';
import { AppError } from '../errors';
import { Prisma } from '../generated/prisma/client';
import type { AuthedUser } from '../auth';

/** Everything a mutation returns: the updated alert + device, assignee, timeline. */
export const alertDetailInclude = {
  device: { select: { id: true, name: true, location: true, type: true, company: true, timezone: true } },
  assignedTo: { select: { id: true, name: true, role: true } },
  timeline: { orderBy: { timestamp: 'asc' } },
} satisfies Prisma.AlertInclude;

export type AlertDetail = Prisma.AlertGetPayload<{ include: typeof alertDetailInclude }>;

export interface AssignInput {
  assigneeId: string;
  note?: string;
}
export interface ResolveInput {
  resolutionType: 'fixed' | 'false_alarm' | 'known_issue' | 'deferred' | 'cannot_reproduce';
  rootCause: string;
  actionTaken: string;
  preventiveMeasures?: string;
  timeSpentMinutes?: number;
}

function conflict(message: string): never {
  throw new AppError(409, 'conflict', message);
}

// Each mutation runs in a transaction: load (company-scoped) → check the
// transition → update + append a timeline entry, all atomically.

export async function acknowledgeAlert(id: string, user: AuthedUser): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    if (alert.status !== 'new') conflict(`Cannot acknowledge an alert in status '${alert.status}'`);

    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledgedAt: now,
        timeline: { create: { action: 'acknowledged', userName: user.name, timestamp: now } },
      },
      include: alertDetailInclude,
    });
  });
}

export async function assignAlert(id: string, user: AuthedUser, input: AssignInput): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    if (alert.status === 'resolved' || alert.status === 'dismissed') {
      conflict(`Cannot assign an alert in status '${alert.status}'`);
    }

    const assignee = await tx.user.findFirst({ where: { id: input.assigneeId, company: user.company } });
    if (!assignee) throw new AppError(400, 'bad_request', 'assignee_id is not a user in your company');

    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        assignedToId: assignee.id, // status intentionally unchanged
        timeline: {
          create: {
            action: 'assigned',
            userName: user.name,
            timestamp: now,
            note: input.note ?? null,
            details: { assigneeId: assignee.id, assigneeName: assignee.name },
          },
        },
      },
      include: alertDetailInclude,
    });
  });
}

export async function resolveAlert(id: string, user: AuthedUser, input: ResolveInput): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    if (alert.status !== 'acknowledged') {
      conflict(`Cannot resolve an alert in status '${alert.status}' (acknowledge it first)`);
    }

    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: now,
        resolutionType: input.resolutionType,
        resolutionRootCause: input.rootCause,
        resolutionActionTaken: input.actionTaken,
        resolutionPreventiveMeasures: input.preventiveMeasures ?? null,
        resolutionTimeSpentMinutes: input.timeSpentMinutes ?? null,
        timeline: {
          create: {
            action: 'resolved',
            userName: user.name,
            timestamp: now,
            details: { resolutionType: input.resolutionType },
          },
        },
      },
      include: alertDetailInclude,
    });
  });
}

export async function addNote(id: string, user: AuthedUser, note: string): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);

    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        timeline: { create: { action: 'note', userName: user.name, timestamp: now, note } },
      },
      include: alertDetailInclude,
    });
  });
}

export async function dismissAlert(id: string, user: AuthedUser, note?: string): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    if (alert.status !== 'new' && alert.status !== 'acknowledged') {
      conflict(`Cannot dismiss an alert in status '${alert.status}'`);
    }

    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        status: 'dismissed',
        timeline: { create: { action: 'dismissed', userName: user.name, timestamp: now, note: note ?? null } },
      },
      include: alertDetailInclude,
    });
  });
}

export async function reopenAlert(id: string, user: AuthedUser, note?: string): Promise<AlertDetail> {
  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.findFirst({ where: { id, company: user.company } });
    if (!alert) throw new AppError(404, 'not_found', `Alert '${id}' not found`);
    if (alert.status !== 'resolved' && alert.status !== 'dismissed') {
      conflict(`Cannot reopen an alert in status '${alert.status}'`);
    }

    // Reopening returns the alert to `acknowledged` and clears the stale resolution.
    const now = new Date();
    return tx.alert.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledgedAt: now,
        resolvedAt: null,
        resolutionType: null,
        resolutionRootCause: null,
        resolutionActionTaken: null,
        resolutionPreventiveMeasures: null,
        resolutionTimeSpentMinutes: null,
        timeline: { create: { action: 'reopened', userName: user.name, timestamp: now, note: note ?? null } },
      },
      include: alertDetailInclude,
    });
  });
}
