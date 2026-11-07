import type { ErrorResponse } from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe.skipIf(!hasDatabase)('DELETE /api/photos/:photoId', () => {
  let testApp: TestApp;
  let prisma: PrismaClient;
  let logLines: string[];

  beforeEach(async () => {
    await resetDb();
    prisma = getTestPrismaClient();
    logLines = [];
    testApp = await createTestApp({
      prisma,
      env: { LOG_LEVEL: 'warn' },
      loggerStream: { write: (message) => logLines.push(message) },
    });
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

  function deletePhotoRequest(auth: AuthFixture | null, photoId: string, withCsrf = true) {
    return testApp.app.inject({
      method: 'DELETE',
      url: `/api/photos/${encodeURIComponent(photoId)}`,
      headers: headers(auth, withCsrf),
    });
  }

  /** Seeds the fake bucket with the three objects a photo owns. */
  function seedObjects(photo: {
    readonly originalKey: string;
    readonly displayKey: string;
    readonly thumbKey: string;
  }): void {
    testApp.services.storage.objects.set(photo.originalKey, {
      body: Buffer.from('original'),
      contentType: 'image/jpeg',
    });
    testApp.services.storage.objects.set(photo.displayKey, {
      body: Buffer.from('display'),
      contentType: 'image/webp',
    });
    testApp.services.storage.objects.set(photo.thumbKey, {
      body: Buffer.from('thumb'),
      contentType: 'image/webp',
    });
  }

  it('answers 401 without a session and 403 without CSRF', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const unauthenticated = await deletePhotoRequest(null, photo.id);

    expect(unauthenticated.statusCode, unauthenticated.body).toBe(401);
    expect((unauthenticated.json() as ErrorResponse).code).toBe('UNAUTHENTICATED');

    const noCsrf = await deletePhotoRequest(auth, photo.id, false);

    expect(noCsrf.statusCode, noCsrf.body).toBe(403);
    expect((noCsrf.json() as ErrorResponse).code).toBe('FORBIDDEN');
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).not.toBeNull();
  });

  it('answers 403 for a member who is neither the author nor the owner', async () => {
    const { circle, album } = await seedCircle();
    const author = await addMember(circle.id);
    const otherMember = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });

    const response = await deletePhotoRequest(otherMember.auth, photo.id);

    expect(response.statusCode, response.body).toBe(403);
    expect((response.json() as ErrorResponse).code).toBe('FORBIDDEN');
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).not.toBeNull();
  });

  it('answers 404 for a photo from another circle and leaves it intact', async () => {
    const { circle, album, owner } = await seedCircle();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    const stranger = await makeUser(prisma);
    const strangerCircle = await makeCircle(prisma, { ownerId: stranger.id });
    await makeMembership(prisma, {
      circleId: strangerCircle.id,
      userId: stranger.id,
      role: 'owner',
    });
    const strangerAuth = await makeAuth(stranger.id);

    const response = await deletePhotoRequest(strangerAuth, photo.id);

    expect(response.statusCode, response.body).toBe(404);
    expect((response.json() as ErrorResponse).code).toBe('NOT_FOUND');
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).not.toBeNull();
  });

  it('answers 404 for a missing photo id', async () => {
    const { auth } = await seedCircle();

    const response = await deletePhotoRequest(auth, 'does-not-exist');

    expect(response.statusCode, response.body).toBe(404);
    expect((response.json() as ErrorResponse).code).toBe('NOT_FOUND');
  });

  it('lets the author delete the photo with 204, removes the row and the three objects', async () => {
    const { circle, album } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });

    seedObjects(photo);

    const response = await deletePhotoRequest(author.auth, photo.id);

    expect(response.statusCode, response.body).toBe(204);
    expect(response.body).toBe('');
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();

    for (const key of [photo.originalKey, photo.displayKey, photo.thumbKey]) {
      expect(testApp.services.storage.objects.has(key)).toBe(false);
      expect(response.body).not.toContain(key);
    }
  });

  it('lets the circle owner delete a photo uploaded by a member with 204', async () => {
    const { circle, album, auth } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });

    const response = await deletePhotoRequest(auth, photo.id);

    expect(response.statusCode, response.body).toBe(204);
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();
  });

  it('cascades the tags and keeps the activity with photoId null', async () => {
    const { circle, album, owner, auth } = await seedCircle();
    const author = await addMember(circle.id);
    const tagged = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });
    const tag = await makeTag(prisma, {
      photoId: photo.id,
      taggedUserId: tagged.user.id,
      createdBy: author.user.id,
    });
    const activity = await makeActivity(prisma, {
      circleId: circle.id,
      actorId: author.user.id,
      albumId: album.id,
      photoId: photo.id,
    });

    const response = await deletePhotoRequest(auth, photo.id);

    expect(response.statusCode, response.body).toBe(204);
    expect(await prisma.photoTag.findUnique({ where: { id: tag.id } })).toBeNull();

    const survived = await prisma.activity.findUniqueOrThrow({ where: { id: activity.id } });

    expect(survived.photoId).toBeNull();
    expect(survived.albumId).toBe(album.id);
    expect(survived.actorId).toBe(author.user.id);
    expect(owner.id).not.toBe(author.user.id);
  });

  it('answers 404 when the delete is repeated', async () => {
    const { circle, album } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });

    const first = await deletePhotoRequest(author.auth, photo.id);

    expect(first.statusCode, first.body).toBe(204);

    const repeated = await deletePhotoRequest(author.auth, photo.id);

    expect(repeated.statusCode, repeated.body).toBe(404);
    expect((repeated.json() as ErrorResponse).code).toBe('NOT_FOUND');
  });

  it('answers 204 when storage fails, removes the row and logs a warning', async () => {
    const { circle, album } = await seedCircle();
    const author = await addMember(circle.id);
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: author.user.id,
    });

    seedObjects(photo);
    testApp.services.storage.delete = async () => {
      throw new Error('bucket down');
    };

    const response = await deletePhotoRequest(author.auth, photo.id);

    expect(response.statusCode, response.body).toBe(204);
    expect(response.body).toBe('');
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();
    expect(logLines.some((line) => line.includes('STORAGE_CLEANUP_FAILED'))).toBe(true);

    // No internal detail reaches the response.
    expect(response.body).not.toContain('bucket down');
  });
});
