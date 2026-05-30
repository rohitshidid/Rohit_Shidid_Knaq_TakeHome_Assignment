import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { AppError } from '../errors';
import { prisma } from '../db';
import { runIngest } from '../ingest/run';

/**
 * Testing-only helpers. Disabled when NODE_ENV=production. `/dev/reset` wipes
 * all alerts + timeline (across every company) and re-ingests the original
 * messages, restoring the deterministic post-ingest state (all alerts `new`).
 */
export async function devRoutes(app: FastifyInstance): Promise<void> {
  app.post('/dev/reset', { preHandler: authenticate }, async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(403, 'forbidden', 'Dev reset is disabled in production');
    }

    // Removing alerts cascades to their timeline; ingest then recreates them
    // fresh (status `new`, only created/recovered timeline entries).
    await prisma.alert.deleteMany({});
    await runIngest();

    return { ok: true, message: 'Database reset to default values' };
  });
}
