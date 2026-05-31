import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { userRoutes } from './routes/users';
import { deviceRoutes } from './routes/devices';
import { alertRoutes } from './routes/alerts';
import { analyticsRoutes } from './routes/analytics';
import { devRoutes } from './routes/dev';
import { AppError, errorBody } from './errors';
import type { AuthedUser } from './auth';

/**
 * Build a fully-wired Fastify instance WITHOUT starting it.
 * Keeping construction separate from listening lets tests
 * use `app.inject()` against an in-memory instance — no real port needed.
 */
export function buildApp(opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({
    logger: opts.logger ?? true,
  });

  // Allow the browser frontend (different origin) to call the API.
  app.register(cors, { origin: true });

  // Reserve the request slot the auth preHandler fills in (set per-request later).
  app.decorateRequest('user', null as unknown as AuthedUser);

  // One place that turns thrown errors into the consistent envelope.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send(errorBody(err.code, err.message));
      return;
    }
    if (err.validation) {
      reply.code(400).send(errorBody('bad_request', err.message));
      return;
    }
    request.log.error(err);
    reply.code(500).send(errorBody('internal_error', 'Unexpected server error'));
  });

  app.register(healthRoutes);
  app.register(userRoutes);
  app.register(deviceRoutes);
  app.register(alertRoutes);
  app.register(analyticsRoutes);
  app.register(devRoutes);

  return app;
}
