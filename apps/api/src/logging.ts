import type { FastifyRequest } from 'fastify';

import type { AppConfig } from './config.ts';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'passwordHash',
  'tokenHash',
  'csrfToken',
  'sessionToken',
  'sessionSecret',
  'email',
] as const;

function pathsForKey(key: string): string[] {
  return [key, `*.${key}`, `*.*.${key}`, `*.*.*.${key}`];
}

/**
 * Paths pino must censor. They cover the headers that carry session and CSRF
 * credentials plus the secret fields used by DTOs and database rows.
 *
 * Cookies, bearer tokens, CSRF tokens, password/session hashes and emails must
 * never reach a log sink, not even in development. Logging whole DTOs is
 * forbidden, so controllers log identifiers and outcomes only.
 */
export const LOG_REDACT_PATHS: string[] = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'req.headers["x-csrf-token"]',
  'x-csrf-token',
  ...SENSITIVE_KEYS.flatMap(pathsForKey),
];

export const REDACTED = '[REDACTED]';

/**
 * Invitation links carry the raw token in the path, and Fastify logs every
 * request URL at `info`. Only paths under `/api/invitations/` are redacted;
 * every other route (including `/api/circles/:id/invitations`) is logged
 * verbatim.
 */
const INVITATIONS_PATH_PREFIX = '/api/invitations/';

/**
 * Replaces the first segment after `/api/invitations/` with `[REDACTED]`.
 *
 * The path is decoded defensively (a malformed escape leaves the URL untouched)
 * so variants such as `/api/%69nvitations/<token>` cannot bypass the rule. The
 * remainder (trailing slash, `/accept`, extra segments, double slashes) and the
 * original query string are preserved (B-01, N-07).
 */
export function redactInvitationTokenFromUrl(url: string): string {
  const queryIndex = url.indexOf('?');
  const rawPath = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : url.slice(queryIndex);

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    // Invalid percent-encoding: do not guess at the path.
    return url;
  }

  if (!decodedPath.startsWith(INVITATIONS_PATH_PREFIX)) {
    return url;
  }

  const remainder = decodedPath.slice(INVITATIONS_PATH_PREFIX.length);
  const firstSlash = remainder.indexOf('/');
  const suffix = firstSlash === -1 ? '' : remainder.slice(firstSlash);

  return `${INVITATIONS_PATH_PREFIX}${REDACTED}${suffix}${search}`;
}

export interface SerializedRequest {
  readonly [key: string]: unknown;
  readonly method: string;
  readonly url: string;
  readonly host: string;
  readonly remoteAddress: string;
  readonly remotePort: number;
}

/** Structural subset read from the value pino hands to the `req` serializer. */
interface RequestLike {
  readonly method?: unknown;
  readonly url?: unknown;
  readonly host?: unknown;
  readonly hostname?: unknown;
  readonly ip?: unknown;
  readonly socket?: { readonly remotePort?: unknown } | undefined;
}

/**
 * Request serializer for pino.
 *
 * Mirrors Fastify's default fields (method, URL, host, address, port) and only
 * changes the URL, so the rest of the logs keep their usual shape. A non-request
 * object logged under a `req` key keeps its original shape and the normal
 * redaction paths still apply.
 */
export function serializeRequestForLog(request: FastifyRequest): SerializedRequest {
  const source = request as unknown as RequestLike;

  if (typeof source.url !== 'string') {
    return request as unknown as SerializedRequest;
  }

  return {
    method: typeof source.method === 'string' ? source.method : '',
    url: redactInvitationTokenFromUrl(source.url),
    host:
      typeof source.host === 'string'
        ? source.host
        : typeof source.hostname === 'string'
          ? source.hostname
          : '',
    remoteAddress: typeof source.ip === 'string' ? source.ip : '',
    remotePort: typeof source.socket?.remotePort === 'number' ? source.socket.remotePort : 0,
  };
}

/** Minimal destination contract Fastify/pino accept for captured output. */
export interface LogStream {
  write(message: string): void;
}

/** Pino options used by the API. Tests inject a stream to inspect the output. */
export interface ApiLoggerOptions {
  readonly level: string;
  readonly redact: {
    readonly paths: string[];
    readonly censor: string;
  };
  readonly serializers: {
    readonly req: typeof serializeRequestForLog;
  };
  readonly stream?: LogStream;
}

export function createLoggerOptions(config: AppConfig, stream?: LogStream): ApiLoggerOptions {
  return {
    level: config.logLevel,
    redact: {
      paths: [...LOG_REDACT_PATHS],
      censor: REDACTED,
    },
    serializers: {
      req: serializeRequestForLog,
    },
    ...(stream === undefined ? {} : { stream }),
  };
}
