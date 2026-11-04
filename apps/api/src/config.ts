import './zod-locale.ts';

import { z } from 'zod';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const EMAIL_PROVIDERS = ['mailpit', 'resend'] as const;

export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

/** Local Mailpit defaults; production must set `EMAIL_FROM` explicitly. */
export const DEFAULT_EMAIL_FROM = 'Memora <no-reply@memora.local>';

export const DEFAULT_SMTP_HOST = 'localhost';

/** Mailpit's SMTP port inside `docker-compose.yml`. */
export const DEFAULT_SMTP_PORT = 1025;

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
  z.string().min(32, 'SESSION_SECRET debe tener al menos 32 caracteres.').optional(),
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

/**
 * Public origin of the web app. Used by the `Origin`/`Referer` checks of the
 * auth mutations.
 *
 * Outside production it defaults to the local web dev server; production must
 * set it explicitly, like `SESSION_SECRET` and `DATABASE_URL`.
 */
export const DEFAULT_APP_URL = 'http://localhost:3000';

const optionalAppUrlSchema = z.preprocess(
  emptyToUndefined,
  z
    .url('APP_URL debe ser una URL válida.')
    .refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      'APP_URL debe usar http o https.',
    )
    .optional(),
);

/** Optional parent domain for the session and CSRF cookies. */
const optionalCookieDomainSchema = z.preprocess(
  emptyToUndefined,
  z.string().min(1, 'COOKIE_DOMAIN no puede estar vacía.').optional(),
);

/**
 * Accepts either a bare address (`no-reply@memora.local`) or the
 * `Nombre <email>` form used by `EMAIL_FROM`.
 */
function isValidEmailFrom(value: string): boolean {
  const bracketed = /^([^<>]*)<([^<>]+)>$/.exec(value);
  const address = bracketed === null ? value : bracketed[2];

  return address !== undefined && z.email().safeParse(address.trim()).success;
}

/** Optional sender; `EMAIL_FROM` defaults outside production. */
const optionalEmailFromSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(1, 'EMAIL_FROM no puede estar vacía.')
    .max(254)
    .refine(
      isValidEmailFrom,
      'EMAIL_FROM debe ser una dirección de email o tener el formato "Nombre <email>".',
    )
    .optional(),
);

/** Optional provider secret; required only when `EMAIL_PROVIDER=resend`. */
const optionalResendApiKeySchema = z.preprocess(
  emptyToUndefined,
  z.string().min(1, 'RESEND_API_KEY no puede estar vacía.').optional(),
);

const optionalSmtpHostSchema = z.preprocess(
  emptyToUndefined,
  z.string().min(1, 'SMTP_HOST no puede estar vacío.').optional(),
);

const optionalSmtpPortSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int('SMTP_PORT debe ser un número entero.')
    .min(1, 'SMTP_PORT debe estar entre 1 y 65535.')
    .max(65_535, 'SMTP_PORT debe estar entre 1 y 65535.')
    .optional(),
);

const emailProviderSchema = z.preprocess(
  emptyToUndefined,
  z
    .enum(EMAIL_PROVIDERS, {
      error: `EMAIL_PROVIDER debe ser uno de: ${EMAIL_PROVIDERS.join(', ')}.`,
    })
    .default('mailpit'),
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
    APP_URL: optionalAppUrlSchema,
    COOKIE_DOMAIN: optionalCookieDomainSchema,
    EMAIL_PROVIDER: emailProviderSchema,
    EMAIL_FROM: optionalEmailFromSchema,
    RESEND_API_KEY: optionalResendApiKeySchema,
    SMTP_HOST: optionalSmtpHostSchema,
    SMTP_PORT: optionalSmtpPortSchema,
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

    if (value.NODE_ENV === 'production' && value.APP_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_URL'],
        message: 'APP_URL es obligatoria en producción.',
      });
    }

    if (
      value.NODE_ENV === 'production' &&
      value.APP_URL !== undefined &&
      new URL(value.APP_URL).protocol !== 'https:'
    ) {
      // The message never echoes the configured value.
      ctx.addIssue({
        code: 'custom',
        path: ['APP_URL'],
        message: 'APP_URL debe usar https en producción.',
      });
    }

    if (value.NODE_ENV === 'production' && value.EMAIL_FROM === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM'],
        message: 'EMAIL_FROM es obligatoria en producción.',
      });
    }

    if (value.NODE_ENV === 'production' && value.EMAIL_PROVIDER !== 'resend') {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_PROVIDER'],
        message:
          'En producción EMAIL_PROVIDER debe ser resend; mailpit solo está disponible en local.',
      });
    }

    if (value.EMAIL_PROVIDER === 'resend' && value.RESEND_API_KEY === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY es obligatoria con EMAIL_PROVIDER=resend.',
      });
    }

    if (value.EMAIL_PROVIDER !== 'resend' && value.RESEND_API_KEY !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY solo se admite con EMAIL_PROVIDER=resend.',
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
  /** Public web origin, normalised to scheme + host + port. */
  readonly appUrl: string;
  /** Parent domain for cookies. Absent means host-only (development/test). */
  readonly cookieDomain: string | undefined;
  readonly emailProvider: EmailProvider;
  /** Sender shown in invitation emails; defaults outside production. */
  readonly emailFrom: string;
  /** Only present when `emailProvider === 'resend'`. */
  readonly resendApiKey: string | undefined;
  readonly smtpHost: string;
  readonly smtpPort: number;
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
    appUrl: new URL(env.APP_URL ?? DEFAULT_APP_URL).origin,
    cookieDomain: env.COOKIE_DOMAIN,
    emailProvider: env.EMAIL_PROVIDER,
    emailFrom: env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    resendApiKey: env.RESEND_API_KEY,
    smtpHost: env.SMTP_HOST ?? DEFAULT_SMTP_HOST,
    smtpPort: env.SMTP_PORT ?? DEFAULT_SMTP_PORT,
  };
}
