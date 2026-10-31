import { z } from 'zod';

import { createPageSchema, pageQuerySchema } from '../pagination.js';
import { VALIDATION_MESSAGES } from '../validation-messages.js';
import { albumParamsSchema } from './albums.js';
import { emptyResponseSchema, idSchema, isoDateTimeSchema } from './common.js';
import { photoDtoSchema } from './dto.js';

export const MAX_PHOTO_DESCRIPTION_LENGTH = 1000;

/** Geocoded or manually typed place; no coordinates are ever accepted. */
export const MAX_PLACE_NAME_LENGTH = 200;

/** `:photoId` route param. */
export const photoParamsSchema = z.object({
  photoId: idSchema,
});

export type PhotoParams = z.infer<typeof photoParamsSchema>;

/** `GET /albums/:albumId/photos?cursor=&limit=&personId=`. */
export const albumPhotosQuerySchema = pageQuerySchema.extend({
  personId: idSchema.optional(),
});

export type AlbumPhotosQuery = z.infer<typeof albumPhotosQuerySchema>;

export const albumPhotosResponseSchema = createPageSchema(photoDtoSchema);

export type AlbumPhotosResponse = z.infer<typeof albumPhotosResponseSchema>;

/**
 * Text fields of the `multipart/form-data` upload request. The binary `file`
 * part is validated by the upload pipeline (magic bytes, size, pixels) because
 * it cannot be represented as JSON.
 */
export const uploadPhotoFieldsSchema = z.object({
  clientUploadId: z
    .string()
    .min(1, VALIDATION_MESSAGES.clientUploadIdRequired)
    .max(128, VALIDATION_MESSAGES.clientUploadIdTooLong),
  takenAt: isoDateTimeSchema.optional(),
  description: z
    .string()
    .max(MAX_PHOTO_DESCRIPTION_LENGTH, VALIDATION_MESSAGES.descriptionTooLong)
    .optional(),
});
export type UploadPhotoFields = z.infer<typeof uploadPhotoFieldsSchema>;

/** `POST /albums/:albumId/photos` → 201. */
export const uploadPhotoResponseSchema = photoDtoSchema;

export type UploadPhotoResponse = z.infer<typeof uploadPhotoResponseSchema>;

export const photoResponseSchema = photoDtoSchema;

export type PhotoResponse = z.infer<typeof photoResponseSchema>;

/** `PATCH /photos/:photoId`: description, date and place only. */
export const updatePhotoRequestSchema = z
  .object({
    description: z
      .string()
      .max(MAX_PHOTO_DESCRIPTION_LENGTH, VALIDATION_MESSAGES.descriptionTooLong)
      .nullable()
      .optional(),
    takenAt: isoDateTimeSchema.nullable().optional(),
    placeName: z
      .string()
      .max(MAX_PLACE_NAME_LENGTH, VALIDATION_MESSAGES.placeNameTooLong)
      .nullable()
      .optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Indica al menos un campo para actualizar.',
  });

export type UpdatePhotoRequest = z.infer<typeof updatePhotoRequestSchema>;

/** `DELETE /photos/:photoId` → 204. */
export const deletePhotoResponseSchema = emptyResponseSchema;

export type DeletePhotoResponse = z.infer<typeof deletePhotoResponseSchema>;

export const photoImageSizeSchema = z.enum(['thumb', 'display', 'original']);

export type PhotoImageSize = z.infer<typeof photoImageSizeSchema>;

/**
 * `GET /photos/:photoId/image?size=`. `original` requires `membersCanDownload`;
 * `thumb` and `display` are available to every circle member. The response is
 * binary, so it has no JSON schema.
 */
export const photoImageQuerySchema = z.object({
  size: photoImageSizeSchema.default('display'),
});

export type PhotoImageQuery = z.infer<typeof photoImageQuerySchema>;

/** `GET /circles/:circleId/members/:userId/photos`. */
export const personPhotosParamsSchema = z.object({
  circleId: idSchema,
  userId: idSchema,
});

export type PersonPhotosParams = z.infer<typeof personPhotosParamsSchema>;

export const personPhotosQuerySchema = pageQuerySchema;

export type PersonPhotosQuery = z.infer<typeof personPhotosQuerySchema>;

export const personPhotosResponseSchema = createPageSchema(photoDtoSchema);

export type PersonPhotosResponse = z.infer<typeof personPhotosResponseSchema>;

/** Re-exported for routers that mount photo upload under an album. */
export const uploadPhotoParamsSchema = albumParamsSchema;

export type UploadPhotoParams = z.infer<typeof uploadPhotoParamsSchema>;
