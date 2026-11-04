import {
  type ErrorResponse,
  type ListMembersResponse,
  type PersonPhotosResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSessionToken, hashSessionToken, SESSION_COOKIE_NAME } from '../auth/session.ts';
import type { Circle, PrismaClient } from '../../generated/prisma/client.ts';
import {
  closeTestPrismaClient,
  getTestPrismaClient,
  hasDatabaseUrl,
  resetDb,
} from '../../test/db.ts';
import {
  makeActivity,
  makeAlbum,
  makeCircle,
  makeMembership,
  makePhoto,
  makeSession,
  makeTag,
  makeUser,
} from '../../test/factories.ts';
import { createTestApp, TEST_APP_URL, type TestApp } from '../../test/harness.ts';

const hasDatabase = hasDatabaseUrl();

const ORIGIN = TEST_APP_URL;

const BASE = new Date('2026-01-01T00:00:00.000Z').getTime();

function at(offsetMs: number): Date {
  return new Date(BASE + offsetMs);
}

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
 * Members API integration suite (F21).
 *
 * Exercises the real HTTP pipeline over PostgreSQL: sessions, CSRF, Zod
 * validation, the shared DTOs and the keyset cursors. Cross-circle cases
 * always assert `404`, never `403`.
 */
describe.skipIf(!hasDatabase)('members API', () => {
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

    await makeMembership(prisma, {
      circleId: circle.id,
      userId: owner.id,
      role: 'owner',
      joinedAt: at(0),
    });

    return { owner, circle };
  }

  async function addMember(circleId: string, joinedAt: Date = at(1_000)) {
    const user = await makeUser(prisma);

    await makeMembership(prisma, {
      circleId,
      userId: user.id,
      role: 'member',
      joinedAt,
    });

    return user;
  }

  function listMembers(auth: AuthFixture | null, circleId: string, query = '') {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/circles/${circleId}/members${query}`,
      headers: headers(auth, { withCsrf: false }),
    });
  }

  function personPhotos(auth: AuthFixture | null, circleId: string, userId: string, query = '') {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/circles/${circleId}/members/${userId}/photos${query}`,
      headers: headers(auth, { withCsrf: false }),
    });
  }

  function removeMember(auth: AuthFixture | null, circleId: string, userId: string) {
    return testApp.app.inject({
      method: 'DELETE',
      url: `/api/circles/${circleId}/members/${userId}`,
      headers: headers(auth),
    });
  }

  function leave(auth: AuthFixture | null, circleId: string) {
    return testApp.app.inject({
      method: 'POST',
      url: `/api/circles/${circleId}/leave`,
      headers: headers(auth),
    });
  }

  function expectError(response: { json: <T>() => T }, code: ErrorResponse['code']): ErrorResponse {
    const body = response.json<ErrorResponse>();
    expect(body.code).toBe(code);

    return body;
  }

  describe('AC-01 — listado solo del círculo', () => {
    it('lista owner y members con orden estable y contador', async () => {
      const { owner, circle } = await seedCircle();
      const second = await addMember(circle.id, at(2_000));
      const first = await addMember(circle.id, at(1_000));

      const response = await listMembers(await makeAuth(owner.id), circle.id);

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers.vary).toBe('Cookie');

      const body = response.json<ListMembersResponse>();
      expect(body.nextCursor).toBeNull();
      expect(body.items.map((item) => item.user.id)).toEqual([owner.id, first.id, second.id]);
      expect(body.items.map((item) => item.role)).toEqual(['owner', 'member', 'member']);
      expect(body.items.map((item) => item.photosCount)).toEqual([0, 0, 0]);
    });

    it('pagina con cursor keyset sin duplicados y respeta el límite', async () => {
      const { owner, circle } = await seedCircle();
      const members = [];

      for (let index = 1; index <= 4; index += 1) {
        members.push(await addMember(circle.id, at(index * 1_000)));
      }

      const auth = await makeAuth(owner.id);
      const collected: string[] = [];
      let cursor: string | null = null;

      for (let page = 0; page < 3; page += 1) {
        const query: string =
          cursor === null ? '?limit=2' : `?limit=2&cursor=${encodeURIComponent(cursor)}`;

        const response = await listMembers(auth, circle.id, query);

        expect(response.statusCode).toBe(200);

        const body = response.json<ListMembersResponse>();

        collected.push(...body.items.map((item) => item.user.id));
        cursor = body.nextCursor;
      }

      expect(cursor).toBeNull();
      expect(collected).toEqual([owner.id, ...members.map((member) => member.id)]);
      expect(new Set(collected).size).toBe(collected.length);

      const tooLarge = await listMembers(auth, circle.id, '?limit=101');
      const invalidCursor = await listMembers(auth, circle.id, '?cursor=no-es-un-cursor');

      expect(tooLarge.statusCode).toBe(400);
      expect(invalidCursor.statusCode).toBe(400);
      expect(expectError(invalidCursor, 'VALIDATION_ERROR').details?.[0]?.field).toBe('cursor');
    });

    it('un extraño no ve nada del círculo, aunque esté en otro', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();

      const stranger = await makeAuth(other.owner.id);
      const response = await listMembers(stranger, circle.id);

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
      expect(response.body).not.toContain(owner.name);
    });

    it('sin sesión responde 401', async () => {
      const { circle } = await seedCircle();
      const response = await listMembers(null, circle.id);

      expect(response.statusCode).toBe(401);
      expectError(response, 'UNAUTHENTICATED');
    });
  });

  describe('AC-05 — photosCount por círculo', () => {
    it('cuenta solo etiquetas en fotos del círculo y devuelve 0 sin etiquetas', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();

      await makeMembership(prisma, { circleId: other.circle.id, userId: member.id });

      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const otherAlbum = await makeAlbum(prisma, {
        circleId: other.circle.id,
        createdBy: other.owner.id,
      });

      const taggedA = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const taggedB = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const untagged = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const inOtherCircle = await makePhoto(prisma, {
        circleId: other.circle.id,
        albumId: otherAlbum.id,
        uploaderId: other.owner.id,
      });

      await makeTag(prisma, {
        photoId: taggedA.id,
        taggedUserId: member.id,
        createdBy: owner.id,
      });
      await makeTag(prisma, {
        photoId: taggedB.id,
        taggedUserId: member.id,
        createdBy: owner.id,
      });
      // A tag of another person must not inflate the member's counter.
      await makeTag(prisma, {
        photoId: untagged.id,
        taggedUserId: owner.id,
        createdBy: owner.id,
      });
      // Same person, another circle: must not count in this list.
      await makeTag(prisma, {
        photoId: inOtherCircle.id,
        taggedUserId: member.id,
        createdBy: other.owner.id,
      });

      const response = await listMembers(await makeAuth(owner.id), circle.id);

      expect(response.statusCode).toBe(200);

      const items = response.json<ListMembersResponse>().items;
      const memberItem = items.find((item) => item.user.id === member.id);
      const ownerItem = items.find((item) => item.user.id === owner.id);

      expect(memberItem?.photosCount).toBe(2);
      expect(ownerItem?.photosCount).toBe(1);
    });

    it('no expone el email de ningún miembro', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);

      const response = await listMembers(await makeAuth(owner.id), circle.id);

      expect(response.statusCode).toBe(200);
      expect(response.body).not.toContain(owner.email);
      expect(response.body).not.toContain(member.email);
      expect(response.body).not.toContain('email');

      for (const item of response.json<ListMembersResponse>().items) {
        expect(item.user).not.toHaveProperty('email');
      }
    });
  });

  describe('AC-02 — expulsión solo del owner', () => {
    it('expulsa con 204 y limpia etiquetas del círculo sin tocar fotos ni autoría', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();
      const otherElsewhere = await addMember(other.circle.id);

      await makeMembership(prisma, { circleId: other.circle.id, userId: member.id });

      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const otherAlbum = await makeAlbum(prisma, {
        circleId: other.circle.id,
        createdBy: other.owner.id,
      });

      // Uploaded by the expelled member: authorship must survive.
      const theirPhoto = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: member.id,
      });
      const ownerPhoto = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const foreignPhoto = await makePhoto(prisma, {
        circleId: other.circle.id,
        albumId: otherAlbum.id,
        uploaderId: other.owner.id,
      });

      // Tags of the expelled member inside this circle: removed.
      await makeTag(prisma, {
        photoId: ownerPhoto.id,
        taggedUserId: member.id,
        createdBy: owner.id,
      });
      // Tag they created for someone else: kept.
      await makeTag(prisma, {
        photoId: ownerPhoto.id,
        taggedUserId: otherElsewhere.id,
        createdBy: member.id,
      });
      // Tag of the expelled member in another circle: kept.
      await makeTag(prisma, {
        photoId: foreignPhoto.id,
        taggedUserId: member.id,
        createdBy: other.owner.id,
      });
      // Activity is history: expulsion never deletes it.
      await makeActivity(prisma, { circleId: circle.id, actorId: member.id });

      const response = await removeMember(await makeAuth(owner.id), circle.id, member.id);

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');

      expect(
        await prisma.membership.findUnique({
          where: { circleId_userId: { circleId: circle.id, userId: member.id } },
        }),
      ).toBeNull();

      const remainingTags = await prisma.photoTag.findMany({ where: { taggedUserId: member.id } });

      expect(remainingTags.map((tag) => tag.photoId)).toEqual([foreignPhoto.id]);
      expect(
        await prisma.photoTag.count({
          where: { taggedUserId: otherElsewhere.id, createdBy: member.id },
        }),
      ).toBe(1);

      // Photos stay, with their original author.
      const photos = await prisma.photo.findMany({
        where: { circleId: circle.id },
        orderBy: { id: 'asc' },
      });

      expect(photos).toHaveLength(2);
      expect(photos.find((photo) => photo.id === theirPhoto.id)?.uploaderId).toBe(member.id);
      expect(await prisma.activity.count({ where: { circleId: circle.id } })).toBe(1);
    });

    it('un member que intenta expulsar recibe 403 y no borra nada', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const target = await addMember(circle.id, at(2_000));

      const response = await removeMember(await makeAuth(member.id), circle.id, target.id);

      expect(response.statusCode).toBe(403);
      expectError(response, 'FORBIDDEN');
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: target.id } }),
      ).toBe(1);
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: owner.id } }),
      ).toBe(1);
    });

    it('un role owner falsificado no eleva permisos', async () => {
      const { circle } = await seedCircle();
      const forged = await addMember(circle.id);
      const target = await addMember(circle.id, at(2_000));

      await prisma.membership.update({
        where: { circleId_userId: { circleId: circle.id, userId: forged.id } },
        data: { role: 'owner' },
      });

      const auth = await makeAuth(forged.id);
      const listed = await listMembers(auth, circle.id);
      const denied = await removeMember(auth, circle.id, target.id);

      expect(listed.statusCode).toBe(200);
      expect(
        listed.json<ListMembersResponse>().items.find((item) => item.user.id === forged.id)?.role,
      ).toBe('member');
      expect(denied.statusCode).toBe(403);
      expectError(denied, 'FORBIDDEN');
    });

    it('un objetivo inexistente u de otro círculo responde 404', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const auth = await makeAuth(owner.id);

      const unknown = await removeMember(auth, circle.id, 'usuario-que-no-existe');
      const foreign = await removeMember(auth, circle.id, other.owner.id);

      expect(unknown.statusCode).toBe(404);
      expectError(unknown, 'NOT_FOUND');
      expect(foreign.statusCode).toBe(404);
      expectError(foreign, 'NOT_FOUND');
      expect(
        await prisma.membership.count({
          where: { circleId: other.circle.id, userId: other.owner.id },
        }),
      ).toBe(1);
    });

    it('el owner no se puede expulsar a sí mismo ni a otro owner: 409', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const self = await removeMember(auth, circle.id, owner.id);

      expect(self.statusCode).toBe(409);
      expect(expectError(self, 'CONFLICT').message).toBe(
        'El propietario no puede salir ni ser expulsado del círculo.',
      );
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: owner.id } }),
      ).toBe(1);
    });

    it('un extraño recibe 404 y las mutaciones exigen Origin y CSRF', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();
      const auth = await makeAuth(owner.id);

      const stranger = await removeMember(await makeAuth(other.owner.id), circle.id, member.id);

      expect(stranger.statusCode).toBe(404);

      const withoutCsrf = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/members/${member.id}`,
        headers: headers(auth, { withCsrf: false }),
      });
      const withoutOrigin = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/circles/${circle.id}/members/${member.id}`,
        headers: headers(auth, { withOrigin: false }),
      });

      for (const response of [withoutCsrf, withoutOrigin]) {
        expect(response.statusCode).toBe(403);
        expectError(response, 'FORBIDDEN');
      }

      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: member.id } }),
      ).toBe(1);
    });
  });

  describe('AC-03 — salida del member', () => {
    it('un member sale con 204 y conserva sus fotos', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: member.id });
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: member.id,
      });

      await makeTag(prisma, {
        photoId: photo.id,
        taggedUserId: member.id,
        createdBy: owner.id,
      });

      const response = await leave(await makeAuth(member.id), circle.id);

      expect(response.statusCode).toBe(204);
      expect(
        await prisma.membership.findUnique({
          where: { circleId_userId: { circleId: circle.id, userId: member.id } },
        }),
      ).toBeNull();
      expect(await prisma.photoTag.count({ where: { taggedUserId: member.id } })).toBe(0);

      const persisted = await prisma.photo.findUnique({ where: { id: photo.id } });

      expect(persisted).not.toBeNull();
      expect(persisted?.uploaderId).toBe(member.id);
    });

    it('el owner no puede salir: 409', async () => {
      const { owner, circle } = await seedCircle();
      const response = await leave(await makeAuth(owner.id), circle.id);

      expect(response.statusCode).toBe(409);
      expectError(response, 'CONFLICT');
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: owner.id } }),
      ).toBe(1);
    });

    it('quien ya no es miembro recibe 404 y sin sesión 401', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);

      expect((await leave(await makeAuth(member.id), circle.id)).statusCode).toBe(204);

      const repeated = await leave(await makeAuth(member.id), circle.id);

      expect(repeated.statusCode).toBe(404);
      expectError(repeated, 'NOT_FOUND');

      const anonymous = await leave(null, circle.id);

      expect(anonymous.statusCode).toBe(401);
      expectError(anonymous, 'UNAUTHENTICATED');
      expect(
        await prisma.membership.count({ where: { circleId: circle.id, userId: owner.id } }),
      ).toBe(1);
    });
  });

  describe('AC-07 — fotos de esta persona', () => {
    it('lista solo fotos del círculo etiquetadas, paginadas y con PhotoDto', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();

      await makeMembership(prisma, { circleId: other.circle.id, userId: member.id });

      const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
      const otherAlbum = await makeAlbum(prisma, {
        circleId: other.circle.id,
        createdBy: other.owner.id,
      });

      const oldest = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        createdAt: at(1_000),
        description: 'La más antigua',
      });
      const middle = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        createdAt: at(2_000),
      });
      const newest = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        createdAt: at(3_000),
      });
      const untagged = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        createdAt: at(4_000),
      });
      const foreign = await makePhoto(prisma, {
        circleId: other.circle.id,
        albumId: otherAlbum.id,
        uploaderId: other.owner.id,
        createdAt: at(5_000),
      });

      for (const photo of [oldest, middle, newest, foreign]) {
        await makeTag(prisma, {
          photoId: photo.id,
          taggedUserId: member.id,
          createdBy: owner.id,
        });
      }

      const auth = await makeAuth(owner.id);
      const collected: string[] = [];
      let cursor: string | null = null;

      for (let page = 0; page < 2; page += 1) {
        const query: string =
          cursor === null ? '?limit=2' : `?limit=2&cursor=${encodeURIComponent(cursor)}`;

        const response = await personPhotos(auth, circle.id, member.id, query);

        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).toBe('private, no-store');

        const body = response.json<PersonPhotosResponse>();

        for (const item of body.items) {
          expect(item.circleId).toBe(circle.id);
          expect(item.uploader.id).toBe(owner.id);
          expect(item.tags.map((tag) => tag.id)).toContain(member.id);
          expect(item.thumbUrl).toBe(`/api/photos/${item.id}/image?size=thumb`);
          expect(item.displayUrl).toBe(`/api/photos/${item.id}/image?size=display`);
          expect(item).not.toHaveProperty('original');
          expect(item).not.toHaveProperty('originalKey');
          expect(item).not.toHaveProperty('displayKey');
          expect(item).not.toHaveProperty('thumbKey');
          expect(item).not.toHaveProperty('latitude');
          expect(response.body).not.toContain(untagged.id);
          expect(response.body).not.toContain(foreign.id);
          expect(response.body).not.toContain(other.circle.id);
          expect(response.body).not.toContain(owner.email);
        }

        collected.push(...body.items.map((item) => item.id));
        cursor = body.nextCursor;
      }

      expect(cursor).toBeNull();
      expect(collected).toEqual([newest.id, middle.id, oldest.id]);
      expect(collected).not.toContain(untagged.id);
      expect(collected).not.toContain(foreign.id);
    });

    it('un objetivo que no es miembro del círculo responde 404', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const response = await personPhotos(await makeAuth(owner.id), circle.id, other.owner.id);

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
    });

    it('un llamante que no es miembro responde 404 y sin sesión 401', async () => {
      const { owner, circle } = await seedCircle();
      const stranger = await makeUser(prisma);
      const denied = await personPhotos(await makeAuth(stranger.id), circle.id, owner.id);

      expect(denied.statusCode).toBe(404);
      expectError(denied, 'NOT_FOUND');

      const anonymous = await personPhotos(null, circle.id, owner.id);

      expect(anonymous.statusCode).toBe(401);
      expectError(anonymous, 'UNAUTHENTICATED');
    });
  });
});
