import { MAX_PHOTO_DESCRIPTION_LENGTH, type ErrorResponse, type PhotoDto } from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Circle, PrismaClient } from '../../generated/prisma/client.ts';
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
import { createTestApp, TEST_APP_URL, type TestApp } from '../../test/harness.ts';
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from '../auth/session.ts';

const hasDatabase = hasDatabaseUrl();
const ORIGIN = TEST_APP_URL;

interface AuthFixture {
  readonly token: string;
  readonly csrfToken: string;
}

interface CircleFixture {
  readonly owner: { id: string; name: string; email: string };
  readonly circle: Circle;
  readonly album: { id: string };
  readonly auth: AuthFixture;
}

interface MemberFixture {
  readonly user: { id: string; name: string; email: string };
  readonly auth: AuthFixture;
}

describe.skipIf(!hasDatabase)('PATCH /api/photos/:photoId', () => {
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

  function headers(auth: AuthFixture | null, withCsrf = true): Record<string, string> {
    const result: Record<string, string> = { origin: ORIGIN };

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

  async function seedCircle(): Promise<CircleFixture> {
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });

    return { owner, circle, album, auth: await makeAuth(owner.id) };
  }

  async function addMember(circleId: string): Promise<MemberFixture> {
    const user = await makeUser(prisma);

    await makeMembership(prisma, { circleId, userId: user.id, role: 'member' });

    return { user, auth: await makeAuth(user.id) };
  }

  function patchPhoto(
    auth: AuthFixture | null,
    photoId: string,
    body: Record<string, unknown>,
    withCsrf = true,
  ) {
    return testApp.app.inject({
      method: 'PATCH',
      url: `/api/photos/${encodeURIComponent(photoId)}`,
      headers: headers(auth, withCsrf),
      payload: body,
    });
  }

  function getPhoto(auth: AuthFixture | null, photoId: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${encodeURIComponent(photoId)}`,
      headers: headers(auth),
    });
  }

  it('answers 401 without a session and 403 without CSRF', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const unauthenticated = await patchPhoto(null, photo.id, { description: 'Sin sesión' });

    expect(unauthenticated.statusCode, unauthenticated.body).toBe(401);
    expect((unauthenticated.json() as ErrorResponse).code).toBe('UNAUTHENTICATED');

    const noCsrf = await patchPhoto(auth, photo.id, { description: 'Sin CSRF' }, false);

    expect(noCsrf.statusCode, noCsrf.body).toBe(403);
    expect((noCsrf.json() as ErrorResponse).code).toBe('FORBIDDEN');
  });

  it('hides a photo from another circle with 404 and keeps it unchanged', async () => {
    const { circle, album, owner } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
      description: 'Original',
    });

    const stranger = await makeUser(prisma);
    const strangerCircle = await makeCircle(prisma, { ownerId: stranger.id });
    await makeMembership(prisma, {
      circleId: strangerCircle.id,
      userId: stranger.id,
      role: 'owner',
    });
    const strangerAuth = await makeAuth(stranger.id);

    const response = await patchPhoto(strangerAuth, photo.id, { description: 'Robada' });

    expect(response.statusCode, response.body).toBe(404);
    expect((response.json() as ErrorResponse).code).toBe('NOT_FOUND');
    expect((await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } })).description).toBe(
      'Original',
    );
  });

  it('answers 404 for a missing photo id', async () => {
    const { auth } = await seedCircle();

    const response = await patchPhoto(auth, 'does-not-exist', { description: 'Fantasma' });

    expect(response.statusCode, response.body).toBe(404);
    expect((response.json() as ErrorResponse).code).toBe('NOT_FOUND');
  });

  it('answers 403 for a member who is neither the author nor the owner', async () => {
    const { circle, album, owner } = await seedCircle();
    const author = await addMember(circle.id);
    const otherMember = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
      description: 'Del autor',
    });

    const response = await patchPhoto(otherMember.auth, photo.id, { description: 'Ajena' });

    expect(response.statusCode, response.body).toBe(403);
    expect((response.json() as ErrorResponse).code).toBe('FORBIDDEN');
    expect((await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } })).description).toBe(
      'Del autor',
    );
    expect(owner.id).not.toBe(otherMember.user.id);
  });

  it('lets the author update every editable field with 200', async () => {
    const { circle, album } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
      description: 'Antes',
      placeName: 'Madrid, España',
    });

    const response = await patchPhoto(author.auth, photo.id, {
      description: 'Después',
      takenAt: '2024-02-03T04:05:06.000Z',
      placeName: 'Palma, Mallorca',
    });

    expect(response.statusCode, response.body).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');

    const dto = response.json() as PhotoDto;

    expect(dto.id).toBe(photo.id);
    expect(dto.description).toBe('Después');
    expect(dto.takenAt).toBe('2024-02-03T04:05:06.000Z');
    expect(dto.placeName).toBe('Palma, Mallorca');

    const persisted = await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } });

    expect(persisted.description).toBe('Después');
    expect(persisted.takenAt?.toISOString()).toBe('2024-02-03T04:05:06.000Z');
    expect(persisted.placeName).toBe('Palma, Mallorca');
  });

  it('lets the circle owner update a photo uploaded by a member with 200', async () => {
    const { circle, album, auth } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
      description: 'Del miembro',
    });

    const response = await patchPhoto(auth, photo.id, { description: 'Corregida por el owner' });

    expect(response.statusCode, response.body).toBe(200);
    expect((response.json() as PhotoDto).uploader.id).toBe(author.user.id);
    expect((await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } })).description).toBe(
      'Corregida por el owner',
    );
  });

  it('rejects an empty body with 400', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const response = await patchPhoto(auth, photo.id, {});

    expect(response.statusCode, response.body).toBe(400);
    expect((response.json() as ErrorResponse).code).toBe('VALIDATION_ERROR');
  });

  it('rejects a description over the shared limit with 400', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const response = await patchPhoto(auth, photo.id, {
      description: 'x'.repeat(MAX_PHOTO_DESCRIPTION_LENGTH + 1),
    });

    expect(response.statusCode, response.body).toBe(400);
    expect((response.json() as ErrorResponse).code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid takenAt with 400', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const response = await patchPhoto(auth, photo.id, { takenAt: 'no-es-una-fecha' });

    expect(response.statusCode, response.body).toBe(400);
    expect((response.json() as ErrorResponse).code).toBe('VALIDATION_ERROR');
  });

  it('clears description and placeName with null and leaves takenAt untouched', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
      description: 'Playa al atardecer',
      placeName: 'Madrid, España',
    });

    const response = await patchPhoto(auth, photo.id, { description: null, placeName: null });

    expect(response.statusCode, response.body).toBe(200);

    const dto = response.json() as PhotoDto;

    expect(dto.description).toBeNull();
    expect(dto.placeName).toBeNull();
    expect(dto.takenAt).toBe('2025-05-01T12:00:00.000Z');

    const persisted = await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } });

    expect(persisted.description).toBeNull();
    expect(persisted.placeName).toBeNull();
    expect(persisted.takenAt?.toISOString()).toBe('2025-05-01T12:00:00.000Z');
  });

  it('persists the change and returns it from a later GET detail', async () => {
    const { circle, album, auth } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
      description: 'Antes',
    });

    const patched = await patchPhoto(author.auth, photo.id, {
      description: 'Persistida',
      placeName: 'Valencia, España',
    });

    expect(patched.statusCode, patched.body).toBe(200);

    const detail = await getPhoto(auth, photo.id);

    expect(detail.statusCode, detail.body).toBe(200);

    const dto = detail.json() as PhotoDto;

    expect(dto.description).toBe('Persistida');
    expect(dto.placeName).toBe('Valencia, España');
  });

  it('never returns coordinates or storage keys and ignores them in the body', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const response = await patchPhoto(auth, photo.id, {
      description: 'Sin secretos',
      latitude: 39.5696,
      longitude: 2.6502,
      originalKey: 'circles/leak/original.jpg',
      displayKey: 'circles/leak/display.webp',
      thumbKey: 'circles/leak/thumb.webp',
    });

    expect(response.statusCode, response.body).toBe(200);

    const dto = response.json() as PhotoDto;

    for (const forbidden of ['originalKey', 'displayKey', 'thumbKey', 'latitude', 'longitude']) {
      expect(dto).not.toHaveProperty(forbidden);
      expect(response.body).not.toContain(forbidden);
    }

    expect(response.body).not.toContain(photo.originalKey);
    expect(response.body).not.toContain(photo.displayKey);
    expect(response.body).not.toContain(photo.thumbKey);

    const persisted = await prisma.photo.findUniqueOrThrow({ where: { id: photo.id } });

    expect(persisted.description).toBe('Sin secretos');
    expect(persisted.originalKey).toBe(photo.originalKey);
  });
});
