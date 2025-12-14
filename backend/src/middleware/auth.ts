import type { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    // User is not authenticated, but that's okay for optional auth
    request.user = undefined as unknown as JWTPayload;
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify();
      if (!roles.includes(request.user.role)) {
        reply.status(403).send({ error: 'Forbidden' });
      }
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'admin') {
      reply.status(403).send({ error: 'Admin access required' });
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requireContributor(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    if (!['admin', 'contributor'].includes(request.user.role)) {
      reply.status(403).send({ error: 'Contributor access required' });
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
