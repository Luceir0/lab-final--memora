import { z } from 'zod';

export const ROLES = ['owner', 'member'] as const;

export const roleSchema = z.enum(ROLES);

export type Role = (typeof ROLES)[number];

/**
 * Circle flags stored in `Circle.settings`. They only limit members; the owner
 * is never limited by them. There is no `membersCanInvite` flag by design.
 *
 * Strict on purpose: an unknown flag (for example `membersCanInvite`) is a
 * contract error, not something to silently drop.
 */
export const circleSettingsSchema = z.strictObject({
  membersCanCreateAlbums: z.boolean(),
  membersCanUpload: z.boolean(),
  membersCanDownload: z.boolean(),
  membersCanTag: z.boolean(),
});

export type CircleSettings = z.infer<typeof circleSettingsSchema>;

/** New circles start with every member capability enabled. Frozen. */
export const DEFAULT_CIRCLE_SETTINGS: Readonly<CircleSettings> = Object.freeze({
  membersCanCreateAlbums: true,
  membersCanUpload: true,
  membersCanDownload: true,
  membersCanTag: true,
});

/** Every action checked by `can()`; keep in sync with `auth.md`. */
export const PERMISSION_ACTIONS = [
  'circle.view',
  'circle.update',
  'circle.delete',
  'member.invite',
  'member.remove',
  'album.create',
  'album.update',
  'album.delete',
  'album.empty',
  'photo.upload',
  'photo.update',
  'photo.delete',
  'photo.tag',
  'photo.download',
] as const;

export const permissionActionSchema = z.enum(PERMISSION_ACTIONS);

export type Action = (typeof PERMISSION_ACTIONS)[number];

/** The authenticated user, with the role resolved for the circle in question. */
export interface PermissionActor {
  readonly id: string;
  readonly role: Role;
}

export interface PermissionCircle {
  readonly id: string;
  /** Authoritative owner of the circle; membership rows may lag behind. */
  readonly ownerId: string;
  readonly settings: CircleSettings;
}

/**
 * Minimal facts `can()` needs about the target resource. Callers must load the
 * resource on the server and pass it here; `can()` never queries anything.
 */
export type PermissionResource =
  | {
      readonly type: 'photo';
      readonly circleId: string;
      readonly uploaderId: string;
    }
  | {
      readonly type: 'album';
      readonly circleId: string;
      readonly createdById: string;
      readonly photosCount: number;
    };

/** Convenience bag for callers that resolve the three inputs together. */
export interface PermissionContext extends PermissionCircle {
  readonly actor: PermissionActor;
  readonly resource?: PermissionResource | undefined;
}

/**
 * Ownership is decided by id only. A user whose membership row says `owner`
 * but does not match `Circle.ownerId` must not be elevated (that would be a
 * cross-circle escalation).
 */
export function isCircleOwner(
  actor: PermissionActor | null | undefined,
  circle: PermissionCircle | null | undefined,
): boolean {
  if (actor === null || actor === undefined || circle === null || circle === undefined) {
    return false;
  }

  return actor.id === circle.ownerId;
}

/** Unreachable branch helper: keeps the switch exhaustive and fails closed. */
function denyUnreachable(action: never): false {
  void action;
  return false;
}

/**
 * Pure authorization check. It knows nothing about sessions, HTTP or the
 * database; the caller resolves the actor, the circle and the resource first.
 *
 * Rules (see `docs/03-architecture/auth.md`):
 * - The owner can do everything, except deleting an album that still has photos.
 * - Inviting, removing members, editing/deleting the circle: owner only.
 * - Creating albums and uploading photos: owner, or members while the matching
 *   `Circle.settings` flag is enabled.
 * - Editing an album: owner, or its creator while members can create albums.
 * - Emptying an album: owner only, regardless of how many photos it has.
 * - Editing or deleting a photo: owner, or the uploader. No other member.
 * - Tagging and downloading: owner, or members while the flag is enabled.
 * - Deleting an album: owner only, and only when it has no photos.
 * - `original` images reuse `photo.download`.
 *
 * Unknown actions and resources from another circle always return `false`.
 */
export function can(
  actor: PermissionActor | null | undefined,
  action: Action,
  circle: PermissionCircle | null | undefined,
  resource?: PermissionResource | undefined,
): boolean {
  if (actor === null || actor === undefined || circle === null || circle === undefined) {
    return false;
  }

  // Runtime validation: `action` may come from an untyped payload. Unknown
  // actions fail closed for both owners and members.
  if (!permissionActionSchema.safeParse(action).success) {
    return false;
  }

  // A resource from another circle can only be reached through a bug or a
  // tampered id; it must never be authorized.
  if (resource !== undefined && resource.circleId !== circle.id) {
    return false;
  }

  if (isCircleOwner(actor, circle)) {
    if (action === 'album.delete') {
      return resource?.type === 'album' && resource.photosCount === 0;
    }

    return true;
  }

  switch (action) {
    case 'circle.view':
      // Reaching this point means an actor with a resolved membership.
      return true;
    case 'circle.update':
    case 'circle.delete':
    case 'member.invite':
    case 'member.remove':
    case 'album.delete':
    case 'album.empty':
      return false;
    case 'album.create':
      return circle.settings.membersCanCreateAlbums;
    case 'album.update':
      return (
        circle.settings.membersCanCreateAlbums &&
        resource?.type === 'album' &&
        resource.createdById === actor.id
      );
    case 'photo.upload':
      return circle.settings.membersCanUpload;
    case 'photo.update':
    case 'photo.delete':
      return resource?.type === 'photo' && resource.uploaderId === actor.id;
    case 'photo.tag':
      return circle.settings.membersCanTag;
    case 'photo.download':
      return circle.settings.membersCanDownload;
    default:
      return denyUnreachable(action);
  }
}
