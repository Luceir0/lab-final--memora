import { ApiError, ApiTransportError } from '@memora/api-client';
import { describe, expect, it } from 'vitest';

import type { UploadError, UploadErrorCode } from './errors';
import { getUploadErrorCopy, toUploadError } from './errors';

const EXPECTED: ReadonlyArray<readonly [UploadErrorCode, string]> = [
  ['UNSUPPORTED_MEDIA_TYPE', 'Formato no admitido. Usa JPEG, PNG o WebP.'],
  ['FILE_TOO_LARGE', 'El archivo supera los 25 MB.'],
  ['QUOTA_EXCEEDED', 'El círculo ha alcanzado su cuota de almacenamiento.'],
  ['INVALID_IMAGE', 'La imagen está dañada o es demasiado grande.'],
  ['FORBIDDEN', 'No tienes permiso para subir fotos a este álbum.'],
  ['NOT_FOUND', 'El álbum ya no existe o no tienes acceso.'],
  ['CONFLICT', 'No se pudo completar la subida por un conflicto. Reintenta.'],
  ['PROCESSING_FAILED', 'No se pudo procesar la imagen. Prueba con otra.'],
  ['NETWORK_ERROR', 'No se pudo conectar. Revisa tu conexión y reintenta.'],
  ['CANCELLED', 'Subida cancelada.'],
];

describe('getUploadErrorCopy', () => {
  it.each(EXPECTED)('traduce %s a copy de UI', (code, copy) => {
    const error: UploadError = { code, status: null, message: 'mensaje interno' };

    expect(getUploadErrorCopy(error)).toBe(copy);
  });

  it('cubre todos los códigos posibles sin devolver undefined', () => {
    const codes: readonly UploadErrorCode[] = [
      'VALIDATION_ERROR',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'ALBUM_NOT_EMPTY',
      'FILE_TOO_LARGE',
      'PAYLOAD_TOO_LARGE',
      'QUOTA_EXCEEDED',
      'UNSUPPORTED_MEDIA_TYPE',
      'UNPROCESSABLE_ENTITY',
      'INVALID_IMAGE',
      'PROCESSING_FAILED',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
      'NETWORK_ERROR',
      'CANCELLED',
      'INVALID_RESPONSE',
    ];

    for (const code of codes) {
      expect(getUploadErrorCopy({ code, status: null, message: 'x' }).length).toBeGreaterThan(0);
    }
  });
});

describe('toUploadError con errores del cliente de API', () => {
  it('normaliza un 401 del prefetch de CSRF a sesión caducada', () => {
    const normalized = toUploadError(
      new ApiError(401, {
        code: 'UNAUTHENTICATED',
        message: 'Inicia sesión para continuar.',
        details: null,
      }),
    );

    expect(normalized).toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });
    expect(getUploadErrorCopy(normalized)).toBe('Tu sesión ha caducado. Vuelve a entrar.');
  });

  it('normaliza un 403 a FORBIDDEN', () => {
    expect(
      toUploadError(
        new ApiError(403, {
          code: 'FORBIDDEN',
          message: 'No tienes acceso.',
          details: null,
        }),
      ),
    ).toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('normaliza un fallo de transporte a NETWORK_ERROR', () => {
    const normalized = toUploadError(new ApiTransportError('network'));

    expect(normalized).toMatchObject({ code: 'NETWORK_ERROR' });
    expect(getUploadErrorCopy(normalized)).toBe(
      'No se pudo conectar. Revisa tu conexión y reintenta.',
    );
  });
});
