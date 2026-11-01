import { pathToFileURL } from 'node:url';

import { resolveRequiredDatabaseUrl } from '../src/db-url.ts';
import { disconnectPrisma, getPrismaClient } from '../src/db.ts';
import type { PrismaClient } from '../src/generated/prisma/client.ts';

/**
 * Deterministic, idempotent development seed.
 *
 * Every record uses a fixed id, fixed timestamps and an upsert, so running the
 * seed twice keeps identical rows, values and counts. There is no global
 * `deleteMany`.
 */

/**
 * Deliberately fake credential placeholder.
 *
 * It is not a valid argon2id hash and must never authenticate anyone. F15
 * replaces seed/dev credentials with real hashing; until then, sign-in cannot
 * succeed with this value.
 */
const SEED_PASSWORD_HASH = 'seed-placeholder-not-a-valid-password-hash';

/**
 * Fixed timestamp for every seeded row. `@updatedAt` fields are set
 * explicitly in both `create` and `update` so repeated seeds are byte-for-byte
 * stable.
 */
const SEED_TIMESTAMP = new Date('2025-01-15T09:00:00.000Z');

/** Far-future invitation expiry so the fixture never looks accidentally expired. */
const SEED_INVITATION_EXPIRES_AT = new Date('2030-01-01T00:00:00.000Z');

/**
 * Activity fed chronology: one fixed event per hour starting at
 * `SEED_TIMESTAMP`, so the feed has a coherent order independent of each
 * photo's `takenAt`.
 */
const SEED_ACTIVITY_STEP_MS = 60 * 60 * 1000;

function seedActivityTimestamp(step: number): Date {
  return new Date(SEED_TIMESTAMP.getTime() + step * SEED_ACTIVITY_STEP_MS);
}

const DEFAULT_CIRCLE_SETTINGS = {
  membersCanCreateAlbums: true,
  membersCanUpload: true,
  membersCanDownload: true,
  membersCanTag: true,
} as const;

/** Read-only circle: members cannot create, upload, download or tag. */
const READ_ONLY_CIRCLE_SETTINGS = {
  membersCanCreateAlbums: false,
  membersCanUpload: false,
  membersCanDownload: false,
  membersCanTag: false,
} as const;

const USER_LUCIA_ID = 'seed_user_lucia';
const USER_MATEO_ID = 'seed_user_mateo';

const CIRCLE_FAMILY_ID = 'seed_circle_family';
const CIRCLE_TRIP_ID = 'seed_circle_trip';

const ALBUM_COAST_ID = 'seed_album_coast';
const ALBUM_LISBON_ID = 'seed_album_lisbon';

interface SeedSummary {
  users: number;
  circles: number;
  memberships: number;
  albums: number;
  photos: number;
  tags: number;
  invitations: number;
  activities: number;
}

interface SeedPhotoInput {
  id: string;
  circleId: string;
  albumId: string;
  uploaderId: string;
  clientUploadId: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  takenAt: Date;
  placeName: string;
  description: string;
}

function photoKeys(circleId: string, photoId: string, extension: string) {
  const base = `circles/${circleId}/photos/${photoId}`;

  return {
    originalKey: `${base}/original.${extension}`,
    displayKey: `${base}/display.webp`,
    thumbKey: `${base}/thumb.webp`,
  };
}

