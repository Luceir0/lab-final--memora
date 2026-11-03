import {
  csrfResponseSchema,
  errorResponseSchema,
  INVALID_CREDENTIALS_MESSAGE,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  updateMeRequestSchema,
} from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { Prisma, type User } from '../../generated/prisma/client.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { csrfHeaderSchema } from './csrf-header.ts';
import { toCurrentUserDto } from './dto.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from './guards.ts';
import { assertTrustedOrigin } from './origin.ts';
import { consumeTimingEqualisation, hashPassword, verifyPassword } from './password.ts';
import {
  buildSessionCreateData,
  clearAuthCookies,
  clearCsrfCookie,
  createSession,
  createSessionToken,
  resolveSession,
  revokeSessionToken,
  setCsrfCookie,
  setSessionCookie,
  SESSION_COOKIE_NAME,
} from './session.ts';

/** `docs/03-architecture/api-contract.md`: 10 registrations per hour per IP. */
export const REGISTER_RATE_LIMIT_MAX = 10;

/** `docs/03-architecture/api-contract.md`: 5 login attempts per minute per IP+email. */
export const LOGIN_RATE_LIMIT_MAX = 5;

/**
 * Aggregate login ceiling per IP, independent of the email.
 *
 * Derived defence, not in `api-contract.md`: stops password spraying that
 * rotates emails to dodge the per-IP+email limit and to cap Argon2 cost.
 */
export const LOGIN_IP_RATE_LIMIT_MAX = 20;

export const DUPLICATE_EMAIL_MESSAGE = 'Ya existe una cuenta con ese email.';

const AUTH_TAG = 'Auth';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * `PATCH /me` only accepts `name` and `themePreference`. The shared schema
 * strips unknown keys, so the immutable fields are rejected on the raw body
 * before validation.
 */
function rejectImmutableFields(body: unknown): void {
  if (typeof body !== 'object' || body === null) {
    return;
  }

  if ('email' in body) {
    throw new ApiError('VALIDATION_ERROR', {
      message: 'El email no se puede cambiar.',
      details: [{ field: 'email', message: 'El email no se puede cambiar.' }],
    });
  }
}

/** Login limit key: client IP plus the submitted email. */
function loginRateLimitKey(request: FastifyRequest): string {
  const body: unknown = request.body;
  const email =
    typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string'
      ? body.email.toLowerCase()
      : 'unknown';

  return `${request.ip}:${email}`;
}

/**
 * Registers the auth endpoints on `/api`.
 *
 * `config` carries the trusted web origin and the cookie flags; `app.prisma`
 * is the client created by `buildApp()` (or injected by the tests).
 */
