import {
  DEFAULT_CIRCLE_SETTINGS,
  MAX_DOWNLOAD_PHOTOS,
  type CircleSettings,
  type DownloadJobDto,
  type ErrorResponse,
} from '@memora/shared';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  Album,
  Circle,
  DownloadJob,
  Photo,
  Prisma,
  PrismaClient,
  User,
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
  makeUser,
} from '../../test/factories.ts';
import { createTestApp, type TestApp } from '../../test/harness.ts';
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from '../auth/session.ts';
import { DOWNLOAD_JOB_TTL_MS } from './service.ts';
import { downloadProgressRegistryFor } from './routes.ts';

const hasDatabase = hasDatabaseUrl();

/** `APP_URL` used by the test harness. */
const ORIGIN = 'http://localhost:3000';

const ALBUM_TITLE = 'Cumpleaños de Lucía';
const ALBUM_DATE = new Date('2025-05-01T00:00:00.000Z');

interface AuthFixture {
  readonly token: string;
  readonly csrfToken: string;
}

interface CircleFixture {
  readonly owner: User;
  readonly member: User;
  readonly otherMember: User;
  readonly outsider: User;
  readonly circle: Circle;
  readonly album: Album;
  readonly otherCircle: Circle;
  readonly otherAlbum: Album;
}

/**
 * Download API integration suite (F33).
 *
 * Runs the real HTTP pipeline over PostgreSQL. It covers the four endpoints and
 * the in-process worker: cross-circle authorization, `membersCanDownload`,
 * limits, expiry, rate limiting, derived progress and the ZIP lifecycle.
 */
