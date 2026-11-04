import {
  type AcceptInvitationResponse,
  type CreateInvitationResponse,
  type ErrorResponse,
  type InvitationPreviewResponse,
  type ListInvitationsResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSessionToken, hashSessionToken, SESSION_COOKIE_NAME } from '../auth/session.ts';
import { DEFAULT_EMAIL_FROM } from '../../config.ts';
import type { Circle, PrismaClient } from '../../generated/prisma/client.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import {
  closeTestPrismaClient,
  getTestPrismaClient,
  hasDatabaseUrl,
  resetDb,
} from '../../test/db.ts';
import { makeCircle, makeMembership, makeSession, makeUser } from '../../test/factories.ts';
import { createFakeServices } from '../../test/fakes.ts';
import { createTestApp, TEST_APP_URL, type TestApp } from '../../test/harness.ts';
import { hashInvitationToken, INVITATION_TTL_MS } from './token.ts';

const hasDatabase = hasDatabaseUrl();

const ORIGIN = TEST_APP_URL;

interface AuthFixture {
  readonly token: string;
  readonly csrfToken: string;
}

interface CircleFixture {
  readonly owner: { id: string; name: string; email: string };
  readonly circle: Circle;
}

interface HeadersOptions {
  readonly withCsrf?: boolean;
  readonly withOrigin?: boolean;
}

/**
 * Invitations API integration suite (F19).
 *
 * Exercises the real HTTP pipeline over PostgreSQL: sessions, Origin and CSRF,
 * Zod validation, the shared DTOs, the email adapter and the keyset cursor.
 * Cross-circle cases always assert `404`, never `403`.
 */
