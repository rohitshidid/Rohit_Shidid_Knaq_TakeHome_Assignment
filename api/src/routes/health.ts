import type { FastifyInstance } from 'fastify';

/** Liveness probe — confirms the API process is up and serving. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return { status: 'ok' };
  });
}
