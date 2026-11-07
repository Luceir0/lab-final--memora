import { PrismaPg } from '@prisma/adapter-pg';
import {
  DEFAULT_CIRCLE_SETTINGS,
  type CircleSettings,
  type ErrorResponse,
  type PhotoTagDto,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PrismaClient as SecondPrismaClient,
  type Circle,
  type PrismaClient,
  type User,
} from '../../generated/prisma/client.ts';
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
  makeTag,
  makeUser,
} from '../../test/factories.ts';
import { createTestApp, TEST_APP_URL, type TestApp } from '../../test/harness.ts';
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from '../auth/session.ts';

const hasDatabase = hasDatabaseUrl();
const ORIGIN = TEST_APP_URL;

interface AuthFixture {
  readonly token: string;
  readonly csrfToken: string;
}

interface HeadersOptions {
  readonly withCsrf?: boolean;
  readonly withOrigin?: boolean;
}

interface CircleFixture {
  readonly owner: User;
  readonly circle: Circle;
  readonly albumId: string;
}

/**
 * Tags API integration suite (F32).
 *
 * Exercises the real HTTP pipeline over PostgreSQL: sessions, Origin/CSRF,
 * Zod contracts, `can('photo.tag')` and the frozen `PhotoTagDto`. Cross-circle
 * cases always assert `404`, never `403`, so foreign users are never revealed.
 */
