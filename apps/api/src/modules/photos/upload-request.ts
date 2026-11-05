import { uploadPhotoFieldsSchema, type UploadPhotoFields } from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import { ApiError } from '../../errors.ts';

const ALLOWED_FIELDS = new Set(['clientUploadId', 'takenAt', 'description']);

const ALLOWED_FIELD_LIST = [...ALLOWED_FIELDS].join(', ');

function fieldError(field: string, message: string): ApiError {
  return new ApiError('VALIDATION_ERROR', {
    details: [{ field, message }],
  });
}

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const code = (error as { readonly code?: unknown }).code;

  return typeof code === 'string' ? code : undefined;
}

function mapMultipartError(error: unknown): never {
  const code = readErrorCode(error);

  if (code === 'FST_REQ_FILE_TOO_LARGE') {
    throw new ApiError('FILE_TOO_LARGE');
  }

  if (code === 'FST_FILES_LIMIT') {
    throw fieldError('file', 'Solo se admite un archivo por petición.');
  }

  throw error;
}

function parseFields(raw: Readonly<Record<string, string>>): UploadPhotoFields {
  const parsed = uploadPhotoFieldsSchema.safeParse(raw);

  if (parsed.success) {
    return parsed.data;
  }

  throw new ApiError('VALIDATION_ERROR', {
    details: parsed.error.issues.map((issue) => ({
      ...(issue.path.length === 0 ? {} : { field: issue.path.join('.') }),
      message: issue.message,
    })),
  });
}

export interface UploadRequestData {
  readonly file: Buffer;
  readonly fields: UploadPhotoFields;
}

/**
 * Reads one multipart upload: exactly one `file` part plus the text fields
 * declared by `uploadPhotoFieldsSchema`.
 *
 * The part's declared MIME type is ignored; magic bytes are validated later.
 * Unknown, duplicated, empty or extra fields are `400 VALIDATION_ERROR`. The
 * multipart plugin's file-size error is translated to `413 FILE_TOO_LARGE` and
 * its files-limit error (one file per request) to `400`, matching the contract.
 */
export async function readUploadRequest(request: FastifyRequest): Promise<UploadRequestData> {
  const rawFields: Record<string, string> = {};
  const seenFields = new Set<string>();
  let file: Buffer | null = null;
  let fileParts = 0;

  try {
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        fileParts += 1;

        if (part.fieldname !== 'file') {
          throw fieldError(part.fieldname, 'Campo de archivo desconocido.');
        }

        if (fileParts > 1) {
          throw fieldError('file', 'Solo se admite un archivo por petición.');
        }

        file = await part.toBuffer();

        if (file.length === 0) {
          throw fieldError('file', 'El archivo está vacío.');
        }

        continue;
      }

      if (part.fieldname === 'file') {
        throw fieldError('file', 'El archivo debe enviarse como parte de archivo.');
      }

      if (!ALLOWED_FIELDS.has(part.fieldname)) {
        throw fieldError(part.fieldname, `Campo desconocido. Se admiten: ${ALLOWED_FIELD_LIST}.`);
      }

      if (seenFields.has(part.fieldname)) {
        throw fieldError(part.fieldname, 'Campo duplicado.');
      }

      if (typeof part.value !== 'string') {
        throw fieldError(part.fieldname, 'El campo debe ser texto.');
      }

      seenFields.add(part.fieldname);
      rawFields[part.fieldname] = part.value;
    }
  } catch (error) {
    mapMultipartError(error);
  }

  if (file === null) {
    throw fieldError('file', 'Falta el archivo.');
  }

  return { file, fields: parseFields(rawFields) };
}
