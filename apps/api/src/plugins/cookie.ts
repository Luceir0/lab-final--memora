import cookie from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';

/**
 * Cookie parsing and serialization.
 *
 * Session cookies are opaque random tokens stored hashed in PostgreSQL, so
 * they are not signed: `@fastify/cookie` without secret is enough.
 */
export async function registerCookie(app: FastifyInstance): Promise<void> {
  await app.register(cookie);
}
