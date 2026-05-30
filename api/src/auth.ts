import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './db';
import { errorBody } from './errors';

export interface AuthedUser {
  id: string;
  name: string;
  role: string;
  company: string;
}

// Make `request.user` available + typed on every request.
declare module 'fastify' {
  interface FastifyRequest {
    user: AuthedUser;
  }
}

/**
 * preHandler that resolves the bearer token to a seeded user and attaches it to
 * the request. Missing / malformed / unknown token → 401. Everything downstream
 * can trust `request.user.company` for tenant scoping.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    await reply.code(401).send(errorBody('unauthorized', 'Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const user = await prisma.user.findUnique({
    where: { token },
    select: { id: true, name: true, role: true, company: true },
  });

  if (!user) {
    await reply.code(401).send(errorBody('unauthorized', 'Invalid bearer token'));
    return;
  }

  request.user = user;
}
