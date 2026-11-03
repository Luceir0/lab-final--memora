import {
  DEFAULT_CIRCLE_SETTINGS,
  type CircleDetailResponse,
  type CircleResponse,
  type ErrorResponse,
  type ListCirclesResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from '../modules/auth/session.ts';
import { Prisma, type Circle, type PrismaClient } from '../generated/prisma/client.ts';
import { closeTestPrismaClient, getTestPrismaClient, hasDatabaseUrl, resetDb } from './db.ts';
import {
  makeAlbum,
  makeCircle,
  makeMembership,
  makePhoto,
  makeSession,
  makeUser,
} from './factories.ts';
import { createTestApp, TEST_APP_URL, type TestApp } from './harness.ts';

const hasDatabase = hasDatabaseUrl();

const ORIGIN = TEST_APP_URL;

interface AuthFixture {
  readonly token: string;
  readonly csrfToken: string;
}

interface CircleFixture {
  readonly owner: { id: string };
  readonly circle: Circle;
}

interface HeadersOptions {
  readonly withCsrf?: boolean;
  readonly withOrigin?: boolean;
}

/**
 * Circles API integration suite (F17).
 *
 * Exercises the real HTTP pipeline over PostgreSQL: session cookies, Origin and
 * CSRF checks, Zod validation, shared DTO serialization and keyset pagination.
 * Cross-circle cases always assert that a stranger sees `404`, not `403`.
 */
describe.skipIf(!hasDatabase)('circles API', () => {
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

  async function seedCircle(ownerId?: string): Promise<CircleFixture> {
    const owner = await makeUser(prisma, ownerId === undefined ? {} : { id: ownerId });
    const circle = await makeCircle(prisma, { ownerId: owner.id });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    return { owner, circle };
  }

  async function addMember(circleId: string): Promise<{ id: string }> {
    const user = await makeUser(prisma);

    await makeMembership(prisma, { circleId, userId: user.id, role: 'member' });

    return user;
  }

  async function setCircleUpdatedAt(circleId: string, updatedAt: Date): Promise<void> {
    // `@updatedAt` is managed by Prisma; the raw write is the only reliable way
    // to pin the value that the keyset pagination orders by.
    await prisma.$executeRaw`UPDATE "Circle" SET "updatedAt" = ${updatedAt} WHERE "id" = ${circleId}`;
  }

  interface CircleDelegateOverrides {
    readonly update?: () => Promise<never>;
    readonly deleteMany?: () => Promise<{ count: number }>;
  }

  /**
   * Wraps the real client and breaks only the circle write used by the route.
   *
   * Session, membership and cover reads keep hitting PostgreSQL, so the request
   * follows the real HTTP path; the write then simulates losing the row between
   * the membership read and the write.
   */
  function withCircleRace(client: PrismaClient, overrides: CircleDelegateOverrides): PrismaClient {
    return new Proxy(client, {
      get(target, property, receiver) {
        if (property !== 'circle') {
          return Reflect.get(target, property, receiver);
        }

        const delegate = target.circle;

        return new Proxy(delegate, {
          get(delegateTarget, delegateProperty, delegateReceiver) {
            if (delegateProperty === 'update' && overrides.update !== undefined) {
              return overrides.update;
            }

            if (delegateProperty === 'deleteMany' && overrides.deleteMany !== undefined) {
              return overrides.deleteMany;
            }

            const value = Reflect.get(delegateTarget, delegateProperty, delegateReceiver);

            return typeof value === 'function' ? value.bind(delegateTarget) : value;
          },
        });
      },
    });
  }

  function prismaRaceError(code: 'P2025' | 'P2003'): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError('write race', {
      code,
      clientVersion: 'test',
    });
  }

  function expectError(response: { json: <T>() => T }, code: ErrorResponse['code']): ErrorResponse {
    const body = response.json<ErrorResponse>();
    expect(body.code).toBe(code);

    return body;
  }

  describe('AC-01 — crear círculo', () => {
    it('persiste el círculo y la membresía owner del creador', async () => {
      const owner = await makeUser(prisma);
      const auth = await makeAuth(owner.id);

      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: headers(auth),
        payload: { name: 'Familia', description: 'Casa de la abuela' },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json<CircleResponse>();
      expect(body.name).toBe('Familia');
      expect(body.description).toBe('Casa de la abuela');
      expect(body.role).toBe('owner');
      expect(body.settings).toEqual(DEFAULT_CIRCLE_SETTINGS);
      expect(body.coverPhoto).toBeNull();

      const circle = await prisma.circle.findUnique({ where: { id: body.id } });
      expect(circle).not.toBeNull();
      expect(circle?.ownerId).toBe(owner.id);

      const memberships = await prisma.membership.findMany({ where: { circleId: body.id } });
      expect(memberships).toHaveLength(1);
      expect(memberships[0]).toMatchObject({ userId: owner.id, role: 'owner' });
    });
  });

  describe('AC-02 — solo los miembros ven el círculo', () => {
    it('el owner y el miembro obtienen 200 y el extraño 404', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const stranger = await makeUser(prisma);

      const ownerResponse = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(owner.id)),
      });
      const memberResponse = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(member.id)),
      });
      const strangerResponse = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(stranger.id)),
      });

      expect(ownerResponse.statusCode).toBe(200);
      expect(ownerResponse.json<CircleDetailResponse>().role).toBe('owner');
      expect(ownerResponse.headers['cache-control']).toBe('private, no-store');
      expect(ownerResponse.headers.vary).toBe('Cookie');
      expect(memberResponse.statusCode).toBe(200);
      expect(memberResponse.json<CircleDetailResponse>().role).toBe('member');
      expect(strangerResponse.statusCode).toBe(404);
      expectError(strangerResponse, 'NOT_FOUND');
    });

    it('la lista solo incluye los círculos con membresía', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();

      const ownerList = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles',
        headers: headers(await makeAuth(owner.id)),
      });
      const memberList = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles',
        headers: headers(await makeAuth(member.id)),
      });

      expect(ownerList.statusCode).toBe(200);
      expect(ownerList.headers['cache-control']).toBe('private, no-store');
      expect(ownerList.headers.vary).toBe('Cookie');
      expect(ownerList.json<ListCirclesResponse>().items.map((item) => item.id)).toEqual([
        circle.id,
      ]);
      expect(memberList.json<ListCirclesResponse>().items.map((item) => item.id)).toEqual([
        circle.id,
      ]);
      expect(memberList.json<ListCirclesResponse>().items[0]?.role).toBe('member');
      expect(other.circle.id).not.toBe(circle.id);
    });
  });

  describe('AC-03 — solo el owner edita y borra', () => {
    it('member PATCH y DELETE devuelven 403; owner PATCH y DELETE funcionan', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const memberAuth = await makeAuth(member.id);
      const ownerAuth = await makeAuth(owner.id);

      const memberPatch = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(memberAuth),
        payload: { name: 'Renombrado por member' },
      });
      const memberDelete = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(memberAuth),
      });

      expect(memberPatch.statusCode).toBe(403);
      expectError(memberPatch, 'FORBIDDEN');
      expect(memberDelete.statusCode).toBe(403);
      expectError(memberDelete, 'FORBIDDEN');

      const ownerPatch = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(ownerAuth),
        payload: { name: 'Renombrado por owner' },
      });

      expect(ownerPatch.statusCode).toBe(200);
      expect(ownerPatch.json<CircleResponse>().name).toBe('Renombrado por owner');

      // A cover pointing at one of the circle's own photos must not block the
      // cascade when the circle is deleted (Circle → Photo → Circle FK loop).
      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const cover = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(ownerAuth),
        payload: { coverPhotoId: photo.id },
      });

      expect(cover.statusCode).toBe(200);

      const ownerDelete = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(ownerAuth),
      });

      expect(ownerDelete.statusCode).toBe(204);
      expect(ownerDelete.body).toBe('');

      expect(await prisma.circle.findUnique({ where: { id: circle.id } })).toBeNull();
      expect(await prisma.membership.count({ where: { circleId: circle.id } })).toBe(0);
      expect(await prisma.photo.count({ where: { circleId: circle.id } })).toBe(0);
      expect(await prisma.album.count({ where: { circleId: circle.id } })).toBe(0);
    });

    it('un rol owner falsificado en la membresía no eleva permisos', async () => {
      const { circle } = await seedCircle();
      const intruder = await makeUser(prisma);

      await makeMembership(prisma, {
        circleId: circle.id,
        userId: intruder.id,
        role: 'owner',
      });

      const auth = await makeAuth(intruder.id);
      const get = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });
      const patch = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { name: 'Escalada' },
      });
      const remove = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });

      // The forged row grants no writes, and the exposed role must not claim
      // ownership either: `Circle.ownerId` is the only authority.
      expect(get.statusCode).toBe(200);
      expect(get.json<CircleDetailResponse>().role).toBe('member');
      expect(patch.statusCode).toBe(403);
      expect(remove.statusCode).toBe(403);
      expect(await prisma.circle.findUnique({ where: { id: circle.id } })).not.toBeNull();
    });

    it('un segundo DELETE secuencial devuelve 404', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const first = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });
      const second = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });

      expect(first.statusCode).toBe(204);
      expect(second.statusCode).toBe(404);
      expectError(second, 'NOT_FOUND');
    });
  });

  describe('AC-04 — un extraño recibe 404', () => {
    it('GET, PATCH y DELETE de un no miembro devuelven 404 y no 403', async () => {
      const { circle } = await seedCircle();
      const stranger = await makeUser(prisma);
      const auth = await makeAuth(stranger.id);

      const get = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });
      const patch = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { name: 'Ajeno' },
      });
      const remove = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
      });

      expect(get.statusCode).toBe(404);
      expect(patch.statusCode).toBe(404);
      expect(remove.statusCode).toBe(404);
      expectError(get, 'NOT_FOUND');
      expectError(patch, 'NOT_FOUND');
      expectError(remove, 'NOT_FOUND');

      expect(await prisma.circle.findUnique({ where: { id: circle.id } })).not.toBeNull();
    });

    it('un id inexistente también devuelve 404 para un usuario con sesión', async () => {
      const user = await makeUser(prisma);
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles/no-existe',
        headers: headers(await makeAuth(user.id)),
      });

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
    });
  });

  describe('AC-05 — settings validados y reemplazados', () => {
    async function patchSettings(
      payload: Record<string, unknown>,
    ): Promise<{ statusCode: number }> {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      return testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload,
      });
    }

    it('rechaza un flag desconocido', async () => {
      const response = await patchSettings({
        settings: { ...DEFAULT_CIRCLE_SETTINGS, membersCanInvite: true },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rechaza un tipo incorrecto', async () => {
      const response = await patchSettings({
        settings: { ...DEFAULT_CIRCLE_SETTINGS, membersCanUpload: 'yes' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rechaza un objeto incompleto', async () => {
      const response = await patchSettings({
        settings: { membersCanUpload: true },
      });

      expect(response.statusCode).toBe(400);
    });

    it('reemplaza los settings completos, sin merge', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const response = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: {
          settings: {
            membersCanCreateAlbums: false,
            membersCanUpload: false,
            membersCanDownload: true,
            membersCanTag: false,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<CircleResponse>().settings).toEqual({
        membersCanCreateAlbums: false,
        membersCanUpload: false,
        membersCanDownload: true,
        membersCanTag: false,
      });

      const persisted = await prisma.circle.findUnique({ where: { id: circle.id } });
      expect(persisted?.settings).toEqual({
        membersCanCreateAlbums: false,
        membersCanUpload: false,
        membersCanDownload: true,
        membersCanTag: false,
      });
    });
  });

  describe('AC-06 — stats acotadas al círculo', () => {
    it('cuenta solo las filas del círculo y calcula lastUploadAt', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const albumA = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });

      await makePhoto(prisma, {
        circleId: circle.id,
        albumId: albumA.id,
        uploaderId: owner.id,
        size: 100,
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
      });
      await makePhoto(prisma, {
        circleId: circle.id,
        albumId: albumA.id,
        uploaderId: member.id,
        size: 250,
        createdAt: new Date('2026-02-03T18:30:00.000Z'),
      });

      // A second circle with more data must not leak into the first one.
      const other = await seedCircle();
      await addMember(other.circle.id);
      const albumB = await makeAlbum(prisma, {
        circleId: other.circle.id,
        createdBy: other.owner.id,
      });
      await makeAlbum(prisma, { circleId: other.circle.id, createdBy: other.owner.id });

      for (let index = 0; index < 3; index += 1) {
        await makePhoto(prisma, {
          circleId: other.circle.id,
          albumId: albumB.id,
          uploaderId: other.owner.id,
          size: 1_000,
          createdAt: new Date('2026-02-05T10:00:00.000Z'),
        });
      }

      const response = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(owner.id)),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<CircleDetailResponse>().stats).toEqual({
        membersCount: 2,
        albumsCount: 1,
        photosCount: 2,
        storageBytes: 350,
        lastUploadAt: '2026-02-03T18:30:00.000Z',
      });

      const otherResponse = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${other.circle.id}`,
        headers: headers(await makeAuth(other.owner.id)),
      });

      expect(otherResponse.json<CircleDetailResponse>().stats).toEqual({
        membersCount: 2,
        albumsCount: 2,
        photosCount: 3,
        storageBytes: 3_000,
        lastUploadAt: '2026-02-05T10:00:00.000Z',
      });
    });

    it('un círculo sin fotos devuelve lastUploadAt null y ceros', async () => {
      const { owner, circle } = await seedCircle();
      const response = await testApp.app.inject({
        method: 'GET',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(owner.id)),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<CircleDetailResponse>().stats).toEqual({
        membersCount: 1,
        albumsCount: 0,
        photosCount: 0,
        storageBytes: 0,
        lastUploadAt: null,
      });
    });
  });

  describe('AC-07 — negativos', () => {
    it('sin sesión todos los endpoints devuelven 401', async () => {
      const { circle } = await seedCircle();
      const auth = null;

      const requests = [
        { method: 'GET' as const, url: '/api/circles' },
        { method: 'POST' as const, url: '/api/circles', payload: { name: 'Sin sesión' } },
        { method: 'GET' as const, url: `/api/circles/${circle.id}` },
        { method: 'PATCH' as const, url: `/api/circles/${circle.id}`, payload: { name: 'X' } },
        { method: 'DELETE' as const, url: `/api/circles/${circle.id}` },
      ];

      for (const request of requests) {
        const response = await testApp.app.inject({
          ...request,
          headers: headers(auth, { withCsrf: false }),
        });

        expect(response.statusCode).toBe(401);
        expectError(response, 'UNAUTHENTICATED');
      }
    });

    it('las mutaciones exigen Origin permitido y CSRF válido', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const withoutCsrf = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth, { withCsrf: false }),
        payload: { name: 'Sin CSRF' },
      });
      const badCsrf = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: { ...headers(auth), 'x-csrf-token': 'token-invalido' },
        payload: { name: 'CSRF inválido' },
      });
      const withoutOrigin = await testApp.app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: headers(auth, { withOrigin: false }),
        payload: { name: 'Sin origen' },
      });
      const createWithoutCsrf = await testApp.app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: headers(auth, { withCsrf: false }),
        payload: { name: 'Sin CSRF' },
      });
      const deleteWithoutCsrf = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth, { withCsrf: false }),
      });

      for (const response of [
        withoutCsrf,
        badCsrf,
        withoutOrigin,
        createWithoutCsrf,
        deleteWithoutCsrf,
      ]) {
        expect(response.statusCode).toBe(403);
        expectError(response, 'FORBIDDEN');
      }

      expect(await prisma.circle.findUnique({ where: { id: circle.id } })).not.toBeNull();
    });

    it('las tres mutaciones rechazan Origin ausente o no permitido', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const mutations = [
        { method: 'POST' as const, url: '/api/circles', payload: { name: 'Sin origen' } },
        {
          method: 'PATCH' as const,
          url: `/api/circles/${circle.id}`,
          payload: { name: 'Sin origen' },
        },
        { method: 'DELETE' as const, url: `/api/circles/${circle.id}` },
      ];

      for (const origin of [undefined, 'https://evil.example']) {
        for (const mutation of mutations) {
          const requestHeaders = headers(auth);

          if (origin === undefined) {
            delete requestHeaders.origin;
          } else {
            requestHeaders.origin = origin;
          }

          const response = await testApp.app.inject({ ...mutation, headers: requestHeaders });

          expect(response.statusCode, `${mutation.method} ${mutation.url} origin=${origin}`).toBe(
            403,
          );
          expectError(response, 'FORBIDDEN');
        }
      }

      // Decision: no session at all is still a 403 when `Origin` is missing,
      // because the cheap origin check runs before session resolution.
      for (const mutation of mutations) {
        const response = await testApp.app.inject({
          ...mutation,
          headers: headers(null, { withCsrf: false, withOrigin: false }),
        });

        expect(response.statusCode, `sin sesión ${mutation.method} ${mutation.url}`).toBe(403);
        expectError(response, 'FORBIDDEN');
      }

      const persisted = await prisma.circle.findUnique({ where: { id: circle.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.name).not.toBe('Sin origen');
    });

    it('rechaza un PATCH sin ningún campo', async () => {
      const { owner, circle } = await seedCircle();
      const response = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(await makeAuth(owner.id)),
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expectError(response, 'VALIDATION_ERROR');
    });

    it('`description: null` borra la descripción', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      await prisma.circle.update({
        where: { id: circle.id },
        data: { description: 'Descripción inicial' },
      });

      const response = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { description: null },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<CircleResponse>().description).toBeNull();

      const persisted = await prisma.circle.findUnique({ where: { id: circle.id } });
      expect(persisted?.description).toBeNull();
    });

    it('rechaza nombre vacío o demasiado largo y descripción demasiado larga', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const createEmpty = await testApp.app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: headers(auth),
        payload: { name: '   ' },
      });
      const createLong = await testApp.app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: headers(auth),
        payload: { name: 'x'.repeat(81) },
      });
      const patchEmpty = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { name: '' },
      });
      const patchLongDescription = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { description: 'x'.repeat(501) },
      });

      for (const response of [createEmpty, createLong, patchEmpty, patchLongDescription]) {
        expect(response.statusCode).toBe(400);
        expectError(response, 'VALIDATION_ERROR');
      }
    });

    it('una portada de otro círculo devuelve 404 y la del propio círculo se guarda', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const otherAlbum = await makeAlbum(prisma, {
        circleId: other.circle.id,
        createdBy: other.owner.id,
      });
      const foreignPhoto = await makePhoto(prisma, {
        circleId: other.circle.id,
        albumId: otherAlbum.id,
        uploaderId: other.owner.id,
      });

      const ownAlbum = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const ownPhoto = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: ownAlbum.id,
        uploaderId: owner.id,
        width: 1_920,
        height: 1_080,
      });

      const auth = await makeAuth(owner.id);

      const foreign = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { coverPhotoId: foreignPhoto.id },
      });

      expect(foreign.statusCode).toBe(404);
      expectError(foreign, 'NOT_FOUND');

      const own = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { coverPhotoId: ownPhoto.id },
      });

      expect(own.statusCode).toBe(200);
      expect(own.json<CircleResponse>().coverPhoto).toEqual({
        id: ownPhoto.id,
        thumbUrl: `/api/photos/${ownPhoto.id}/image?size=thumb`,
        width: 1_920,
        height: 1_080,
      });

      const cleared = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/circles/${circle.id}`,
        headers: headers(auth),
        payload: { coverPhotoId: null },
      });

      expect(cleared.statusCode).toBe(200);
      expect(cleared.json<CircleResponse>().coverPhoto).toBeNull();

      const persisted = await prisma.circle.findUnique({ where: { id: circle.id } });
      expect(persisted?.coverPhotoId).toBeNull();
    });
  });

  describe('carreras lectura→escritura', () => {
    async function openRacingApp(overrides: CircleDelegateOverrides): Promise<TestApp> {
      return createTestApp({ prisma: withCircleRace(prisma, overrides) });
    }

    it('un PATCH que pierde la fila (P2025) responde 404 y no 500', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const raceApp = await openRacingApp({
        update: () => Promise.reject(prismaRaceError('P2025')),
      });

      try {
        const response = await raceApp.app.inject({
          method: 'PATCH',
          url: `/api/circles/${circle.id}`,
          headers: headers(auth),
          payload: { name: 'Carrera' },
        });

        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
      } finally {
        await raceApp.close();
      }
    });

    it('un PATCH con la portada borrada en paralelo (P2003) responde 404 y no 500', async () => {
      const { owner, circle } = await seedCircle();
      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const auth = await makeAuth(owner.id);
      const raceApp = await openRacingApp({
        update: () => Promise.reject(prismaRaceError('P2003')),
      });

      try {
        const response = await raceApp.app.inject({
          method: 'PATCH',
          url: `/api/circles/${circle.id}`,
          headers: headers(auth),
          payload: { coverPhotoId: photo.id },
        });

        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
      } finally {
        await raceApp.close();
      }
    });

    it('un DELETE cuya fila ya no existe responde 404 y no 500', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const raceApp = await openRacingApp({
        deleteMany: () => Promise.resolve({ count: 0 }),
      });

      try {
        const response = await raceApp.app.inject({
          method: 'DELETE',
          url: `/api/circles/${circle.id}`,
          headers: headers(auth),
        });

        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
      } finally {
        await raceApp.close();
      }
    });
  });

  describe('paginación keyset', () => {
    async function seedOrderedCircles(): Promise<{ userId: string; ids: string[] }> {
      const user = await makeUser(prisma);
      const base = new Date('2026-01-01T00:00:00.000Z').getTime();
      const fixture = [
        { id: 'circle-e', updatedAt: new Date(base + 3_000) },
        { id: 'circle-d', updatedAt: new Date(base + 3_000) },
        { id: 'circle-c', updatedAt: new Date(base + 2_000) },
        { id: 'circle-b', updatedAt: new Date(base + 1_000) },
        { id: 'circle-a', updatedAt: new Date(base) },
      ];

      for (const row of fixture) {
        await makeCircle(prisma, { id: row.id, ownerId: user.id });
        await makeMembership(prisma, { circleId: row.id, userId: user.id, role: 'owner' });
        await setCircleUpdatedAt(row.id, row.updatedAt);
      }

      return { userId: user.id, ids: fixture.map((row) => row.id) };
    }

    it('ordena por updatedAt desc con desempate por id desc y pagina sin duplicados', async () => {
      const { userId, ids: expected } = await seedOrderedCircles();
      const auth = await makeAuth(userId);
      const collected: string[] = [];
      let cursor: string | null = null;

      for (let page = 0; page < 3; page += 1) {
        const url: string =
          cursor === null
            ? '/api/circles?limit=2'
            : `/api/circles?limit=2&cursor=${encodeURIComponent(cursor)}`;

        const response = await testApp.app.inject({
          method: 'GET',
          url,
          headers: headers(auth),
        });

        expect(response.statusCode).toBe(200);

        const body = response.json<ListCirclesResponse>();
        expect(body.items.length).toBeLessThanOrEqual(2);

        for (const item of body.items) {
          collected.push(item.id);
          expect(item.role).toBe('owner');
        }

        cursor = body.nextCursor;

        if (page < 2) {
          expect(cursor).not.toBeNull();
        }
      }

      expect(cursor).toBeNull();
      expect(collected).toEqual(expected);
      expect(new Set(collected).size).toBe(expected.length);
    });

    it('rechaza limit fuera de rango y cursores inválidos', async () => {
      const { owner } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const invalidCursors = [
        'no-es-un-cursor',
        Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf8').toString('base64url'),
      ];

      const tooSmall = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles?limit=0',
        headers: headers(auth),
      });
      const tooLarge = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles?limit=101',
        headers: headers(auth),
      });

      expect(tooSmall.statusCode).toBe(400);
      expect(tooLarge.statusCode).toBe(400);

      for (const cursor of invalidCursors) {
        const response = await testApp.app.inject({
          method: 'GET',
          url: `/api/circles?cursor=${encodeURIComponent(cursor)}`,
          headers: headers(auth),
        });

        expect(response.statusCode).toBe(400);

        const body = expectError(response, 'VALIDATION_ERROR');
        expect(body.details?.[0]?.field).toBe('cursor');
      }
    });

    it('un PATCH cambia el updatedAt y mueve el círculo al principio', async () => {
      const user = await makeUser(prisma);
      const first = await makeCircle(prisma, {
        id: 'circle-first',
        ownerId: user.id,
      });
      const second = await makeCircle(prisma, { id: 'circle-second', ownerId: user.id });

      await makeMembership(prisma, { circleId: first.id, userId: user.id, role: 'owner' });
      await makeMembership(prisma, { circleId: second.id, userId: user.id, role: 'owner' });
      await setCircleUpdatedAt('circle-first', new Date('2026-01-01T00:00:00.000Z'));
      await setCircleUpdatedAt('circle-second', new Date('2026-01-02T00:00:00.000Z'));

      const auth = await makeAuth(user.id);
      const before = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles',
        headers: headers(auth),
      });

      expect(before.json<ListCirclesResponse>().items.map((item) => item.id)).toEqual([
        'circle-second',
        'circle-first',
      ]);

      const patch = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/circles/circle-first',
        headers: headers(auth),
        payload: { name: 'Actualizado' },
      });

      expect(patch.statusCode).toBe(200);

      const after = await testApp.app.inject({
        method: 'GET',
        url: '/api/circles',
        headers: headers(auth),
      });

      expect(after.json<ListCirclesResponse>().items.map((item) => item.id)).toEqual([
        'circle-first',
        'circle-second',
      ]);
    });
  });

  describe('OpenAPI', () => {
    interface OpenApiOperation {
      readonly parameters?: Array<{ readonly name?: string; readonly required?: boolean }>;
      readonly responses?: Record<string, unknown>;
    }

    it('documenta el CSRF de las mutaciones, el tag Circles y los 400 de params', async () => {
      const response = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });
      const document = response.json<{
        tags?: Array<{ name?: string }>;
        paths: Record<string, Record<string, OpenApiOperation>>;
      }>();

      const csrfParameter = (operation: OpenApiOperation | undefined) =>
        operation?.parameters?.find((parameter) => parameter.name === 'x-csrf-token');

      const create = document.paths['/api/circles']?.post;
      const patch = document.paths['/api/circles/{circleId}']?.patch;
      const remove = document.paths['/api/circles/{circleId}']?.delete;

      for (const operation of [create, patch, remove]) {
        expect(csrfParameter(operation)).toMatchObject({ required: true });
      }

      expect(document.tags?.map((tag) => tag.name)).toEqual(expect.arrayContaining(['Circles']));

      expect(patch?.responses?.['400']).toBeDefined();
      expect(remove?.responses?.['400']).toBeDefined();
      expect(document.paths['/api/circles/{circleId}']?.get?.responses?.['400']).toBeDefined();
    });
  });
});