describe.skipIf(!hasDatabase)('photo tags API', () => {
  let testApp: TestApp;
  let prisma: PrismaClient;

  beforeEach(async () => {
    await resetDb();
    prisma = getTestPrismaClient();
    testApp = await createTestApp({ prisma });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await testApp.close();
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  function headers(auth: AuthFixture | null, options: HeadersOptions = {}): Record<string, string> {
    const withCsrf = options.withCsrf ?? true;
    const withOrigin = options.withOrigin ?? true;
    const result: Record<string, string> = {};

    if (withOrigin) {
      result.origin = ORIGIN;
    }

    if (auth !== null) {
      result.cookie = `${SESSION_COOKIE_NAME}=${auth.token}`;

      if (withCsrf) {
        result['x-csrf-token'] = auth.csrfToken;
      }
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

    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });

    return { owner, circle, albumId: album.id };
  }

  async function addMember(circleId: string): Promise<User> {
    const user = await makeUser(prisma);

    await makeMembership(prisma, { circleId, userId: user.id, role: 'member' });

    return user;
  }

  function addPhoto(fixture: CircleFixture, uploaderId: string = fixture.owner.id) {
    return makePhoto(prisma, {
      circleId: fixture.circle.id,
      albumId: fixture.albumId,
      uploaderId,
    });
  }

  function postTag(
    auth: AuthFixture | null,
    photoId: string,
    body: unknown,
    options: HeadersOptions = {},
  ) {
    return testApp.app.inject({
      method: 'POST',
      url: `/api/photos/${encodeURIComponent(photoId)}/tags`,
      headers: { ...headers(auth, options), 'content-type': 'application/json' },
      payload: JSON.stringify(body),
    });
  }

  function deleteTag(
    auth: AuthFixture | null,
    photoId: string,
    userId: string,
    options: HeadersOptions = {},
  ) {
    return testApp.app.inject({
      method: 'DELETE',
      url: `/api/photos/${encodeURIComponent(photoId)}/tags/${encodeURIComponent(userId)}`,
      headers: headers(auth, options),
    });
  }

  function expectError(response: { json: <T>() => T }, code: ErrorResponse['code']): void {
    expect(response.json<ErrorResponse>().code).toBe(code);
  }

  it('sin sesión responde 401 en POST y DELETE', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);

    for (const response of [
      await postTag(null, photo.id, { userId: target.id }),
      await deleteTag(null, photo.id, target.id),
    ]) {
      expect(response.statusCode).toBe(401);
      expectError(response, 'UNAUTHENTICATED');
    }

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('oculta con 404 a no miembros, fotos de otro círculo y fotos inexistentes', async () => {
    const fixture = await seedCircle();
    const member = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(member.id);

    const stranger = await makeUser(prisma);
    const foreign = await seedCircle();
    const foreignAuth = await makeAuth(foreign.owner.id);

    const notMember = await postTag(await makeAuth(stranger.id), photo.id, { userId: member.id });

    expect(notMember.statusCode).toBe(404);
    expectError(notMember, 'NOT_FOUND');

    const otherCircle = await postTag(foreignAuth, photo.id, { userId: foreign.owner.id });

    expect(otherCircle.statusCode).toBe(404);
    expectError(otherCircle, 'NOT_FOUND');

    const missing = await postTag(auth, 'does-not-exist', { userId: fixture.owner.id });

    expect(missing.statusCode).toBe(404);
    expectError(missing, 'NOT_FOUND');

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('AC-01: un miembro con membersCanTag etiqueta con 201 y PhotoTagDto correcto', async () => {
    const fixture = await seedCircle();
    const member = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(member.id);

    const response = await postTag(auth, photo.id, { userId: fixture.owner.id });

    expect(response.statusCode, response.body).toBe(201);
    expect(response.headers['cache-control']).toBe('private, no-store');

    const dto = response.json<PhotoTagDto>();

    expect(dto.photoId).toBe(photo.id);
    expect(dto.id.length).toBeGreaterThan(0);
    expect(dto.user).toEqual({
      id: fixture.owner.id,
      name: fixture.owner.name,
      avatarUrl: null,
    });
    expect(new Date(dto.createdAt).toISOString()).toBe(dto.createdAt);
    expect(response.body).not.toContain(fixture.owner.email);
    expect(dto).not.toHaveProperty('email');

    const row = await prisma.photoTag.findUniqueOrThrow({
      where: {
        photoId_taggedUserId: { photoId: photo.id, taggedUserId: fixture.owner.id },
      },
    });

    expect(row.createdBy).toBe(member.id);
    expect(row.id).toBe(dto.id);
  });

  it('AC-01: un miembro sin membersCanTag recibe 403 y el owner etiqueta igualmente', async () => {
    const fixture = await seedCircle({ membersCanTag: false });
    const member = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);

    const denied = await postTag(await makeAuth(member.id), photo.id, {
      userId: fixture.owner.id,
    });

    expect(denied.statusCode).toBe(403);
    expectError(denied, 'FORBIDDEN');
    expect(await prisma.photoTag.count()).toBe(0);

    const owner = await postTag(await makeAuth(fixture.owner.id), photo.id, {
      userId: member.id,
    });

    expect(owner.statusCode, owner.body).toBe(201);
    expect(await prisma.photoTag.count()).toBe(1);
  });

  it('AC-01: no etiqueta a quien no es miembro del mismo círculo', async () => {
    const fixture = await seedCircle();
    const foreign = await seedCircle();
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    const stranger = await makeUser(prisma);
    const notMember = await postTag(auth, photo.id, { userId: stranger.id });
    const otherCircle = await postTag(auth, photo.id, { userId: foreign.owner.id });

    for (const response of [notMember, otherCircle]) {
      expect(response.statusCode).toBe(404);
      expectError(response, 'NOT_FOUND');
    }

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('AC-02: repetir POST devuelve 200 con la misma etiqueta y una sola fila', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    const first = await postTag(auth, photo.id, { userId: target.id });
    const second = await postTag(auth, photo.id, { userId: target.id });

    expect(first.statusCode, first.body).toBe(201);
    expect(second.statusCode, second.body).toBe(200);

    const firstDto = first.json<PhotoTagDto>();
    const secondDto = second.json<PhotoTagDto>();

    expect(secondDto.id).toBe(firstDto.id);
    expect(secondDto).toEqual(firstDto);
    expect(await prisma.photoTag.count()).toBe(1);
  });

  it('AC-02: una carrera P2002 se resuelve releyendo fuera de la transacción con 200', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);
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
          // The winner's row is inserted but not committed: the request reads
          // no tag, then blocks on the unique constraint until this commits.
          await tx.photoTag.create({
            data: {
              photoId: photo.id,
              taggedUserId: target.id,
              createdBy: fixture.owner.id,
            },
          });

          signalInserted();
          await commitGate;
        },
        { timeout: 15_000 },
      );

      await inserted;

      const postPromise = postTag(auth, photo.id, { userId: target.id });
      const raced = await Promise.race([
        postPromise.then(() => 'completed' as const),
        new Promise<'blocked'>((resolve) => {
          setTimeout(() => resolve('blocked'), 300);
        }),
      ]);

      expect(raced).toBe('blocked');

      releaseCommit();
      await external;
      external = null;

      const response = await postPromise;

      expect(response.statusCode, response.body).toBe(200);

      const persisted = await prisma.photoTag.findUniqueOrThrow({
        where: {
          photoId_taggedUserId: { photoId: photo.id, taggedUserId: target.id },
        },
      });

      expect(response.json<PhotoTagDto>().id).toBe(persisted.id);
      expect(await prisma.photoTag.count()).toBe(1);
    } finally {
      releaseCommit();

      if (external !== null) {
        await external.catch(() => undefined);
      }

      await secondConnection.$disconnect();
    }
  });

  it('M-01: el alta espera el lock de la membresía y no deja etiquetas si gana la expulsión', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL es obligatoria para el test de concurrencia.');
    }

    const secondConnection = new SecondPrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });

    let signalDeleted: () => void = () => {};
    let releaseCommit: () => void = () => {};

    const deleted = new Promise<void>((resolve) => {
      signalDeleted = resolve;
    });
    const commitGate = new Promise<void>((resolve) => {
      releaseCommit = resolve;
    });

    let external: Promise<unknown> | null = null;

    try {
      external = secondConnection.$transaction(
        async (tx) => {
          // Same order as `removeCircleMember`: membership first, tags after.
          // The row lock is held without committing, so the tag insert must
          // wait on `SELECT ... FOR SHARE` instead of checking a stale row.
          await tx.membership.deleteMany({
            where: { circleId: fixture.circle.id, userId: target.id },
          });

          signalDeleted();
          await commitGate;

          await tx.photoTag.deleteMany({
            where: {
              taggedUserId: target.id,
              photo: { circleId: fixture.circle.id },
            },
          });
        },
        { timeout: 15_000 },
      );

      await deleted;

      const postPromise = postTag(auth, photo.id, { userId: target.id });
      const raced = await Promise.race([
        postPromise.then(() => 'completed' as const),
        new Promise<'blocked'>((resolve) => {
          setTimeout(() => resolve('blocked'), 300);
        }),
      ]);

      expect(raced).toBe('blocked');

      releaseCommit();
      await external;
      external = null;

      const response = await postPromise;

      expect(response.statusCode, response.body).toBe(404);
      expectError(response, 'NOT_FOUND');
      expect(
        await prisma.photoTag.count({
          where: { taggedUserId: target.id, photo: { circleId: fixture.circle.id } },
        }),
      ).toBe(0);
    } finally {
      releaseCommit();

      if (external !== null) {
        await external.catch(() => undefined);
      }

      await secondConnection.$disconnect();
    }
  });

  it('rechaza un body inválido con 400', async () => {
    const fixture = await seedCircle();
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    for (const body of [{}, { userId: 123 }, { userId: '' }]) {
      const response = await postTag(auth, photo.id, body);

      expect(response.statusCode, response.body).toBe(400);
      expectError(response, 'VALIDATION_ERROR');
    }

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('exige Origin confiable y CSRF en POST y DELETE', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    const postWithoutOrigin = await postTag(
      auth,
      photo.id,
      { userId: target.id },
      { withOrigin: false },
    );
    const postWithoutCsrf = await postTag(
      auth,
      photo.id,
      { userId: target.id },
      { withCsrf: false },
    );
    const deleteWithoutOrigin = await deleteTag(auth, photo.id, target.id, { withOrigin: false });
    const deleteWithoutCsrf = await deleteTag(auth, photo.id, target.id, { withCsrf: false });

    for (const response of [
      postWithoutOrigin,
      postWithoutCsrf,
      deleteWithoutOrigin,
      deleteWithoutCsrf,
    ]) {
      expect(response.statusCode).toBe(403);
      expectError(response, 'FORBIDDEN');
    }

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('AC-06: DELETE responde 204 y borra la fila', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);

    await makeTag(prisma, {
      photoId: photo.id,
      taggedUserId: target.id,
      createdBy: fixture.owner.id,
    });

    const response = await deleteTag(await makeAuth(fixture.owner.id), photo.id, target.id);

    expect(response.statusCode, response.body).toBe(204);
    expect(response.body).toBe('');
    expect(
      await prisma.photoTag.findUnique({
        where: { photoId_taggedUserId: { photoId: photo.id, taggedUserId: target.id } },
      }),
    ).toBeNull();
  });

  it('AC-06: DELETE es idempotente y responde 204 aunque no exista la etiqueta', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    const first = await deleteTag(auth, photo.id, target.id);
    const repeated = await deleteTag(auth, photo.id, target.id);

    for (const response of [first, repeated]) {
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    }

    expect(await prisma.photoTag.count()).toBe(0);
  });

  it('AC-06: un miembro sin membersCanTag recibe 403 y con la flag puede quitar', async () => {
    const deniedFixture = await seedCircle({ membersCanTag: false });
    const deniedTarget = await addMember(deniedFixture.circle.id);
    const deniedPhoto = await addPhoto(deniedFixture);

    await makeTag(prisma, {
      photoId: deniedPhoto.id,
      taggedUserId: deniedTarget.id,
      createdBy: deniedFixture.owner.id,
    });

    const denied = await deleteTag(
      await makeAuth(deniedTarget.id),
      deniedPhoto.id,
      deniedTarget.id,
    );

    expect(denied.statusCode).toBe(403);
    expectError(denied, 'FORBIDDEN');
    expect(await prisma.photoTag.count()).toBe(1);

    const allowedFixture = await seedCircle();
    const allowedMember = await addMember(allowedFixture.circle.id);
    const allowedPhoto = await addPhoto(allowedFixture);

    await makeTag(prisma, {
      photoId: allowedPhoto.id,
      taggedUserId: allowedMember.id,
      createdBy: allowedFixture.owner.id,
    });

    const allowed = await deleteTag(
      await makeAuth(allowedMember.id),
      allowedPhoto.id,
      allowedMember.id,
    );

    expect(allowed.statusCode, allowed.body).toBe(204);
    expect(
      await prisma.photoTag.findUnique({
        where: {
          photoId_taggedUserId: {
            photoId: allowedPhoto.id,
            taggedUserId: allowedMember.id,
          },
        },
      }),
    ).toBeNull();
    // The denied tag of the other circle is untouched.
    expect(await prisma.photoTag.count()).toBe(1);
  });

  it('AC-06: expulsar a un miembro elimina sus etiquetas del círculo', async () => {
    const fixture = await seedCircle();
    const member = await addMember(fixture.circle.id);
    const photo = await addPhoto(fixture);

    await makeTag(prisma, {
      photoId: photo.id,
      taggedUserId: member.id,
      createdBy: fixture.owner.id,
    });

    const response = await testApp.app.inject({
      method: 'DELETE',
      url: `/api/circles/${fixture.circle.id}/members/${member.id}`,
      headers: headers(await makeAuth(fixture.owner.id)),
    });

    expect(response.statusCode, response.body).toBe(204);
    expect(
      await prisma.photoTag.findUnique({
        where: { photoId_taggedUserId: { photoId: photo.id, taggedUserId: member.id } },
      }),
    ).toBeNull();
    expect(await prisma.photo.count({ where: { id: photo.id } })).toBe(1);
  });

  it('AC-02: la misma persona se puede etiquetar en dos fotos distintas', async () => {
    const fixture = await seedCircle();
    const target = await addMember(fixture.circle.id);
    const firstPhoto = await addPhoto(fixture);
    const secondPhoto = await addPhoto(fixture);
    const auth = await makeAuth(fixture.owner.id);

    const first = await postTag(auth, firstPhoto.id, { userId: target.id });
    const second = await postTag(auth, secondPhoto.id, { userId: target.id });

    expect(first.statusCode, first.body).toBe(201);
    expect(second.statusCode, second.body).toBe(201);
    expect(first.json<PhotoTagDto>().id).not.toBe(second.json<PhotoTagDto>().id);
    expect(await prisma.photoTag.count({ where: { taggedUserId: target.id } })).toBe(2);
  });
});
