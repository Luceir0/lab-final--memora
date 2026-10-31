import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { seedDatabase } from '../prisma/seed.ts';
import { closeTestPrismaClient, getTestPrismaClient, hasDatabaseUrl, resetDb } from './test/db.ts';
import {
  makeActivity,
  makeAlbum,
  makeCircle,
  makeMembership,
  makePhoto,
  makeTag,
  makeUser,
} from './test/factories.ts';

const hasDatabase = hasDatabaseUrl();

/** Exact initial migration; the spike migration must not survive. */
const INITIAL_MIGRATION_NAME = '20261031224916_init';
const SEED_TIMESTAMP_ISO = '2025-01-15T09:00:00.000Z';

/**
 * Runs only when `DATABASE_URL` points to a migrated disposable test database.
 * The helpers reject any database whose name does not end in `_test`, so CI
 * without Postgres skips instead of failing.
 */
describe.skipIf(!hasDatabase)('database model integration', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeTestPrismaClient();
  });

  it('applies exactly the initial migration with timestamptz columns and activity indexes', async () => {
    const prisma = getTestPrismaClient();

    const migrations = await prisma.$queryRaw<
      { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
    >`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at ASC
    `;
    const migrationNames = migrations.map((migration) => migration.migration_name);
    expect(migrationNames).toContain(INITIAL_MIGRATION_NAME);
    expect(migrationNames.some((name) => name.includes('spike'))).toBe(false);

    const initialMigration = migrations.find(
      (migration) => migration.migration_name === INITIAL_MIGRATION_NAME,
    );
    expect(initialMigration?.finished_at).not.toBeNull();
    expect(initialMigration?.rolled_back_at).toBeNull();
    expect(
      migrations.every(
        (migration) => migration.finished_at !== null && migration.rolled_back_at === null,
      ),
    ).toBe(true);

    const dateColumns = await prisma.$queryRaw<
      {
        table_name: string;
        column_name: string;
        data_type: string;
        datetime_precision: number | null;
      }[]
    >`
      SELECT table_name, column_name, data_type, datetime_precision
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'timestamp with time zone'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name, column_name
    `;
    expect(dateColumns.every((column) => column.data_type === 'timestamp with time zone')).toBe(
      true,
    );
    expect(dateColumns.every((column) => column.datetime_precision === 3)).toBe(true);

    const expectedDateColumns = [
      'Activity.createdAt',
      'Album.createdAt',
      'Album.date',
      'Album.updatedAt',
      'Circle.createdAt',
      'Circle.updatedAt',
      'DownloadJob.completedAt',
      'DownloadJob.createdAt',
      'DownloadJob.expiresAt',
      'Invitation.acceptedAt',
      'Invitation.createdAt',
      'Invitation.expiresAt',
      'Invitation.revokedAt',
      'Membership.joinedAt',
      'Photo.createdAt',
      'Photo.takenAt',
      'Photo.updatedAt',
      'PhotoTag.createdAt',
      'Session.createdAt',
      'Session.expiresAt',
      'Session.lastUsedAt',
      'User.createdAt',
      'User.updatedAt',
    ].sort();
    expect(
      dateColumns.map((column) => `${column.table_name}.${column.column_name}`).sort(),
    ).toEqual(expectedDateColumns);

    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Activity'
    `;
    const indexNames = indexes.map((index) => index.indexname);
    expect(indexNames).toEqual(
      expect.arrayContaining(['Activity_circleId_createdAt_idx', 'Activity_actorId_createdAt_idx']),
    );

    const tagIndexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'PhotoTag'
    `;
    expect(tagIndexes.map((index) => index.indexname)).toContain(
      'PhotoTag_taggedUserId_photoId_idx',
    );
  });

  it('rejects duplicate email, membership, photo upload id and tag', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const member = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });

    await expect(makeUser(prisma, { email: owner.email })).rejects.toMatchObject({ code: 'P2002' });

    await makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'member' });
    await expect(
      makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'owner' }),
    ).rejects.toMatchObject({ code: 'P2002' });

    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
      clientUploadId: 'duplicate-upload',
    });
    await expect(
      makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        clientUploadId: 'duplicate-upload',
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: member.id,
      clientUploadId: 'tag-target',
    });
    await makeTag(prisma, { photoId: photo.id, taggedUserId: member.id, createdBy: owner.id });
    await expect(
      makeTag(prisma, { photoId: photo.id, taggedUserId: member.id, createdBy: owner.id }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('deletes every circle child when the circle is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const member = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    await makeMembership(prisma, { circleId: circle.id, userId: owner.id, role: 'owner' });
    await makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'member' });
    await prisma.invitation.create({
      data: {
        circleId: circle.id,
        tokenHash: 'test-invitation-hash',
        createdBy: owner.id,
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });
    await prisma.downloadJob.create({
      data: {
        circleId: circle.id,
        albumId: album.id,
        requestedBy: owner.id,
        kind: 'album',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });
    await makeTag(prisma, { photoId: photo.id, taggedUserId: member.id, createdBy: owner.id });
    await makeActivity(prisma, {
      circleId: circle.id,
      actorId: owner.id,
      type: 'photo_uploaded',
      albumId: album.id,
      photoId: photo.id,
    });

    await prisma.circle.delete({ where: { id: circle.id } });

    expect(await prisma.circle.count()).toBe(0);
    expect(await prisma.membership.count()).toBe(0);
    expect(await prisma.invitation.count()).toBe(0);
    expect(await prisma.album.count()).toBe(0);
    expect(await prisma.photo.count()).toBe(0);
    expect(await prisma.photoTag.count()).toBe(0);
    expect(await prisma.downloadJob.count()).toBe(0);
    expect(await prisma.activity.count()).toBe(0);
    await expect(prisma.user.count()).resolves.toBe(2);
  });

  it('keeps activity history but drops tags when a photo is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const member = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });
    await makeTag(prisma, { photoId: photo.id, taggedUserId: member.id, createdBy: owner.id });
    const activity = await makeActivity(prisma, {
      circleId: circle.id,
      actorId: owner.id,
      type: 'photo_uploaded',
      albumId: album.id,
      photoId: photo.id,
    });

    await prisma.photo.delete({ where: { id: photo.id } });

    expect(await prisma.photoTag.count()).toBe(0);
    const kept = await prisma.activity.findUnique({ where: { id: activity.id } });
    expect(kept).not.toBeNull();
    expect(kept?.photoId).toBeNull();
    expect(kept?.albumId).toBe(album.id);
  });

  it('deletes album photos when the album is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });

    for (const clientUploadId of ['album-photo-1', 'album-photo-2']) {
      await makePhoto(prisma, {
        circleId: circle.id,
        albumId: album.id,
        uploaderId: owner.id,
        clientUploadId,
      });
    }

    await prisma.album.delete({ where: { id: album.id } });

    expect(await prisma.photo.count()).toBe(0);
    expect(await prisma.circle.count()).toBe(1);
  });

  it('sets circle and album covers to null when the cover photo is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    await prisma.circle.update({ where: { id: circle.id }, data: { coverPhotoId: photo.id } });
    await prisma.album.update({ where: { id: album.id }, data: { coverPhotoId: photo.id } });

    await prisma.photo.delete({ where: { id: photo.id } });

    await expect(prisma.circle.findUnique({ where: { id: circle.id } })).resolves.toMatchObject({
      coverPhotoId: null,
    });
    await expect(prisma.album.findUnique({ where: { id: album.id } })).resolves.toMatchObject({
      coverPhotoId: null,
    });
  });

  it('sets DownloadJob.albumId to null when the album is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const job = await prisma.downloadJob.create({
      data: {
        circleId: circle.id,
        albumId: album.id,
        requestedBy: owner.id,
        kind: 'album',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });

    await prisma.album.delete({ where: { id: album.id } });

    await expect(prisma.downloadJob.findUnique({ where: { id: job.id } })).resolves.toMatchObject({
      albumId: null,
    });
  });

  it('sets Invitation.acceptedBy to null when the accepting user is removed', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const acceptor = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    const invitation = await prisma.invitation.create({
      data: {
        circleId: circle.id,
        tokenHash: 'accepted-invitation-hash',
        createdBy: owner.id,
        acceptedBy: acceptor.id,
        acceptedAt: new Date('2025-02-01T00:00:00.000Z'),
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });

    await prisma.user.delete({ where: { id: acceptor.id } });

    await expect(
      prisma.invitation.findUnique({ where: { id: invitation.id } }),
    ).resolves.toMatchObject({
      acceptedBy: null,
    });
  });

  it('TODO(F23/F25): the database allows Photo.circleId to differ from Album.circleId', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const albumCircle = await makeCircle(prisma, { ownerId: owner.id });
    const otherCircle = await makeCircle(prisma, { ownerId: owner.id });
    const album = await makeAlbum(prisma, { circleId: albumCircle.id, createdBy: owner.id });

    const photo = await makePhoto(prisma, {
      circleId: otherCircle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });

    // There is no composite FK (circleId, albumId) -> Album; the service layer
    // must enforce the invariant on upload and album moves.
    expect(photo.circleId).toBe(otherCircle.id);
    expect(photo.albumId).toBe(album.id);
  });

  it('TODO(F21): expelling a member leaves PhotoTag rows until F21 deletes them', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    const member = await makeUser(prisma);
    const circle = await makeCircle(prisma, { ownerId: owner.id });
    await makeMembership(prisma, { circleId: circle.id, userId: member.id, role: 'member' });
    const album = await makeAlbum(prisma, { circleId: circle.id, createdBy: owner.id });
    const photo = await makePhoto(prisma, {
      circleId: circle.id,
      albumId: album.id,
      uploaderId: owner.id,
    });
    const tag = await makeTag(prisma, {
      photoId: photo.id,
      taggedUserId: member.id,
      createdBy: owner.id,
    });

    await prisma.membership.delete({
      where: { circleId_userId: { circleId: circle.id, userId: member.id } },
    });

    // Documented gap: deleting a Membership does not cascade to PhotoTag.
    // F21 must delete the tags in the same transaction as the expulsion.
    await expect(prisma.photoTag.findUnique({ where: { id: tag.id } })).resolves.not.toBeNull();
  });

  it('runs the seed twice with identical rows, timestamps and counts', async () => {
    const prisma = getTestPrismaClient();

    const first = await seedDatabase(prisma);
    const firstSnapshot = await readSeedSnapshot(prisma);

    const second = await seedDatabase(prisma);
    const secondSnapshot = await readSeedSnapshot(prisma);

    expect(second).toEqual(first);
    expect(first).toEqual({
      users: 2,
      circles: 2,
      memberships: 4,
      albums: 2,
      photos: 6,
      tags: 2,
      invitations: 1,
      activities: 4,
    });
    expect(secondSnapshot).toEqual(firstSnapshot);

    const isSeedTimestamp = (value: Date): boolean => value.toISOString() === SEED_TIMESTAMP_ISO;
    expect(
      firstSnapshot.users.every(
        (user) => isSeedTimestamp(user.createdAt) && isSeedTimestamp(user.updatedAt),
      ),
    ).toBe(true);
    expect(
      firstSnapshot.circles.every(
        (circle) => isSeedTimestamp(circle.createdAt) && isSeedTimestamp(circle.updatedAt),
      ),
    ).toBe(true);
    expect(
      firstSnapshot.albums.every(
        (album) => isSeedTimestamp(album.createdAt) && isSeedTimestamp(album.updatedAt),
      ),
    ).toBe(true);
    expect(
      firstSnapshot.photos.every(
        (photo) => isSeedTimestamp(photo.createdAt) && isSeedTimestamp(photo.updatedAt),
      ),
    ).toBe(true);
    expect(firstSnapshot.tags.every((tag) => isSeedTimestamp(tag.createdAt))).toBe(true);
    expect(
      firstSnapshot.memberships.every((membership) => isSeedTimestamp(membership.joinedAt)),
    ).toBe(true);
    expect(
      firstSnapshot.invitations.every((invitation) => isSeedTimestamp(invitation.createdAt)),
    ).toBe(true);
    expect(
      firstSnapshot.activities.map((activity) => activity.createdAt.toISOString()).sort(),
    ).toEqual([
      '2025-01-15T09:00:00.000Z',
      '2025-01-15T10:00:00.000Z',
      '2025-01-15T11:00:00.000Z',
      '2025-01-15T12:00:00.000Z',
    ]);

    const restrictedCircle = firstSnapshot.circles.find(
      (circle) => circle.id === 'seed_circle_trip',
    );
    expect(restrictedCircle?.settings).toEqual({
      membersCanCreateAlbums: false,
      membersCanUpload: false,
      membersCanDownload: false,
      membersCanTag: false,
    });

    const tags = firstSnapshot.tags;
    expect(tags).toHaveLength(2);
    const memberIds = new Set(
      firstSnapshot.memberships
        .filter((membership) => membership.circleId === 'seed_circle_family')
        .map((membership) => membership.userId),
    );
    expect(
      tags.every((tag) => memberIds.has(tag.taggedUserId) && memberIds.has(tag.createdBy)),
    ).toBe(true);
  });

  it('produces identical rows when seeding two fresh databases', async () => {
    const prisma = getTestPrismaClient();

    await resetDb(prisma);
    const firstSummary = await seedDatabase(prisma);
    const firstSnapshot = await readSeedSnapshot(prisma);

    await resetDb(prisma);
    const secondSummary = await seedDatabase(prisma);
    const secondSnapshot = await readSeedSnapshot(prisma);

    expect(secondSummary).toEqual(firstSummary);
    expect(secondSnapshot).toEqual(firstSnapshot);
  });

  it('resetDb removes every model row', async () => {
    const prisma = getTestPrismaClient();
    const owner = await makeUser(prisma);
    await makeCircle(prisma, { ownerId: owner.id });

    await resetDb(prisma);

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.circle.count()).toBe(0);
  });
});

/** Reads every seeded table with a stable order for deep comparison. */
async function readSeedSnapshot(prisma: ReturnType<typeof getTestPrismaClient>) {
  const [users, circles, memberships, albums, photos, tags, invitations, activities] =
    await Promise.all([
      prisma.user.findMany({ orderBy: { id: 'asc' } }),
      prisma.circle.findMany({ orderBy: { id: 'asc' } }),
      prisma.membership.findMany({ orderBy: { id: 'asc' } }),
      prisma.album.findMany({ orderBy: { id: 'asc' } }),
      prisma.photo.findMany({ orderBy: { id: 'asc' } }),
      prisma.photoTag.findMany({ orderBy: { id: 'asc' } }),
      prisma.invitation.findMany({ orderBy: { id: 'asc' } }),
      prisma.activity.findMany({ orderBy: { id: 'asc' } }),
    ]);

  return { users, circles, memberships, albums, photos, tags, invitations, activities };
}
