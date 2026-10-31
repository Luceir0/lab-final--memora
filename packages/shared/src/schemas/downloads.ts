import { z } from 'zod';

import { albumParamsSchema } from './albums.js';
import { idSchema } from './common.js';
import { downloadJobDtoSchema } from './dto.js';
import { photoParamsSchema } from './photos.js';

/** Maximum number of photos in a single download job. */
export const MAX_DOWNLOAD_PHOTOS = 500;

/** Maximum size of a ZIP produced by one download job (2 GB). */
export const MAX_DOWNLOAD_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * `POST /albums/:albumId/downloads`. Omitting `photoIds` downloads the whole
 * album; sending it downloads that selection only.
 */
export const createDownloadRequestSchema = z.object({
  photoIds: z
    .array(idSchema)
    .min(1, 'Selecciona al menos una foto.')
    .max(MAX_DOWNLOAD_PHOTOS, `No se pueden descargar más de ${MAX_DOWNLOAD_PHOTOS} fotos.`)
    .optional(),
});

export type CreateDownloadRequest = z.infer<typeof createDownloadRequestSchema>;

/** Re-exported for routers that mount download creation under an album. */
export const createDownloadParamsSchema = albumParamsSchema;

export type CreateDownloadParams = z.infer<typeof createDownloadParamsSchema>;

/** `POST /albums/:albumId/downloads` → 202 with the queued job. */
export const createDownloadResponseSchema = downloadJobDtoSchema;

export type CreateDownloadResponse = z.infer<typeof createDownloadResponseSchema>;

/** `:jobId` route param. */
export const downloadJobParamsSchema = z.object({
  jobId: idSchema,
});

export type DownloadJobParams = z.infer<typeof downloadJobParamsSchema>;

/** `GET /downloads/:jobId`. */
export const downloadJobResponseSchema = downloadJobDtoSchema;

export type DownloadJobResponse = z.infer<typeof downloadJobResponseSchema>;

/**
 * `GET /photos/:photoId/download` responds with the original as an attachment
 * and requires `membersCanDownload`, so it has no JSON response schema either.
 */
export const downloadPhotoParamsSchema = photoParamsSchema;

export type DownloadPhotoParams = z.infer<typeof downloadPhotoParamsSchema>;

/**
 * `GET /downloads/:jobId/file` responds with the ZIP as an attachment, so it
 * has no JSON response schema. It is only available while `status === 'ready'`.
 */
