import { describe, expect, it } from 'vitest';

import type { UploadItem, UploadSource } from './types';

import {
  formatMegabytes,
  formatUploadBytes,
  formatUploadCancelledCount,
  formatUploadFailedCount,
  formatUploadItemName,
  formatUploadQueueCount,
  formatUploadSource,
  formatUploadStatus,
  isGenericUploadFileName,
} from './format';

function pendingItem(overrides: Partial<UploadItem> & Pick<UploadItem, 'status'>): UploadItem {
  const file = new File(['contenido'], 'foto.jpg', {
    type: 'image/jpeg',
    lastModified: Date.UTC(2026, 10, 5, 18, 42),
  });

  return {
    id: 'item-1',
    file,
    albumId: 'album-1',
    source: 'desktop',
    previewUrl: '',
    originalName: file.name,
    clientUploadId: 'client-1',
    size: file.size,
    attempts: 0,
    progress: 0,
    ...overrides,
  } as UploadItem;
}

describe('formatUploadSource', () => {
  it('traduce los tres orígenes', () => {
    const expected: Record<UploadSource, string> = {
      gallery: 'Galería',
      camera: 'Cámara',
      desktop: 'Del ordenador',
    };

    for (const [source, label] of Object.entries(expected)) {
      expect(formatUploadSource(source as UploadSource)).toBe(label);
    }
  });
});

describe('formatUploadStatus', () => {
  it('describe cada estado sin depender del color', () => {
    expect(formatUploadStatus(pendingItem({ status: 'pending' }))).toBe('En cola');
    expect(formatUploadStatus(pendingItem({ status: 'uploading', progress: 72 }))).toBe(
      'Subiendo · 72 %',
    );
    expect(formatUploadStatus(pendingItem({ status: 'done', progress: 100, photoId: 'p' }))).toBe(
      'Completada',
    );
    expect(formatUploadStatus(pendingItem({ status: 'cancelled' }))).toBe('Cancelada');
    expect(
      formatUploadStatus(
        pendingItem({
          status: 'error',
          error: { code: 'FILE_TOO_LARGE', status: 413, message: 'x' },
        }),
      ),
    ).toBe('Error');
  });
});

describe('formatUploadItemName', () => {
  it('detecta nombres genéricos de captura', () => {
    expect(isGenericUploadFileName('image.jpg')).toBe(true);
    expect(isGenericUploadFileName('IMG_2240.jpg')).toBe(true);
    expect(isGenericUploadFileName('foto.png')).toBe(true);
    expect(isGenericUploadFileName('playa-de-mallorca.jpg')).toBe(false);
  });

  it('usa la hora de captura para una cámara con nombre genérico', () => {
    const item = pendingItem({ status: 'pending', source: 'camera', originalName: 'IMG_2240.jpg' });

    expect(formatUploadItemName(item)).toMatch(/^Foto de la cámara · \d{2}:\d{2}$/);
  });

  it('conserva el nombre real aunque venga de la cámara', () => {
    const item = pendingItem({
      status: 'pending',
      source: 'camera',
      originalName: 'cumpleanos.jpg',
    });

    expect(formatUploadItemName(item)).toBe('cumpleanos.jpg');
  });

  it('no renombra los archivos de galería u ordenador', () => {
    expect(
      formatUploadItemName(
        pendingItem({ status: 'pending', source: 'gallery', originalName: 'IMG_2240.jpg' }),
      ),
    ).toBe('IMG_2240.jpg');
  });
});

describe('formatUploadQueueCount', () => {
  it('usa singular y plural', () => {
    expect(formatUploadQueueCount(1, 1)).toBe('1 de 1 subida');
    expect(formatUploadQueueCount(4, 12)).toBe('4 de 12 subidas');
  });
});

describe('contadores de estado', () => {
  it('concuerda el error en singular y plural', () => {
    expect(formatUploadFailedCount(1)).toBe('1 con error');
    expect(formatUploadFailedCount(2)).toBe('2 con errores');
  });

  it('concuerda las canceladas', () => {
    expect(formatUploadCancelledCount(1)).toBe('1 cancelada');
    expect(formatUploadCancelledCount(3)).toBe('3 canceladas');
  });
});

describe('bytes', () => {
  it('formatea megabytes con coma decimal y sin decimales de más', () => {
    expect(formatMegabytes(0)).toBe('0');
    expect(formatMegabytes(1.5 * 1024 * 1024)).toBe('1,5');
    expect(formatMegabytes(38.4 * 1024 * 1024)).toBe('38');
  });

  it('compone «X de Y MB»', () => {
    expect(formatUploadBytes(38 * 1024 * 1024, 59 * 1024 * 1024)).toBe('38 de 59 MB');
  });
});
