import type { Prisma, PrismaClient } from '../generated/prisma/client.ts';

/**
 * Typed, deterministic factories for database tests.
 *
 * Every factory generates a unique sequential id and accepts a partial
 * override. Callers pass the parent ids explicitly so tests stay readable and
 * no factory reaches outside its own row.
 */

let sequence = 0;

function nextSequence(): number {
  sequence += 1;

  return sequence;
}

const DEFAULT_PASSWORD_HASH = 'factory-placeholder-not-a-valid-password-hash';
const DEFAULT_SETTINGS = {
  membersCanCreateAlbums: true,
  membersCanUpload: true,
  membersCanDownload: true,
  membersCanTag: true,
} as const;
const DEFAULT_TAKEN_AT = new Date('2025-05-01T12:00:00.000Z');

export type UserOverrides = Partial<Prisma.UserUncheckedCreateInput>;
export type CircleOverrides = Partial<Prisma.CircleUncheckedCreateInput> &
  Pick<Prisma.CircleUncheckedCreateInput, 'ownerId'>;
export type MembershipOverrides = Partial<Prisma.MembershipUncheckedCreateInput> &
  Pick<Prisma.MembershipUncheckedCreateInput, 'circleId' | 'userId'>;
export type AlbumOverrides = Partial<Prisma.AlbumUncheckedCreateInput> &
  Pick<Prisma.AlbumUncheckedCreateInput, 'circleId' | 'createdBy'>;
export type PhotoOverrides = Partial<Prisma.PhotoUncheckedCreateInput> &
  Pick<Prisma.PhotoUncheckedCreateInput, 'circleId' | 'albumId' | 'uploaderId'>;
export type PhotoTagOverrides = Partial<Prisma.PhotoTagUncheckedCreateInput> &
  Pick<Prisma.PhotoTagUncheckedCreateInput, 'photoId' | 'taggedUserId' | 'createdBy'>;
export type ActivityOverrides = Partial<Prisma.ActivityUncheckedCreateInput> &
  Pick<Prisma.ActivityUncheckedCreateInput, 'circleId' | 'actorId'>;

export async function makeUser(prisma: PrismaClient, overrides: UserOverrides = {}) {
  const sequenceId = nextSequence();
  const defaults: Prisma.UserUncheckedCreateInput = {
    id: `test-user-${sequenceId}`,
    name: `Test User ${sequenceId}`,
    email: `test-user-${sequenceId}@memora.test`,
    passwordHash: DEFAULT_PASSWORD_HASH,
    themePreference: 'system',
  };

  return prisma.user.create({ data: { ...defaults, ...overrides } });
}

export async function makeCircle(prisma: PrismaClient, overrides: CircleOverrides) {
  const sequenceId = nextSequence();
  const defaults: Prisma.CircleUncheckedCreateInput = {
    id: `test-circle-${sequenceId}`,
    ownerId: overrides.ownerId,
    name: `Test Circle ${sequenceId}`,
    settings: DEFAULT_SETTINGS,
  };

  return prisma.circle.create({ data: { ...defaults, ...overrides } });
}

export async function makeMembership(prisma: PrismaClient, overrides: MembershipOverrides) {
  const sequenceId = nextSequence();
  const defaults: Prisma.MembershipUncheckedCreateInput = {
    id: `test-membership-${sequenceId}`,
    circleId: overrides.circleId,
    userId: overrides.userId,
    role: 'member',
  };

  return prisma.membership.create({ data: { ...defaults, ...overrides } });
}

export async function makeAlbum(prisma: PrismaClient, overrides: AlbumOverrides) {
  const sequenceId = nextSequence();
  const defaults: Prisma.AlbumUncheckedCreateInput = {
    id: `test-album-${sequenceId}`,
    circleId: overrides.circleId,
    createdBy: overrides.createdBy,
    title: `Test Album ${sequenceId}`,
  };

  return prisma.album.create({ data: { ...defaults, ...overrides } });
}

export async function makePhoto(prisma: PrismaClient, overrides: PhotoOverrides) {
  const sequenceId = nextSequence();
  const id = overrides.id ?? `test-photo-${sequenceId}`;
  const baseKey = `circles/${overrides.circleId}/photos/${id}`;
  const defaults: Prisma.PhotoUncheckedCreateInput = {
    id,
    circleId: overrides.circleId,
    albumId: overrides.albumId,
    uploaderId: overrides.uploaderId,
    clientUploadId: `test-upload-${sequenceId}`,
    originalKey: `${baseKey}/original.jpg`,
    displayKey: `${baseKey}/display.webp`,
    thumbKey: `${baseKey}/thumb.webp`,
    mimeType: 'image/jpeg',
    size: 1_234_567,
    width: 1600,
    height: 1200,
    takenAt: DEFAULT_TAKEN_AT,
    placeName: 'Madrid, España',
  };

  return prisma.photo.create({ data: { ...defaults, ...overrides } });
}

export async function makeTag(prisma: PrismaClient, overrides: PhotoTagOverrides) {
  const sequenceId = nextSequence();
  const defaults: Prisma.PhotoTagUncheckedCreateInput = {
    id: `test-tag-${sequenceId}`,
    photoId: overrides.photoId,
    taggedUserId: overrides.taggedUserId,
    createdBy: overrides.createdBy,
  };

  return prisma.photoTag.create({ data: { ...defaults, ...overrides } });
}

export async function makeActivity(prisma: PrismaClient, overrides: ActivityOverrides) {
  const sequenceId = nextSequence();
  const defaults: Prisma.ActivityUncheckedCreateInput = {
    id: `test-activity-${sequenceId}`,
    circleId: overrides.circleId,
    actorId: overrides.actorId,
    type: 'photo_uploaded',
  };

  return prisma.activity.create({ data: { ...defaults, ...overrides } });
}
