import { describe, expect, it } from 'vitest';

import {
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES_PER_BATCH,
  validateUploadBatch,
  validateUploadFile,
} from './validation';

function imageFile(name = 'foto.jpg', type = 'image/jpeg'): File {
  return new File(['contenido'], name, { type });
}

function withSize(file: File, size: number): File {
  Object.defineProperty(file, 'size', { value: size });

  return file;
}

describe('validateUploadFile', () => {
  it('acepta JPEG, PNG y WebP dentro del límite', () => {
    expect(validateUploadFile(imageFile('foto.jpg', 'image/jpeg'))).toBeNull();
    expect(validateUploadFile(imageFile('foto.png', 'image/png'))).toBeNull();
    expect(validateUploadFile(imageFile('foto.webp', 'image/webp'))).toBeNull();
  });

  it('rechaza un tipo no permitido con el código del contrato', () => {
    expect(validateUploadFile(imageFile('foto.gif', 'image/gif'))).toEqual({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      status: null,
      message: 'Formato no admitido. Usa JPEG, PNG o WebP.',
    });
  });

  it('acepta justo 25 MB y rechaza un byte más', () => {
    expect(validateUploadFile(withSize(imageFile(), MAX_UPLOAD_FILE_BYTES))).toBeNull();
    expect(validateUploadFile(withSize(imageFile(), MAX_UPLOAD_FILE_BYTES + 1))).toEqual({
      code: 'FILE_TOO_LARGE',
      status: null,
      message: 'El archivo supera los 25 MB.',
    });
  });

  it('rechaza un archivo vacío como imagen inválida', () => {
    expect(validateUploadFile(withSize(imageFile(), 0))).toMatchObject({
      code: 'INVALID_IMAGE',
    });
  });
});

describe('validateUploadBatch', () => {
  it('separa válidos de inválidos sin bloquear los válidos', () => {
    const valid = imageFile('ok.jpg');
    const badType = imageFile('animado.gif', 'image/gif');
    const tooLarge = withSize(imageFile('grande.jpg'), MAX_UPLOAD_FILE_BYTES + 1);

    const result = validateUploadBatch([valid, badType, tooLarge]);

    expect(result.accepted).toEqual([valid]);
    expect(result.rejected.map((item) => item.error.code)).toEqual([
      'UNSUPPORTED_MEDIA_TYPE',
      'FILE_TOO_LARGE',
    ]);
    expect(result.files.map((item) => item.error)).toEqual([
      null,
      expect.objectContaining({ code: 'UNSUPPORTED_MEDIA_TYPE' }),
      expect.objectContaining({ code: 'FILE_TOO_LARGE' }),
    ]);
  });

  it('rechaza el archivo 21 y siguientes con VALIDATION_ERROR', () => {
    const files = Array.from({ length: MAX_UPLOAD_FILES_PER_BATCH + 2 }, (_, index) =>
      imageFile(`foto-${index}.jpg`),
    );

    const result = validateUploadBatch(files);

    expect(result.accepted).toHaveLength(MAX_UPLOAD_FILES_PER_BATCH);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected.every((item) => item.error.code === 'VALIDATION_ERROR')).toBe(true);
    expect(result.rejected[0]?.error.message).toBe(
      `Puedes subir hasta ${MAX_UPLOAD_FILES_PER_BATCH} archivos a la vez.`,
    );
  });

  it('acepta un lote vacío', () => {
    expect(validateUploadBatch([])).toEqual({ files: [], accepted: [], rejected: [] });
  });
});
