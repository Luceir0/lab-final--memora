import { z } from 'zod';

import { pageQuerySchema } from '../pagination.js';
import { idSchema, isoDateTimeSchema } from './common.js';
import { photoDtoSchema, photoSummarySchema } from './dto.js';

/**
 * «Mis subidas» (`GET /me/uploads` and `GET /me/uploads/photos`).
 *
 * The summary groups the authenticated user's own visible photos by circle and
 * album. `preview` carries at most four `PhotoSummary` items, newest first, and
 * is decorative: the client must not paginate it.
 */

/** Maximum previews the summary includes per album. */
export const MY_UPLOADS_PREVIEW_LIMIT = 4;

export const myUploadsCircleRefSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export type MyUploadsCircleRef = z.infer<typeof myUploadsCircleRefSchema>;

export const myUploadsAlbumRefSchema = z.object({
  id: idSchema,
  title: z.string(),
});

export type MyUploadsAlbumRef = z.infer<typeof myUploadsAlbumRefSchema>;

/** One album («carpeta») with the requesting user's photos inside it. */
export const myUploadsAlbumGroupSchema = z.object({
  album: myUploadsAlbumRefSchema,
  photosCount: z.number().int().nonnegative(),
  /** Most recent `createdAt` among the user's photos in this album. */
  lastUploadAt: isoDateTimeSchema,
  preview: z.array(photoSummarySchema).max(MY_UPLOADS_PREVIEW_LIMIT),
});

export type MyUploadsAlbumGroup = z.infer<typeof myUploadsAlbumGroupSchema>;

/** One circle with at least one visible photo uploaded by the user. */
export const myUploadsCircleGroupSchema = z.object({
  circle: myUploadsCircleRefSchema,
  photosCount: z.number().int().nonnegative(),
  albums: z.array(myUploadsAlbumGroupSchema),
});

export type MyUploadsCircleGroup = z.infer<typeof myUploadsCircleGroupSchema>;

/**
 * `GET /me/uploads` → 200. `total` is the sum of every circle `photosCount`.
 * Circles and albums are ordered by their newest `lastUploadAt` descending,
 * with `id` ascending as the tie-break.
 */
export const myUploadsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  circles: z.array(myUploadsCircleGroupSchema),
});

export type MyUploadsSummary = z.infer<typeof myUploadsSummarySchema>;

/** `GET /me/uploads/photos?albumId=&cursor=&limit=`. */
export const myUploadsPhotosQuerySchema = pageQuerySchema.extend({
  albumId: idSchema,
});

export type MyUploadsPhotosQuery = z.infer<typeof myUploadsPhotosQuerySchema>;

/** Input shape before Zod applies the `limit` default. */
export type MyUploadsPhotosQueryInput = z.input<typeof myUploadsPhotosQuerySchema>;

/**
 * `GET /me/uploads/photos` → 200. Only the requesting user's photos of the
 * album, newest first; `total` counts all of them, not just the current page.
 */
export const myUploadsPhotosResponseSchema = z.object({
  items: z.array(photoDtoSchema),
  nextCursor: z.string().min(1).nullable(),
  total: z.number().int().nonnegative(),
});

export type MyUploadsPhotosResponse = z.infer<typeof myUploadsPhotosResponseSchema>;
