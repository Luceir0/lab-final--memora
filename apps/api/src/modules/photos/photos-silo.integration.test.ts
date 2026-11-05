import { afterAll, describe, expect, it } from 'vitest';

import { buildApp } from '../../app.ts';
import { loadConfig } from '../../config.ts';
import { createRuntimeServices } from '../../services/index.ts';
import { closeTestPrismaClient, getTestPrismaClient, hasDatabaseUrl } from '../../test/db.ts';
import { makeAlbum, makeCircle, makeMembership, makeUser } from '../../test/factories.ts';
import { createJpeg } from '../../test/image-fixtures.ts';
import { createSession, SESSION_COOKIE_NAME } from '../auth/session.ts';

const ENABLED =
  process.env.SILO_INTEGRATION === '1' &&
  hasDatabaseUrl() &&
  typeof process.env.S3_ENDPOINT === 'string' &&
  typeof process.env.S3_BUCKET === 'string';

const BOUNDARY = '----memora-silo-boundary';

function multipartBody(
  file: Buffer,
  clientUploadId: string,
): {
  readonly payload: Buffer;
  readonly contentType: string;
} {
  const head = Buffer.from(
    `--${BOUNDARY}\r\nContent-Disposition: form-data; name="clientUploadId"\r\n\r\n${clientUploadId}\r\n` +
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="silo.jpg"\r\n` +
      'Content-Type: image/jpeg\r\n\r\n',
  );
  const tail = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);

  return {
    payload: Buffer.concat([head, file, tail]),
    contentType: `multipart/form-data; boundary=${BOUNDARY}`,
  };
}

/**
 * Optional real round-trip against the local Silo bucket and PostgreSQL.
 *
 * Runs only with `SILO_INTEGRATION=1` plus S3_* pointing at Silo. The normal
 * suite skips it. It creates its own user/circle/album, uploads one generated
 * JPEG through the public route, checks the row and the three objects, and
 * removes every row and object before finishing.
 */
describe.skipIf(!ENABLED)('upload pipeline against Silo (integration)', () => {
  afterAll(async () => {
    await closeTestPrismaClient();
  });

  it('stores one photo and its three objects in Silo', async () => {
    const prisma = getTestPrismaClient();
    const config = loadConfig({
      NODE_ENV: 'test',
      SESSION_SECRET: 'silo-integration-session-secret-0123456789',
      DATABASE_URL: process.env.DATABASE_URL,
      APP_URL: 'http://localhost:3000',
      EMAIL_FROM: 'Memora <no-reply@memora.local>',
      LOG_LEVEL: 'silent',
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_REGION: process.env.S3_REGION ?? 'us-east-1',
      S3_BUCKET: process.env.S3_BUCKET,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? 'memora',
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? 'memora123',
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE ?? 'true',
      GEOCODING_BASE_URL: process.env.GEOCODING_BASE_URL ?? 'https://nominatim.openstreetmap.org',
      GEOCODING_USER_AGENT:
        process.env.GEOCODING_USER_AGENT ?? 'Memora-test/0.1 (test@memora.local)',
    });
    const services = createRuntimeServices(config);
    const app = await buildApp({ config, services, logger: false, prisma });
    const user = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: user.id });
    await makeMembership(prisma, {
      circleId: circle.id,
      userId: user.id,
      role: 'owner',
    });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: user.id });
    const session = await createSession(prisma, user.id);
    const csrfToken = app.csrf.create(session.token);
    const body = multipartBody(await createJpeg(320, 240), 'silo-integration');
    let photoId: string | null = null;

    try {
      const response = await app.inject({
        method: 'POST',
        url: `/api/albums/${album.id}/photos`,
        headers: {
          origin: 'http://localhost:3000',
          cookie: `${SESSION_COOKIE_NAME}=${session.token}`,
          'x-csrf-token': csrfToken,
          'content-type': body.contentType,
        },
        payload: body.payload,
      });

      expect(response.statusCode, response.body).toBe(201);
      const dto = response.json() as { readonly id: string };
      photoId = dto.id;

      const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
      const keys = [photo.originalKey, photo.displayKey, photo.thumbKey];

      for (const key of keys) {
        const object = await services.storage.get(key);

        expect(object).not.toBeNull();
        expect(object?.body.length).toBeGreaterThan(0);
      }

      const activity = await prisma.activity.findFirst({
        where: { type: 'photo_uploaded', photoId },
      });
      expect(activity).not.toBeNull();
    } finally {
      if (photoId !== null) {
        const photo = await prisma.photo.findUnique({ where: { id: photoId } });

        if (photo !== null) {
          await Promise.allSettled(
            [photo.originalKey, photo.displayKey, photo.thumbKey].map((key) =>
              services.storage.delete(key),
            ),
          );
        }
      }

      await prisma.activity.deleteMany({ where: { circleId: circle.id } });
      await prisma.photo.deleteMany({ where: { circleId: circle.id } });
      await prisma.album.deleteMany({ where: { circleId: circle.id } });
      await prisma.membership.deleteMany({ where: { circleId: circle.id } });
      await prisma.circle.deleteMany({ where: { id: circle.id } });
      await prisma.user.deleteMany({ where: { id: user.id } });
      await app.close();
    }
  });
});
