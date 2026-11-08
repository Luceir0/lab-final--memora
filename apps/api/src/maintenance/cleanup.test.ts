import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Circle, Prisma, PrismaClient, User } from '../generated/prisma/client.ts';
import { closeTestPrismaClient, getTestPrismaClient, hasDatabaseUrl, resetDb } from '../test/db.ts';
import { makeCircle, makeSession, makeUser } from '../test/factories.ts';
import type { StorageService } from '../services/storage.ts';
import {
  CLEANUP_INTERVAL_MS,
  EXPIRED_JOB_RETENTION_MS,
  runCleanup,
  startCleanupScheduler,
  type CleanupLogger,
} from './cleanup.ts';

const hasDatabase = hasDatabaseUrl();

/** Fixed clock so expirations and retentions never depend on the wall clock. */
const NOW = new Date('2026-01-15T12:00:00.000Z');

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

interface RecordingStorage extends StorageService {
  /** Keys passed to `delete`, in call order. */
  readonly deletedKeys: string[];
}

function createRecordingStorage(): RecordingStorage {
  const deletedKeys: string[] = [];

  return {
    deletedKeys,
    put: async () => undefined,
    get: async () => null,
    delete: async (key) => {
      deletedKeys.push(key);
    },
  };
}

/**
 * Maintenance suite (F42, H-02).
 *
 * Runs the cleanup against the real `memora_test` database so the Prisma
 * filters, the batch limit and the retention window are verified as written.
 * Storage is a fake that records deleted keys: no real bucket is touched.
 */
describe.skipIf(!hasDatabase)('maintenance cleanup', () => {
  let prisma: PrismaClient;
  let storage: RecordingStorage;
  let owner: User;
  let circle: Circle;

  beforeEach(async () => {
    await resetDb();
    prisma = getTestPrismaClient();
    storage = createRecordingStorage();

    owner = await makeUser(prisma);
    circle = await makeCircle(prisma, { ownerId: owner.id });
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  async function makeJob(
    overrides: Partial<Prisma.DownloadJobUncheckedCreateInput> = {},
  ): Promise<{ id: string }> {
    return prisma.downloadJob.create({
      data: {
        circleId: circle.id,
        requestedBy: owner.id,
        kind: 'album',
        status: 'pending',
        expiresAt: new Date(NOW.getTime() + HOUR_MS),
        ...overrides,
      },
    });
  }

  it('deletes expired sessions and keeps valid ones', async () => {
    const expired = await makeSession(prisma, {
      userId: owner.id,
      expiresAt: new Date(NOW.getTime() - MINUTE_MS),
    });
    const valid = await makeSession(prisma, {
      userId: owner.id,
      expiresAt: new Date(NOW.getTime() + HOUR_MS),
    });

    const result = await runCleanup(prisma, storage, NOW);

    expect(result.sessionsDeleted).toBe(1);
    expect(result.jobsExpired).toBe(0);
    expect(result.jobsDeleted).toBe(0);
    await expect(prisma.session.findUnique({ where: { id: expired.id } })).resolves.toBeNull();
    await expect(prisma.session.findUnique({ where: { id: valid.id } })).resolves.not.toBeNull();
  });

  it('expires a due job and deletes its ZIP from storage', async () => {
    const objectKey = 'circles/test/downloads/job-1.zip';
    const job = await makeJob({
      status: 'ready',
      objectKey,
      expiresAt: new Date(NOW.getTime() - MINUTE_MS),
    });

    const result = await runCleanup(prisma, storage, NOW);

    expect(result.jobsExpired).toBe(1);
    // Within the retention window: the row survives so a recent read still
    // answers `expired` instead of `404`.
    expect(result.jobsDeleted).toBe(0);
    expect(storage.deletedKeys).toEqual([objectKey]);

    const row = await prisma.downloadJob.findUnique({ where: { id: job.id } });

    expect(row?.status).toBe('expired');
  });

  it('purges only expired jobs past the 24-hour retention', async () => {
    const old = await makeJob({
      status: 'expired',
      expiresAt: new Date(NOW.getTime() - EXPIRED_JOB_RETENTION_MS - MINUTE_MS),
    });
    const recent = await makeJob({
      status: 'expired',
      expiresAt: new Date(NOW.getTime() - MINUTE_MS),
    });

    const result = await runCleanup(prisma, storage, NOW);

    expect(result.jobsExpired).toBe(0);
    expect(result.jobsDeleted).toBe(1);
    await expect(prisma.downloadJob.findUnique({ where: { id: old.id } })).resolves.toBeNull();
    await expect(
      prisma.downloadJob.findUnique({ where: { id: recent.id } }),
    ).resolves.not.toBeNull();
  });

  it('runs one pass on start and stop() prevents later passes', async () => {
    const expired = await makeSession(prisma, {
      userId: owner.id,
      expiresAt: new Date(NOW.getTime() - MINUTE_MS),
    });

    const calls: Array<{ bindings: Record<string, unknown>; message: string }> = [];
    // The first pass runs immediately; stop synchronously from the log call so
    // no interval tick can start before the test cancels it.
    let stop: (() => void) | null = null;

    const logger: CleanupLogger = {
      info: (bindings, message) => {
        calls.push({ bindings, message });
        stop?.();
      },
      error: () => undefined,
    };

    stop = startCleanupScheduler({ prisma, storage, logger, intervalMs: 20 });

    await vi.waitFor(() => {
      expect(calls).toHaveLength(1);
    });

    // Only counters are logged: no ids, emails or tokens.
    expect(calls[0]?.bindings).toEqual({
      sessionsDeleted: 1,
      jobsExpired: 0,
      jobsDeleted: 0,
    });
    await expect(prisma.session.findUnique({ where: { id: expired.id } })).resolves.toBeNull();

    const afterStop = await makeSession(prisma, {
      userId: owner.id,
      expiresAt: new Date(NOW.getTime() - MINUTE_MS),
    });

    // Longer than several intervals: if stop() failed, the session would go.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(calls).toHaveLength(1);
    await expect(
      prisma.session.findUnique({ where: { id: afterStop.id } }),
    ).resolves.not.toBeNull();
    // `stop()` is idempotent.
    expect(() => stop?.()).not.toThrow();
  });

  it('exposes the documented interval and retention', () => {
    expect(CLEANUP_INTERVAL_MS).toBe(15 * MINUTE_MS);
    expect(EXPIRED_JOB_RETENTION_MS).toBe(24 * HOUR_MS);
  });
});
