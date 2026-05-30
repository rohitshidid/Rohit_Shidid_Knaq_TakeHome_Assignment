import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health';

/**
 * Build a fully-wired Fastify instance WITHOUT starting it.
 * Keeping construction separate from listening lets tests (Phase 5.3)
 * use `app.inject()` against an in-memory instance — no real port needed.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  app.register(healthRoutes);

  return app;
}
