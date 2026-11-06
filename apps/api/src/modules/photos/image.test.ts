import { DEFAULT_CIRCLE_SETTINGS, type CircleSettings, type ErrorResponse } from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Circle, Photo, PrismaClient, User } from '../../generated/prisma/client.ts';
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
import { createFakeServices, createFakeStorageService } from '../../test/fakes.ts';
import { createTestApp, type TestApp } from '../../test/harness.ts';
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from '../auth/session.ts';

const hasDatabase = hasDatabaseUrl();

interface AuthFixture {
  readonly token: string;
}

interface ImageFixture {
  readonly owner: User;
  readonly uploader: User;
  readonly viewer: User;
  readonly circle: Circle;
  readonly album: { readonly id: string };
  readonly photo: Photo;
  readonly auth: AuthFixture;
  readonly buffers: {
    readonly thumb: Buffer;
    readonly display: Buffer;
    readonly original: Buffer;
  };
}

/**
 * `GET /api/photos/:photoId/image` integration suite (F27, ADR-0006).
 *
 * Runs against the real HTTP pipeline and PostgreSQL. The key assertions are
 * authorization (membership, `photo.download` for `original`) and the exact
 * binary contract: server-chosen keys, real `Content-Type`, private caching,
 * stable weak `ETag` and `304` revalidation.
 */
