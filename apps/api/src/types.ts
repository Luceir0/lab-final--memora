import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawServerDefault,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** The single Fastify instance type the API uses (Zod 4 type provider). */
export type MemoraServer = FastifyInstance<
  RawServerDefault,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  ZodTypeProvider
>;
