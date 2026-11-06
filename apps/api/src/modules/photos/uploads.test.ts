import {
  type ErrorResponse,
  type MyUploadsPhotosResponse,
  type MyUploadsSummary,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Circle, PrismaClient, User } from '../../generated/prisma/client.ts';
import {
  closeTestPrismaClient,
  getTestPrismaClient,
  hasDatabaseUrl,
  resetDb,
} from '../../test/db.ts';
import {
  makeAlbum,
  makeCircle,
  makeMembership,
  makePhoto,
  makeSession,
  makeUser,
} from '../../test/factories.ts';
import { createTestApp, type TestApp } from '../../test/harness.ts';
import { createSessionToken, hashSessionToken, SESSION_COOKIE_NAME } from '../auth/session.ts';

const hasDatabase = hasDatabaseUrl();

const BASE = new Date('2026-02-01T00:00:00.000Z').getTime();

function at(offsetMs: number): Date {
  return new Date(BASE + offsetMs);
}

interface AuthFixture {
  readonly token: string;
}

/**
 * «Mis subidas» API integration suite (F27).
 *
 * Every test runs over the real HTTP pipeline and PostgreSQL: sessions, Zod
 * validation, shared DTOs and the keyset cursor. The visibility rule is
 * asserted both ways: a user only sees their own photos and a circle where
 * their membership is still present; everything else is a `404`, never a `403`.
 */