describe.skipIf(!hasDatabase)('invitations API', () => {
  let testApp: TestApp;
  let prisma: PrismaClient;

  beforeEach(async () => {
    await resetDb();
    prisma = getTestPrismaClient();
    testApp = await createTestApp({ prisma });
  });

  afterEach(async () => {
    await testApp.close();
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  function headers(auth: AuthFixture | null, options: HeadersOptions = {}): Record<string, string> {
    const withCsrf = options.withCsrf ?? true;
    const withOrigin = options.withOrigin ?? true;
    const result: Record<string, string> = {};

    if (auth !== null) {
      result.cookie = `${SESSION_COOKIE_NAME}=${auth.token}`;
    }

    if (withOrigin) {
      result.origin = ORIGIN;
    }

    if (auth !== null && withCsrf) {
      result['x-csrf-token'] = auth.csrfToken;
    }

    return result;
  }

  async function makeAuth(userId: string): Promise<AuthFixture> {
    const token = createSessionToken();

    await makeSession(prisma, { userId, tokenHash: hashSessionToken(token) });

    return { token, csrfToken: testApp.app.csrf.create(token) };
  }

  async function seedCircle(): Promise<CircleFixture> {
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    return { owner, circle };
  }

  async function addMember(circleId: string): Promise<{ id: string }> {
    const user = await makeUser(prisma);

    await makeMembership(prisma, { circleId, userId: user.id, role: 'member' });

    return user;
  }

  async function createInvitation(
    auth: AuthFixture,
    circleId: string,
    payload: { readonly invitedEmail?: string } = {},
  ): Promise<CreateInvitationResponse> {
    const response = await testApp.app.inject({
      method: 'POST',
      url: `/api/circles/${circleId}/invitations`,
      headers: headers(auth),
      payload,
    });

    expect(response.statusCode).toBe(201);

    return response.json<CreateInvitationResponse>();
  }

  async function expireInvitation(invitationId: string): Promise<void> {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
  }

  function preview(
    token: string,
    auth: AuthFixture | null = null,
  ): Promise<{ statusCode: number; json: <T>() => T; body: string }> {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/invitations/${encodeURIComponent(token)}`,
      headers: headers(auth, { withCsrf: false }),
    });
  }

  function accept(token: string, auth: AuthFixture | null, options: HeadersOptions = {}) {
    return testApp.app.inject({
      method: 'POST',
      url: `/api/invitations/${encodeURIComponent(token)}/accept`,
      headers: headers(auth, options),
    });
  }

  function expectError(response: { json: <T>() => T }, code: ErrorResponse['code']): ErrorResponse {
    const body = response.json<ErrorResponse>();
    expect(body.code).toBe(code);

    return body;
  }

  describe('AC-01 — token no predecible y hasheado', () => {
    it('devuelve el token una sola vez y guarda solo su hash', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const before = Date.now();

      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth),
        payload: { invitedEmail: 'Ana@Example.com' },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<CreateInvitationResponse>();

      // The token must not be cached by browsers or shared proxies.
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers.vary).toBe('Cookie');

      // 32 bytes in base64url: 43 characters, no padding.
      expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(body.invitedEmail).toBe('ana@example.com');
      expect(body.revokedAt).toBeNull();
      expect(body.acceptedAt).toBeNull();
      expect(body.circleId).toBe(circle.id);
      expect(new Date(body.expiresAt).getTime()).toBeGreaterThanOrEqual(
        before + INVITATION_TTL_MS - 5_000,
      );
      expect(response.body).not.toContain('tokenHash');

      const persisted = await prisma.invitation.findUnique({ where: { id: body.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.tokenHash).toBe(hashInvitationToken(body.token));
      expect(persisted?.tokenHash).not.toBe(body.token);
      expect(persisted?.createdBy).toBe(owner.id);

      // The raw token exists only in the response and in the emailed link.
      const email = testApp.services.email.messages[0];
      expect(testApp.services.email.messages).toHaveLength(1);
      expect(email?.to).toBe('ana@example.com');
      expect(email?.from).toBe(DEFAULT_EMAIL_FROM);
      expect(email?.subject).toBe('Te han invitado a un círculo en Memora');
      expect(email?.subject).not.toContain(circle.name);
      expect(email?.subject).not.toContain('ana@example.com');
      expect(email?.text).toContain(`${TEST_APP_URL}/invitations/${body.token}`);
      expect(email?.html).toContain(`/invitations/${body.token}`);
    });

    it('permite crear un enlace sin email y no envía correo', async () => {
      const { owner, circle } = await seedCircle();
      const body = await createInvitation(await makeAuth(owner.id), circle.id);

      expect(body.invitedEmail).toBeNull();
      expect(testApp.services.email.messages).toHaveLength(0);
    });

    it('acepta crear sin cuerpo (enlace sin email)', async () => {
      const { owner, circle } = await seedCircle();
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(await makeAuth(owner.id)),
      });

      expect(response.statusCode).toBe(201);
      expect(response.json<CreateInvitationResponse>().invitedEmail).toBeNull();
    });

    it('rechaza un email inválido', async () => {
      const { owner, circle } = await seedCircle();
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(await makeAuth(owner.id)),
        payload: { invitedEmail: 'no-es-un-email' },
      });

      expect(response.statusCode).toBe(400);
      expectError(response, 'VALIDATION_ERROR');
      expect(await prisma.invitation.count()).toBe(0);
    });

    it('rechaza un token de más de 256 caracteres con 400', async () => {
      const tooLong = 'x'.repeat(257);
      const previewResponse = await preview(tooLong);

      expect(previewResponse.statusCode).toBe(400);
      expectError(previewResponse, 'VALIDATION_ERROR');

      const member = await makeUser(prisma);
      const acceptResponse = await accept(tooLong, await makeAuth(member.id));

      expect(acceptResponse.statusCode).toBe(400);
      expectError(acceptResponse, 'VALIDATION_ERROR');
    });
  });

  describe('AC-02 — caduca y se puede revocar', () => {
    it('una invitación caducada no se lista, la preview lo dice y aceptar da 409', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      await expireInvitation(created.id);

      const list = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(await makeAuth(owner.id)),
      });

      expect(list.statusCode).toBe(200);
      expect(list.json<ListInvitationsResponse>().items).toHaveLength(0);

      const expired = await preview(created.token);
      expect(expired.statusCode).toBe(200);
      expect(expired.json<InvitationPreviewResponse>().state).toBe('expired');

      const denied = await accept(created.token, await makeAuth(member.id));
      expect(denied.statusCode).toBe(409);

      const body = expectError(denied, 'CONFLICT');
      expect(body.message).toBe('La invitación ha caducado o se ha revocado.');
      expect(await prisma.membership.count({ where: { userId: member.id } })).toBe(0);
      expect(await prisma.activity.count({ where: { type: 'member_joined' } })).toBe(0);
    });

    it('revocar es idempotente, se refleja en la preview y bloquea aceptar', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const auth = await makeAuth(owner.id);
      const created = await createInvitation(auth, circle.id);

      const first = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/invitations/${created.id}`,
        headers: headers(auth),
      });
      const second = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/invitations/${created.id}`,
        headers: headers(auth),
      });

      expect(first.statusCode).toBe(204);
      expect(first.body).toBe('');
      expect(second.statusCode).toBe(204);

      const persisted = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(persisted?.revokedAt).not.toBeNull();

      const revoked = await preview(created.token);
      expect(revoked.json<InvitationPreviewResponse>().state).toBe('revoked');

      const denied = await accept(created.token, await makeAuth(member.id));
      expect(denied.statusCode).toBe(409);
      expectError(denied, 'CONFLICT');

      const list = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth),
      });
      expect(list.json<ListInvitationsResponse>().items).toHaveLength(0);
    });

    it('revocar una invitación aceptada es un no-op y no expulsa al miembro', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const ownerAuth = await makeAuth(owner.id);
      const created = await createInvitation(ownerAuth, circle.id);

      expect((await accept(created.token, await makeAuth(member.id))).statusCode).toBe(200);

      const revoke = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/invitations/${created.id}`,
        headers: headers(ownerAuth),
      });

      expect(revoke.statusCode).toBe(204);

      const persisted = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(persisted?.revokedAt).toBeNull();

      const membership = await prisma.membership.findUnique({
        where: { circleId_userId: { circleId: circle.id, userId: member.id } },
      });
      expect(membership).not.toBeNull();
    });

    it('el listado excluye una invitación aceptada', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const auth = await makeAuth(owner.id);
      const accepted = await createInvitation(auth, circle.id);
      const pending = await createInvitation(auth, circle.id);

      expect((await accept(accepted.token, await makeAuth(member.id))).statusCode).toBe(200);

      const list = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth),
      });

      expect(list.statusCode).toBe(200);
      expect(list.json<ListInvitationsResponse>().items.map((item) => item.id)).toEqual([
        pending.id,
      ]);
    });

    it('lista solo pendientes y pagina con cursor keyset sin duplicados', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const base = new Date('2026-01-01T00:00:00.000Z').getTime();
      const fixture = [
        { createdAt: new Date(base + 3_000) },
        { createdAt: new Date(base + 3_000) },
        { createdAt: new Date(base + 2_000) },
        { createdAt: new Date(base + 1_000) },
        { createdAt: new Date(base) },
      ];
      const created: CreateInvitationResponse[] = [];

      for (const row of fixture) {
        const invitation = await createInvitation(auth, circle.id);

        await prisma.$executeRaw`UPDATE "Invitation" SET "createdAt" = ${row.createdAt} WHERE "id" = ${invitation.id}`;
        created.push(invitation);
      }

      // One revoked and one expired row must be invisible.
      const revokedTarget = created[3];
      const expiredTarget = created[4];

      if (revokedTarget === undefined || expiredTarget === undefined) {
        throw new Error('La fixture de paginación debe crear cinco invitaciones.');
      }

      await prisma.invitation.update({
        where: { id: revokedTarget.id },
        data: { revokedAt: new Date() },
      });
      await expireInvitation(expiredTarget.id);

      const expectedTie = created
        .slice(0, 2)
        .sort((left, right) => right.id.localeCompare(left.id));
      const expected = [...expectedTie, created[2]].flatMap((invitation) =>
        invitation === undefined ? [] : [invitation.id],
      );
      const collected: string[] = [];
      let cursor: string | null = null;

      for (let page = 0; page < 2; page += 1) {
        const url: string =
          cursor === null
            ? `/api/circles/${circle.id}/invitations?limit=2`
            : `/api/circles/${circle.id}/invitations?limit=2&cursor=${encodeURIComponent(cursor)}`;

        const response = await testApp.app.inject({ method: 'GET', url, headers: headers(auth) });

        expect(response.statusCode).toBe(200);

        const body = response.json<ListInvitationsResponse>();

        for (const item of body.items) {
          collected.push(item.id);
          expect(item).not.toHaveProperty('token');
          expect(item).not.toHaveProperty('tokenHash');
          expect(response.body).not.toContain(hashInvitationToken(created[0]?.token ?? ''));
        }

        cursor = body.nextCursor;
      }

      expect(cursor).toBeNull();
      expect(collected).toEqual(expected);
      expect(new Set(collected).size).toBe(expected.length);
    });

    it('rechaza cursores inválidos y límites fuera de rango', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const invalidCursors = [
        'no-es-un-cursor',
        Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf8').toString('base64url'),
      ];

      const tooSmall = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}/invitations?limit=0`,
        headers: headers(auth),
      });
      const tooLarge = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}/invitations?limit=101`,
        headers: headers(auth),
      });

      expect(tooSmall.statusCode).toBe(400);
      expect(tooLarge.statusCode).toBe(400);

      for (const cursor of invalidCursors) {
        const response = await testApp.app.inject({
          method: 'GET',
          url: `/api/circles/${circle.id}/invitations?cursor=${encodeURIComponent(cursor)}`,
          headers: headers(auth),
        });

        expect(response.statusCode).toBe(400);

        const body = expectError(response, 'VALIDATION_ERROR');
        expect(body.details?.[0]?.field).toBe('cursor');
      }
    });
  });

  describe('AC-03 — aceptar dos veces no duplica', () => {
    it('crea membresía y actividad una sola vez y devuelve already_member al repetir', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);
      const auth = await makeAuth(member.id);

      const first = await accept(created.token, auth);

      expect(first.statusCode).toBe(200);
      expect(first.headers['cache-control']).toBe('private, no-store');
      expect(first.headers.vary).toBe('Cookie');

      const firstBody = first.json<AcceptInvitationResponse>();
      expect(firstBody.state).toBe('valid');
      expect(firstBody.circle.id).toBe(circle.id);
      expect(firstBody.circle.role).toBe('member');

      const membership = await prisma.membership.findUnique({
        where: { circleId_userId: { circleId: circle.id, userId: member.id } },
      });
      expect(membership).toMatchObject({ role: 'member' });

      const persisted = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(persisted?.acceptedAt).not.toBeNull();
      expect(persisted?.acceptedBy).toBe(member.id);

      const activities = await prisma.activity.findMany({ where: { circleId: circle.id } });
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({ type: 'member_joined', actorId: member.id });

      const second = await accept(created.token, auth);

      expect(second.statusCode).toBe(200);
      expect(second.json<AcceptInvitationResponse>().state).toBe('already_member');
      expect(second.json<AcceptInvitationResponse>().circle.role).toBe('member');
      expect(await prisma.membership.count({ where: { userId: member.id } })).toBe(1);
      expect(await prisma.activity.count({ where: { type: 'member_joined' } })).toBe(1);

      const after = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(after?.acceptedAt?.toISOString()).toBe(persisted?.acceptedAt?.toISOString());
    });

    it('el enlace sigue siendo reutilizable por otras personas hasta caducar', async () => {
      const { owner, circle } = await seedCircle();
      const first = await makeUser(prisma);
      const second = await makeUser(prisma);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      expect((await accept(created.token, await makeAuth(first.id))).statusCode).toBe(200);
      expect((await accept(created.token, await makeAuth(second.id))).statusCode).toBe(200);

      expect(await prisma.membership.count({ where: { circleId: circle.id } })).toBe(3);
      expect(await prisma.activity.count({ where: { circleId: circle.id } })).toBe(2);
    });

    it('dos aceptaciones simultáneas del mismo usuario acaban en una sola membresía', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);
      const auth = await makeAuth(member.id);

      const [a, b] = await Promise.all([accept(created.token, auth), accept(created.token, auth)]);
      const states = [
        a.json<AcceptInvitationResponse>().state,
        b.json<AcceptInvitationResponse>().state,
      ].sort();

      expect([a.statusCode, b.statusCode]).toEqual([200, 200]);
      expect(states).toEqual(['already_member', 'valid']);
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: member.id } }),
      ).toBe(1);
      expect(
        await prisma.activity.count({ where: { circleId: circle.id, type: 'member_joined' } }),
      ).toBe(1);
    });
  });

  describe('AC-04 — ya miembro devuelve estado', () => {
    it('un miembro existente recibe already_member con su rol real y sin actividad', async () => {
      const { owner, circle } = await seedCircle();
      const existing = await addMember(circle.id);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      const response = await accept(created.token, await makeAuth(existing.id));

      expect(response.statusCode).toBe(200);

      const body = response.json<AcceptInvitationResponse>();
      expect(body.state).toBe('already_member');
      expect(body.circle.role).toBe('member');
      expect(await prisma.membership.count({ where: { circleId: circle.id } })).toBe(2);
      expect(await prisma.activity.count({ where: { circleId: circle.id } })).toBe(0);

      const invitation = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(invitation?.acceptedBy).toBeNull();
    });

    it('el propietario que abre su propio enlace recibe already_member con rol owner', async () => {
      const { owner, circle } = await seedCircle();
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      const response = await accept(created.token, await makeAuth(owner.id));

      expect(response.statusCode).toBe(200);
      expect(response.json<AcceptInvitationResponse>().state).toBe('already_member');
      expect(response.json<AcceptInvitationResponse>().circle.role).toBe('owner');
      expect(await prisma.activity.count({ where: { circleId: circle.id } })).toBe(0);
    });
  });

  describe('AC-05 — un email fallido no rompe la invitación', () => {
    it('crea la invitación y responde 201 aunque el envío falle', async () => {
      const logLines: string[] = [];
      const failingServices = createFakeServices();
      const services = {
        ...failingServices,
        email: {
          messages: failingServices.email.messages,
          send: async (): Promise<void> => {
            throw new Error('SMTP no disponible');
          },
        },
      };
      const failingApp = await createTestApp({
        prisma,
        services,
        env: { LOG_LEVEL: 'info' },
        loggerStream: {
          write: (message: string) => {
            logLines.push(message);
          },
        },
      });

      try {
        const owner = await makeUser(prisma);
        const circle = await makeCircle(prisma, { ownerId: owner.id });

        await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

        const token = createSessionToken();

        await makeSession(prisma, { userId: owner.id, tokenHash: hashSessionToken(token) });

        const response = await failingApp.app.inject({
          method: 'POST',
          url: `/api/circles/${circle.id}/invitations`,
          headers: {
            cookie: `${SESSION_COOKIE_NAME}=${token}`,
            origin: ORIGIN,
            'x-csrf-token': failingApp.app.csrf.create(token),
          },
          payload: { invitedEmail: 'ana@example.com' },
        });

        expect(response.statusCode).toBe(201);

        const created = response.json<CreateInvitationResponse>();

        expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);

        const persisted = await prisma.invitation.findMany({ where: { circleId: circle.id } });
        expect(persisted).toHaveLength(1);
        expect(persisted[0]?.tokenHash).not.toBe(created.token);

        // The failure warning never logs the recipient, the token or the
        // circle name (B-01).
        const output = logLines.join('\n');
        expect(output).toContain('No se pudo enviar el email de invitación');
        expect(output).not.toContain('ana@example.com');
        expect(output).not.toContain(created.token);
        expect(output).not.toContain(circle.name);
      } finally {
        await failingApp.close();
      }
    });
  });

  describe('AC-06 — permisos y acceso cruzado', () => {
    it('un miembro recibe 403 y un extraño 404 al crear, listar y revocar', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const stranger = await makeUser(prisma);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);
      const memberAuth = await makeAuth(member.id);
      const strangerAuth = await makeAuth(stranger.id);

      for (const auth of [memberAuth, strangerAuth]) {
        const expected = auth === memberAuth ? 403 : 404;

        const create = await testApp.app.inject({
          method: 'POST',
          url: `/api/circles/${circle.id}/invitations`,
          headers: headers(auth),
          payload: {},
        });
        const list = await testApp.app.inject({
          method: 'GET',
          url: `/api/circles/${circle.id}/invitations`,
          headers: headers(auth),
        });
        const revoke = await testApp.app.inject({
          method: 'DELETE',
          url: `/api/circles/${circle.id}/invitations/${created.id}`,
          headers: headers(auth),
        });

        expect(create.statusCode).toBe(expected);
        expect(list.statusCode).toBe(expected);

        // A stranger cannot even learn whether the invitation exists; the
        // member is rejected by permission before the invitation is loaded.
        expect(revoke.statusCode).toBe(expected);
        expectError(create, expected === 403 ? 'FORBIDDEN' : 'NOT_FOUND');
        expectError(list, expected === 403 ? 'FORBIDDEN' : 'NOT_FOUND');
        expectError(revoke, expected === 403 ? 'FORBIDDEN' : 'NOT_FOUND');
      }

      const persisted = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(persisted?.revokedAt).toBeNull();
      expect(await prisma.invitation.count()).toBe(1);
    });

    it('revocar con el circleId de otro círculo devuelve 404 y no toca la invitación', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      const response = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${other.circle.id}/invitations/${created.id}`,
        headers: headers(await makeAuth(other.owner.id)),
      });

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');

      const persisted = await prisma.invitation.findUnique({ where: { id: created.id } });
      expect(persisted?.revokedAt).toBeNull();
    });

    it('las mutaciones exigen Origin permitido y CSRF válido', async () => {
      const { owner, circle } = await seedCircle();
      const member = await makeUser(prisma);
      const auth = await makeAuth(owner.id);
      const created = await createInvitation(auth, circle.id);
      const memberAuth = await makeAuth(member.id);

      const createWithoutCsrf = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth, { withCsrf: false }),
        payload: {},
      });
      const createWithoutOrigin = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth, { withOrigin: false }),
        payload: {},
      });
      const deleteWithoutCsrf = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/invitations/${created.id}`,
        headers: headers(auth, { withCsrf: false }),
      });
      const deleteWithoutOrigin = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/invitations/${created.id}`,
        headers: headers(auth, { withOrigin: false }),
      });
      const acceptWithoutCsrf = await accept(created.token, memberAuth, { withCsrf: false });
      const acceptWithoutOrigin = await accept(created.token, memberAuth, { withOrigin: false });

      for (const response of [
        createWithoutCsrf,
        createWithoutOrigin,
        deleteWithoutCsrf,
        deleteWithoutOrigin,
        acceptWithoutCsrf,
        acceptWithoutOrigin,
      ]) {
        expect(response.statusCode).toBe(403);
        expectError(response, 'FORBIDDEN');
      }

      expect(await prisma.invitation.count()).toBe(1);
      expect(await prisma.membership.count({ where: { userId: member.id } })).toBe(0);
    });

    it('sin sesión crear, listar, revocar y aceptar devuelven 401', async () => {
      const { owner, circle } = await seedCircle();
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      const requests = [
        { method: 'POST' as const, url: `/api/circles/${circle.id}/invitations`, payload: {} },
        { method: 'GET' as const, url: `/api/circles/${circle.id}/invitations` },
        { method: 'DELETE' as const, url: `/api/circles/${circle.id}/invitations/${created.id}` },
        { method: 'POST' as const, url: `/api/invitations/${created.token}/accept` },
      ];

      for (const request of requests) {
        const response = await testApp.app.inject({
          ...request,
          headers: headers(null, { withCsrf: false }),
        });

        expect(response.statusCode).toBe(401);
        expectError(response, 'UNAUTHENTICATED');
      }
    });
  });

  describe('AC-07 — no se exponen datos privados', () => {
    it('la preview pública expone solo los cuatro campos del contrato', async () => {
      const { owner, circle } = await seedCircle();
      const created = await createInvitation(await makeAuth(owner.id), circle.id);
      const response = await preview(created.token);

      expect(response.statusCode).toBe(200);

      const body = response.json<InvitationPreviewResponse>();
      expect(Object.keys(body).sort()).toEqual(
        ['circleName', 'expiresAt', 'inviterName', 'state'].sort(),
      );
      expect(body.circleName).toBe(circle.name);
      expect(body.inviterName).toBe(owner.name);
      expect(body.state).toBe('valid');
      expect(response.body).not.toContain(owner.email);
      expect(response.body).not.toContain(created.token);
      expect(response.body).not.toContain(hashInvitationToken(created.token));
      expect(response.body).not.toContain(owner.id);
    });

    it('con sesión de un miembro la preview cambia a already_member', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const created = await createInvitation(await makeAuth(owner.id), circle.id);

      expect((await preview(created.token)).json<InvitationPreviewResponse>().state).toBe('valid');
      expect(
        (await preview(created.token, await makeAuth(member.id))).json<InvitationPreviewResponse>()
          .state,
      ).toBe('already_member');
    });

    it('una cookie inválida no rompe la preview ni la autentica', async () => {
      const { owner, circle } = await seedCircle();
      const created = await createInvitation(await makeAuth(owner.id), circle.id);
      const response = await testApp.app.inject({
        method: 'GET',
        url: `/api/invitations/${created.token}`,
        headers: { cookie: `${SESSION_COOKIE_NAME}=token-inventado` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<InvitationPreviewResponse>().state).toBe('valid');
    });

    it('un token desconocido devuelve 404', async () => {
      const response = await preview('token-que-no-existe');

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
    });
  });

  describe('carreras lectura→escritura', () => {
    function withInvitationCreateRace(client: PrismaClient, error: Error): PrismaClient {
      return new Proxy(client, {
        get(target, property, receiver) {
          if (property !== 'invitation') {
            return Reflect.get(target, property, receiver);
          }

          const delegate = target.invitation;

          return new Proxy(delegate, {
            get(delegateTarget, delegateProperty, delegateReceiver) {
              if (delegateProperty === 'create') {
                return () => Promise.reject(error);
              }

              const value = Reflect.get(delegateTarget, delegateProperty, delegateReceiver);

              return typeof value === 'function' ? value.bind(delegateTarget) : value;
            },
          });
        },
      });
    }

    function prismaRaceError(code: 'P2003' | 'P2025'): Prisma.PrismaClientKnownRequestError {
      return new Prisma.PrismaClientKnownRequestError('write race', {
        code,
        clientVersion: 'test',
      });
    }

    for (const code of ['P2003', 'P2025'] as const) {
      it(`un borrado del círculo entre autorización y creación (${code}) responde 404 y no 500`, async () => {
        const { owner, circle } = await seedCircle();
        const auth = await makeAuth(owner.id);
        const raceApp = await createTestApp({
          prisma: withInvitationCreateRace(prisma, prismaRaceError(code)),
        });

        try {
          const response = await raceApp.app.inject({
            method: 'POST',
            url: `/api/circles/${circle.id}/invitations`,
            headers: headers(auth),
            payload: {},
          });

          expect(response.statusCode).toBe(404);
          expectError(response, 'NOT_FOUND');
          expect(await prisma.invitation.count()).toBe(0);
        } finally {
          await raceApp.close();
        }
      });
    }
  });

  describe('logs', () => {
    it('redacta el token de las URLs de preview y accept sin tocar el resto', async () => {
      const lines: string[] = [];
      const loggedApp = await createTestApp({
        prisma,
        env: { LOG_LEVEL: 'info' },
        loggerStream: {
          write: (message: string) => {
            lines.push(message);
          },
        },
      });

      try {
        const owner = await makeUser(prisma);
        const circle = await makeCircle(prisma, { ownerId: owner.id });

        await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

        const sessionToken = createSessionToken();

        await makeSession(prisma, {
          userId: owner.id,
          tokenHash: hashSessionToken(sessionToken),
        });

        const auth: AuthFixture = {
          token: sessionToken,
          csrfToken: loggedApp.app.csrf.create(sessionToken),
        };

        const createdResponse = await loggedApp.app.inject({
          method: 'POST',
          url: `/api/circles/${circle.id}/invitations`,
          headers: headers(auth),
          payload: {},
        });

        expect(createdResponse.statusCode).toBe(201);

        const created = createdResponse.json<CreateInvitationResponse>();

        const previewResponse = await loggedApp.app.inject({
          method: 'GET',
          url: `/api/invitations/${created.token}?origen=email`,
        });
        const acceptResponse = await loggedApp.app.inject({
          method: 'POST',
          url: '/api/invitations/token-ficticio-123/accept',
          headers: headers(auth),
        });

        expect(previewResponse.statusCode).toBe(200);
        expect(acceptResponse.statusCode).toBe(404);

        // Non-canonical variants must be redacted too (N-07). Status codes are
        // irrelevant here: the point is the request line that gets logged.
        const variants = [
          {
            method: 'GET' as const,
            url: `/api/invitations/${created.token}/`,
            expected: '/api/invitations/[REDACTED]/',
          },
          {
            method: 'POST' as const,
            url: `/api/invitations/${created.token}/accept/`,
            expected: '/api/invitations/[REDACTED]/accept/',
          },
          {
            method: 'GET' as const,
            url: `/api/invitations/${created.token}/extra`,
            expected: '/api/invitations/[REDACTED]/extra',
          },
          {
            method: 'POST' as const,
            url: `/api/invitations/${created.token}//accept`,
            expected: '/api/invitations/[REDACTED]//accept',
          },
          {
            method: 'GET' as const,
            url: `/api/%69nvitations/${created.token}?encoded=1`,
            expected: '/api/invitations/[REDACTED]?encoded=1',
          },
          {
            method: 'POST' as const,
            url: `/api/invitations/${created.token}/accept?desde=email`,
            expected: '/api/invitations/[REDACTED]/accept?desde=email',
          },
        ];

        for (const variant of variants) {
          await loggedApp.app.inject({
            method: variant.method,
            url: variant.url,
            headers: headers(auth),
          });
        }

        const output = lines.join('\n');

        expect(output.length).toBeGreaterThan(0);
        expect(output).toContain('[REDACTED]');
        expect(output).not.toContain(created.token);
        expect(output).not.toContain('token-ficticio-123');
        expect(output).toContain('/api/invitations/[REDACTED]?origen=email');
        expect(output).toContain('/api/invitations/[REDACTED]/accept');

        for (const variant of variants) {
          expect(output, variant.url).toContain(variant.expected);
        }

        // Other routes keep their full URL in the request log.
        expect(output).toContain(`/api/circles/${circle.id}/invitations`);
      } finally {
        await loggedApp.close();
      }
    });
  });

  describe('rate limit de creación', () => {
    it('limita a 10 por hora y usuario sin afectar a otros usuarios', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      for (let index = 0; index < 10; index += 1) {
        const response = await testApp.app.inject({
          method: 'POST',
          url: `/api/circles/${circle.id}/invitations`,
          headers: headers(auth),
          payload: {},
        });

        expect(response.statusCode, `creación ${index + 1}`).toBe(201);
      }

      const limited = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/invitations`,
        headers: headers(auth),
        payload: {},
      });

      expect(limited.statusCode).toBe(429);
      expectError(limited, 'RATE_LIMITED');

      // The limiter is keyed by user, not by IP or circle.
      const other = await seedCircle();

      const otherResponse = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${other.circle.id}/invitations`,
        headers: headers(await makeAuth(other.owner.id)),
        payload: {},
      });

      expect(otherResponse.statusCode).toBe(201);
    });
  });

  describe('OpenAPI', () => {
    it('documenta el tag Invitations, el CSRF y el contrato compartido', async () => {
      const response = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });
      const document = response.json<{
        tags?: Array<{ name?: string }>;
        paths: Record<
          string,
          Record<
            string,
            {
              parameters?: Array<{ name?: string; required?: boolean }>;
              responses?: Record<string, unknown>;
            }
          >
        >;
      }>();

      expect(document.tags?.map((tag) => tag.name)).toEqual(
        expect.arrayContaining(['Invitations']),
      );

      const csrfParameter = (operation: { parameters?: Array<{ name?: string }> } | undefined) =>
        operation?.parameters?.find((parameter) => parameter.name === 'x-csrf-token');

      for (const operation of [
        document.paths['/api/circles/{circleId}/invitations']?.post,
        document.paths['/api/circles/{circleId}/invitations/{invitationId}']?.delete,
        document.paths['/api/invitations/{token}/accept']?.post,
      ]) {
        expect(csrfParameter(operation)).toBeDefined();
      }

      expect(document.paths['/api/invitations/{token}']?.get?.responses?.['200']).toBeDefined();
      expect(
        document.paths['/api/invitations/{token}/accept']?.post?.responses?.['409'],
      ).toBeDefined();
      expect(
        document.paths['/api/circles/{circleId}/invitations']?.post?.responses?.['429'],
      ).toBeDefined();
    });
  });
});
