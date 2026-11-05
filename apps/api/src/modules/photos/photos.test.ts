import {
  DEFAULT_CIRCLE_SETTINGS,
  MAX_PLACE_NAME_LENGTH,
  type CircleSettings,
  type ErrorResponse,
  type PhotoDto,
} from '@memora/shared';
import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Circle, Photo, PrismaClient } from '../../generated/prisma/client.ts';
import { MAX_UPLOAD_BYTES } from '../../plugins/multipart.ts';
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
import {
  createAvif,
  createCorruptJpeg,
  createGif,
  createGpsJpeg,
  createHeic,
  createJpeg,
  createOrientedJpeg,
  createPng,
  createSvg,
  createWebp,
  patchJpegDimensions,
} from '../../test/image-fixtures.ts';
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from '../auth/session.ts';
import { createFakeServices, createFakeStorageService } from '../../test/fakes.ts';
import { MAX_CIRCLE_BYTES } from './service.ts';

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
}

interface FilePart {
  readonly fieldname?: string;
  readonly filename?: string;
  readonly contentType?: string;
  readonly data: Buffer;
}

interface FieldPart {
  readonly name: string;
  readonly value: string;
}

interface MultipartBody {
  readonly payload: Buffer;
  readonly contentType: string;
}

interface UploadOptions {
  readonly fields?: readonly FieldPart[];
  readonly files?: readonly FilePart[];
}

const BOUNDARY = '----memora-f25-boundary';

