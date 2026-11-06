import { describe, expect, it, vi } from 'vitest';

import { galleryPhotos } from '../../../test/fixtures/photos-fixtures';

import { formatPhotoPosition, formatPhotoTakenAt } from './format';
import { findPhotoNeighbours } from './navigation';
import { originalImageUrl } from './queries';
import {
  clearActivePhotoSelection,
  registerPhotoSelectionClear,
  resetPhotoSelectionBridge,
} from './selection-bridge';

describe('viewer utils', () => {
  it('resuelve vecinos en la lista cargada y no inventa si falta la foto', () => {
    expect(findPhotoNeighbours(galleryPhotos, 'pho_playa')).toMatchObject({
      index: 0,
      previous: null,
      next: galleryPhotos[1],
    });
    expect(findPhotoNeighbours(galleryPhotos, 'pho_cena')).toMatchObject({
      index: 1,
      previous: galleryPhotos[0],
      next: galleryPhotos[2],
    });
    expect(findPhotoNeighbours(galleryPhotos, 'pho_montana')).toMatchObject({
      index: 2,
      previous: galleryPhotos[1],
      next: null,
    });
    expect(findPhotoNeighbours(galleryPhotos, 'pho_otra')).toEqual({
      index: -1,
      previous: null,
      next: null,
    });
  });

  it('construye la URL original solo desde el patrón congelado de display', () => {
    expect(originalImageUrl('/api/photos/pho_1/image?size=display')).toBe(
      '/api/photos/pho_1/image?size=original',
    );
    expect(originalImageUrl('/fotos/pho_1?foo=1&size=display')).toBe(
      '/fotos/pho_1?foo=1&size=original',
    );
    expect(originalImageUrl('/fotos/pho_1?size=thumb')).toBe('/fotos/pho_1?size=thumb');
  });

  it('formatea la posición y tolera totales y fechas ausentes', () => {
    expect(formatPhotoPosition(23, 342)).toBe('24 de 342');
    expect(formatPhotoPosition(0, undefined)).toBe('Foto 1');
    expect(formatPhotoPosition(-1, 342)).toBe('Foto');
    expect(formatPhotoTakenAt(null)).toBeNull();
    expect(formatPhotoTakenAt('no-es-fecha')).toBeNull();
    expect(formatPhotoTakenAt('2026-08-14T17:42:00.000Z')).toMatch(/2026/);
  });

  it('el puente limpia la selección una sola vez y se desregistra', () => {
    const clear = vi.fn();

    resetPhotoSelectionBridge();
    expect(clearActivePhotoSelection()).toBe(false);

    const unregister = registerPhotoSelectionClear(clear);

    expect(clearActivePhotoSelection()).toBe(true);
    expect(clear).toHaveBeenCalledTimes(1);

    unregister();
    expect(clearActivePhotoSelection()).toBe(false);
  });
});
