import { describe, expect, it } from 'vitest';

import {
  DOWNLOAD_WARNING_BYTES,
  exceedsDownloadWarning,
  formatAlbumDownloadWarning,
  formatDownloadSize,
  formatDownloadWarning,
  formatDownloadWarningTitle,
  sumPhotoSizes,
} from './format';

const MEGABYTE = 1024 * 1024;

describe('descargas · tamaño y aviso', () => {
  it('suma los tamaños sin aceptar valores negativos', () => {
    expect(sumPhotoSizes([{ size: 10 }, { size: 32 }, { size: -5 }])).toBe(42);
  });

  it('avisa solo por encima de 100 MB, no justo en el límite', () => {
    expect(exceedsDownloadWarning(DOWNLOAD_WARNING_BYTES)).toBe(false);
    expect(exceedsDownloadWarning(DOWNLOAD_WARNING_BYTES + 1)).toBe(true);
  });

  it('formatea megabytes con coma decimal y sin decimales de más', () => {
    expect(formatDownloadSize(1.5 * MEGABYTE)).toBe('1,5 MB');
    expect(formatDownloadSize(150 * MEGABYTE)).toBe('150 MB');
  });

  it('el aviso explica la espera y dónde queda el archivo en móvil (AC-06)', () => {
    const copy = formatDownloadWarning(3, 150 * MEGABYTE);

    expect(copy).toContain('3 fotos');
    expect(copy).toContain('150 MB');
    expect(copy).toContain('puede tardar');
    expect(copy).toContain('iPhone y Android');
    expect(copy).toContain('Archivos o en Descargas');
  });

  it('usa singular en títulos y avisos de una sola foto', () => {
    expect(formatDownloadWarningTitle(1)).toBe('Descargar 1 foto');
    expect(formatDownloadWarning(1, 2 * MEGABYTE)).toContain('1 foto');
  });

  it('el aviso del álbum completo no promete un tamaño y explica el umbral y la ubicación (AC-06)', () => {
    const copy = formatAlbumDownloadWarning(342);

    expect(copy).toContain('342 fotos');
    expect(copy).toContain('100 MB');
    expect(copy).toContain('puede tardar');
    expect(copy).toContain('seguir usando Memora');
    expect(copy).toContain('iPhone y Android');
    expect(copy).toContain('Archivos o en Descargas');
  });

  it('usa singular en el aviso del álbum con una sola foto', () => {
    expect(formatAlbumDownloadWarning(1)).toContain('1 foto');
  });
});
