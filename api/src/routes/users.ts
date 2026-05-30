import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../auth';

/** Team members visible for assignment — scoped to the caller's company. */
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/users', { preHandler: authenticate }, async (request) => {
    return prisma.user.findMany({
      where: { company: request.user.company },
      select: { id: true, name: true, role: true, company: true },
      orderBy: { name: 'asc' },
    });
  });
}
