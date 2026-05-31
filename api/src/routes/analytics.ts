import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { prisma } from '../db';

const DAY_MS = 86_400_000;

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  // Aggregate resolution metrics for the caller's company.
  app.get('/alerts/stats', { preHandler: authenticate }, async (request) => {
    const company = request.user.company;

    const byStatusRows = await prisma.alert.groupBy({
      by: ['status'],
      where: { company },
      _count: { _all: true },
    });
    const byStatus = { new: 0, acknowledged: 0, resolved: 0, dismissed: 0 };
    for (const r of byStatusRows) byStatus[r.status] = r._count._all;

    const openRows = await prisma.alert.groupBy({
      by: ['severity'],
      where: { company, status: { in: ['new', 'acknowledged'] } },
      _count: { _all: true },
    });
    const openBySeverity = { critical: 0, warning: 0 };
    for (const r of openRows) openBySeverity[r.severity] = r._count._all;

    // MTTR overall + per severity, in minutes. ROLLUP adds a grand-total row.
    const mttrRows = await prisma.$queryRaw<{ severity: string | null; minutes: string | null }[]>`
      SELECT severity::text AS severity,
             EXTRACT(EPOCH FROM AVG(resolved_at - acknowledged_at)) / 60 AS minutes
      FROM alerts
      WHERE company = ${company} AND status = 'resolved'
        AND resolved_at IS NOT NULL AND acknowledged_at IS NOT NULL
      GROUP BY ROLLUP(severity)
    `;
    let mttrMinutes: number | null = null;
    const resolutionTimeBySeverity: { critical: number | null; warning: number | null } = {
      critical: null,
      warning: null,
    };
    for (const r of mttrRows) {
      const m = r.minutes === null ? null : Math.round(Number(r.minutes));
      if (r.severity === null) mttrMinutes = m;
      else if (r.severity === 'critical') resolutionTimeBySeverity.critical = m;
      else if (r.severity === 'warning') resolutionTimeBySeverity.warning = m;
    }

    const now = Date.now();
    const [resolvedThisWeek, resolvedLastWeek] = await Promise.all([
      prisma.alert.count({ where: { company, status: 'resolved', resolvedAt: { gte: new Date(now - 7 * DAY_MS) } } }),
      prisma.alert.count({
        where: {
          company,
          status: 'resolved',
          resolvedAt: { gte: new Date(now - 14 * DAY_MS), lt: new Date(now - 7 * DAY_MS) },
        },
      }),
    ]);

    const closed = byStatus.resolved + byStatus.dismissed;
    const dismissalRate = closed === 0 ? 0 : byStatus.dismissed / closed;

    return {
      byStatus,
      openBySeverity,
      mttrMinutes,
      resolutionTimeBySeverity,
      resolvedThisWeek,
      resolvedLastWeek,
      dismissalRate,
    };
  });

  // Alert volume by day and severity, for the trend chart.
  app.get('/alerts/timeseries', { preHandler: authenticate }, async (request) => {
    const company = request.user.company;
    const q = request.query as Record<string, unknown>;
    const parsed = Number.parseInt(String(q['days'] ?? '30'), 10);
    const days = Number.isFinite(parsed) ? parsed : 30; // days <= 0 means all-time

    const rows =
      days > 0
        ? await prisma.$queryRaw<{ day: Date; severity: string; count: bigint }[]>`
            SELECT date_trunc('day', triggered_at) AS day, severity::text AS severity, COUNT(*)::bigint AS count
            FROM alerts
            WHERE company = ${company} AND triggered_at >= ${new Date(Date.now() - Math.min(days, 3650) * DAY_MS)}
            GROUP BY day, severity
            ORDER BY day ASC
          `
        : await prisma.$queryRaw<{ day: Date; severity: string; count: bigint }[]>`
            SELECT date_trunc('day', triggered_at) AS day, severity::text AS severity, COUNT(*)::bigint AS count
            FROM alerts
            WHERE company = ${company}
            GROUP BY day, severity
            ORDER BY day ASC
          `;

    const byDay = new Map<string, { date: string; critical: number; warning: number }>();
    for (const r of rows) {
      const date = r.day.toISOString().slice(0, 10);
      const entry = byDay.get(date) ?? { date, critical: 0, warning: 0 };
      if (r.severity === 'critical') entry.critical = Number(r.count);
      else if (r.severity === 'warning') entry.warning = Number(r.count);
      byDay.set(date, entry);
    }

    return { days, points: [...byDay.values()] };
  });
}
