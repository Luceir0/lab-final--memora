import { z } from 'zod';

import { circleSettingsSchema, roleSchema } from '../permissions.js';
import {
  idSchema,
  imageMimeTypeSchema,
  isoDateTimeSchema,
  themePreferenceSchema,
} from './common.js';

/**
 * Public identity. Never includes email or any internal field; safe to embed in
 * member lists, tags, photo authors and activity.
 *
 * Response DTOs are intentionally lenient (no max length, no trimming): they
 * must serialise whatever is already persisted.
 */
export const userDtoSchema = z.object({
  id: idSchema,
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

export type UserDto = z.infer<typeof userDtoSchema>;

/** The authenticated user's own profile. */
export const currentUserDtoSchema = userDtoSchema.extend({
  email: z.email(),
  themePreference: themePreferenceSchema,
  createdAt: isoDateTimeSchema,
});

export type CurrentUserDto = z.infer<typeof currentUserDtoSchema>;

/** Enough to render a cover or a gallery cell without extra requests. */
export const photoSummarySchema = z.object({
  id: idSchema,
  thumbUrl: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type PhotoSummary = z.infer<typeof photoSummarySchema>;

/**
 * Public photo. Storage keys (`originalKey`, `displayKey`, `thumbKey`) and any
 * GPS coordinates are deliberately absent; only `placeName` is exposed.
 */
export const photoDtoSchema = z.object({
  id: idSchema,
  circleId: idSchema,
  albumId: idSchema,
  uploader: userDtoSchema,
  /**
   * Echoed from the upload request so the client can reconcile its queue after
   * a retry. Null for photos uploaded outside the queue.
   */
  clientUploadId: z.string().nullable(),
  description: z.string().nullable(),
  takenAt: isoDateTimeSchema.nullable(),
  placeName: z.string().nullable(),
  mimeType: imageMimeTypeSchema,
  size: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  thumbUrl: z.string().min(1),
  displayUrl: z.string().min(1),
  tags: z.array(userDtoSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type PhotoDto = z.infer<typeof photoDtoSchema>;

export const albumDtoSchema = z.object({
  id: idSchema,
  circleId: idSchema,
  title: z.string(),
  description: z.string().nullable(),
  date: isoDateTimeSchema.nullable(),
  coverPhoto: photoSummarySchema.nullable(),
  photosCount: z.number().int().nonnegative(),
  createdBy: userDtoSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type AlbumDto = z.infer<typeof albumDtoSchema>;

export const circleDtoSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().nullable(),
  settings: circleSettingsSchema,
  /** Role of the requesting user inside this circle. */
  role: roleSchema,
  coverPhoto: photoSummarySchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CircleDto = z.infer<typeof circleDtoSchema>;

export const circleStatsSchema = z.object({
  membersCount: z.number().int().nonnegative(),
  albumsCount: z.number().int().nonnegative(),
  photosCount: z.number().int().nonnegative(),
  storageBytes: z.number().int().nonnegative(),
  lastUploadAt: isoDateTimeSchema.nullable(),
});

export type CircleStats = z.infer<typeof circleStatsSchema>;

export const circleDetailDtoSchema = circleDtoSchema.extend({
  stats: circleStatsSchema,
});

export type CircleDetailDto = z.infer<typeof circleDetailDtoSchema>;

export const memberDtoSchema = z.object({
  user: userDtoSchema,
  role: roleSchema,
  joinedAt: isoDateTimeSchema,
});

export type MemberDto = z.infer<typeof memberDtoSchema>;

export const photoTagDtoSchema = z.object({
  id: idSchema,
  photoId: idSchema,
  user: userDtoSchema,
  createdAt: isoDateTimeSchema,
});

export type PhotoTagDto = z.infer<typeof photoTagDtoSchema>;

export const invitationStateSchema = z.enum(['valid', 'expired', 'revoked', 'already_member']);

export type InvitationState = z.infer<typeof invitationStateSchema>;

/** Invitation as listed for the owner. Never includes `tokenHash`. */
export const invitationDtoSchema = z.object({
  id: idSchema,
  circleId: idSchema,
  invitedEmail: z.email().nullable(),
  expiresAt: isoDateTimeSchema,
  revokedAt: isoDateTimeSchema.nullable(),
  acceptedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export type InvitationDto = z.infer<typeof invitationDtoSchema>;

/**
 * Response of `POST /circles/:circleId/invitations`. The raw token is returned
 * exactly once so the client can build and share the link.
 */
export const createdInvitationDtoSchema = invitationDtoSchema.extend({
  token: z.string().min(1),
});

export type CreatedInvitationDto = z.infer<typeof createdInvitationDtoSchema>;

/** Public preview before accepting. No members, albums or photos. */
export const invitationPreviewDtoSchema = z.object({
  circleName: z.string(),
  inviterName: z.string(),
  expiresAt: isoDateTimeSchema,
  state: invitationStateSchema,
});

export type InvitationPreviewDto = z.infer<typeof invitationPreviewDtoSchema>;

export const downloadKindSchema = z.enum(['album', 'selection']);

export type DownloadKind = z.infer<typeof downloadKindSchema>;

export const downloadStatusSchema = z.enum(['pending', 'processing', 'ready', 'error', 'expired']);

export type DownloadStatus = z.infer<typeof downloadStatusSchema>;

/**
 * Download job status. Never exposes the ZIP object key.
 *
 * `progress` is derived by the API (not persisted) and is `null` while the job
 * has not started or is already finished by other means.
 */
export const downloadJobDtoSchema = z.object({
  id: idSchema,
  kind: downloadKindSchema,
  status: downloadStatusSchema,
  albumId: idSchema.nullable(),
  progress: z.number().int().min(0).max(100).nullable(),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.nullable(),
  errorMessage: z.string().nullable(),
});

export type DownloadJobDto = z.infer<typeof downloadJobDtoSchema>;

export const activityTypeSchema = z.enum(['photo.uploaded', 'album.created', 'member.joined']);

export type ActivityType = z.infer<typeof activityTypeSchema>;

export const activityActorSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export type ActivityActor = z.infer<typeof activityActorSchema>;

export const activityAlbumRefSchema = z.object({
  id: idSchema,
  title: z.string(),
});

export type ActivityAlbumRef = z.infer<typeof activityAlbumRefSchema>;

/**
 * One activity entry. Uploads may be grouped per actor/album/interval, which is
 * why `count` is part of the contract.
 */
export const activityItemDtoSchema = z.object({
  id: idSchema,
  type: activityTypeSchema,
  actor: activityActorSchema,
  album: activityAlbumRefSchema.nullable(),
  count: z.number().int().min(1),
  createdAt: isoDateTimeSchema,
});

export type ActivityItemDto = z.infer<typeof activityItemDtoSchema>;
