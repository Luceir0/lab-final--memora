import './zod-locale.ts';

import { z } from 'zod';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/**
 * Treats an empty variable as absent.
 *
 * `.env.example` ships optional secrets empty on purpose; an empty string must
 * not bypass `.min(32)` nor be passed to services as a real value.
 */
function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

const optionalSecretSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .min(32, 'SESSION_SECRET debe tener al menos 32 caracteres.')
    .optional(),
);

const optionalDatabaseUrlSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .min(1, 'DATABASE_URL no puede estar vacía.')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL debe ser una URL de PostgreSQL.',
    )
    .optional(),
);

/** Raw environment contract. Every variable the API reads is declared here. */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
    API_PORT: z.coerce
      .number()
      .int('API_PORT debe ser un número entero.')
      .min(1, 'API_PORT debe estar entre 1 y 65535.')
      .max(65_535, 'API_PORT debe estar entre 1 y 65535.')
      .default(3001),
    HOST: z.string().min(1, 'HOST no puede estar vacío.').default('127.0.0.1'),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    SESSION_SECRET: optionalSecretSchema,
    DATABASE_URL: optionalDatabaseUrlSchema,
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.SESSION_SECRET === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET es obligatoria en producción.',
      });
    }

    if (value.NODE_ENV === 'production' && value.DATABASE_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL es obligatoria en producción.',
      });
    }
  });

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export type LogLevel = (typeof LOG_LEVELS)[number];

/** Validated configuration. Built once at bootstrap and injected everywhere. */
export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly isTest: boolean;
  readonly apiPort: number;
  readonly host: string;
  readonly logLevel: LogLevel;
  /** Absent outside production when the operator has not configured it yet. */
  readonly sessionSecret: string | undefined;
  readonly databaseUrl: string | undefined;
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';

      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Validates `process.env` (or an injected source) and fails fast.
 *
 * The thrown message lists every invalid variable and never includes values,
 * so secrets cannot end up in a terminal or a crash report.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(`Configuración de la API inválida:\n${formatIssues(parsed.error)}`);
  }

  const env = parsed.data;

  return {
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    apiPort: env.API_PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    sessionSecret: env.SESSION_SECRET,
    databaseUrl: env.DATABASE_URL,
  };
}