function buildMultipart(fields: readonly FieldPart[], files: readonly FilePart[]): MultipartBody {
  const chunks: Buffer[] = [];

  for (const field of fields) {
    chunks.push(
      Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${field.value}\r\n`,
      ),
    );
  }

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${file.fieldname ?? 'file'}"; ` +
          `filename="${file.filename ?? 'photo.jpg'}"\r\nContent-Type: ${
            file.contentType ?? 'application/octet-stream'
          }\r\n\r\n`,
      ),
    );
    chunks.push(file.data);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));

  return {
    payload: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${BOUNDARY}`,
  };
}

describe.skipIf(!hasDatabase)('photos API', () => {
  let testApp: TestApp;
  let prisma: PrismaClient;
  let jpeg: Buffer;
  let png: Buffer;
  let webp: Buffer;
  let orientedJpeg: Buffer;
  let gpsJpeg: Buffer;

  beforeAll(async () => {
    [jpeg, png, webp, orientedJpeg, gpsJpeg] = await Promise.all([
      createJpeg(120, 80),
      createPng(60, 40),
      createWebp(30, 20),
      createOrientedJpeg(),
      createGpsJpeg(),
    ]);
  });

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

  async function seedCircleWithAlbum(
    settings?: Partial<CircleSettings>,
  ): Promise<CircleFixture & { readonly auth: AuthFixture }> {
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, {
      ownerId: owner.id,
      ...(settings === undefined ? {} : { settings: { ...DEFAULT_CIRCLE_SETTINGS, ...settings } }),
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });

    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });

    return { owner, circle, album, auth: await makeAuth(owner.id) };
  }

  function upload(
    auth: AuthFixture | null,
    albumId: string,
    options: UploadOptions = {},
    withCsrf = true,
  ) {
    const body = buildMultipart(options.fields ?? [], options.files ?? []);

    return testApp.app.inject({
      method: 'POST',
      url: `/api/albums/${albumId}/photos`,
      headers: { ...headers(auth, withCsrf), 'content-type': body.contentType },
      payload: body.payload,
    });
  }

  function uploadFile(
    auth: AuthFixture | null,
    albumId: string,
    file: Buffer,
    clientUploadId = 'upload-1',
    extraFields: readonly FieldPart[] = [],
    withCsrf = true,
  ) {
    return upload(
      auth,
      albumId,
      {
        fields: [{ name: 'clientUploadId', value: clientUploadId }, ...extraFields],
        files: [{ data: file, contentType: 'image/jpeg' }],
      },
      withCsrf,
    );
  }

  function storedPhotoKeys(photo: Photo): [string, string, string] {
    return [photo.originalKey, photo.displayKey, photo.thumbKey];
  }

  async function latestPhoto(): Promise<Photo> {
    const photo = await prisma.photo.findFirst();

    if (photo === null) {
      throw new Error('Expected a persisted photo');
    }

    return photo;
  }

  it('AC-01: accepts JPEG, PNG and WebP and rejects SVG, GIF and HEIC', async () => {
    const { album, auth, circle } = await seedCircleWithAlbum();
    const accepted = [
      { file: jpeg, extension: 'jpg', mimeType: 'image/jpeg', format: 'jpeg' },
      { file: png, extension: 'png', mimeType: 'image/png', format: 'png' },
      { file: webp, extension: 'webp', mimeType: 'image/webp', format: 'webp' },
    ] as const;

    for (const [index, item] of accepted.entries()) {
      const response = await uploadFile(auth, album.id, item.file, `accepted-${index}`);

      expect(response.statusCode, response.body).toBe(201);
      const dto = response.json() as PhotoDto;
      expect(dto.circleId).toBe(circle.id);
      expect(dto.mimeType).toBe(item.mimeType);

      const photo = await prisma.photo.findUniqueOrThrow({ where: { id: dto.id } });
      expect(photo.originalKey.endsWith(`/original.${item.extension}`)).toBe(true);

      const object = testApp.services.storage.objects.get(photo.originalKey);
      expect(object?.contentType).toBe(item.mimeType);
      expect((await sharp(object?.body).metadata()).format).toBe(item.format);
    }

    for (const [index, file] of [createSvg(), createGif(), createHeic()].entries()) {
      const response = await uploadFile(auth, album.id, file, `rejected-${index}`);

      expect(response.statusCode, response.body).toBe(415);
      expect((response.json() as ErrorResponse).code).toBe('UNSUPPORTED_MEDIA_TYPE');
    }

    expect(await prisma.photo.count()).toBe(3);
  });

  it('rejects AVIF with 415', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const response = await uploadFile(auth, album.id, createAvif(), 'avif');

    expect(response.statusCode, response.body).toBe(415);
    expect((response.json() as ErrorResponse).code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects a patched JPEG over 50 MP with INVALID_IMAGE', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const oversized = patchJpegDimensions(jpeg, 10_000, 6_000);
    const response = await uploadFile(auth, album.id, oversized, 'too-many-pixels');

    expect(response.statusCode, response.body).toBe(422);
    expect((response.json() as ErrorResponse).code).toBe('INVALID_IMAGE');
    expect(await prisma.photo.count()).toBe(0);
    expect(testApp.services.storage.objects.size).toBe(0);
  });

  it('trusts magic bytes over a text/plain part and ignores the filename in keys', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const body = buildMultipart(
      [{ name: 'clientUploadId', value: 'spoofed-content-type' }],
      [{ data: jpeg, contentType: 'text/plain', filename: '../../evil.jpg' }],
    );
    const response = await testApp.app.inject({
      method: 'POST',
      url: `/api/albums/${album.id}/photos`,
      headers: {
        ...headers(auth),
        'content-type': body.contentType,
      },
      payload: body.payload,
    });

    expect(response.statusCode, response.body).toBe(201);
    expect((response.json() as PhotoDto).mimeType).toBe('image/jpeg');

    const photo = await latestPhoto();

    for (const key of storedPhotoKeys(photo)) {
      expect(key).not.toContain('evil');
      expect(key).not.toContain('..');
    }
  });

  it('AC-02: rejects files over 25 MB and uploads over the circle quota', async () => {
    const { album, auth, circle, owner } = await seedCircleWithAlbum();

    const tooLarge = await uploadFile(
      auth,
      album.id,
      Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x61),
      'too-large',
    );
    expect(tooLarge.statusCode, tooLarge.body).toBe(413);
    expect((tooLarge.json() as ErrorResponse).code).toBe('FILE_TOO_LARGE');
    expect(testApp.services.storage.objects.size).toBe(0);

    await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
      size: MAX_CIRCLE_BYTES - 10,
      clientUploadId: 'existing-quota',
    });

    const quota = await uploadFile(auth, album.id, jpeg, 'over-quota');

    expect(quota.statusCode, quota.body).toBe(413);
    expect((quota.json() as ErrorResponse).code).toBe('QUOTA_EXCEEDED');
    expect(testApp.services.storage.objects.size).toBe(0);
  });

  it('AC-03: generates correct keys, content types and variants', async () => {
    const { album, auth, circle } = await seedCircleWithAlbum();
    const largeJpeg = await createJpeg(2_000, 1_200);
    const albumBefore = await prisma.album.findUniqueOrThrow({ where: { id: album.id } });

    const response = await uploadFile(auth, album.id, largeJpeg, 'variants');

    expect(response.statusCode, response.body).toBe(201);
    const dto = response.json() as PhotoDto;
    const photo = await latestPhoto();
    const keys = storedPhotoKeys(photo);

    expect(photo.originalKey).toBe(`circles/${circle.id}/photos/${photo.id}/original.jpg`);
    expect(photo.displayKey).toBe(`circles/${circle.id}/photos/${photo.id}/display.webp`);
    expect(photo.thumbKey).toBe(`circles/${circle.id}/photos/${photo.id}/thumb.webp`);
    expect(dto.width).toBe(2_000);
    expect(dto.height).toBe(1_200);
    expect(photo.mimeType).toBe('image/jpeg');
    expect(photo.size).toBeGreaterThan(0);

    const original = testApp.services.storage.objects.get(keys[0]);
    const display = testApp.services.storage.objects.get(keys[1]);
    const thumb = testApp.services.storage.objects.get(keys[2]);

    expect(photo.size).toBe(original?.body.length);
    expect(original?.contentType).toBe('image/jpeg');
    expect(display?.contentType).toBe('image/webp');
    expect(thumb?.contentType).toBe('image/webp');

    const [originalMeta, displayMeta, thumbMeta] = await Promise.all([
      sharp(original?.body).metadata(),
      sharp(display?.body).metadata(),
      sharp(thumb?.body).metadata(),
    ]);

    expect(originalMeta.format).toBe('jpeg');
    expect(originalMeta.width).toBe(2_000);
    expect(originalMeta.height).toBe(1_200);
    expect(displayMeta.format).toBe('webp');
    expect(displayMeta.width).toBeLessThanOrEqual(1_600);
    expect(displayMeta.height).toBeLessThanOrEqual(1_600);
    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBe(400);
    expect(thumbMeta.height).toBe(400);

    const albumAfter = await prisma.album.findUniqueOrThrow({ where: { id: album.id } });
    expect(albumAfter.updatedAt).toEqual(albumBefore.updatedAt);
    expect(albumAfter.coverPhotoId).toBeNull();
  });

  it('AC-04: applies EXIF orientation to the original and the variants', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const response = await uploadFile(auth, album.id, orientedJpeg, 'oriented');

    expect(response.statusCode, response.body).toBe(201);
    const dto = response.json() as PhotoDto;
    const photo = await latestPhoto();

    expect(dto.width).toBe(80);
    expect(dto.height).toBe(120);
    expect(photo.width).toBe(80);
    expect(photo.height).toBe(120);

    for (const key of storedPhotoKeys(photo)) {
      const object = testApp.services.storage.objects.get(key);
      const metadata = await sharp(object?.body).metadata();

      expect(metadata.orientation).toBeUndefined();
      if (key === photo.originalKey) {
        expect(metadata.width).toBe(80);
        expect(metadata.height).toBe(120);
      }
    }
  });

  it('AC-05/AC-06: geocodes GPS in memory and strips metadata from every object', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const response = await uploadFile(auth, album.id, gpsJpeg, 'gps');

    expect(response.statusCode, response.body).toBe(201);
    const dto = response.json() as PhotoDto;
    const photo = await latestPhoto();

    expect(dto.placeName).toBe('Palma, Mallorca');
    expect(photo.placeName).toBe('Palma, Mallorca');
    expect(photo.placeName?.length).toBeLessThanOrEqual(MAX_PLACE_NAME_LENGTH);
    expect(photo.takenAt?.toISOString()).toBe('2024-05-06T07:08:09.000Z');
    expect(testApp.services.geocoding.requests).toHaveLength(1);
    expect(testApp.services.geocoding.requests[0]?.latitude).toBeCloseTo(39.5696, 3);
    expect(testApp.services.geocoding.requests[0]?.longitude).toBeCloseTo(2.6502, 3);

    for (const key of storedPhotoKeys(photo)) {
      const object = testApp.services.storage.objects.get(key);
      const metadata = await sharp(object?.body).metadata();

      expect(metadata.exif).toBeUndefined();
      expect(metadata.orientation).toBeUndefined();
    }
  });

  it('AC-06: keeps 201 and placeName null when geocoding fails', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    testApp.services.geocoding.reverse = async () => null;

    const response = await uploadFile(auth, album.id, gpsJpeg, 'gps-no-place');

    expect(response.statusCode, response.body).toBe(201);
    expect((response.json() as PhotoDto).placeName).toBeNull();
    expect((await latestPhoto()).placeName).toBeNull();
  });

  it('uses the form takenAt over EXIF and persists the description', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const response = await uploadFile(auth, album.id, gpsJpeg, 'form-wins', [
      { name: 'takenAt', value: '2025-01-02T03:04:05.000Z' },
      { name: 'description', value: 'Playa al atardecer' },
    ]);

    expect(response.statusCode, response.body).toBe(201);
    const photo = await latestPhoto();

    expect(photo.takenAt?.toISOString()).toBe('2025-01-02T03:04:05.000Z');
    expect(photo.description).toBe('Playa al atardecer');
  });

  it('AC-07: replays an existing clientUploadId with 200 and the same id', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const first = await uploadFile(auth, album.id, jpeg, 'replay');
    const second = await uploadFile(auth, album.id, jpeg, 'replay');

    expect(first.statusCode, first.body).toBe(201);
    expect(second.statusCode, second.body).toBe(200);
    expect((second.json() as PhotoDto).id).toBe((first.json() as PhotoDto).id);
    expect(await prisma.photo.count()).toBe(1);
    expect(await prisma.activity.count({ where: { type: 'photo_uploaded' } })).toBe(1);
    expect(testApp.services.storage.objects.size).toBe(3);
  });

  it('AC-07: a concurrent replay leaves one row, one activity and no orphan objects', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const [first, second] = await Promise.all([
      uploadFile(auth, album.id, jpeg, 'race'),
      uploadFile(auth, album.id, jpeg, 'race'),
    ]);

    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 201]);
    expect((first.json() as PhotoDto).id).toBe((second.json() as PhotoDto).id);
    expect(await prisma.photo.count()).toBe(1);
    expect(await prisma.activity.count({ where: { type: 'photo_uploaded' } })).toBe(1);
    expect(testApp.services.storage.objects.size).toBe(3);
  });

  it('AC-07: handles a forced P2002 race by replaying the existing photo', async () => {
    const { album, auth, circle, owner } = await seedCircleWithAlbum();
    const existing = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
      clientUploadId: 'forced-race',
    });

    // The first lookup lies and returns null, so the pipeline reaches the
    // unique insert. The real implementation answers the second lookup.
    vi.spyOn(prisma.photo, 'findUnique').mockResolvedValueOnce(null as never);
    const putSpy = vi.spyOn(testApp.services.storage, 'put');

    const response = await uploadFile(auth, album.id, jpeg, 'forced-race');

    expect(response.statusCode, response.body).toBe(200);
    expect((response.json() as PhotoDto).id).toBe(existing.id);
    expect(await prisma.photo.count()).toBe(1);
    expect(await prisma.activity.count({ where: { type: 'photo_uploaded' } })).toBe(0);
    expect(putSpy).toHaveBeenCalledTimes(3);
    expect(testApp.services.storage.objects.size).toBe(0);
  });

  it('AC-07: cross-album replay from another accessible circle returns 200', async () => {
    const owner = await makeUser(prisma);
    const circleA = await makeCircle(prisma, { ownerId: owner.id });
    const circleB = await makeCircle(prisma, { ownerId: owner.id });

    await makeMembership(prisma, { circleId: circleA.id, userId: owner.id, role: 'owner' });
    await makeMembership(prisma, { circleId: circleB.id, userId: owner.id, role: 'owner' });

    const albumA = await makeAlbum(prisma, { circleId: circleA.id, createdBy: owner.id });
    const albumB = await makeAlbum(prisma, { circleId: circleB.id, createdBy: owner.id });
    const auth = await makeAuth(owner.id);

    const first = await uploadFile(auth, albumA.id, jpeg, 'cross-accessible');
    const second = await uploadFile(auth, albumB.id, jpeg, 'cross-accessible');

    expect(first.statusCode, first.body).toBe(201);
    expect(second.statusCode, second.body).toBe(200);
    expect((second.json() as PhotoDto).id).toBe((first.json() as PhotoDto).id);
    expect(await prisma.photo.count()).toBe(1);
  });

  it('AC-07: cross-circle replay after losing membership returns 409', async () => {
    const otherOwner = await makeUser(prisma);
    const circleA = await makeCircle(prisma, { ownerId: otherOwner.id });
    await makeMembership(prisma, {
      circleId: circleA.id,
      userId: otherOwner.id,
      role: 'owner',
    });

    const member = await makeUser(prisma);
    await makeMembership(prisma, { circleId: circleA.id, userId: member.id, role: 'member' });
    const albumA = await makeAlbum(prisma, { circleId: circleA.id, createdBy: otherOwner.id });

    const circleB = await makeCircle(prisma, { ownerId: member.id });
    await makeMembership(prisma, { circleId: circleB.id, userId: member.id, role: 'owner' });
    const albumB = await makeAlbum(prisma, { circleId: circleB.id, createdBy: member.id });

    const auth = await makeAuth(member.id);
    const first = await uploadFile(auth, albumA.id, jpeg, 'cross-lost');

    expect(first.statusCode, first.body).toBe(201);

    await prisma.membership.deleteMany({ where: { circleId: circleA.id, userId: member.id } });

    const second = await uploadFile(auth, albumB.id, jpeg, 'cross-lost');

    expect(second.statusCode, second.body).toBe(409);
    expect((second.json() as ErrorResponse).code).toBe('CONFLICT');
    expect(await prisma.photo.count()).toBe(1);
  });

  it('AC-08: a failing second put returns PROCESSING_FAILED and cleans the first object', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const storage = createFakeStorageService();
    const originalPut = storage.put;
    let puts = 0;

    storage.put = async (key, body, contentType) => {
      puts += 1;

      if (puts === 2) {
        throw new Error('S3 unavailable');
      }

      await originalPut(key, body, contentType);
    };

    const failingApp = await createTestApp({
      prisma,
      services: { ...createFakeServices(), storage },
    });

    try {
      const body = buildMultipart(
        [{ name: 'clientUploadId', value: 'storage-fails' }],
        [{ data: jpeg, contentType: 'image/jpeg' }],
      );
      const response = await failingApp.app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/photos`,
        headers: {
          origin: ORIGIN,
          cookie: `${SESSION_COOKIE_NAME}=${auth.token}`,
          'x-csrf-token': auth.csrfToken,
          'content-type': body.contentType,
        },
        payload: body.payload,
      });

      expect(response.statusCode, response.body).toBe(422);
      expect((response.json() as ErrorResponse).code).toBe('PROCESSING_FAILED');
      expect(await prisma.photo.count()).toBe(0);
      expect(await prisma.activity.count()).toBe(0);
      expect(storage.objects.size).toBe(0);
    } finally {
      await failingApp.close();
    }
  });

  it('AC-08: maps a sharp failure after validation to PROCESSING_FAILED', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const truncated = jpeg.subarray(0, jpeg.length - 10);

    const response = await uploadFile(auth, album.id, truncated, 'sharp-fails');

    expect(response.statusCode, response.body).toBe(422);
    expect((response.json() as ErrorResponse).code).toBe('PROCESSING_FAILED');
    expect(await prisma.photo.count()).toBe(0);
    expect(await prisma.activity.count()).toBe(0);
    expect(testApp.services.storage.objects.size).toBe(0);
  });

  it('cleans objects and publishes no photo when the final transaction fails', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const storage = createFakeStorageService();
    const failingPrisma = new Proxy(prisma, {
      get(target, property, receiver) {
        if (property === '$transaction') {
          return async () => {
            throw new Error('database unavailable');
          };
        }

        const value = Reflect.get(target, property, receiver);

        return typeof value === 'function' ? value.bind(target) : value;
      },
    }) as PrismaClient;
    const failingApp = await createTestApp({
      prisma: failingPrisma,
      services: { ...createFakeServices(), storage },
    });

    try {
      const body = buildMultipart(
        [{ name: 'clientUploadId', value: 'db-fails' }],
        [{ data: jpeg, contentType: 'image/jpeg' }],
      );
      const response = await failingApp.app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/photos`,
        headers: {
          origin: ORIGIN,
          cookie: `${SESSION_COOKIE_NAME}=${auth.token}`,
          'x-csrf-token': auth.csrfToken,
          'content-type': body.contentType,
        },
        payload: body.payload,
      });

      expect(response.statusCode, response.body).toBe(500);
      expect(await prisma.photo.count()).toBe(0);
      expect(await prisma.activity.count()).toBe(0);
      expect(storage.objects.size).toBe(0);
    } finally {
      await failingApp.close();
    }
  });

  it('rejects unauthenticated, missing CSRF and unauthorized uploads', async () => {
    const { album, auth, circle } = await seedCircleWithAlbum({ membersCanUpload: false });

    const unauthenticated = await uploadFile(null, album.id, jpeg, 'no-session');
    expect(unauthenticated.statusCode, unauthenticated.body).toBe(401);

    const noCsrf = await uploadFile(auth, album.id, jpeg, 'no-csrf', [], false);
    expect(noCsrf.statusCode, noCsrf.body).toBe(403);

    const member = await makeUser(prisma);
    await makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'member' });
    const memberAuth = await makeAuth(member.id);
    const noPermission = await uploadFile(memberAuth, album.id, jpeg, 'no-permission');

    expect(noPermission.statusCode, noPermission.body).toBe(403);
    expect((noPermission.json() as ErrorResponse).code).toBe('FORBIDDEN');
  });

  it('hides albums from non-members and missing albums with 404', async () => {
    const { album } = await seedCircleWithAlbum();
    const stranger = await makeUser(prisma);
    const strangerAuth = await makeAuth(stranger.id);

    const otherCircle = await uploadFile(strangerAuth, album.id, jpeg, 'stranger');
    expect(otherCircle.statusCode, otherCircle.body).toBe(404);
    expect((otherCircle.json() as ErrorResponse).code).toBe('NOT_FOUND');

    const missing = await uploadFile(strangerAuth, 'does-not-exist', jpeg, 'missing');
    expect(missing.statusCode, missing.body).toBe(404);
  });

  it('rejects missing files, two files and malformed fields with 400', async () => {
    const { album, auth } = await seedCircleWithAlbum();

    const missingFile = await upload(auth, album.id, {
      fields: [{ name: 'clientUploadId', value: 'missing-file' }],
    });
    expect(missingFile.statusCode, missingFile.body).toBe(400);
    expect((missingFile.json() as ErrorResponse).code).toBe('VALIDATION_ERROR');

    const twoFiles = await upload(auth, album.id, {
      fields: [{ name: 'clientUploadId', value: 'two-files' }],
      files: [
        { data: jpeg, contentType: 'image/jpeg' },
        { data: png, contentType: 'image/png' },
      ],
    });
    expect(twoFiles.statusCode, twoFiles.body).toBe(400);

    const unknownField = await upload(auth, album.id, {
      fields: [
        { name: 'clientUploadId', value: 'unknown-field' },
        { name: 'surprise', value: 'x' },
      ],
      files: [{ data: jpeg, contentType: 'image/jpeg' }],
    });
    expect(unknownField.statusCode, unknownField.body).toBe(400);

    const duplicate = await upload(auth, album.id, {
      fields: [
        { name: 'clientUploadId', value: 'duplicate' },
        { name: 'clientUploadId', value: 'duplicate-2' },
      ],
      files: [{ data: jpeg, contentType: 'image/jpeg' }],
    });
    expect(duplicate.statusCode, duplicate.body).toBe(400);

    const invalidId = await upload(auth, album.id, {
      fields: [{ name: 'clientUploadId', value: 'x'.repeat(129) }],
      files: [{ data: jpeg, contentType: 'image/jpeg' }],
    });
    expect(invalidId.statusCode, invalidId.body).toBe(400);

    expect(await prisma.photo.count()).toBe(0);
  });

  it('maps corrupt bytes to INVALID_IMAGE', async () => {
    const { album, auth } = await seedCircleWithAlbum();
    const response = await uploadFile(auth, album.id, await createCorruptJpeg(), 'corrupt');

    expect(response.statusCode, response.body).toBe(422);
    expect((response.json() as ErrorResponse).code).toBe('INVALID_IMAGE');
  });

  it('writes one photo_uploaded activity linked to album, photo, actor and circle', async () => {
    const { album, auth, circle, owner } = await seedCircleWithAlbum();

    const response = await uploadFile(auth, album.id, jpeg, 'activity');
    expect(response.statusCode, response.body).toBe(201);

    const photo = await latestPhoto();
    const activity = await prisma.activity.findFirstOrThrow({
      where: { type: 'photo_uploaded' },
    });

    expect(activity.circleId).toBe(circle.id);
    expect(activity.actorId).toBe(owner.id);
    expect(activity.albumId).toBe(album.id);
    expect(activity.photoId).toBe(photo.id);
    expect(activity.metadata).toEqual({ count: 1 });
  });

  it('deletes only the emptied album objects, best-effort', async () => {
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const otherCircle = await makeCircle(prisma, { ownerId: owner.id });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });
    await makeMembership(prisma, {
      circleId: otherCircle.id,
      userId: owner.id,
      role: 'owner',
    });

    const target = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const sibling = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const otherAlbum = await makeAlbum(prisma, {
      circleId: otherCircle.id,
      createdBy: owner.id,
    });

    const targetPhoto = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: target.id,
      uploaderId: owner.id,
    });
    const siblingPhoto = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: sibling.id,
      uploaderId: owner.id,
    });
    const otherPhoto = await makePhoto(prisma, {
      circleId: otherCircle.id,
      albumId: otherAlbum.id,
      uploaderId: owner.id,
    });

    for (const photo of [targetPhoto, siblingPhoto, otherPhoto]) {
      for (const key of storedPhotoKeys(photo)) {
        await testApp.services.storage.put(key, Buffer.from('object'), 'application/octet-stream');
      }
    }

    const auth = await makeAuth(owner.id);
    const response = await testApp.app.inject({
      method: 'DELETE',
      url: `/api/albums/${target.id}/photos`,
      headers: headers(auth),
    });

    expect(response.statusCode, response.body).toBe(200);
    expect((response.json() as { deletedCount: number }).deletedCount).toBe(1);

    for (const key of storedPhotoKeys(targetPhoto)) {
      expect(testApp.services.storage.objects.has(key)).toBe(false);
    }

    for (const key of [...storedPhotoKeys(siblingPhoto), ...storedPhotoKeys(otherPhoto)]) {
      expect(testApp.services.storage.objects.has(key)).toBe(true);
    }

    expect(await prisma.photo.count()).toBe(2);
  });

  it('still answers 200 when object cleanup fails after emptying', async () => {
    const { album, auth, circle, owner } = await seedCircleWithAlbum();
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    for (const key of storedPhotoKeys(photo)) {
      await testApp.services.storage.put(key, Buffer.from('object'), 'application/octet-stream');
    }

    const failingStorage = createFakeStorageService();
    failingStorage.delete = async () => {
      throw new Error('storage down');
    };
    const failingApp = await createTestApp({
      prisma,
      services: { ...createFakeServices(), storage: failingStorage },
    });

    try {
      const response = await failingApp.app.inject({
        method: 'DELETE',
        url: `/api/albums/${album.id}/photos`,
        headers: headers(auth),
      });

      expect(response.statusCode, response.body).toBe(200);
      expect((response.json() as { deletedCount: number }).deletedCount).toBe(1);
      expect(await prisma.photo.count()).toBe(0);
    } finally {
      await failingApp.close();
    }
  });

  it('rate limits uploads to 60 per minute and user across sessions', async () => {
    const { album, auth, owner } = await seedCircleWithAlbum();
    const secondSession = await makeAuth(owner.id);
    const tiny = await createJpeg(1, 1);

    for (let index = 0; index < 60; index += 1) {
      const session = index % 2 === 0 ? auth : secondSession;
      const response = await uploadFile(session, album.id, tiny, `rate-${index}`);

      expect(response.statusCode, response.body).toBe(201);
    }

    const limited = await uploadFile(secondSession, album.id, tiny, 'rate-61');

    expect(limited.statusCode, limited.body).toBe(429);
    expect((limited.json() as ErrorResponse).code).toBe('RATE_LIMITED');
  }, 120_000);

  it('does not persist GPS coordinates in the data model', async () => {
    const { album, auth, circle, owner } = await seedCircleWithAlbum();
    const response = await uploadFile(auth, album.id, gpsJpeg, 'no-gps-log');

    expect(response.statusCode, response.body).toBe(201);

    const photo = await latestPhoto();
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Photo'
        AND column_name IN ('latitude', 'longitude', 'gps')
    `;

    expect(columns).toEqual([]);
    expect(photo.circleId).toBe(circle.id);
    expect(photo.uploaderId).toBe(owner.id);
  });
});