const PHOTOS: readonly SeedPhotoInput[] = [
  {
    id: 'seed_photo_coast_01',
    circleId: CIRCLE_FAMILY_ID,
    albumId: ALBUM_COAST_ID,
    uploaderId: USER_LUCIA_ID,
    clientUploadId: 'seed-upload-coast-01',
    mimeType: 'image/jpeg',
    size: 3_481_920,
    width: 4032,
    height: 3024,
    takenAt: new Date('2024-08-12T10:24:00.000Z'),
    placeName: 'Cadaqués, Girona',
    description: 'Primera mañana en la cala.',
  },
  {
    id: 'seed_photo_coast_02',
    circleId: CIRCLE_FAMILY_ID,
    albumId: ALBUM_COAST_ID,
    uploaderId: USER_MATEO_ID,
    clientUploadId: 'seed-upload-coast-02',
    mimeType: 'image/jpeg',
    size: 2_915_640,
    width: 4032,
    height: 3024,
    takenAt: new Date('2024-08-13T17:05:00.000Z'),
    placeName: 'Cadaqués, Girona',
    description: 'Tarde de juegos en el espigón.',
  },
  {
    id: 'seed_photo_coast_03',
    circleId: CIRCLE_FAMILY_ID,
    albumId: ALBUM_COAST_ID,
    uploaderId: USER_LUCIA_ID,
    clientUploadId: 'seed-upload-coast-03',
    mimeType: 'image/png',
    size: 4_102_400,
    width: 3000,
    height: 2000,
    takenAt: new Date('2024-08-14T20:41:00.000Z'),
    placeName: 'Cadaqués, Girona',
    description: 'Cena al aire libre.',
  },
  {
    id: 'seed_photo_lisbon_01',
    circleId: CIRCLE_TRIP_ID,
    albumId: ALBUM_LISBON_ID,
    uploaderId: USER_LUCIA_ID,
    clientUploadId: 'seed-upload-lisbon-01',
    mimeType: 'image/webp',
    size: 1_248_576,
    width: 2400,
    height: 1600,
    takenAt: new Date('2025-04-03T08:12:00.000Z'),
    placeName: 'Lisboa, Portugal',
    description: 'Tranvía 28 al amanecer.',
  },
  {
    id: 'seed_photo_lisbon_02',
    circleId: CIRCLE_TRIP_ID,
    albumId: ALBUM_LISBON_ID,
    uploaderId: USER_LUCIA_ID,
    clientUploadId: 'seed-upload-lisbon-02',
    mimeType: 'image/jpeg',
    size: 3_774_464,
    width: 4032,
    height: 3024,
    takenAt: new Date('2025-04-04T12:30:00.000Z'),
    placeName: 'Belém, Lisboa',
    description: 'Pasteles de nata antes de volver.',
  },
  {
    id: 'seed_photo_lisbon_03',
    circleId: CIRCLE_TRIP_ID,
    albumId: ALBUM_LISBON_ID,
    uploaderId: USER_LUCIA_ID,
    clientUploadId: 'seed-upload-lisbon-03',
    mimeType: 'image/jpeg',
    size: 2_621_440,
    width: 3024,
    height: 4032,
    takenAt: new Date('2025-04-05T18:55:00.000Z'),
    placeName: 'Alfama, Lisboa',
    description: 'Azulejos del barrio alto.',
  },
];

