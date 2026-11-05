import { describe, expect, it } from 'vitest';

import {
  currentMonthInput,
  formatAlbumDateLabel,
  formatAlbumMeta,
  formatAlbumMonth,
  formatAlbumPhotos,
  formatDeletedPhotos,
  formatWillDeletePhotos,
  isoToMonthInput,
  monthInputToIso,
} from './format';

describe('currentMonthInput', () => {
  it('devuelve el año y el mes locales', () => {
    expect(currentMonthInput(new Date(2026, 7, 15, 12, 0, 0))).toBe('2026-08');
    expect(currentMonthInput(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01');
    expect(currentMonthInput(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12');
  });
});

describe('formatAlbumMonth', () => {
  it('formatea el día 1 a las 00:00 UTC como «agosto 2026»', () => {
    expect(formatAlbumMonth('2026-08-01T00:00:00.000Z')).toBe('agosto 2026');
  });

  it('usa UTC para no desplazar el mes en husos al oeste de Greenwich', () => {
    // Un instante que en America/Los_Angeles sigue siendo julio, pero en UTC ya
    // es agosto: la etiqueta debe seguir el valor persistido, no la zona local.
    expect(formatAlbumMonth('2026-08-01T00:30:00.000Z')).toBe('agosto 2026');
    expect(formatAlbumMonth('2026-08-01T23:30:00.000Z')).toBe('agosto 2026');
  });

  it('devuelve null cuando falta la fecha o no es válida', () => {
    expect(formatAlbumMonth(null)).toBeNull();
    expect(formatAlbumMonth(undefined)).toBeNull();
    expect(formatAlbumMonth('')).toBeNull();
    expect(formatAlbumMonth('no-es-una-fecha')).toBeNull();
  });
});

describe('formatAlbumDateLabel', () => {
  it('cae al texto de álbum continuo cuando no hay fecha', () => {
    expect(formatAlbumDateLabel(null)).toBe('Sin fecha · álbum continuo');
    expect(formatAlbumDateLabel('')).toBe('Sin fecha · álbum continuo');
    expect(formatAlbumDateLabel('2026-08-01T00:00:00.000Z')).toBe('agosto 2026');
  });
});

describe('monthInputToIso', () => {
  it('convierte el valor de un input month al día 1 a las 00:00 UTC', () => {
    expect(monthInputToIso('2026-08')).toBe('2026-08-01T00:00:00.000Z');
    expect(monthInputToIso('2026-01')).toBe('2026-01-01T00:00:00.000Z');
    expect(monthInputToIso('2026-12')).toBe('2026-12-01T00:00:00.000Z');
  });

  it('devuelve null para vacío o valores fuera de formato', () => {
    expect(monthInputToIso('')).toBeNull();
    expect(monthInputToIso('   ')).toBeNull();
    expect(monthInputToIso('2026-13')).toBeNull();
    expect(monthInputToIso('2026-00')).toBeNull();
    expect(monthInputToIso('2026-8')).toBeNull();
    expect(monthInputToIso('agosto 2026')).toBeNull();
    expect(monthInputToIso('2026-08-01')).toBeNull();
  });

  it('conserva los años 0–99 sin mapearlos a 1900–1999', () => {
    expect(monthInputToIso('0099-01')).toBe('0099-01-01T00:00:00.000Z');
    expect(monthInputToIso('0001-12')).toBe('0001-12-01T00:00:00.000Z');
  });
});

describe('isoToMonthInput', () => {
  it('extrae YYYY-MM leyendo en UTC', () => {
    expect(isoToMonthInput('2026-08-01T00:00:00.000Z')).toBe('2026-08');
    expect(isoToMonthInput('2026-08-31T23:59:59.000Z')).toBe('2026-08');
    expect(isoToMonthInput('2026-01-01T00:00:00.000Z')).toBe('2026-01');
  });

  it('devuelve cadena vacía cuando no hay fecha válida', () => {
    expect(isoToMonthInput(null)).toBe('');
    expect(isoToMonthInput(undefined)).toBe('');
    expect(isoToMonthInput('')).toBe('');
    expect(isoToMonthInput('no-es-una-fecha')).toBe('');
  });

  it('hace ida y vuelta con monthInputToIso', () => {
    expect(isoToMonthInput(monthInputToIso('2026-08'))).toBe('2026-08');
  });
});

describe('formatAlbumPhotos', () => {
  it('usa singular con una foto y plural en el resto', () => {
    expect(formatAlbumPhotos(0)).toBe('0 fotos');
    expect(formatAlbumPhotos(1)).toBe('1 foto');
    expect(formatAlbumPhotos(342)).toBe('342 fotos');
  });
});

describe('formatDeletedPhotos', () => {
  it('concuerda el verbo en singular y plural', () => {
    expect(formatDeletedPhotos(1)).toBe('Se ha eliminado 1 foto.');
    expect(formatDeletedPhotos(2)).toBe('Se han eliminado 2 fotos.');
    expect(formatDeletedPhotos(342)).toBe('Se han eliminado 342 fotos.');
  });
});

describe('formatWillDeletePhotos', () => {
  it('concuerda el verbo en futuro en singular y plural', () => {
    expect(formatWillDeletePhotos(1)).toBe('Se borrará 1 foto');
    expect(formatWillDeletePhotos(2)).toBe('Se borrarán 2 fotos');
    expect(formatWillDeletePhotos(342)).toBe('Se borrarán 342 fotos');
  });
});

describe('formatAlbumMeta', () => {
  it('compone fecha y actualización relativa', () => {
    const now = new Date('2026-11-05T10:00:00.000Z');
    const meta = formatAlbumMeta(
      { date: '2026-08-01T00:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z' },
      now,
    );

    expect(meta).toBe('agosto 2026 · actualizado hace 4 días');
  });

  it('usa «sin fecha · álbum continuo» cuando el álbum no tiene fecha', () => {
    const now = new Date('2026-11-05T10:00:00.000Z');
    const meta = formatAlbumMeta({ date: null, updatedAt: '2026-11-05T09:00:00.000Z' }, now);

    expect(meta).toBe('Sin fecha · álbum continuo · actualizado hoy');
  });
});