describe.skipIf(!hasDatabase)('my uploads API', () => {
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

  function headers(auth: AuthFixture | null): Record<string, string> {
    return auth === null ? {} : { cookie: `${SESSION_COOKIE_NAME}=${auth.token}` };
  }

  async function makeAuth(userId: string): Promise<AuthFixture> {
    const token = createSessionToken();

    await makeSession(prisma, { userId, tokenHash: hashSessionToken(token) });

    return { token };
  }

  async function seedCircle(owner: User, name: string, id?: string): Promise<Circle> {
    const circle = await makeCircle(prisma, {
      ownerId: owner.id,
      name,
      ...(id === undefined ? {} : { id }),
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    return circle;
  }

  function getSummary(auth: AuthFixture | null) {
    return testApp.app.inject({
      method: 'GET',
      url: '/api/me/uploads',
      headers: headers(auth),
    });
  }

  function getPhotos(auth: AuthFixture | null, query: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/me/uploads/photos${query}`,
      headers: headers(auth),
    });
  }

  function expectSummary(response: { json: <T>() => T }): MyUploadsSummary {
    const summary = response.json<MyUploadsSummary>();

    expect(summary).toBeDefined();

    return summary;
  }

  describe('GET /api/me/uploads — resumen', () => {
    async function seedSummary(): Promise<{
      readonly me: User;
      readonly auth: AuthFixture;
      readonly circle1: Circle;
      readonly albumA: { id: string };
      readonly albumB: { id: string };
      readonly circle2: Circle;
      readonly albumC: { id: string };
      readonly albumD: { id: string };
      readonly circle3: Circle;
      readonly hiddenPhoto: { id: string };
    }> {
      const me = await makeUser(prisma);
      const partner = await makeUser(prisma);

      const circle1 = await seedCircle(me, 'Familia');
      await makeMembership(prisma, { circleId: circle1.id, userId: partner.id });

      const albumA = await makeAlbum(prisma, {
        circleId: circle1.id,
        createdBy: me.id,
        title: 'Costa Brava',
      });
      const albumB = await makeAlbum(prisma, {
        circleId: circle1.id,
        createdBy: me.id,
        title: 'Navidad',
      });

      // Five of mine in album A, interleaved in time with a newer photo that
      // belongs to another member of the same album and must never count.
      await makePhoto(prisma, {
        id: 'photo-a1',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(1_000),
      });
      await makePhoto(prisma, {
        id: 'photo-a4',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(2_000),
      });
      await makePhoto(prisma, {
        id: 'photo-a2',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(4_000),
      });
      await makePhoto(prisma, {
        id: 'photo-a5',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(5_000),
      });
      await makePhoto(prisma, {
        id: 'photo-a3',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(6_000),
      });
      await makePhoto(prisma, {
        id: 'photo-a-other',
        circleId: circle1.id,
        albumId: albumA.id,
        uploaderId: partner.id,
        createdAt: at(9_000),
      });
      await makePhoto(prisma, {
        id: 'photo-b1',
        circleId: circle1.id,
        albumId: albumB.id,
        uploaderId: me.id,
        createdAt: at(3_000),
      });

      const circle2 = await seedCircle(me, 'Amigos');
      const albumC = await makeAlbum(prisma, {
        circleId: circle2.id,
        createdBy: me.id,
        title: 'Montaña',
      });

      await makePhoto(prisma, {
        id: 'photo-c1',
        circleId: circle2.id,
        albumId: albumC.id,
        uploaderId: me.id,
        createdAt: at(7_000),
      });
      await makePhoto(prisma, {
        id: 'photo-c2',
        circleId: circle2.id,
        albumId: albumC.id,
        uploaderId: me.id,
        createdAt: at(8_000),
      });

      // Circle the user left: authorship is kept but no membership remains.
      const circle3 = await seedCircle(partner, 'Antiguo');
      const albumD = await makeAlbum(prisma, {
        circleId: circle3.id,
        createdBy: partner.id,
        title: 'Pasado',
      });
      const hiddenPhoto = await makePhoto(prisma, {
        id: 'photo-d1',
        circleId: circle3.id,
        albumId: albumD.id,
        uploaderId: me.id,
        createdAt: at(9_000),
      });

      return {
        me,
        auth: await makeAuth(me.id),
        circle1,
        albumA,
        albumB,
        circle2,
        albumC,
        albumD,
        circle3,
        hiddenPhoto,
      };
    }

    it('agrupa solo mis fotos visibles, con conteos, total y orden por actividad', async () => {
      const fixture = await seedSummary();
      const response = await getSummary(fixture.auth);

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers.vary).toBe('Cookie');

      const body = expectSummary(response);

      expect(body.total).toBe(8);
      expect(body.circles.map((group) => group.circle.id)).toEqual([
        fixture.circle2.id,
        fixture.circle1.id,
      ]);
      expect(body.circles.map((group) => group.circle.name)).toEqual(['Amigos', 'Familia']);
      expect(body.circles.map((group) => group.photosCount)).toEqual([2, 6]);

      const [friends, family] = body.circles;

      expect(friends?.albums.map((group) => group.album.id)).toEqual([fixture.albumC.id]);
      expect(family?.albums.map((group) => group.album.id)).toEqual([
        fixture.albumA.id,
        fixture.albumB.id,
      ]);
      expect(family?.albums.map((group) => group.album.title)).toEqual(['Costa Brava', 'Navidad']);
      expect(family?.albums.map((group) => group.photosCount)).toEqual([5, 1]);
      expect(family?.albums.map((group) => group.lastUploadAt)).toEqual([
        at(6_000).toISOString(),
        at(3_000).toISOString(),
      ]);
    });

    it('incluye como máximo cuatro previews, las más recientes y solo mías', async () => {
      const fixture = await seedSummary();
      const response = await getSummary(fixture.auth);
      const album = expectSummary(response).circles[1]?.albums[0];

      expect(album?.preview.map((photo) => photo.id)).toEqual([
        'photo-a3',
        'photo-a5',
        'photo-a2',
        'photo-a4',
      ]);
      expect(album?.preview).toHaveLength(4);
      expect(album?.preview).not.toContain('photo-a1');
      expect(album?.preview).not.toContain('photo-a-other');

      expect(album?.preview[0]).toMatchObject({
        id: 'photo-a3',
        thumbUrl: '/api/photos/photo-a3/image?size=thumb',
        width: 1600,
        height: 1200,
      });
    });

    it('excluye círculos de los que ya no soy miembro y responde 404 a su álbum', async () => {
      const fixture = await seedSummary();
      const summary = expectSummary(await getSummary(fixture.auth));

      expect(summary.circles.map((group) => group.circle.id)).not.toContain(fixture.circle3.id);
      expect(JSON.stringify(summary)).not.toContain(fixture.circle3.name);
      expect(JSON.stringify(summary)).not.toContain(fixture.albumD.id);
      expect(JSON.stringify(summary)).not.toContain(fixture.hiddenPhoto.id);

      const response = await getPhotos(fixture.auth, `?albumId=${fixture.albumD.id}`);

      expect(response.statusCode).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('desempata por id ascendente cuando círculos y álbumes empatan en actividad', async () => {
      const me = await makeUser(prisma);
      const auth = await makeAuth(me.id);

      const circleB = await seedCircle(me, 'Círculo B', 'circle-tie-b');
      const circleA = await seedCircle(me, 'Círculo A', 'circle-tie-a');

      const albumB = await makeAlbum(prisma, {
        id: 'album-tie-b',
        circleId: circleA.id,
        createdBy: me.id,
        title: 'Álbum B',
      });
      const albumA = await makeAlbum(prisma, {
        id: 'album-tie-a',
        circleId: circleA.id,
        createdBy: me.id,
        title: 'Álbum A',
      });

      await makePhoto(prisma, {
        id: 'photo-tie-circle-b',
        circleId: circleB.id,
        albumId: (
          await makeAlbum(prisma, { circleId: circleB.id, createdBy: me.id, title: 'Solo' })
        ).id,
        uploaderId: me.id,
        createdAt: at(5_000),
      });
      await makePhoto(prisma, {
        id: 'photo-tie-album-b',
        circleId: circleA.id,
        albumId: albumB.id,
        uploaderId: me.id,
        createdAt: at(5_000),
      });
      await makePhoto(prisma, {
        id: 'photo-tie-album-a',
        circleId: circleA.id,
        albumId: albumA.id,
        uploaderId: me.id,
        createdAt: at(5_000),
      });

      const body = expectSummary(await getSummary(auth));

      expect(body.circles.map((group) => group.circle.id)).toEqual([circleA.id, circleB.id]);
      expect(body.circles[0]?.albums.map((group) => group.album.id)).toEqual([
        albumA.id,
        albumB.id,
      ]);
      expect(body.total).toBe(3);
    });

    it('devuelve el estado vacío sin fotos visibles', async () => {
      const me = await makeUser(prisma);
      const response = await getSummary(await makeAuth(me.id));

      expect(response.statusCode).toBe(200);
      expect(expectSummary(response)).toEqual({ total: 0, circles: [] });
    });

    it('sin sesión responde 401', async () => {
      const response = await getSummary(null);

      expect(response.statusCode).toBe(401);
      expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/me/uploads/photos — listado por álbum', () => {
    async function seedAlbum(): Promise<{
      readonly me: User;
      readonly partner: User;
      readonly auth: AuthFixture;
      readonly album: { id: string };
      readonly circle: Circle;
    }> {
      const me = await makeUser(prisma);
      const partner = await makeUser(prisma);
      const circle = await seedCircle(me, 'Familia');

      await makeMembership(prisma, { circleId: circle.id, userId: partner.id });

      const album = await makeAlbum(prisma, {
        circleId: circle.id,
        createdBy: me.id,
        title: 'Costa Brava',
      });

      for (let index = 1; index <= 5; index += 1) {
        await makePhoto(prisma, {
          id: `photo-mine-${index}`,
          circleId: circle.id,
          albumId: album.id,
          uploaderId: me.id,
          createdAt: at(index * 1_000),
        });
      }

      await makePhoto(prisma, {
        id: 'photo-partner',
        circleId: circle.id,
        albumId: album.id,
        uploaderId: partner.id,
        createdAt: at(9_000),
      });

      return { me, partner, auth: await makeAuth(me.id), album, circle };
    }

    it('devuelve solo mis fotos del álbum con PhotoDto completo y total', async () => {
      const fixture = await seedAlbum();
      const response = await getPhotos(fixture.auth, `?albumId=${fixture.album.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers.vary).toBe('Cookie');

      const body = response.json<MyUploadsPhotosResponse>();

      expect(body.total).toBe(5);
      expect(body.nextCursor).toBeNull();
      expect(body.items.map((photo) => photo.id)).toEqual([
        'photo-mine-5',
        'photo-mine-4',
        'photo-mine-3',
        'photo-mine-2',
        'photo-mine-1',
      ]);
      expect(body.items.map((photo) => photo.uploader.id)).toEqual(Array(5).fill(fixture.me.id));
      expect(body.items[0]).toMatchObject({
        id: 'photo-mine-5',
        albumId: fixture.album.id,
        circleId: fixture.circle.id,
        thumbUrl: '/api/photos/photo-mine-5/image?size=thumb',
        displayUrl: '/api/photos/photo-mine-5/image?size=display',
      });
      expect(Array.isArray(body.items[0]?.tags)).toBe(true);
    });

    it('pagina con keyset sin duplicados ni saltos', async () => {
      const fixture = await seedAlbum();
      const collected: string[] = [];
      let cursor: string | null = null;
      let pages = 0;

      do {
        const query =
          cursor === null
            ? `?albumId=${fixture.album.id}&limit=2`
            : `?albumId=${fixture.album.id}&limit=2&cursor=${encodeURIComponent(cursor)}`;

        const response = await getPhotos(fixture.auth, query);

        expect(response.statusCode).toBe(200);

        const body = response.json<MyUploadsPhotosResponse>();

        expect(body.total).toBe(5);
        collected.push(...body.items.map((photo) => photo.id));
        cursor = body.nextCursor;
        pages += 1;
      } while (cursor !== null && pages < 5);

      expect(pages).toBe(3);
      expect(cursor).toBeNull();
      expect(collected).toEqual([
        'photo-mine-5',
        'photo-mine-4',
        'photo-mine-3',
        'photo-mine-2',
        'photo-mine-1',
      ]);
      expect(new Set(collected).size).toBe(collected.length);
      expect(collected).not.toContain('photo-partner');
    });

    it('desempata por id descendente cuando dos fotos comparten createdAt', async () => {
      const fixture = await seedAlbum();

      await makePhoto(prisma, {
        id: 'photo-same-b',
        circleId: fixture.circle.id,
        albumId: fixture.album.id,
        uploaderId: fixture.me.id,
        createdAt: at(10_000),
      });
      await makePhoto(prisma, {
        id: 'photo-same-a',
        circleId: fixture.circle.id,
        albumId: fixture.album.id,
        uploaderId: fixture.me.id,
        createdAt: at(10_000),
      });

      const first = await getPhotos(fixture.auth, `?albumId=${fixture.album.id}&limit=1`);
      const firstBody = first.json<MyUploadsPhotosResponse>();
      const second = await getPhotos(
        fixture.auth,
        `?albumId=${fixture.album.id}&limit=1&cursor=${encodeURIComponent(firstBody.nextCursor ?? '')}`,
      );

      expect(firstBody.items.map((photo) => photo.id)).toEqual(['photo-same-b']);
      expect(second.statusCode).toBe(200);
      expect(second.json<MyUploadsPhotosResponse>().items.map((photo) => photo.id)).toEqual([
        'photo-same-a',
      ]);
    });

    it('rechaza parámetros inválidos con 400 VALIDATION_ERROR', async () => {
      const fixture = await seedAlbum();
      const missingAlbum = await getPhotos(fixture.auth, '');
      const zeroLimit = await getPhotos(fixture.auth, `?albumId=${fixture.album.id}&limit=0`);
      const tooLargeLimit = await getPhotos(fixture.auth, `?albumId=${fixture.album.id}&limit=101`);
      const invalidCursor = await getPhotos(
        fixture.auth,
        `?albumId=${fixture.album.id}&cursor=no-es-un-cursor`,
      );

      for (const response of [missingAlbum, zeroLimit, tooLargeLimit, invalidCursor]) {
        expect(response.statusCode).toBe(400);
        expect(response.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');
      }

      expect(invalidCursor.json<ErrorResponse>().details?.[0]?.field).toBe('cursor');
    });

    it('responde 404 para un álbum de otro círculo, inexistente o sin membresía', async () => {
      const fixture = await seedAlbum();
      const stranger = await makeUser(prisma);
      const strangerCircle = await seedCircle(stranger, 'Otro círculo');
      const foreignAlbum = await makeAlbum(prisma, {
        circleId: strangerCircle.id,
        createdBy: stranger.id,
        title: 'Ajeno',
      });

      const foreign = await getPhotos(fixture.auth, `?albumId=${foreignAlbum.id}`);
      const missing = await getPhotos(fixture.auth, '?albumId=no-existe');

      expect(foreign.statusCode).toBe(404);
      expect(foreign.json<ErrorResponse>().code).toBe('NOT_FOUND');
      expect(missing.statusCode).toBe(404);
      expect(missing.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('un usuario de otro círculo no ve nada mío y recibe 404 al pedir el álbum', async () => {
      const fixture = await seedAlbum();
      const stranger = await makeUser(prisma);
      await seedCircle(stranger, 'Otro círculo');
      const strangerAuth = await makeAuth(stranger.id);

      const summary = expectSummary(await getSummary(strangerAuth));

      expect(summary).toEqual({ total: 0, circles: [] });

      const response = await getPhotos(strangerAuth, `?albumId=${fixture.album.id}`);

      expect(response.statusCode).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
      expect(response.body).not.toContain('photo-mine');
    });

    it('sin sesión responde 401', async () => {
      const fixture = await seedAlbum();
      const response = await getPhotos(null, `?albumId=${fixture.album.id}`);

      expect(response.statusCode).toBe(401);
      expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
    });
  });
});
