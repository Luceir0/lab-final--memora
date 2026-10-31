import { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { VALIDATION_MESSAGES } from '../validation-messages.js';
import { circleParamsSchema } from './circles.js';
import { emptyResponseSchema, idSchema, isoDateTimeSchema } from './common.js';
import { albumDtoSchema } from './dto.js';

/** `:albumId` route param. */
export const albumParamsSchema = z.object({
  albumId: idSchema,
});

export type AlbumParams = z.infer<typeof albumParamsSchema>;

/** Params of `GET|POST /circles/:circleId/albums`. */
export const circleAlbumsParamsSchema = circleParamsSchema;

export type CircleAlbumsParams = z.infer<typeof circleAlbumsParamsSchema>;

export const albumTitleSchema = z
  .string()
  .trim()
  .min(1, 'El título es obligatorio.')
  .max(120, 'El título no puede superar los 120 caracteres.');

export const albumDescriptionSchema = z
  .string()
  .max(1000, VALIDATION_MESSAGES.descriptionTooLong)
  .nullable();

export const listAlbumsQuerySchema = pageQuerySchema;

export type ListAlbumsQuery = z.infer<typeof listAlbumsQuerySchema>;

export const listAlbumsResponseSchema = createPageSchema(albumDtoSchema);

export type ListAlbumsResponse = z.infer<typeof listAlbumsResponseSchema>;

export const createAlbumRequestSchema = z.object({
  title: albumTitleSchema,
  description: albumDescriptionSchema.optional(),
  date: isoDateTimeSchema.nullable().optional(),
});

export type CreateAlbumRequest = z.infer<typeof createAlbumRequestSchema>;

export const albumResponseSchema = albumDtoSchema;

export type AlbumResponse = z.infer<typeof albumResponseSchema>;

/** `PATCH /albums/:albumId`. */
export const updateAlbumRequestSchema = z
  .object({
    title: albumTitleSchema.optional(),
    description: albumDescriptionSchema.optional(),
    date: isoDateTimeSchema.nullable().optional(),
    coverPhotoId: idSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Indica al menos un campo para actualizar.',
  });

export type UpdateAlbumRequest = z.infer<typeof updateAlbumRequestSchema>;

/** `DELETE /albums/:albumId` → 204. Fails with `ALBUM_NOT_EMPTY` when needed. */
export const deleteAlbumResponseSchema = emptyResponseSchema;

export type DeleteAlbumResponse = z.infer<typeof deleteAlbumResponseSchema>;

/** `DELETE /albums/:albumId/photos` (empty the album). */
export const emptyAlbumResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative(),
});

export type EmptyAlbumResponse = z.infer<typeof emptyAlbumResponseSchema>;
