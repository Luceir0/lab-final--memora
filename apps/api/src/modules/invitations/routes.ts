import {
  acceptInvitationResponseSchema,
  can,
  circleInvitationParamsSchema,
  createInvitationParamsSchema,
  createInvitationRequestSchema,
  createInvitationResponseSchema,
  errorResponseSchema,
  invitationPreviewResponseSchema,
  invitationTokenParamsSchema,
  listInvitationsQuerySchema,
  listInvitationsResponseSchema,
  revokeInvitationResponseSchema,
  type PermissionActor,
  type PermissionCircle,
} from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { csrfHeaderSchema } from '../auth/csrf-header.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { assertTrustedOrigin } from '../auth/origin.ts';
import { resolveSession, SESSION_COOKIE_NAME } from '../auth/session.ts';
import { resolveCircleRole, toCircleDto, toCircleSettings } from '../circles/dto.ts';
import { findCircleForMember, type CircleMembership } from '../circles/service.ts';
import { decodeInvitationCursor } from './cursor.ts';
import { toCreatedInvitationDto, toInvitationPreviewDto } from './dto.ts';
import { buildInvitationEmailMessage } from './email.ts';
import {
  createInvitation,
  findInvitationByToken,
  findMembership,
  findSessionViewer,
  joinThroughInvitation,
  listPendingInvitationsPage,
  resolveInvitationState,
  revokeInvitation,
  type NewInvitation,
} from './service.ts';
import { hashInvitationToken } from './token.ts';

const INVITATIONS_TAG = 'Invitations';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/** `docs/03-architecture/api-contract.md`: 10 invitations per hour per user. */
export const INVITATION_CREATE_RATE_LIMIT_MAX = 10;

export const INVITATION_CREATE_RATE_LIMIT_WINDOW = '1 hour';

/** Same generic wording for expired and revoked, to avoid extra probing. */
export const INVITATION_UNAVAILABLE_MESSAGE = 'La invitación ha caducado o se ha revocado.';

/** Request property used only to key the per-user creation limiter. */
interface InvitationRateLimitRequest extends FastifyRequest {
  invitationRateLimitUser?: string;
}

/**
 * Invitations: create, list and revoke under a circle (owner only) plus the
 * public preview and the authenticated acceptance.
 *
 * Authorization uses `can()` with the persisted `Circle.ownerId`: a member is
 * `403` and a stranger is `404`, so the API never confirms that a circle the
 * caller cannot see exists. The raw token is returned exactly once, on
 * creation, and only its SHA-256 hash is stored.
 */