export function registerAuthRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  const aggregateLoginLimiter = app.createRateLimit({
    max: LOGIN_IP_RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  const enforceAggregateLoginLimit = async (request: FastifyRequest): Promise<void> => {
    const result = await aggregateLoginLimiter(request);

    // `applyRateLimit` always reports `isAllowed: false` and encodes the
    // decision in `isExceeded` (the allow-list branch is the only `true`).
    if (!result.isAllowed && result.isExceeded) {
      throw new ApiError('RATE_LIMITED');
    }
  };

  app.post(
    '/api/auth/register',
    {
      preValidation: trustedOrigin,
      config: {
        rateLimit: {
          max: REGISTER_RATE_LIMIT_MAX,
          timeWindow: '1 hour',
        },
      },
      schema: {
        tags: [AUTH_TAG],
        summary: 'Crear cuenta',
        description:
          'Crea el usuario y una sesión nueva. Devuelve el usuario y fija la cookie `memora_session`. ' +
          'Un email ya registrado responde `409 CONFLICT` con el detalle del campo `email`. ' +
          'Exige `Origin`/`Referer` permitido (sin CSRF: todavía no hay sesión). Límite: 10 por hora e IP. ' +
          'Invalida cualquier cookie CSRF previa: el cliente debe pedir un token nuevo a `GET /auth/csrf`.',
        body: registerRequestSchema,
        response: {
          201: registerResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { name, email, password } = request.body;
      const passwordHash = await hashPassword(password);
      const token = createSessionToken();
      const now = new Date();

      let user: User;

      try {
        user = await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({ data: { name, email, passwordHash } });
          await tx.session.create({
            data: buildSessionCreateData(created.id, token, now),
          });

          return created;
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ApiError('CONFLICT', {
            details: [{ field: 'email', message: DUPLICATE_EMAIL_MESSAGE }],
          });
        }

        throw error;
      }

      setSessionCookie(reply, config, token);
      clearCsrfCookie(reply, config);

      return reply.code(201).send({ user: toCurrentUserDto(user) });
    },
  );

  app.post(
    '/api/auth/login',
    {
      preValidation: trustedOrigin,
      preHandler: enforceAggregateLoginLimit,
      config: {
        rateLimit: {
          max: LOGIN_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
          hook: 'preHandler',
          keyGenerator: loginRateLimitKey,
        },
      },
      schema: {
        tags: [AUTH_TAG],
        summary: 'Iniciar sesión',
        description:
          'Verifica email y contraseña con Argon2id y crea una sesión nueva (rotación). ' +
          'Email desconocido y contraseña incorrecta devuelven el mismo `401 UNAUTHENTICATED` con idéntico mensaje. ' +
          'Exige `Origin`/`Referer` permitido. Límites: 5 por minuto e IP+email y 20 por minuto e IP (agregado, ' +
          'para frenar el password spraying). Invalida la cookie CSRF previa: el cliente debe pedir un token ' +
          'nuevo a `GET /auth/csrf` después del login.',
        body: loginRequestSchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { email, password } = request.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (user === null) {
        // Same Argon2 cost as a real verification: latency must not reveal
        // whether the email is registered (AC-02).
        await consumeTimingEqualisation(password);
        throw new ApiError('UNAUTHENTICATED', { message: INVALID_CREDENTIALS_MESSAGE });
      }

      const matches = await verifyPassword(user.passwordHash, password);

      if (!matches) {
        throw new ApiError('UNAUTHENTICATED', { message: INVALID_CREDENTIALS_MESSAGE });
      }

      // Rotation: a previous session cookie is invalidated by the new login.
      await revokeSessionToken(prisma, request.cookies[SESSION_COOKIE_NAME]);

      const session = await createSession(prisma, user.id);
      setSessionCookie(reply, config, session.token);
      clearCsrfCookie(reply, config);

      return { user: toCurrentUserDto(user) };
    },
  );

  app.post(
    '/api/auth/logout',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [AUTH_TAG],
        summary: 'Cerrar sesión',
        description:
          'Borra la sesión de la base de datos y limpia las cookies de sesión y CSRF. ' +
          'Requiere sesión válida y `X-CSRF-Token` ligado a esa sesión. Devuelve `204`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        response: {
          204: logoutResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { session, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);
      await prisma.session.deleteMany({ where: { id: session.id } });
      clearAuthCookies(reply, config);

      return reply.code(204).send();
    },
  );

  app.get(
    '/api/auth/csrf',
    {
      schema: {
        tags: [AUTH_TAG],
        summary: 'Obtener token CSRF',
        description:
          'Devuelve un token de doble envío ligado a la sesión actual y lo fija en la cookie legible ' +
          '`memora_csrf`. Requiere sesión válida. El cliente lo reenvía en `X-CSRF-Token` en cada mutación. ' +
          'La respuesta es privada y no cacheable.',
        security: sessionSecurity,
        response: {
          200: csrfResponseSchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { token } = await resolveSession(prisma, config, request, reply);
      const csrfToken = app.csrf.create(token);

      setPrivateNoStore(reply);
      setCsrfCookie(reply, config, csrfToken);

      return { csrfToken };
    },
  );

  app.get(
    '/api/me',
    {
      schema: {
        tags: [AUTH_TAG],
        summary: 'Usuario actual',
        description:
          'Devuelve el usuario de la sesión. `401` si la cookie falta, no existe o caducó. ' +
          'La respuesta es privada y no cacheable.',
        security: sessionSecurity,
        response: {
          200: meResponseSchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);

      setPrivateNoStore(reply);

      return { user: toCurrentUserDto(user) };
    },
  );

  app.patch(
    '/api/me',
    {
      preValidation: async (request) => {
        assertTrustedOrigin(request, config);
        rejectImmutableFields(request.body);
      },
      schema: {
        tags: [AUTH_TAG],
        summary: 'Actualizar usuario actual',
        description:
          'Actualiza `name` y/o `themePreference`. El email es inmutable y el avatar no se edita en el MVP; ' +
          'enviar `email` devuelve `400 VALIDATION_ERROR`. Requiere sesión y `X-CSRF-Token`. ' +
          'Siempre actúa sobre la sesión, nunca sobre un id del cliente.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        body: updateMeRequestSchema,
        response: {
          200: meResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { session, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const { name, themePreference } = request.body;
      const updated = await prisma.user.update({
        where: { id: session.userId },
        data: {
          ...(name === undefined ? {} : { name }),
          ...(themePreference === undefined ? {} : { themePreference }),
        },
      });

      return { user: toCurrentUserDto(updated) };
    },
  );
}