/** Inserts or updates the deterministic seed data and returns seed-only counts. */
export async function seedDatabase(prisma: PrismaClient): Promise<SeedSummary> {
  await prisma.user.upsert({
    where: { id: USER_LUCIA_ID },
    update: {
      name: 'Lucía Ferrer',
      email: 'lucia@memora.test',
      passwordHash: SEED_PASSWORD_HASH,
      themePreference: 'system',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: USER_LUCIA_ID,
      name: 'Lucía Ferrer',
      email: 'lucia@memora.test',
      passwordHash: SEED_PASSWORD_HASH,
      themePreference: 'system',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.user.upsert({
    where: { id: USER_MATEO_ID },
    update: {
      name: 'Mateo Ríos',
      email: 'mateo@memora.test',
      passwordHash: SEED_PASSWORD_HASH,
      themePreference: 'dark',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: USER_MATEO_ID,
      name: 'Mateo Ríos',
      email: 'mateo@memora.test',
      passwordHash: SEED_PASSWORD_HASH,
      themePreference: 'dark',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.circle.upsert({
    where: { id: CIRCLE_FAMILY_ID },
    update: {
      ownerId: USER_LUCIA_ID,
      name: 'Familia Ferrer',
      description: 'Recuerdos de casa, vacaciones y celebraciones.',
      settings: DEFAULT_CIRCLE_SETTINGS,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: CIRCLE_FAMILY_ID,
      ownerId: USER_LUCIA_ID,
      name: 'Familia Ferrer',
      description: 'Recuerdos de casa, vacaciones y celebraciones.',
      settings: DEFAULT_CIRCLE_SETTINGS,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.circle.upsert({
    where: { id: CIRCLE_TRIP_ID },
    update: {
      ownerId: USER_LUCIA_ID,
      name: 'Viaje a Lisboa',
      description: 'Círculo de solo lectura para invitados.',
      settings: READ_ONLY_CIRCLE_SETTINGS,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: CIRCLE_TRIP_ID,
      ownerId: USER_LUCIA_ID,
      name: 'Viaje a Lisboa',
      description: 'Círculo de solo lectura para invitados.',
      settings: READ_ONLY_CIRCLE_SETTINGS,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.membership.upsert({
    where: { circleId_userId: { circleId: CIRCLE_FAMILY_ID, userId: USER_LUCIA_ID } },
    update: { role: 'owner', joinedAt: SEED_TIMESTAMP },
    create: {
      id: 'seed_membership_family_lucia',
      circleId: CIRCLE_FAMILY_ID,
      userId: USER_LUCIA_ID,
      role: 'owner',
      joinedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.membership.upsert({
    where: { circleId_userId: { circleId: CIRCLE_FAMILY_ID, userId: USER_MATEO_ID } },
    update: { role: 'member', joinedAt: SEED_TIMESTAMP },
    create: {
      id: 'seed_membership_family_mateo',
      circleId: CIRCLE_FAMILY_ID,
      userId: USER_MATEO_ID,
      role: 'member',
      joinedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.membership.upsert({
    where: { circleId_userId: { circleId: CIRCLE_TRIP_ID, userId: USER_LUCIA_ID } },
    update: { role: 'owner', joinedAt: SEED_TIMESTAMP },
    create: {
      id: 'seed_membership_trip_lucia',
      circleId: CIRCLE_TRIP_ID,
      userId: USER_LUCIA_ID,
      role: 'owner',
      joinedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.membership.upsert({
    where: { circleId_userId: { circleId: CIRCLE_TRIP_ID, userId: USER_MATEO_ID } },
    update: { role: 'member', joinedAt: SEED_TIMESTAMP },
    create: {
      id: 'seed_membership_trip_mateo',
      circleId: CIRCLE_TRIP_ID,
      userId: USER_MATEO_ID,
      role: 'member',
      joinedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.album.upsert({
    where: { id: ALBUM_COAST_ID },
    update: {
      circleId: CIRCLE_FAMILY_ID,
      title: 'Verano en la costa',
      description: 'Días de mar en Cadaqués.',
      date: new Date('2024-08-12T00:00:00.000Z'),
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: ALBUM_COAST_ID,
      circleId: CIRCLE_FAMILY_ID,
      title: 'Verano en la costa',
      description: 'Días de mar en Cadaqués.',
      date: new Date('2024-08-12T00:00:00.000Z'),
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  await prisma.album.upsert({
    where: { id: ALBUM_LISBON_ID },
    update: {
      circleId: CIRCLE_TRIP_ID,
      title: 'Lisboa en primavera',
      description: 'Cuatro días de tranvías y azulejos.',
      date: new Date('2025-04-03T00:00:00.000Z'),
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    create: {
      id: ALBUM_LISBON_ID,
      circleId: CIRCLE_TRIP_ID,
      title: 'Lisboa en primavera',
      description: 'Cuatro días de tranvías y azulejos.',
      date: new Date('2025-04-03T00:00:00.000Z'),
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  });

  for (const photo of PHOTOS) {
    const extension =
      photo.mimeType === 'image/png' ? 'png' : photo.mimeType === 'image/webp' ? 'webp' : 'jpg';
    const keys = photoKeys(photo.circleId, photo.id, extension);

    const data = {
      circleId: photo.circleId,
      albumId: photo.albumId,
      uploaderId: photo.uploaderId,
      clientUploadId: photo.clientUploadId,
      originalKey: keys.originalKey,
      displayKey: keys.displayKey,
      thumbKey: keys.thumbKey,
      mimeType: photo.mimeType,
      size: photo.size,
      width: photo.width,
      height: photo.height,
      takenAt: photo.takenAt,
      placeName: photo.placeName,
      description: photo.description,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    } as const;

    await prisma.photo.upsert({
      where: { id: photo.id },
      update: data,
      create: { id: photo.id, ...data },
    });
  }

  await prisma.circle.update({
    where: { id: CIRCLE_FAMILY_ID },
    data: { coverPhotoId: 'seed_photo_coast_01', updatedAt: SEED_TIMESTAMP },
  });

  await prisma.circle.update({
    where: { id: CIRCLE_TRIP_ID },
    data: { coverPhotoId: 'seed_photo_lisbon_01', updatedAt: SEED_TIMESTAMP },
  });

  await prisma.album.update({
    where: { id: ALBUM_COAST_ID },
    data: { coverPhotoId: 'seed_photo_coast_01', updatedAt: SEED_TIMESTAMP },
  });

  await prisma.album.update({
    where: { id: ALBUM_LISBON_ID },
    data: { coverPhotoId: 'seed_photo_lisbon_01', updatedAt: SEED_TIMESTAMP },
  });

  // Tags only between members of the same circle: Lucía and Mateo belong to
  // the family circle, so both tags respect the membership invariant.
  await prisma.photoTag.upsert({
    where: { id: 'seed_tag_coast_01' },
    update: {
      photoId: 'seed_photo_coast_01',
      taggedUserId: USER_MATEO_ID,
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
    },
    create: {
      id: 'seed_tag_coast_01',
      photoId: 'seed_photo_coast_01',
      taggedUserId: USER_MATEO_ID,
      createdBy: USER_LUCIA_ID,
      createdAt: SEED_TIMESTAMP,
    },
  });

  await prisma.photoTag.upsert({
    where: { id: 'seed_tag_coast_02' },
    update: {
      photoId: 'seed_photo_coast_02',
      taggedUserId: USER_LUCIA_ID,
      createdBy: USER_MATEO_ID,
      createdAt: SEED_TIMESTAMP,
    },
    create: {
      id: 'seed_tag_coast_02',
      photoId: 'seed_photo_coast_02',
      taggedUserId: USER_LUCIA_ID,
      createdBy: USER_MATEO_ID,
      createdAt: SEED_TIMESTAMP,
    },
  });

  await prisma.invitation.upsert({
    where: { id: 'seed_invitation_family' },
    update: {
      circleId: CIRCLE_FAMILY_ID,
      tokenHash: 'seed-invitation-token-hash-not-a-real-token',
      createdBy: USER_LUCIA_ID,
      invitedEmail: 'prima@memora.test',
      expiresAt: SEED_INVITATION_EXPIRES_AT,
      createdAt: SEED_TIMESTAMP,
    },
    create: {
      id: 'seed_invitation_family',
      circleId: CIRCLE_FAMILY_ID,
      tokenHash: 'seed-invitation-token-hash-not-a-real-token',
      createdBy: USER_LUCIA_ID,
      invitedEmail: 'prima@memora.test',
      expiresAt: SEED_INVITATION_EXPIRES_AT,
      createdAt: SEED_TIMESTAMP,
    },
  });

  const activities = [
    {
      id: 'seed_activity_album_created',
      circleId: CIRCLE_FAMILY_ID,
      actorId: USER_LUCIA_ID,
      type: 'album_created' as const,
      albumId: ALBUM_COAST_ID,
      photoId: null,
      metadata: { title: 'Verano en la costa' },
      createdAt: seedActivityTimestamp(0),
    },
    {
      id: 'seed_activity_photo_uploaded',
      circleId: CIRCLE_FAMILY_ID,
      actorId: USER_LUCIA_ID,
      type: 'photo_uploaded' as const,
      albumId: ALBUM_COAST_ID,
      photoId: 'seed_photo_coast_01',
      metadata: { count: 1 },
      createdAt: seedActivityTimestamp(1),
    },
    {
      id: 'seed_activity_member_joined',
      circleId: CIRCLE_FAMILY_ID,
      actorId: USER_MATEO_ID,
      type: 'member_joined' as const,
      albumId: null,
      photoId: null,
      metadata: { role: 'member' },
      createdAt: seedActivityTimestamp(2),
    },
    {
      id: 'seed_activity_lisbon_photo',
      circleId: CIRCLE_TRIP_ID,
      actorId: USER_LUCIA_ID,
      type: 'photo_uploaded' as const,
      albumId: ALBUM_LISBON_ID,
      photoId: 'seed_photo_lisbon_01',
      metadata: { count: 1 },
      createdAt: seedActivityTimestamp(3),
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: activity,
      create: activity,
    });
  }

  const seedIds = { id: { startsWith: 'seed_' } };
  const [users, circles, memberships, albums, photos, tags, invitations, activitiesCount] =
    await Promise.all([
      prisma.user.count({ where: seedIds }),
      prisma.circle.count({ where: seedIds }),
      prisma.membership.count({ where: seedIds }),
      prisma.album.count({ where: seedIds }),
      prisma.photo.count({ where: seedIds }),
      prisma.photoTag.count({ where: seedIds }),
      prisma.invitation.count({ where: seedIds }),
      prisma.activity.count({ where: seedIds }),
    ]);

  return {
    users,
    circles,
    memberships,
    albums,
    photos,
    tags,
    invitations,
    activities: activitiesCount,
  };
}

async function run(): Promise<void> {
  const prisma = getPrismaClient(resolveRequiredDatabaseUrl());

  try {
    const summary = await seedDatabase(prisma);
    process.stdout.write(`Seed completed: ${JSON.stringify(summary)}\n`);
  } finally {
    await disconnectPrisma();
  }
}

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  void run().catch((error: unknown) => {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`Seed failed: ${message}\n`);
    process.exitCode = 1;
  });
}
