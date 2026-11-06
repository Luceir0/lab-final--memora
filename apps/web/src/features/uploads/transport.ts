import {
  errorResponseSchema,
  uploadPhotoResponseSchema,
  type ErrorCode,
  type PhotoDto,
  type UploadPhotoFields,
} from '@memora/shared';

import { resolveBrowserApiBasePath } from '../../lib/api-client';
import { UploadTransportError } from './errors';

export interface UploadTransportRequest {
  readonly albumId: string;
  readonly file: File;
  readonly fields: UploadPhotoFields;
  readonly csrfToken: string;
  readonly signal: AbortSignal;
  /** Porcentaje 0–100. Nunca retrocede. */
  readonly onProgress: (percent: number) => void;
}

/** Puerto de subida; permite inyectar un transporte falso en tests. */
export interface UploadTransport {
  upload(request: UploadTransportRequest): Promise<PhotoDto>;
}

export interface XhrUploadTransportOptions {
  /** Ruta o URL absoluta de la API. Por defecto, la del navegador. */
  readonly basePath?: string;
  /** Constructor de XHR inyectable en tests. */
  readonly createXhr?: () => XMLHttpRequest;
}

export function buildUploadUrl(albumId: string, basePath: string): string {
  const base = basePath.replace(/\/+$/, '');

  return `${base}/albums/${encodeURIComponent(albumId)}/photos`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function statusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 413:
      return 'FILE_TOO_LARGE';
    case 415:
      return 'UNSUPPORTED_MEDIA_TYPE';
    case 422:
      return 'INVALID_IMAGE';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}

function toHttpError(status: number, responseText: string): UploadTransportError {
  const parsed = errorResponseSchema.safeParse(parseJson(responseText));

  if (parsed.success) {
    return new UploadTransportError(parsed.data.code, status, parsed.data.message);
  }

  return new UploadTransportError(statusToCode(status), status);
}

/**
 * Transporte por defecto.
 *
 * `fetch` no expone `upload.onprogress`; por eso la subida usa XHR. El
 * progreso se acota a 99 % hasta que llega un `2xx`, y solo avanza, para que
 * un evento tardío de `lengthComputable` no haga retroceder la barra.
 */
export function createXhrUploadTransport(options: XhrUploadTransportOptions = {}): UploadTransport {
  const createXhr = options.createXhr ?? (() => new XMLHttpRequest());

  return {
    upload(request) {
      if (request.signal.aborted) {
        return Promise.reject(new UploadTransportError('CANCELLED', null));
      }

      const basePath = options.basePath ?? resolveBrowserApiBasePath();

      return new Promise<PhotoDto>((resolve, reject) => {
        const xhr = createXhr();
        let settled = false;
        let lastProgress = 0;

        const handleAbort = () => {
          xhr.abort();
          finish(() => reject(new UploadTransportError('CANCELLED', null)));
        };

        function finish(complete: () => void): void {
          if (settled) {
            return;
          }

          settled = true;
          request.signal.removeEventListener('abort', handleAbort);
          complete();
        }

        request.signal.addEventListener('abort', handleAbort, { once: true });

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total <= 0) {
            return;
          }

          const percent = Math.min(99, Math.max(0, Math.round((event.loaded / event.total) * 100)));

          if (percent <= lastProgress) {
            return;
          }

          lastProgress = percent;
          request.onProgress(percent);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const parsed = uploadPhotoResponseSchema.safeParse(parseJson(xhr.responseText));

            if (!parsed.success) {
              finish(() => reject(new UploadTransportError('INVALID_RESPONSE', xhr.status)));
              return;
            }

            request.onProgress(100);
            finish(() => resolve(parsed.data));
            return;
          }

          finish(() => reject(toHttpError(xhr.status, xhr.responseText)));
        };

        xhr.onerror = () => {
          finish(() => reject(new UploadTransportError('NETWORK_ERROR', null)));
        };

        xhr.onabort = () => {
          finish(() => reject(new UploadTransportError('CANCELLED', null)));
        };

        xhr.ontimeout = () => {
          finish(() => reject(new UploadTransportError('NETWORK_ERROR', null)));
        };

        try {
          xhr.open('POST', buildUploadUrl(request.albumId, basePath), true);
          xhr.withCredentials = true;
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.setRequestHeader('X-CSRF-Token', request.csrfToken);

          const form = new FormData();
          form.append('clientUploadId', request.fields.clientUploadId);

          if (request.fields.takenAt !== undefined) {
            form.append('takenAt', request.fields.takenAt);
          }

          if (request.fields.description !== undefined) {
            form.append('description', request.fields.description);
          }

          form.append('file', request.file, request.file.name);
          xhr.send(form);
        } catch {
          finish(() => reject(new UploadTransportError('NETWORK_ERROR', null)));
        }
      });
    },
  };
}
