import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

import { ApiError } from '../errors.ts';

/** Per-file limit from `docs/03-architecture/uploads.md`. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Fields allowed in one upload: `file`, `clientUploadId`, `takenAt`, `description`. */
export const MAX_UPLOAD_FIELDS = 10;

/** Parts = fields + files; one file per request plus a few text fields. */
export const MAX_UPLOAD_PARTS = 12;

export const MAX_UPLOAD_FIELD_NAME_BYTES = 100;

const BOUNDARY_PATTERN = /;\s*boundary=(?:"[^"]+"|[^;\s]+)/i;

/**
 * Multipart requests without a boundary make busboy throw a plain `Error` with
 * no status, which would become a 500. Rejecting the header first keeps it a
 * client error and avoids relying on busboy's wording.
 */
function hasMultipartBoundary(contentType: string): boolean {
  return BOUNDARY_PATTERN.test(contentType);
}

/**
 * Multipart streaming. MIME, magic bytes and pixel limits are enforced by the
 * upload module (F25); this registration sets transport limits and rejects
 * malformed multipart headers before parsing.
 */
export async function registerMultipart(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request) => {
    const contentType = request.headers['content-type'];

    if (
      typeof contentType === 'string' &&
      contentType.toLowerCase().startsWith('multipart/form-data') &&
      !hasMultipartBoundary(contentType)
    ) {
      throw new ApiError('UNSUPPORTED_MEDIA_TYPE', {
        message: 'La petición multipart no incluye boundary.',
      });
    }
  });

  await app.register(multipart, {
    attachFieldsToBody: false,
    throwFileSizeLimit: true,
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
      fields: MAX_UPLOAD_FIELDS,
      parts: MAX_UPLOAD_PARTS,
      fieldNameSize: MAX_UPLOAD_FIELD_NAME_BYTES,
    },
  });
}
