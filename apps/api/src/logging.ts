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
  readonly stream?: LogStream;
}

export function createLoggerOptions(config: AppConfig, stream?: LogStream): ApiLoggerOptions {
  return {
    level: config.logLevel,
    redact: {
      paths: [...LOG_REDACT_PATHS],
      censor: REDACTED,
    },
    ...(stream === undefined ? {} : { stream }),
  };
}
