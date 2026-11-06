import type { UploadError } from './errors';

/** Límite del contrato. La API vuelve a validarlo y manda. */
export const MAX_UPLOAD_FILE_BYTES = 25 * 1024 * 1024;

/** Archivos por lote. */
export const MAX_UPLOAD_FILES_PER_BATCH = 20;

/** Peticiones simultáneas en cliente. */
export const MAX_CONCURRENT_UPLOADS = 3;

export const ALLOWED_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

const UNSUPPORTED_TYPE_MESSAGE = 'Formato no admitido. Usa JPEG, PNG o WebP.';
const TOO_LARGE_MESSAGE = 'El archivo supera los 25 MB.';
const EMPTY_FILE_MESSAGE = 'El archivo está vacío.';
const TOO_MANY_FILES_MESSAGE = `Puedes subir hasta ${MAX_UPLOAD_FILES_PER_BATCH} archivos a la vez.`;

function isAllowedMimeType(value: string): value is AllowedUploadMimeType {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * Validación orientativa de un archivo. La API sigue siendo la autoridad:
 * aquí solo se evita gastar una petición con un archivo que no puede pasar.
 */
export function validateUploadFile(file: File): UploadError | null {
  if (!isAllowedMimeType(file.type.toLowerCase())) {
    return { code: 'UNSUPPORTED_MEDIA_TYPE', status: null, message: UNSUPPORTED_TYPE_MESSAGE };
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    return { code: 'FILE_TOO_LARGE', status: null, message: TOO_LARGE_MESSAGE };
  }

  if (file.size === 0) {
    return { code: 'INVALID_IMAGE', status: null, message: EMPTY_FILE_MESSAGE };
  }

  return null;
}

export interface UploadFileValidation {
  readonly file: File;
  readonly error: UploadError | null;
}

export interface RejectedUpload {
  readonly file: File;
  readonly error: UploadError;
}

export interface UploadBatchValidation {
  /** Un resultado por archivo, en el mismo orden de entrada. */
  readonly files: readonly UploadFileValidation[];
  readonly accepted: readonly File[];
  readonly rejected: readonly RejectedUpload[];
}

/**
 * Valida el lote completo.
 *
 * Los archivos que exceden el máximo de 20 se rechazan sin invalidar los
 * anteriores. Un archivo inválido tampoco bloquea a los válidos: cada uno
 * entra en la cola con su propio estado.
 */
export function validateUploadBatch(files: ArrayLike<File>): UploadBatchValidation {
  const results: UploadFileValidation[] = [];
  const accepted: File[] = [];
  const rejected: RejectedUpload[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];

    if (file === undefined) {
      continue;
    }

    const error =
      index >= MAX_UPLOAD_FILES_PER_BATCH
        ? { code: 'VALIDATION_ERROR' as const, status: null, message: TOO_MANY_FILES_MESSAGE }
        : validateUploadFile(file);

    results.push({ file, error });

    if (error === null) {
      accepted.push(file);
    } else {
      rejected.push({ file, error });
    }
  }

  return { files: results, accepted, rejected };
}
