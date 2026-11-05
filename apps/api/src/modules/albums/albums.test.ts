import { PrismaPg } from '@prisma/adapter-pg';
import {
  DEFAULT_CIRCLE_SETTINGS,
  type AlbumResponse,
  type CircleSettings,
  type EmptyAlbumResponse,
  type ErrorResponse,
  type ListAlbumsResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSessionToken, hashSessionToken, SESSION_COOKIE_NAME } from '../auth/session.ts';
import {
  PrismaClient as SecondPrismaClient,
  type Circle,
  type PrismaClient,
} from '../../generated/prisma/client.ts';
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
import { decodeAlbumCursor } from './cursor.ts';

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

interface CreateAlbumBody {
  readonly title: string;
  readonly description?: string | null;
  readonly date?: string | null;
}

/**
 * Albums API integration suite (F23).
 *
 * Exercises the real HTTP pipeline over PostgreSQL: sessions, CSRF, Origin,
 * Zod validation, shared DTOs, keyset cursors and the transactional activity.
 * Cross-circle cases always assert `404`, never `403`.
 */
describe.skipIf(!hasDatabase)('albums API', () => {
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

  async function seedCircle(settings?: Partial<CircleSettings>): Promise<CircleFixture> {
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, {
      ownerId: owner.id,
      ...(settings === undefined ? {} : { settings: { ...DEFAULT_CIRCLE_SETTINGS, ...settings } }),
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    return { owner, circle };
  }

  async function addMember(circleId: string) {
    const user = await makeUser(prisma);

    await makeMembership(prisma, { circleId, userId: user.id, role: 'member' });

    return user;
  }

  async function seedAlbum(
    circleId: string,
    createdBy: string,
    overrides: { id?: string; title?: string; description?: string | null; createdAt?: Date } = {},
  ) {
    return makeAlbum(prisma, { circleId, createdBy, ...overrides });
  }

  function listAlbums(auth: AuthFixture | null, circleId: string, query = '') {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/circles/${circleId}/albums${query}`,
      headers: headers(auth, { withCsrf: false }),
    });
  }

  function createAlbumRequest(auth: AuthFixture | null, circleId: string, body: CreateAlbumBody) {
    return testApp.app.inject({
      method: 'POST',
      url: `/api/circles/${circleId}/albums`,
      headers: headers(auth),
      payload: body,
    });
  }

  function getAlbum(auth: AuthFixture | null, albumId: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/albums/${albumId}`,
      headers: headers(auth, { withCsrf: false }),
    });
  }

  function patchAlbumRequest(
    auth: AuthFixture | null,
    albumId: string,
    body: Record<string, unknown>,
  ) {
    return testApp.app.inject({
      method: 'PATCH',
      url: `/api/albums/${albumId}`,
      headers: headers(auth),
      payload: body,
    });
  }

  function deleteAlbum(auth: AuthFixture | null, albumId: string) {
    return testApp.app.inject({
      method: 'DELETE',
      url: `/api/albums/${albumId}`,
      headers: headers(auth),
    });
  }

  function emptyAlbumRequest(auth: AuthFixture | null, albumId: string) {
    return testApp.app.inject({
      method: 'DELETE',
      url: `/api/albums/${albumId}/photos`,
      headers: headers(auth),
    });
  }

  function expectError(response: { json: <T>() => T }, code: ErrorResponse['code']): ErrorResponse {
    const body = response.json<ErrorResponse>();
    expect(body.code).toBe(code);

    return body;
  }

  describe('AC-01 — CRUD', () => {
    it('crea, lee, edita y borra un álbum vacío', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      const created = await createAlbumRequest(auth, circle.id, {
        title: '  Verano en Mallorca  ',
        description: 'Días de playa',
        date: '2025-07-01T10:00:00.000Z',
      });

      expect(created.statusCode).toBe(201);

      const album = created.json<AlbumResponse>();

      expect(album.circleId).toBe(circle.id);
      expect(album.title).toBe('Verano en Mallorca');
      expect(album.description).toBe('Días de playa');
      expect(album.date).toBe('2025-07-01T10:00:00.000Z');
      expect(album.coverPhoto).toBeNull();
      expect(album.photosCount).toBe(0);
      expect(album.createdBy).toEqual({ id: owner.id, name: owner.name, avatarUrl: null });

      const detail = await getAlbum(auth, album.id);

      expect(detail.statusCode).toBe(200);
      expect(detail.headers['cache-control']).toBe('private, no-store');
      expect(detail.headers.vary).toBe('Cookie');
      expect(detail.json<AlbumResponse>()).toEqual(album);

      const patched = await patchAlbumRequest(auth, album.id, {
        title: 'Verano 2025',
        description: null,
        date: null,
      });

      expect(patched.statusCode).toBe(200);
      expect(patched.json<AlbumResponse>().title).toBe('Verano 2025');
      expect(patched.json<AlbumResponse>().description).toBeNull();
      expect(patched.json<AlbumResponse>().date).toBeNull();

      const deleted = await deleteAlbum(auth, album.id);

      expect(deleted.statusCode).toBe(204);
      expect(await prisma.album.findUnique({ where: { id: album.id } })).toBeNull();
      expect((await getAlbum(auth, album.id)).statusCode).toBe(404);
    });

    it('el listado no mezcla círculos y devuelve portada y contador', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const auth = await makeAuth(owner.id);

      const older = await seedAlbum(circle.id, owner.id, {
        id: 'album-a-1',
        title: 'Más antiguo',
        createdAt: at(1_000),
      });
      const newer = await seedAlbum(circle.id, owner.id, {
        id: 'album-a-2',
        title: 'Más nuevo',
        createdAt: at(2_000),
      });
      await seedAlbum(other.circle.id, other.owner.id, { title: 'De otro círculo' });

      const cover = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: newer.id,
        uploaderId: owner.id,
      });

      await prisma.album.update({ where: { id: newer.id }, data: { coverPhotoId: cover.id } });

      const response = await listAlbums(auth, circle.id);

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-store');

      const body = response.json<ListAlbumsResponse>();

      expect(body.nextCursor).toBeNull();
      expect(body.items.map((item) => item.id)).toEqual([newer.id, older.id]);

      const first = body.items[0];

      expect(first?.photosCount).toBe(1);
      expect(first?.coverPhoto).toEqual({
        id: cover.id,
        thumbUrl: `/api/photos/${cover.id}/image?size=thumb`,
        width: cover.width,
        height: cover.height,
      });
      expect(response.body).not.toContain(other.circle.id);
    });

    it('pagina con cursor keyset sin duplicados y con el defecto de 24', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);

      for (let index = 0; index < 25; index += 1) {
        await seedAlbum(circle.id, owner.id, {
          id: `paged-album-${String(index).padStart(2, '0')}`,
          createdAt: at(index * 1_000),
        });
      }

      const firstPage = await listAlbums(auth, circle.id);

      expect(firstPage.statusCode).toBe(200);

      const firstBody = firstPage.json<ListAlbumsResponse>();

      expect(firstBody.items).toHaveLength(24);
      expect(firstBody.nextCursor).not.toBeNull();

      const secondPage = await listAlbums(
        auth,
        circle.id,
        `?cursor=${encodeURIComponent(firstBody.nextCursor ?? '')}`,
      );

      expect(secondPage.statusCode).toBe(200);

      const secondBody = secondPage.json<ListAlbumsResponse>();

      expect(secondBody.items).toHaveLength(1);
      expect(secondBody.nextCursor).toBeNull();

      const collected = [...firstBody.items, ...secondBody.items].map((item) => item.id);

      expect(new Set(collected).size).toBe(25);
      expect(collected[0]).toBe('paged-album-24');
      expect(collected.at(-1)).toBe('paged-album-00');
    });

    it('desempata por id cuando varios álbumes comparten createdAt', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const sharedCreatedAt = at(5_000);

      for (const id of ['tie-a', 'tie-b', 'tie-c']) {
        await seedAlbum(circle.id, owner.id, { id, createdAt: sharedCreatedAt });
      }

      const collected: string[] = [];
      let cursor: string | null = null;

      for (let page = 0; page < 3; page += 1) {
        const query =
          cursor === null ? '?limit=1' : `?limit=1&cursor=${encodeURIComponent(cursor)}`;
        const response = await listAlbums(auth, circle.id, query);

        expect(response.statusCode).toBe(200);

        const body = response.json<ListAlbumsResponse>();
        const item = body.items[0];

        expect(body.items).toHaveLength(1);

        if (item === undefined) {
          throw new Error('La página de álbumes no devolvió ningún elemento.');
        }

        collected.push(item.id);

        if (body.nextCursor !== null) {
          expect(decodeAlbumCursor(body.nextCursor)).toEqual({
            createdAt: sharedCreatedAt,
            id: item.id,
          });
        }

        cursor = body.nextCursor;
      }

      expect(collected).toEqual(['tie-c', 'tie-b', 'tie-a']);
      expect(new Set(collected).size).toBe(3);
      expect(cursor).toBeNull();
    });

    it('rechaza límites fuera de rango y cursores inválidos', async () => {
      const { owner, circle } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const wrongPayload = Buffer.from(
        JSON.stringify({ updatedAt: '2026-01-01T00:00:00.000Z', id: 'x' }),
        'utf8',
      ).toString('base64url');

      const tooLarge = await listAlbums(auth, circle.id, '?limit=101');
      const zero = await listAlbums(auth, circle.id, '?limit=0');
      const notANumber = await listAlbums(auth, circle.id, '?limit=abc');
      const invalid = await listAlbums(auth, circle.id, '?cursor=no-es-un-cursor');
      const wrongShape = await listAlbums(
        auth,
        circle.id,
        `?cursor=${encodeURIComponent(wrongPayload)}`,
      );

      for (const response of [tooLarge, zero, notANumber, invalid, wrongShape]) {
        expect(response.statusCode).toBe(400);
        expectError(response, 'VALIDATION_ERROR');
      }

      expect(expectError(invalid, 'VALIDATION_ERROR').details?.[0]?.field).toBe('cursor');
      expect(expectError(wrongShape, 'VALIDATION_ERROR').details?.[0]?.field).toBe('cursor');
    });
  });

  describe('AC-02 — solo miembros', () => {
    it('un miembro lista y ve el detalle; un extraño recibe 404 en todo', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const other = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const memberAuth = await makeAuth(member.id);
      const strangerAuth = await makeAuth(other.owner.id);

      expect((await listAlbums(memberAuth, circle.id)).statusCode).toBe(200);
      expect((await getAlbum(memberAuth, album.id)).statusCode).toBe(200);

      const strangerList = await listAlbums(strangerAuth, circle.id);
      const strangerDetail = await getAlbum(strangerAuth, album.id);
      const strangerCreate = await createAlbumRequest(strangerAuth, circle.id, { title: 'Ajeno' });
      const strangerPatch = await patchAlbumRequest(strangerAuth, album.id, { title: 'Ajeno' });
      const strangerDelete = await deleteAlbum(strangerAuth, album.id);
      const strangerEmpty = await emptyAlbumRequest(strangerAuth, album.id);

      for (const response of [
        strangerList,
        strangerDetail,
        strangerCreate,
        strangerPatch,
        strangerDelete,
        strangerEmpty,
      ]) {
        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
      }

      expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
    });

    it('sin sesión responde 401', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);

      for (const response of [
        await listAlbums(null, circle.id),
        await getAlbum(null, album.id),
        await createAlbumRequest(null, circle.id, { title: 'Sin sesión' }),
        await patchAlbumRequest(null, album.id, { title: 'Sin sesión' }),
        await deleteAlbum(null, album.id),
        await emptyAlbumRequest(null, album.id),
      ]) {
        expect(response.statusCode).toBe(401);
        expectError(response, 'UNAUTHENTICATED');
      }
    });
  });

  describe('AC-03 — crear requiere permiso', () => {
    it('el owner crea siempre y el miembro solo con la flag activa', async () => {
      const open = await seedCircle();
      const closed = await seedCircle({ membersCanCreateAlbums: false });
      const openMember = await addMember(open.circle.id);
      const closedMember = await addMember(closed.circle.id);

      const ownerAllowed = await createAlbumRequest(
        await makeAuth(closed.owner.id),
        closed.circle.id,
        { title: 'Del owner' },
      );
      const memberAllowed = await createAlbumRequest(
        await makeAuth(openMember.id),
        open.circle.id,
        { title: 'Del miembro' },
      );
      const memberDenied = await createAlbumRequest(
        await makeAuth(closedMember.id),
        closed.circle.id,
        { title: 'No permitido' },
      );

      expect(ownerAllowed.statusCode).toBe(201);
      expect(memberAllowed.statusCode).toBe(201);
      expect(memberDenied.statusCode).toBe(403);
      expectError(memberDenied, 'FORBIDDEN');
    });
  });

  describe('AC-04 — editar y borrar', () => {
    it('edita el owner o el creador con flag; un tercer miembro recibe 403', async () => {
      const { owner, circle } = await seedCircle();
      const creator = await addMember(circle.id);
      const otherMember = await addMember(circle.id);
      const creatorAuth = await makeAuth(creator.id);

      const created = await createAlbumRequest(creatorAuth, circle.id, {
        title: 'Creado por el miembro',
      });

      expect(created.statusCode).toBe(201);

      const album = created.json<AlbumResponse>();

      const byCreator = await patchAlbumRequest(creatorAuth, album.id, { title: 'Editado' });
      const byOtherMember = await patchAlbumRequest(await makeAuth(otherMember.id), album.id, {
        title: 'Editado por otro',
      });
      const byOwner = await patchAlbumRequest(await makeAuth(owner.id), album.id, {
        title: 'Editado por el owner',
      });

      expect(byCreator.statusCode).toBe(200);
      expect(byOtherMember.statusCode).toBe(403);
      expectError(byOtherMember, 'FORBIDDEN');
      expect(byOwner.statusCode).toBe(200);
      expect(byOwner.json<AlbumResponse>().title).toBe('Editado por el owner');
    });

    it('el creador deja de poder editar si se desactiva la flag', async () => {
      const { circle } = await seedCircle();
      const creator = await addMember(circle.id);
      const album = await seedAlbum(circle.id, creator.id);

      await prisma.circle.update({
        where: { id: circle.id },
        data: { settings: { ...DEFAULT_CIRCLE_SETTINGS, membersCanCreateAlbums: false } },
      });

      const response = await patchAlbumRequest(await makeAuth(creator.id), album.id, {
        title: 'Ya no',
      });

      expect(response.statusCode).toBe(403);
      expectError(response, 'FORBIDDEN');
    });

    it('un miembro creador borra su álbum vacío aunque la flag esté apagada', async () => {
      const { circle } = await seedCircle({ membersCanCreateAlbums: false });
      const creator = await addMember(circle.id);
      const album = await seedAlbum(circle.id, creator.id);

      const response = await deleteAlbum(await makeAuth(creator.id), album.id);

      expect(response.statusCode).toBe(204);
      expect(await prisma.album.findUnique({ where: { id: album.id } })).toBeNull();
    });

    it('un miembro creador con fotos recibe 409 ALBUM_NOT_EMPTY, no 403', async () => {
      const { circle } = await seedCircle({ membersCanCreateAlbums: false });
      const creator = await addMember(circle.id);
      const album = await seedAlbum(circle.id, creator.id);

      await makePhoto(prisma, { circleId: circle.id, albumId: album.id, uploaderId: creator.id });

      const response = await deleteAlbum(await makeAuth(creator.id), album.id);

      expect(response.statusCode).toBe(409);
      expectError(response, 'ALBUM_NOT_EMPTY');
      expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
    });

    it('un miembro que no creó el álbum recibe 403 al borrarlo', async () => {
      const { owner, circle } = await seedCircle();
      const otherMember = await addMember(circle.id);
      const album = await seedAlbum(circle.id, owner.id);

      const response = await deleteAlbum(await makeAuth(otherMember.id), album.id);

      expect(response.statusCode).toBe(403);
      expectError(response, 'FORBIDDEN');
      expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
    });
    it('una membresía con rol owner falsificado no permite borrar ni vaciar', async () => {
      const { owner, circle } = await seedCircle();
      const forged = await addMember(circle.id);
      // The album belongs to the real owner, so the forged member is neither
      // owner nor creator and cannot use the creator exception.
      const album = await seedAlbum(circle.id, owner.id);

      await prisma.membership.update({
        where: { circleId_userId: { circleId: circle.id, userId: forged.id } },
        data: { role: 'owner' },
      });

      const auth = await makeAuth(forged.id);
      const deleted = await deleteAlbum(auth, album.id);
      const emptied = await emptyAlbumRequest(auth, album.id);

      expect(deleted.statusCode).toBe(403);
      expectError(deleted, 'FORBIDDEN');
      expect(emptied.statusCode).toBe(403);
      expectError(emptied, 'FORBIDDEN');
      expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
    });
  });

  describe('AC-05 — portada', () => {
    it('acepta una foto del mismo álbum y `null` limpia la portada', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });
      const auth = await makeAuth(owner.id);

      const withCover = await patchAlbumRequest(auth, album.id, { coverPhotoId: photo.id });

      expect(withCover.statusCode).toBe(200);
      expect(withCover.json<AlbumResponse>().coverPhoto).toEqual({
        id: photo.id,
        thumbUrl: `/api/photos/${photo.id}/image?size=thumb`,
        width: photo.width,
        height: photo.height,
      });

      const cleared = await patchAlbumRequest(auth, album.id, { coverPhotoId: null });

      expect(cleared.statusCode).toBe(200);
      expect(cleared.json<AlbumResponse>().coverPhoto).toBeNull();
      expect((await prisma.album.findUnique({ where: { id: album.id } }))?.coverPhotoId).toBeNull();
    });

    it('rechaza una portada inexistente, de otro álbum o de otro círculo con 404', async () => {
      const { owner, circle } = await seedCircle();
      const other = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const siblingAlbum = await seedAlbum(circle.id, owner.id);
      const otherAlbum = await seedAlbum(other.circle.id, other.owner.id);
      const siblingPhoto = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: siblingAlbum.id,
        uploaderId: owner.id,
      });
      const foreignPhoto = await makePhoto(prisma, {
        circleId: other.circle.id,
        albumId: otherAlbum.id,
        uploaderId: other.owner.id,
      });

      // The caller must be a member of the foreign circle too; otherwise the
      // request would 404 on membership before the cover is even validated.
      await makeMembership(prisma, { circleId: other.circle.id, userId: owner.id });

      const auth = await makeAuth(owner.id);

      for (const coverPhotoId of ['foto-inexistente', siblingPhoto.id, foreignPhoto.id]) {
        const response = await patchAlbumRequest(auth, album.id, { coverPhotoId });

        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
        expect(
          (await prisma.album.findUnique({ where: { id: album.id } }))?.coverPhotoId,
        ).toBeNull();
      }
    });
  });

  describe('AC-07 — álbum no vacío', () => {
    it('borrar un álbum con fotos responde 409 y lo conserva', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);

      await makePhoto(prisma, { circleId: circle.id, albumId: album.id, uploaderId: owner.id });

      const response = await deleteAlbum(await makeAuth(owner.id), album.id);

      expect(response.statusCode).toBe(409);
      expectError(response, 'ALBUM_NOT_EMPTY');
      expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
    });

    it('borra un álbum vacío con 204; uno ya inexistente responde 404', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const auth = await makeAuth(owner.id);

      expect((await deleteAlbum(auth, album.id)).statusCode).toBe(204);
      expect((await deleteAlbum(auth, album.id)).statusCode).toBe(404);
    });
  });

  describe('AC-07 — borrado concurrente', () => {
    it('una foto sin confirmar bloquea el DELETE y acaba en 409 sin perderse', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const auth = await makeAuth(owner.id);
      const databaseUrl = process.env.DATABASE_URL;

      if (databaseUrl === undefined) {
        throw new Error('DATABASE_URL es obligatoria para el test de concurrencia.');
      }

      const secondConnection = new SecondPrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl }),
      });

      let signalInserted: () => void = () => {};
      let releaseCommit: () => void = () => {};

      const inserted = new Promise<void>((resolve) => {
        signalInserted = resolve;
      });
      const commitGate = new Promise<void>((resolve) => {
        releaseCommit = resolve;
      });

      let external: Promise<unknown> | null = null;

      try {
        external = secondConnection.$transaction(
          async (tx) => {
            await tx.photo.create({
              data: {
                circleId: circle.id,
                albumId: album.id,
                uploaderId: owner.id,
                clientUploadId: 'concurrent-upload',
                originalKey: 'concurrent/original.jpg',
                displayKey: 'concurrent/display.webp',
                thumbKey: 'concurrent/thumb.webp',
                mimeType: 'image/jpeg',
                size: 1_024,
                width: 100,
                height: 100,
              },
            });

            // The photo is inserted but not committed: the DELETE must wait on
            // the album row instead of reading an empty album.
            signalInserted();
            await commitGate;
          },
          { timeout: 15_000 },
        );

        await inserted;

        const deletePromise = deleteAlbum(auth, album.id);
        const raced = await Promise.race([
          deletePromise.then(() => 'completed' as const),
          new Promise<'blocked'>((resolve) => {
            setTimeout(() => resolve('blocked'), 300);
          }),
        ]);

        expect(raced).toBe('blocked');

        releaseCommit();
        await external;
        external = null;

        const response = await deletePromise;

        expect(response.statusCode).toBe(409);
        expectError(response, 'ALBUM_NOT_EMPTY');
        expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(1);
        expect(await prisma.album.findUnique({ where: { id: album.id } })).not.toBeNull();
      } finally {
        releaseCommit();

        if (external !== null) {
          await external.catch(() => undefined);
        }

        await secondConnection.$disconnect();
      }
    });
  });

  describe('AC-08 — vaciar álbum', () => {
    it('borra fotos y etiquetas, conserva la actividad y es idempotente', async () => {
      const { owner, circle } = await seedCircle();
      const member = await addMember(circle.id);
      const album = await seedAlbum(circle.id, owner.id);
      const sibling = await seedAlbum(circle.id, owner.id);
      const siblingPhoto = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: sibling.id,
        uploaderId: owner.id,
      });

      await makeTag(prisma, {
        photoId: siblingPhoto.id,
        taggedUserId: member.id,
        createdBy: owner.id,
      });

      const foreign = await seedCircle();
      const foreignAlbum = await seedAlbum(foreign.circle.id, foreign.owner.id);
      const foreignPhoto = await makePhoto(prisma, {
        circleId: foreign.circle.id,
        albumId: foreignAlbum.id,
        uploaderId: foreign.owner.id,
      });

      await makeTag(prisma, {
        photoId: foreignPhoto.id,
        taggedUserId: foreign.owner.id,
        createdBy: foreign.owner.id,
      });

      const photos = [];

      for (let index = 0; index < 3; index += 1) {
        photos.push(
          await makePhoto(prisma, {
            circleId: circle.id,
            albumId: album.id,
            uploaderId: owner.id,
          }),
        );
      }

      for (const photo of photos.slice(0, 2)) {
        await makeTag(prisma, {
          photoId: photo.id,
          taggedUserId: member.id,
          createdBy: owner.id,
        });
      }

      const firstPhoto = photos[0];

      if (firstPhoto === undefined) {
        throw new Error('La semilla de fotos no se creó.');
      }

      const history = await makeActivity(prisma, {
        circleId: circle.id,
        actorId: owner.id,
        type: 'photo_uploaded',
        albumId: album.id,
        photoId: firstPhoto.id,
      });

      await prisma.album.update({
        where: { id: album.id },
        data: { coverPhotoId: firstPhoto.id },
      });

      const auth = await makeAuth(owner.id);
      const response = await emptyAlbumRequest(auth, album.id);

      expect(response.statusCode).toBe(200);
      expect(response.json<EmptyAlbumResponse>()).toEqual({ deletedCount: 3 });
      expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(0);
      expect(
        await prisma.photoTag.count({ where: { photoId: { in: photos.map((p) => p.id) } } }),
      ).toBe(0);
      expect(await prisma.photo.findUnique({ where: { id: siblingPhoto.id } })).not.toBeNull();
      expect(await prisma.photoTag.count({ where: { photoId: siblingPhoto.id } })).toBe(1);
      expect(await prisma.album.findUnique({ where: { id: sibling.id } })).not.toBeNull();
      expect(await prisma.photo.findUnique({ where: { id: foreignPhoto.id } })).not.toBeNull();
      expect(await prisma.photoTag.count({ where: { photoId: foreignPhoto.id } })).toBe(1);

      const persistedHistory = await prisma.activity.findUnique({ where: { id: history.id } });

      expect(persistedHistory).not.toBeNull();
      expect(persistedHistory?.photoId).toBeNull();
      expect(persistedHistory?.albumId).toBe(album.id);
      expect((await prisma.album.findUnique({ where: { id: album.id } }))?.coverPhotoId).toBeNull();

      const repeated = await emptyAlbumRequest(auth, album.id);

      expect(repeated.statusCode).toBe(200);
      expect(repeated.json<EmptyAlbumResponse>()).toEqual({ deletedCount: 0 });
    });

    it('un miembro creador vacía su álbum aunque la flag esté apagada', async () => {
      const { circle } = await seedCircle({ membersCanCreateAlbums: false });
      const creator = await addMember(circle.id);
      const album = await seedAlbum(circle.id, creator.id);

      for (let index = 0; index < 2; index += 1) {
        await makePhoto(prisma, {
          circleId: circle.id,
          albumId: album.id,
          uploaderId: creator.id,
        });
      }

      const response = await emptyAlbumRequest(await makeAuth(creator.id), album.id);

      expect(response.statusCode).toBe(200);
      expect(response.json<EmptyAlbumResponse>()).toEqual({ deletedCount: 2 });
      expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(0);
    });

    it('un miembro que no creó el álbum recibe 403 al vaciarlo', async () => {
      const { owner, circle } = await seedCircle();
      const otherMember = await addMember(circle.id);
      const album = await seedAlbum(circle.id, owner.id);
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });

      const response = await emptyAlbumRequest(await makeAuth(otherMember.id), album.id);

      expect(response.statusCode).toBe(403);
      expectError(response, 'FORBIDDEN');
      expect(await prisma.photo.findUnique({ where: { id: photo.id } })).not.toBeNull();
    });
  });

  describe('actividad', () => {
    it('escribe `album.created` una sola vez con actor, círculo, álbum y título', async () => {
      const { circle } = await seedCircle();
      const member = await addMember(circle.id);
      const response = await createAlbumRequest(await makeAuth(member.id), circle.id, {
        title: 'Verano en Mallorca',
      });

      expect(response.statusCode).toBe(201);

      const album = response.json<AlbumResponse>();
      const activities = await prisma.activity.findMany({ where: { circleId: circle.id } });

      expect(activities).toHaveLength(1);
      expect(activities[0]?.type).toBe('album_created');
      expect(activities[0]?.actorId).toBe(member.id);
      expect(activities[0]?.circleId).toBe(circle.id);
      expect(activities[0]?.albumId).toBe(album.id);
      expect(activities[0]?.metadata).toEqual({ albumTitle: 'Verano en Mallorca' });
      expect(activities[0]?.photoId).toBeNull();
      expect(await prisma.activity.count({ where: { type: 'album_created' } })).toBe(1);
      expect(await prisma.album.count({ where: { circleId: circle.id } })).toBe(1);
    });
  });

  describe('AC-06 — no filtra información', () => {
    it('el DTO no expone claves de almacenamiento, coordenadas ni emails', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const photo = await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
      });

      await prisma.album.update({ where: { id: album.id }, data: { coverPhotoId: photo.id } });

      const auth = await makeAuth(owner.id);
      const detail = await getAlbum(auth, album.id);
      const listed = await listAlbums(auth, circle.id);

      expect(detail.statusCode).toBe(200);
      expect(listed.statusCode).toBe(200);

      for (const response of [detail, listed]) {
        expect(response.body).not.toContain('originalKey');
        expect(response.body).not.toContain('displayKey');
        expect(response.body).not.toContain('thumbKey');
        expect(response.body).not.toContain(photo.originalKey);
        expect(response.body).not.toContain('latitude');
        expect(response.body).not.toContain('longitude');
        expect(response.body).not.toContain(owner.email);
        expect(response.body).not.toContain('email');
      }

      const item = detail.json<AlbumResponse>();

      expect(Object.keys(item.coverPhoto ?? {}).sort()).toEqual([
        'height',
        'id',
        'thumbUrl',
        'width',
      ]);
      expect(Object.keys(item.createdBy).sort()).toEqual(['avatarUrl', 'id', 'name']);
    });
  });

  describe('CSRF y Origin', () => {
    it('toda mutación exige Origin permitido y X-CSRF-Token', async () => {
      const { owner, circle } = await seedCircle();
      const album = await seedAlbum(circle.id, owner.id);
      const auth = await makeAuth(owner.id);

      const withoutCsrf = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/albums`,
        headers: headers(auth, { withCsrf: false }),
        payload: { title: 'Sin CSRF' },
      });
      const withoutOrigin = await testApp.app.inject({
        method: 'POST',
        url: `/api/circles/${circle.id}/albums`,
        headers: headers(auth, { withOrigin: false }),
        payload: { title: 'Sin Origin' },
      });
      const patchWithoutCsrf = await testApp.app.inject({
        method: 'PATCH',
        url: `/api/albums/${album.id}`,
        headers: headers(auth, { withCsrf: false }),
        payload: { title: 'Sin CSRF' },
      });
      const deleteWithoutCsrf = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}`,
        headers: headers(auth, { withCsrf: false }),
      });
      const emptyWithoutCsrf = await testApp.app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}/photos`,
        headers: headers(auth, { withCsrf: false }),
      });

      for (const response of [
        withoutCsrf,
        withoutOrigin,
        patchWithoutCsrf,
        deleteWithoutCsrf,
        emptyWithoutCsrf,
      ]) {
        expect(response.statusCode).toBe(403);
        expectError(response, 'FORBIDDEN');
      }

      expect(await prisma.album.count({ where: { circleId: circle.id } })).toBe(1);
      expect((await prisma.album.findUnique({ where: { id: album.id } }))?.title).toBe(album.title);
    });
  });

  describe('acceso cruzado', () => {
    it('un miembro de otro círculo recibe 404 sobre el álbum ajeno', async () => {
      const mine = await seedCircle();
      const foreign = await seedCircle();
      const foreignAlbum = await seedAlbum(foreign.circle.id, foreign.owner.id);
      const foreignPhoto = await makePhoto(prisma, {
        circleId: foreign.circle.id,
        albumId: foreignAlbum.id,
        uploaderId: foreign.owner.id,
      });
      const auth = await makeAuth(mine.owner.id);

      const responses = [
        await getAlbum(auth, foreignAlbum.id),
        await patchAlbumRequest(auth, foreignAlbum.id, { title: 'Robado' }),
        await deleteAlbum(auth, foreignAlbum.id),
        await emptyAlbumRequest(auth, foreignAlbum.id),
        await listAlbums(auth, foreign.circle.id),
        await createAlbumRequest(auth, foreign.circle.id, { title: 'Robado' }),
        await patchAlbumRequest(auth, foreignAlbum.id, { coverPhotoId: foreignPhoto.id }),
      ];

      for (const response of responses) {
        expect(response.statusCode).toBe(404);
        expectError(response, 'NOT_FOUND');
      }

      expect((await prisma.album.findUnique({ where: { id: foreignAlbum.id } }))?.title).toBe(
        foreignAlbum.title,
      );
      expect(await prisma.photo.count({ where: { albumId: foreignAlbum.id } })).toBe(1);
    });

    it('un álbum inexistente responde 404 para un miembro', async () => {
      const { owner } = await seedCircle();
      const auth = await makeAuth(owner.id);
      const response = await getAlbum(auth, 'album-que-no-existe');

      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
    });
  });
});