describe.skipIf(!hasDatabase)('downloads API', () => {
  let testApp: TestApp;
  let prisma: PrismaClient;
  let fixture: CircleFixture;

  beforeEach(async () => {
    await resetDb();
    prisma = getTestPrismaClient();
    testApp = await createTestApp({ prisma });
    fixture = await seedCircle();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await testApp.close();
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  function headers(
    auth: AuthFixture | null,
    options: { readonly csrf?: boolean; readonly origin?: boolean } = {},
  ): Record<string, string> {
    const result: Record<string, string> = {};

    if (auth !== null) {
      result.cookie = `${SESSION_COOKIE_NAME}=${auth.token}`;
    }

    if (options.origin ?? true) {
      result.origin = ORIGIN;
    }

    if (auth !== null && (options.csrf ?? true)) {
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
    const member = await makeUser(prisma);
    const otherMember = await makeUser(prisma);
    const outsider = await makeUser(prisma);

    const circle = await makeCircle(prisma, {
      ownerId: owner.id,
      settings: { ...DEFAULT_CIRCLE_SETTINGS, ...settings },
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });
    await makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'member' });
    await makeMembership(prisma, { circleId: circle.id, userId: otherMember.id, role: 'member' });

    const album = await makeAlbum(prisma, {
      circleId: circle.id,
      createdBy: owner.id,
      title: ALBUM_TITLE,
      date: ALBUM_DATE,
    });

    const otherCircle = await makeCircle(prisma, { ownerId: outsider.id });
    await makeMembership(prisma, {
      circleId: otherCircle.id,
      userId: outsider.id,
      role: 'owner',
    });
    const otherAlbum = await makeAlbum(prisma, {
      circleId: otherCircle.id,
      createdBy: outsider.id,
      title: 'Otro círculo',
    });

    return {
      owner,
      member,
      otherMember,
      outsider,
      circle,
      album,
      otherCircle,
      otherAlbum,
    };
  }

  async function seedPhoto(overrides: Partial<Photo> = {}): Promise<Photo> {
    const photo = await makePhoto(prisma, {
      circleId: fixture.circle.id,
      albumId: fixture.album.id,
      uploaderId: fixture.owner.id,
      ...overrides,
    });

    await testApp.services.storage.put(
      photo.originalKey,
      Buffer.from(`original-${photo.id}`),
      photo.mimeType,
    );

    return photo;
  }

  async function seedJob(
    overrides: Partial<Prisma.DownloadJobUncheckedCreateInput> = {},
  ): Promise<DownloadJob> {
    return prisma.downloadJob.create({
      data: {
        circleId: fixture.circle.id,
        albumId: fixture.album.id,
        requestedBy: fixture.member.id,
        kind: 'album',
        status: 'pending',
        expiresAt: new Date(Date.now() + DOWNLOAD_JOB_TTL_MS),
        ...overrides,
      },
    });
  }

  function getDownload(auth: AuthFixture | null, photoId: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/photos/${encodeURIComponent(photoId)}/download`,
      headers: headers(auth),
    });
  }

  function postDownload(
    auth: AuthFixture | null,
    albumId: string,
    payload: { readonly photoIds?: readonly string[] } = {},
    options: { readonly csrf?: boolean; readonly origin?: boolean } = {},
  ) {
    return testApp.app.inject({
      method: 'POST',
      url: `/api/albums/${encodeURIComponent(albumId)}/downloads`,
      headers: headers(auth, options),
      payload,
    });
  }

  function getJob(auth: AuthFixture | null, jobId: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/downloads/${encodeURIComponent(jobId)}`,
      headers: headers(auth),
    });
  }

  function getJobFile(auth: AuthFixture | null, jobId: string) {
    return testApp.app.inject({
      method: 'GET',
      url: `/api/downloads/${encodeURIComponent(jobId)}/file`,
      headers: headers(auth),
    });
  }

  async function waitForStatus(jobId: string, status: DownloadJob['status']): Promise<DownloadJob> {
    let latest: DownloadJob | null = null;

    await vi.waitFor(
      async () => {
        latest = await prisma.downloadJob.findUnique({ where: { id: jobId } });
        expect(latest?.status, JSON.stringify(latest)).toBe(status);
      },
      { timeout: 15_000, interval: 50 },
    );

    if (latest === null) {
      throw new Error('Job not found.');
    }

    return latest;
  }

  /** Consumes the one-time orphan recovery before a test seeds `processing`. */
  async function primeRecovery(auth: AuthFixture): Promise<void> {
    const response = await getJob(auth, 'prime-recovery-job');

    expect(response.statusCode, response.body).toBe(404);
  }

  describe('GET /api/photos/:photoId/download', () => {
    it('answers 401 without a session', async () => {
      const photo = await seedPhoto();

      const response = await getDownload(null, photo.id);

      expect(response.statusCode, response.body).toBe(401);
      expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
    });

    it('answers 403 when membersCanDownload is disabled', async () => {
      const restricted = await seedCircle({ membersCanDownload: false });
      fixture = restricted;
      const photo = await seedPhoto();
      const auth = await makeAuth(restricted.member.id);

      const response = await getDownload(auth, photo.id);

      expect(response.statusCode, response.body).toBe(403);
      expect(response.json<ErrorResponse>().code).toBe('FORBIDDEN');
    });

    it('answers 404 for a photo of another circle', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.outsider.id);

      const response = await getDownload(auth, photo.id);

      expect(response.statusCode, response.body).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('serves the original as an attachment with a safe filename and headers', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      const response = await getDownload(auth, photo.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-length']).toBe(String(`original-${photo.id}`.length));
      expect(response.headers['content-disposition']).toBe(
        `attachment; filename="memora-cumpleanos-de-lucia-2025-05-01-${photo.id}.jpg"`,
      );
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.rawPayload.toString()).toBe(`original-${photo.id}`);
    });

    it('never exposes the object key in body or headers', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      const response = await getDownload(auth, photo.id);

      expect(response.body).not.toContain(photo.originalKey);
      expect(JSON.stringify(response.headers)).not.toContain(photo.originalKey);
    });

    it('answers 404 when the stored original is missing', async () => {
      const photo = await seedPhoto();
      testApp.services.storage.objects.delete(photo.originalKey);
      const auth = await makeAuth(fixture.member.id);

      const response = await getDownload(auth, photo.id);

      expect(response.statusCode, response.body).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('rate limits individual downloads at 10 per minute and user', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await getDownload(auth, photo.id);
        expect(response.statusCode, response.body).toBe(200);
      }

      const limited = await getDownload(auth, photo.id);

      expect(limited.statusCode, limited.body).toBe(429);
      expect(limited.json<ErrorResponse>().code).toBe('RATE_LIMITED');
    });
  });

  describe('POST /api/albums/:albumId/downloads', () => {
    it('answers 401 without a session', async () => {
      const response = await postDownload(null, fixture.album.id);

      expect(response.statusCode, response.body).toBe(401);
      expect(response.json<ErrorResponse>().code).toBe('UNAUTHENTICATED');
    });

    it('answers 403 when membersCanDownload is disabled', async () => {
      const restricted = await seedCircle({ membersCanDownload: false });
      fixture = restricted;
      const auth = await makeAuth(restricted.member.id);

      const response = await postDownload(auth, restricted.album.id);

      expect(response.statusCode, response.body).toBe(403);
      expect(response.json<ErrorResponse>().code).toBe('FORBIDDEN');
    });

    it('answers 404 for an album of another circle', async () => {
      const auth = await makeAuth(fixture.outsider.id);

      const response = await postDownload(auth, fixture.album.id);

      expect(response.statusCode, response.body).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('creates a pending job and answers 202 with the DTO', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      const response = await postDownload(auth, fixture.album.id);
      const body = response.json<DownloadJobDto>();

      expect(response.statusCode, response.body).toBe(202);
      expect(body).toMatchObject({
        kind: 'album',
        status: 'pending',
        albumId: fixture.album.id,
        progress: null,
        completedAt: null,
        errorMessage: null,
      });

      const created = await prisma.downloadJob.findUnique({ where: { id: body.id } });
      expect(created?.requestedBy).toBe(fixture.member.id);
      expect(created?.photoIds).toEqual([photo.id]);
      const ttl = (created?.expiresAt.getTime() ?? 0) - Date.now();
      expect(ttl).toBeGreaterThan(DOWNLOAD_JOB_TTL_MS - 60_000);
      expect(ttl).toBeLessThanOrEqual(DOWNLOAD_JOB_TTL_MS);

      await waitForStatus(body.id, 'ready');
    });

    it('answers 400 when photoIds is empty', async () => {
      const auth = await makeAuth(fixture.member.id);

      const response = await postDownload(auth, fixture.album.id, { photoIds: [] });

      expect(response.statusCode, response.body).toBe(400);
      expect(response.json<ErrorResponse>().code).toBe('VALIDATION_ERROR');
    });

    it('answers 404 when a selected photo belongs to another album', async () => {
      const photo = await seedPhoto();
      const otherAlbum = await makeAlbum(prisma, {
        circleId: fixture.circle.id,
        createdBy: fixture.owner.id,
      });
      const foreign = await makePhoto(prisma, {
        circleId: fixture.circle.id,
        albumId: otherAlbum.id,
        uploaderId: fixture.owner.id,
      });
      const auth = await makeAuth(fixture.member.id);

      const response = await postDownload(auth, fixture.album.id, {
        photoIds: [photo.id, foreign.id],
      });

      expect(response.statusCode, response.body).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('answers 422 when the album exceeds the photo limit', async () => {
      await prisma.photo.createMany({
        data: Array.from({ length: MAX_DOWNLOAD_PHOTOS + 1 }, (_, index) => ({
          id: `bulk-photo-${index}`,
          circleId: fixture.circle.id,
          albumId: fixture.album.id,
          uploaderId: fixture.owner.id,
          originalKey: `bulk/${index}/original.jpg`,
          displayKey: `bulk/${index}/display.webp`,
          thumbKey: `bulk/${index}/thumb.webp`,
          mimeType: 'image/jpeg',
          size: 10,
          width: 100,
          height: 100,
        })),
      });
      const auth = await makeAuth(fixture.member.id);

      const response = await postDownload(auth, fixture.album.id);

      expect(response.statusCode, response.body).toBe(422);
      expect(response.json<ErrorResponse>().code).toBe('UNPROCESSABLE_ENTITY');
      expect(response.json<ErrorResponse>().message).toContain(String(MAX_DOWNLOAD_PHOTOS));
    });

    it('answers 413 when the selection exceeds 2 GB', async () => {
      const first = await seedPhoto({ size: 1_500_000_000 });
      const second = await seedPhoto({ size: 1_500_000_000 });
      const auth = await makeAuth(fixture.member.id);

      const response = await postDownload(auth, fixture.album.id, {
        photoIds: [first.id, second.id],
      });

      expect(response.statusCode, response.body).toBe(413);
      expect(response.json<ErrorResponse>().code).toBe('FILE_TOO_LARGE');
    });

    it('rate limits job creation at 10 per minute and user', async () => {
      const photo = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);
      const payload = { photoIds: [photo.id] };

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await postDownload(auth, fixture.album.id, payload);
        expect(response.statusCode, response.body).toBe(202);
      }

      const limited = await postDownload(auth, fixture.album.id, payload);

      expect(limited.statusCode, limited.body).toBe(429);
      expect(limited.json<ErrorResponse>().code).toBe('RATE_LIMITED');
    });
  });

  describe('GET /api/downloads/:jobId', () => {
    it('answers 200 for the requester and for the circle owner', async () => {
      const job = await seedJob();
      const requesterAuth = await makeAuth(fixture.member.id);
      const ownerAuth = await makeAuth(fixture.owner.id);

      const asRequester = await getJob(requesterAuth, job.id);
      const asOwner = await getJob(ownerAuth, job.id);

      expect(asRequester.statusCode, asRequester.body).toBe(200);
      expect(asRequester.json<DownloadJobDto>().id).toBe(job.id);
      expect(asRequester.json<DownloadJobDto>().progress).toBeNull();
      expect(asOwner.statusCode, asOwner.body).toBe(200);
      expect(asOwner.json<DownloadJobDto>().id).toBe(job.id);
    });

    it('answers 404 for another member and for another circle', async () => {
      const job = await seedJob();
      const otherMemberAuth = await makeAuth(fixture.otherMember.id);
      const outsiderAuth = await makeAuth(fixture.outsider.id);

      const asMember = await getJob(otherMemberAuth, job.id);
      const asOutsider = await getJob(outsiderAuth, job.id);

      expect(asMember.statusCode, asMember.body).toBe(404);
      expect(asMember.json<ErrorResponse>().code).toBe('NOT_FOUND');
      expect(asOutsider.statusCode, asOutsider.body).toBe(404);
      expect(asOutsider.json<ErrorResponse>().code).toBe('NOT_FOUND');
    });

    it('marks orphaned processing jobs as error on the first job request', async () => {
      const orphan = await seedJob({ status: 'processing' });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJob(auth, orphan.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<DownloadJobDto>().status).toBe('error');
      expect(response.json<DownloadJobDto>().errorMessage).toContain('reiniciar');
      expect(response.json<DownloadJobDto>().progress).toBeNull();
    });

    it('marks orphaned pending jobs as error on the first job request', async () => {
      const orphan = await seedJob({ status: 'pending' });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJob(auth, orphan.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<DownloadJobDto>().status).toBe('error');
      expect(response.json<DownloadJobDto>().errorMessage).toContain('reiniciar');

      const stored = await prisma.downloadJob.findUnique({ where: { id: orphan.id } });
      expect(stored?.status).toBe('error');
    });

    it('recovers pending orphans before creating the new job and keeps the new one pending', async () => {
      const orphan = await seedJob({ status: 'pending' });
      await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      const created = await postDownload(auth, fixture.album.id);
      const body = created.json<DownloadJobDto>();

      expect(created.statusCode, created.body).toBe(202);
      expect(body.status).toBe('pending');

      const recovered = await prisma.downloadJob.findUnique({ where: { id: orphan.id } });
      expect(recovered?.status).toBe('error');

      const fresh = await prisma.downloadJob.findUnique({ where: { id: body.id } });
      expect(fresh?.status).not.toBe('error');

      await waitForStatus(body.id, 'ready');
    });

    it('derives progress only while processing', async () => {
      const auth = await makeAuth(fixture.member.id);
      await primeRecovery(auth);

      const processing = await seedJob({ status: 'processing' });
      downloadProgressRegistryFor(testApp.app)?.set(processing.id, 42);

      const response = await getJob(auth, processing.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<DownloadJobDto>().status).toBe('processing');
      expect(response.json<DownloadJobDto>().progress).toBe(42);

      const ready = await seedJob({ status: 'ready' });
      const readyResponse = await getJob(auth, ready.id);

      expect(readyResponse.json<DownloadJobDto>().progress).toBeNull();
    });

    it('marks a job expired, removes its object and reports expired', async () => {
      const objectKey = 'downloads/expired.zip';
      await testApp.services.storage.put(objectKey, Buffer.from('zip'), 'application/zip');
      const job = await seedJob({
        status: 'ready',
        objectKey,
        expiresAt: new Date(Date.now() - 60_000),
      });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJob(auth, job.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<DownloadJobDto>().status).toBe('expired');
      expect(response.json<DownloadJobDto>().progress).toBeNull();
      expect(testApp.services.storage.objects.has(objectKey)).toBe(false);

      const stored = await prisma.downloadJob.findUnique({ where: { id: job.id } });
      expect(stored?.status).toBe('expired');
    });

    it('never exposes objectKey', async () => {
      const job = await seedJob({ status: 'ready', objectKey: 'downloads/secret.zip' });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJob(auth, job.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.body).not.toContain('downloads/secret.zip');
      expect(response.json<DownloadJobDto>()).not.toHaveProperty('objectKey');
    });
  });

  describe('GET /api/downloads/:jobId/file', () => {
    it('serves the ZIP when the job is ready', async () => {
      const objectKey = 'downloads/ready.zip';
      const zip = Buffer.from('PK\u0003\u0004fake-zip-bytes');
      await testApp.services.storage.put(objectKey, zip, 'application/zip');
      const job = await seedJob({ status: 'ready', objectKey });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJobFile(auth, job.id);

      expect(response.statusCode, response.body).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="memora-cumpleanos-de-lucia-2025-05-01.zip"',
      );
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.rawPayload).toEqual(zip);
      expect(response.body).not.toContain(objectKey);
      expect(JSON.stringify(response.headers)).not.toContain(objectKey);
    });

    it('answers 409 while the job is not ready', async () => {
      const auth = await makeAuth(fixture.member.id);
      await primeRecovery(auth);
      const job = await seedJob({ status: 'pending' });

      const response = await getJobFile(auth, job.id);

      expect(response.statusCode, response.body).toBe(409);
      expect(response.json<ErrorResponse>().code).toBe('CONFLICT');
    });

    it('answers 404 when the job expired and removes the object', async () => {
      const objectKey = 'downloads/expired-file.zip';
      await testApp.services.storage.put(objectKey, Buffer.from('PK'), 'application/zip');
      const job = await seedJob({
        status: 'ready',
        objectKey,
        expiresAt: new Date(Date.now() - 60_000),
      });
      const auth = await makeAuth(fixture.member.id);

      const response = await getJobFile(auth, job.id);

      expect(response.statusCode, response.body).toBe(404);
      expect(response.json<ErrorResponse>().code).toBe('NOT_FOUND');
      expect(testApp.services.storage.objects.has(objectKey)).toBe(false);
    });

    it('answers 404 for another member', async () => {
      const job = await seedJob({ status: 'ready', objectKey: 'downloads/private.zip' });
      const auth = await makeAuth(fixture.otherMember.id);

      const response = await getJobFile(auth, job.id);

      expect(response.statusCode, response.body).toBe(404);
    });
  });

  describe('in-process worker', () => {
    it('generates a non-empty ZIP with the photos and a README', async () => {
      const first = await seedPhoto();
      const second = await seedPhoto();
      const auth = await makeAuth(fixture.member.id);

      const created = await postDownload(auth, fixture.album.id);
      const body = created.json<DownloadJobDto>();

      expect(created.statusCode, created.body).toBe(202);

      const ready = await waitForStatus(body.id, 'ready');

      expect(ready.objectKey).toBe(`downloads/${body.id}.zip`);
      expect(ready.completedAt).not.toBeNull();

      const file = await getJobFile(auth, body.id);

      expect(file.statusCode, file.body).toBe(200);
      expect(file.rawPayload.byteLength).toBeGreaterThan(0);
      expect(file.rawPayload.subarray(0, 2).toString('latin1')).toBe('PK');
      expect(file.rawPayload.includes(Buffer.from('README.txt'))).toBe(true);
      expect(file.rawPayload.includes(Buffer.from(first.id))).toBe(true);
      expect(file.rawPayload.includes(Buffer.from(second.id))).toBe(true);
    });

    it('records an error without PII or storage keys when storage fails', async () => {
      await seedPhoto();
      const auth = await makeAuth(fixture.member.id);
      vi.spyOn(testApp.services.storage, 'put').mockRejectedValue(
        new Error('storage boom at circles/secret/original.jpg'),
      );

      const created = await postDownload(auth, fixture.album.id);
      const body = created.json<DownloadJobDto>();

      expect(created.statusCode, created.body).toBe(202);

      const failed = await waitForStatus(body.id, 'error');

      expect(failed.errorMessage).toBeTruthy();
      expect(failed.errorMessage).not.toContain('boom');
      expect(failed.errorMessage).not.toContain('circles/');
      expect(failed.objectKey).toBeNull();

      const status = await getJob(auth, body.id);
      expect(status.json<DownloadJobDto>().progress).toBeNull();
    });
  });
});