export function registerInvitationRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  /**
   * Creation limit keyed by user.
   *
   * The route resolves the session before calling the limiter (the default
   * `onRequest` hook would only see a cookie), so the user id is attached to
   * the request right before the manual call, exactly like the aggregate login
   * limiter in `auth/routes.ts`.
   */
  const createInvitationLimiter = app.createRateLimit({
    max: INVITATION_CREATE_RATE_LIMIT_MAX,
    timeWindow: INVITATION_CREATE_RATE_LIMIT_WINDOW,
    keyGenerator: (request) => {
      const userId = (request as InvitationRateLimitRequest).invitationRateLimitUser;

      return `invitations:${userId ?? request.ip}`;
    },
  });

  const enforceCreateInvitationLimit = async (
    request: FastifyRequest,
    userId: string,
  ): Promise<void> => {
    (request as InvitationRateLimitRequest).invitationRateLimitUser = userId;

    const result = await createInvitationLimiter(request);

    // `applyRateLimit` always reports `isAllowed: false` and encodes the
    // decision in `isExceeded` (the allow-list branch is the only `true`).
    if (!result.isAllowed && result.isExceeded) {
      throw new ApiError('RATE_LIMITED');
    }
  };

  app.post(
    '/api/circles/:circleId/invitations',
    {
      preValidation: async (request) => {
        assertTrustedOrigin(request, config);

        // The body is optional: a bare `POST` means "link without email".
        if (request.body === undefined || request.body === null) {
          request.body = {};
        }
      },
      schema: {
        tags: [INVITATIONS_TAG],
        summary: 'Crear invitación',
        description:
          'Crea un enlace de invitación al círculo. Solo el propietario: un miembro recibe `403 FORBIDDEN` y un ' +
          'extraño `404 NOT_FOUND`. El token aleatorio viaja en claro únicamente en esta respuesta; en la base ' +
          'de datos solo se guarda su hash SHA-256. Caduca a los 7 días. Si llega `invitedEmail`, se envía un ' +
          'correo con el enlace; si el envío falla, la invitación se crea igualmente. Límite: 10 por hora y usuario.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: createInvitationParamsSchema,
        body: createInvitationRequestSchema,
        response: {
          201: createInvitationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token: sessionToken } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, sessionToken);

      const membership = await requireInvitationOwner(prisma, user.id, request.params.circleId);
      await enforceCreateInvitationLimit(request, user.id);

      const { invitedEmail } = request.body;
      const now = new Date();

      let created: NewInvitation;

      try {
        created = await createInvitation(prisma, {
          circleId: membership.circle.id,
          createdBy: user.id,
          invitedEmail: invitedEmail ?? null,
          now,
        });
      } catch (error) {
        // The circle disappeared between the permission read and the insert.
        // Same outcome as a missing circle, never a 500 (M-03).
        if (isInvitationCreateRace(error)) {
          throw new ApiError('NOT_FOUND');
        }

        throw error;
      }

      if (invitedEmail !== undefined) {
        await sendInvitationEmail(app, config, request, {
          invitationId: created.invitation.id,
          circleId: membership.circle.id,
          to: invitedEmail,
          circleName: membership.circle.name,
          inviterName: user.name,
          token: created.token,
          expiresAt: created.invitation.expiresAt,
        });
      }

      setPrivateNoStore(reply);

      return reply.code(201).send(toCreatedInvitationDto(created.invitation, created.token));
    },
  );

  app.get(
    '/api/circles/:circleId/invitations',
    {
      schema: {
        tags: [INVITATIONS_TAG],
        summary: 'Listar invitaciones pendientes',
        description:
          'Invitaciones todavía utilizables del círculo: no revocadas, no aceptadas y no caducadas. Solo el ' +
          'propietario. Orden `createdAt desc` con desempate `id desc`, keyset opaco con `?cursor=` y `limit` ' +
          '(1–100, defecto 24). Nunca incluye el token ni su hash.',
        security: sessionSecurity,
        params: createInvitationParamsSchema,
        querystring: listInvitationsQuerySchema,
        response: {
          200: listInvitationsResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const membership = await requireInvitationOwner(prisma, user.id, request.params.circleId);
      const { cursor, limit } = request.query;
      const page = await listPendingInvitationsPage(prisma, membership.circle.id, {
        cursor: cursor === undefined ? null : decodeInvitationCursor(cursor),
        limit,
        now: new Date(),
      });

      setPrivateNoStore(reply);

      return page;
    },
  );

  app.delete(
    '/api/circles/:circleId/invitations/:invitationId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [INVITATIONS_TAG],
        summary: 'Revocar invitación',
        description:
          'Marca la invitación como revocada. Solo el propietario. Es idempotente: una invitación ya revocada, ' +
          'caducada o aceptada responde `204` sin cambios (revocar una aceptada no expulsa al miembro). Una ' +
          'invitación desconocida o de otro círculo responde `404 NOT_FOUND`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleInvitationParamsSchema,
        response: {
          204: revokeInvitationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token: sessionToken } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, sessionToken);

      const membership = await requireInvitationOwner(prisma, user.id, request.params.circleId);
      const outcome = await revokeInvitation(prisma, {
        circleId: membership.circle.id,
        invitationId: request.params.invitationId,
        now: new Date(),
      });

      if (outcome === 'missing') {
        throw new ApiError('NOT_FOUND');
      }

      return reply.code(204).send();
    },
  );

  app.get(
    '/api/invitations/:token',
    {
      schema: {
        tags: [INVITATIONS_TAG],
        summary: 'Previsualizar invitación',
        description:
          'Datos mínimos para la pantalla pública de invitación: nombre del círculo, nombre de quien invita, ' +
          'caducidad y estado (`valid`, `expired`, `revoked`, `already_member`). No requiere sesión: si llega ' +
          'una cookie válida se usa solo para calcular `already_member`. Nunca devuelve miembros, fotos, ' +
          'álbumes, el email del invitador ni el hash del token. Un token desconocido responde `404 NOT_FOUND`.',
        params: invitationTokenParamsSchema,
        response: {
          200: invitationPreviewResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const now = new Date();
      const invitation = await findInvitationByToken(
        prisma,
        hashInvitationToken(request.params.token),
      );

      if (invitation === null) {
        throw new ApiError('NOT_FOUND');
      }

      // Optional session: an absent, unknown or expired cookie means anonymous.
      const viewer = await findSessionViewer(prisma, request.cookies[SESSION_COOKIE_NAME], now);
      const isMember =
        viewer !== null && (await findMembership(prisma, invitation.circleId, viewer.id)) !== null;

      setPrivateNoStore(reply);

      return toInvitationPreviewDto({
        circleName: invitation.circle.name,
        inviterName: invitation.creator.name,
        expiresAt: invitation.expiresAt,
        state: resolveInvitationState(invitation, { isMember, now }),
      });
    },
  );

  app.post(
    '/api/invitations/:token/accept',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [INVITATIONS_TAG],
        summary: 'Aceptar invitación',
        description:
          'Une al usuario de la sesión al círculo con rol `member`. Idempotente: si ya era miembro responde ' +
          '`200` con `state: already_member` y su rol real, sin duplicar membresía ni actividad. Una invitación ' +
          'caducada o revocada responde `409 CONFLICT` con un mensaje genérico; un token desconocido, `404`. ' +
          'Crea la membresía, el evento `member.joined` y la marca de aceptación en una sola transacción. ' +
          'Requiere sesión, `Origin` permitido y `X-CSRF-Token`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: invitationTokenParamsSchema,
        response: {
          200: acceptInvitationResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token: sessionToken } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, sessionToken);

      const now = new Date();
      const invitation = await findInvitationByToken(
        prisma,
        hashInvitationToken(request.params.token),
      );

      if (invitation === null) {
        throw new ApiError('NOT_FOUND');
      }

      // Same precedence as the preview: revoked > expired > already_member.
      if (invitation.revokedAt !== null || invitation.expiresAt.getTime() <= now.getTime()) {
        throw new ApiError('CONFLICT', { message: INVITATION_UNAVAILABLE_MESSAGE });
      }

      const outcome = await joinThroughInvitation(prisma, {
        invitationId: invitation.id,
        circleId: invitation.circleId,
        userId: user.id,
        now,
      });

      if (outcome.outcome === 'gone') {
        throw new ApiError('NOT_FOUND');
      }

      if (outcome.outcome === 'unavailable') {
        // Lost a race against a revoke/expire: distinguish "deleted" from
        // "no longer usable" without leaking which invitation existed.
        const current = await prisma.invitation.findUnique({
          where: { id: invitation.id },
          select: { id: true },
        });

        throw current === null
          ? new ApiError('NOT_FOUND')
          : new ApiError('CONFLICT', { message: INVITATION_UNAVAILABLE_MESSAGE });
      }

      setPrivateNoStore(reply);

      return {
        circle: toCircleDto(
          invitation.circle,
          resolveCircleRole(invitation.circle, user.id, outcome.role),
          invitation.circle.coverPhoto,
        ),
        state: outcome.outcome === 'joined' ? ('valid' as const) : ('already_member' as const),
      };
    },
  );
}

