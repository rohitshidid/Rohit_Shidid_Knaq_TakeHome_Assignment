import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../auth';
import { AppError } from '../errors';

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
}