describe.skipIf(!hasDatabase)('photo image API', () => {
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

  function getImage(auth: AuthFixture | null, photoId: string, query: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${encodeURIComponent(photoId)}/image${query}`,
      headers: headers(auth),
    });
  }

  /**
   * A circle with three people: the owner, the uploader and a plain viewer.
   * The viewer is deliberately neither the owner nor the uploader, so the
   * `thumb`/`display` success cases prove that membership is enough.
   */
  async function seedImage(settings?: Partial<CircleSettings>): Promise<ImageFixture> {
    const owner = await makeUser(prisma);
    const uploader = await makeUser(prisma);
    const viewer = await makeUser(prisma);
    const circle = await makeCircle(prisma, {
      ownerId: owner.id,
      ...(settings === undefined ? {} : { settings: { ...DEFAULT_CIRCLE_SETTINGS, ...settings } }),
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });
    await makeMembership(prisma, { circleId: circle.id, userId: uploader.id, role: 'member' });
    await makeMembership(prisma, { circleId: circle.id, userId: viewer.id, role: 'member' });

    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: uploader.id });
    const photo = await makePhoto(prisma, {
      id: 'photo-image',
      circleId: circle.id,
      albumId: album.id,
      uploaderId: uploader.id,
      mimeType: 'image/png',
      originalKey: `circles/${circle.id}/photos/photo-image/original.png`,
    });

    const buffers = {
      thumb: Buffer.from('thumb-native-bytes'),
      display: Buffer.from('display-native-bytes-larger'),
      original: Buffer.from('original-native-bytes'),
    };

    await testApp.services.storage.put(photo.thumbKey, buffers.thumb, 'image/webp');
    await testApp.services.storage.put(photo.displayKey, buffers.display, 'image/webp');
    await testApp.services.storage.put(photo.originalKey, buffers.original, 'image/png');

    return {
      owner,
      uploader,
      viewer,
      circle,
      album,
      photo,
      auth: await makeAuth(viewer.id),
      buffers,
    };
  }

  it('answers 401 UNAUTHENTICATED without a session', async () => {
    const fixture = await seedImage();
    const response = await getImage(null, fixture.photo.id, '?size=thumb');

    expect(response.statusCode, response.body).toBe(401);
    expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
  });

  it('AC-08: serves thumb to a member who did not upload the photo with the full header set', async () => {
    const fixture = await seedImage();
    expect(fixture.viewer.id).not.toBe(fixture.uploader.id);

    const response = await getImage(fixture.auth, fixture.photo.id, '?size=thumb');

    expect(response.statusCode, response.body).toBe(200);
    expect(response.headers['content-type']).toBe('image/webp');
    expect(response.headers['cache-control']).toBe('private, max-age=3600');
    expect(response.headers.vary).toBe('Cookie');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-disposition']).toBe('inline');
    expect(response.headers['content-length']).toBe(String(fixture.buffers.thumb.byteLength));
    expect(response.headers.etag).toMatch(/^W\/"photo-image-thumb-\d+"$/);
    expect(response.rawPayload).toEqual(fixture.buffers.thumb);
  });

  it('AC-08: serves display and, with membersCanDownload, the original with the photo mime type', async () => {
    const fixture = await seedImage({ membersCanDownload: true });

    const display = await getImage(fixture.auth, fixture.photo.id, '?size=display');
    expect(display.statusCode, display.body).toBe(200);
    expect(display.headers['content-type']).toBe('image/webp');
    expect(display.rawPayload).toEqual(fixture.buffers.display);
    expect(display.headers['content-length']).toBe(String(fixture.buffers.display.byteLength));

    const original = await getImage(fixture.auth, fixture.photo.id, '?size=original');
    expect(original.statusCode, original.body).toBe(200);
    expect(original.headers['content-type']).toBe(fixture.photo.mimeType);
    expect(original.headers['content-length']).toBe(String(fixture.buffers.original.byteLength));
    expect(original.headers['content-disposition']).toBe('inline');
    expect(original.rawPayload).toEqual(fixture.buffers.original);
  });

  it('AC-08: forbids original when membersCanDownload is off while thumb and display still work', async () => {
    const fixture = await seedImage({ membersCanDownload: false });

    const original = await getImage(fixture.auth, fixture.photo.id, '?size=original');
    expect(original.statusCode, original.body).toBe(403);
    expect(original.json<ErrorResponse>().code).toBe('FORBIDDEN');

    for (const size of ['thumb', 'display'] as const) {
      const response = await getImage(fixture.auth, fixture.photo.id, `?size=${size}`);
      expect(response.statusCode, response.body).toBe(200);
      expect(response.rawPayload).toEqual(fixture.buffers[size]);
    }
  });

  it('AC-08: hides a missing photo, a foreign circle and a lost membership behind 404', async () => {
    const fixture = await seedImage();

    const stranger = await makeUser(prisma);
    const strangerAuth = await makeAuth(stranger.id);
    const strangerResponse = await getImage(strangerAuth, fixture.photo.id, '?size=thumb');
    expect(strangerResponse.statusCode, strangerResponse.body).toBe(404);
    expect(strangerResponse.json<ErrorResponse>().code).toBe('NOT_FOUND');

    const otherOwner = await makeUser(prisma);
    const otherCircle = await makeCircle(prisma, { ownerId: otherOwner.id });
    await makeMembership(prisma, {
      circleId: otherCircle.id,
      userId: otherOwner.id,
      role: 'owner',
    });
    const otherAuth = await makeAuth(otherOwner.id);
    const otherCircleResponse = await getImage(otherAuth, fixture.photo.id, '?size=thumb');
    expect(otherCircleResponse.statusCode, otherCircleResponse.body).toBe(404);
    expect(otherCircleResponse.json<ErrorResponse>().code).toBe('NOT_FOUND');

    const missing = await getImage(fixture.auth, 'missing-photo', '?size=thumb');
    expect(missing.statusCode, missing.body).toBe(404);
    expect(missing.json<ErrorResponse>().code).toBe('NOT_FOUND');

    await prisma.membership.deleteMany({
      where: { circleId: fixture.circle.id, userId: fixture.viewer.id },
    });
    const removed = await getImage(fixture.auth, fixture.photo.id, '?size=thumb');
    expect(removed.statusCode, removed.body).toBe(404);
    expect(removed.json<ErrorResponse>().code).toBe('NOT_FOUND');
  });

  it('AC-08: answers 404 when the object is absent from storage', async () => {
    const fixture = await seedImage();
    await testApp.services.storage.delete(fixture.photo.thumbKey);

    const response = await getImage(fixture.auth, fixture.photo.id, '?size=thumb');

    expect(response.statusCode, response.body).toBe(404);
    expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
  });

  it('AC-08: revalidates with If-None-Match and keeps the private cache headers', async () => {
    const fixture = await seedImage();
    const first = await getImage(fixture.auth, fixture.photo.id, '?size=thumb');
    expect(first.statusCode, first.body).toBe(200);

    const etag = first.headers.etag;
    expect(etag).toBeDefined();

    const revalidated = await getImage(fixture.auth, fixture.photo.id, '?size=thumb');
    const notModified = await testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${fixture.photo.id}/image?size=thumb`,
      headers: { ...headers(fixture.auth), 'if-none-match': etag ?? '' },
    });

    expect(revalidated.statusCode, revalidated.body).toBe(200);
    expect(notModified.statusCode, notModified.body).toBe(304);
    expect(notModified.body).toBe('');
    expect(notModified.headers['cache-control']).toBe('private, max-age=3600');
    expect(notModified.headers.vary).toBe('Cookie');
    expect(notModified.headers.etag).toBe(etag);

    // A list of validators is legal and must match on any of them.
    const list = await testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${fixture.photo.id}/image?size=thumb`,
      headers: { ...headers(fixture.auth), 'if-none-match': `W/"other", ${etag ?? ''}` },
    });
    expect(list.statusCode, list.body).toBe(304);

    const stale = await testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${fixture.photo.id}/image?size=thumb`,
      headers: { ...headers(fixture.auth), 'if-none-match': 'W/"different-etag"' },
    });
    expect(stale.statusCode, stale.body).toBe(200);
    expect(stale.rawPayload).toEqual(fixture.buffers.thumb);
  });

  it('AC-08: answers 304 without reading storage', async () => {
    const fixture = await seedImage();
    const storage = createFakeStorageService();
    const getSpy = vi.spyOn(storage, 'get');
    const conditionalApp = await createTestApp({
      prisma,
      services: { ...createFakeServices(), storage },
    });
    const etag = `W/"photo-image-thumb-${fixture.photo.updatedAt.getTime()}"`;

    try {
      const response = await conditionalApp.app.inject({
        method: 'GET',
        url: `/api/photos/${fixture.photo.id}/image?size=thumb`,
        headers: { ...headers(fixture.auth), 'if-none-match': etag },
      });

      expect(response.statusCode, response.body).toBe(304);
      expect(response.body).toBe('');
      expect(response.headers.etag).toBe(etag);
      expect(response.headers['cache-control']).toBe('private, max-age=3600');
      expect(response.headers.vary).toBe('Cookie');
      expect(getSpy).not.toHaveBeenCalled();
    } finally {
      await conditionalApp.close();
    }
  });

  it('rejects a missing or unknown size and an invalid photoId with 400', async () => {
    const fixture = await seedImage();

    const missing = await getImage(fixture.auth, fixture.photo.id, '');
    expect(missing.statusCode, missing.body).toBe(400);
    expect(missing.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');

    const unknown = await getImage(fixture.auth, fixture.photo.id, '?size=huge');
    expect(unknown.statusCode, unknown.body).toBe(400);
    expect(unknown.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');

    const invalidId = await getImage(fixture.auth, 'x'.repeat(65), '?size=thumb');
    expect(invalidId.statusCode, invalidId.body).toBe(400);
    expect(invalidId.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');
  });

  it('falls back to application/octet-stream when the persisted mime type is not an accepted image', async () => {
    const fixture = await seedImage();
    await prisma.photo.update({
      where: { id: fixture.photo.id },
      data: { mimeType: 'image/gif' },
    });

    const response = await getImage(fixture.auth, fixture.photo.id, '?size=original');

    expect(response.statusCode, response.body).toBe(200);
    expect(response.headers['content-type']).toBe('application/octet-stream');
  });

  it('never returns storage keys and hides photos from another circle behind 404', async () => {
    const fixture = await seedImage();
    const response = await getImage(fixture.auth, fixture.photo.id, '?size=original');

    expect(response.statusCode, response.body).toBe(200);
    expect(response.rawPayload).toEqual(fixture.buffers.original);

    const wire = [
      response.body,
      JSON.stringify(response.headers),
      response.rawPayload.toString('latin1'),
    ].join('\n');

    for (const key of [
      fixture.photo.originalKey,
      fixture.photo.displayKey,
      fixture.photo.thumbKey,
    ]) {
      expect(wire).not.toContain(key);
    }

    const missing = await getImage(fixture.auth, 'missing-photo', '?size=thumb');
    expect(missing.statusCode, missing.body).toBe(404);
    expect(missing.json<ErrorResponse>()).toEqual({
      code: 'NOT_FOUND',
      message: expect.any(String),
      details: null,
    });

    // An existing photo with its own object in another circle is still a 404
    // and its key never appears in the response.
    const otherOwner = await makeUser(prisma);
    const otherCircle = await makeCircle(prisma, { ownerId: otherOwner.id });
    await makeMembership(prisma, {
      circleId: otherCircle.id,
      userId: otherOwner.id,
      role: 'owner',
    });
    const otherAlbum = await makeAlbum(prisma, {
      circleId: otherCircle.id,
      createdBy: otherOwner.id,
    });
    const foreignPhoto = await makePhoto(prisma, {
      circleId: otherCircle.id,
      albumId: otherAlbum.id,
      uploaderId: otherOwner.id,
    });
    await testApp.services.storage.put(
      foreignPhoto.thumbKey,
      Buffer.from('foreign-bytes'),
      'image/webp',
    );

    const foreign = await getImage(fixture.auth, foreignPhoto.id, '?size=thumb');
    expect(foreign.statusCode, foreign.body).toBe(404);
    expect(foreign.json<ErrorResponse>().code).toBe('NOT_FOUND');
    expect(foreign.body).not.toContain(foreignPhoto.thumbKey);
  });

  it('maps a storage read failure to 500 INTERNAL_ERROR without leaking the error or key', async () => {
    const fixture = await seedImage();
    const storage = createFakeStorageService();
    const storageKey = fixture.photo.thumbKey;
    const providerError = `S3 unavailable while reading ${storageKey}`;
    const lines: string[] = [];

    storage.get = async () => {
      throw new Error(providerError);
    };

    const failingApp = await createTestApp({
      prisma,
      services: { ...createFakeServices(), storage },
      env: { LOG_LEVEL: 'info' },
      loggerStream: {
        write: (message: string) => {
          lines.push(message);
        },
      },
    });

    try {
      const response = await failingApp.app.inject({
        method: 'GET',
        url: `/api/photos/${fixture.photo.id}/image?size=thumb`,
        headers: headers(fixture.auth),
      });

      expect(response.statusCode, response.body).toBe(500);
      expect(response.json<ErrorResponse>().code).toBe('INTERNAL_ERROR');
      expect(response.body).not.toContain(storageKey);
      expect(response.body).not.toContain(storageKey.split('/').at(-1) ?? storageKey);

      const logs = lines.join('\n');
      expect(logs).not.toContain(storageKey);
      expect(logs).not.toContain(providerError);
    } finally {
      await failingApp.close();
    }
  });
});