/** Loads the circle for a member or throws the shared `404`. */
async function requireInvitationOwner(
  prisma: PrismaClient,
  userId: string,
  circleId: string,
): Promise<CircleMembership> {
  const membership = await findCircleForMember(prisma, circleId, userId);

  if (membership === null) {
    throw new ApiError('NOT_FOUND');
  }

  assertInvitationPermission(userId, membership);

  return membership;
}

/**
 * `member.invite` is owner-only. Ownership comes from `Circle.ownerId` inside
 * `can()`, never from the membership `role`.
 */
function assertInvitationPermission(userId: string, membership: CircleMembership): void {
  const actor: PermissionActor = { id: userId, role: membership.membership.role };
  const circle: PermissionCircle = {
    id: membership.circle.id,
    ownerId: membership.circle.ownerId,
    settings: toCircleSettings(membership.circle.settings),
  };

  if (!can(actor, 'member.invite', circle)) {
    throw new ApiError('FORBIDDEN');
  }
}

function isInvitationCreateRace(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2003' || error.code === 'P2025')
  );
}

interface InvitationEmailInput {
  readonly invitationId: string;
  readonly circleId: string;
  readonly to: string;
  readonly circleName: string;
  readonly inviterName: string;
  readonly token: string;
  readonly expiresAt: Date;
}

/**
 * Sends the invitation email as a best-effort side effect (AC-05).
 *
 * A failure never aborts creation and the warning never includes the recipient,
 * the circle name or the token: only identifiers and the error class.
 */
async function sendInvitationEmail(
  app: MemoraServer,
  config: AppConfig,
  request: FastifyRequest,
  input: InvitationEmailInput,
): Promise<void> {
  // `/invite/:token` is the real public page of the web app (SSR); the API
  // route `/api/invitations/:token` is not something a browser can render.
  const invitationUrl = new URL(
    `/invite/${encodeURIComponent(input.token)}`,
    config.appUrl,
  ).toString();

  const message = buildInvitationEmailMessage({
    from: config.emailFrom,
    to: input.to,
    circleName: input.circleName,
    inviterName: input.inviterName,
    invitationUrl,
    expiresAt: input.expiresAt,
  });

  try {
    await app.services.email.send(message);
  } catch (error) {
    request.log.warn(
      {
        invitationId: input.invitationId,
        circleId: input.circleId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      },
      'No se pudo enviar el email de invitación',
    );
  }
}
