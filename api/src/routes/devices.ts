import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { AppError } from '../errors';
import { Prisma } from '../generated/prisma/client';
import { DateTime } from 'luxon';

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  // List devices owned by the caller's company.
  app.get('/devices', { preHandler: authenticate }, async (request) => {
    return prisma.device.findMany({
      where: { company: request.user.company },
      orderBy: { id: 'asc' },
    });
  });

  // Single device. Scoping the query by company means another tenant's id
  // simply isn't found → 404 (we don't leak that it exists elsewhere).
  app.get('/devices/:id', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const device = await prisma.device.findFirst({
      where: { id, company: request.user.company },
    });
    if (!device) throw new AppError(404, 'not_found', `Device '${id}' not found`);
    return device;
  });

  // Time-series readings for a device. `start` and `end` are REQUIRED and are
  // interpreted in the DEVICE'S LOCAL timezone; response timestamps come back in
  // that same local zone. All timezone conversion happens here, server-side.
  app.get('/devices/:id/readings', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as Record<string, unknown>;

    const device = await prisma.device.findFirst({
      where: { id, company: request.user.company },
      select: { id: true, timezone: true },
    });
    if (!device) throw new AppError(404, 'not_found', `Device '${id}' not found`);

    const startRaw = typeof query['start'] === 'string' ? query['start'] : undefined;
    const endRaw = typeof query['end'] === 'string' ? query['end'] : undefined;
    if (!startRaw || !endRaw) {
      throw new AppError(400, 'bad_request', "Both 'start' and 'end' are required (device-local time)");
    }

    // Interpret the wall-clock strings in the device's zone, then convert to UTC.
    const startLocal = DateTime.fromISO(startRaw, { zone: device.timezone });
    const endLocal = DateTime.fromISO(endRaw, { zone: device.timezone });
    if (!startLocal.isValid || !endLocal.isValid) {
      throw new AppError(400, 'bad_request', "'start'/'end' must be ISO-8601 datetimes");
    }

    const metric = typeof query['metric'] === 'string' ? query['metric'] : undefined;

    const where: Prisma.SensorReadingWhereInput = {
      deviceId: id,
      tsUtc: { gte: startLocal.toUTC().toJSDate(), lte: endLocal.toUTC().toJSDate() },
    };
    if (metric) where.metric = metric;

    const rows = await prisma.sensorReading.findMany({
      where,
      orderBy: { tsUtc: 'asc' },
      select: { metric: true, value: true, tsUtc: true, isBreach: true, breachBound: true, breachLimit: true },
    });

    // Convert each stored UTC instant back to the device's local time for output.
    const readings = rows.map((r) => ({
      metric: r.metric,
      value: r.value,
      timestamp: DateTime.fromJSDate(r.tsUtc).setZone(device.timezone).toISO(),
      isBreach: r.isBreach,
      breachBound: r.breachBound,
      breachLimit: r.breachLimit,
    }));

    return {
      deviceId: device.id,
      timezone: device.timezone,
      start: startLocal.toISO(),
      end: endLocal.toISO(),
      count: readings.length,
      readings,
    };
  });
}
