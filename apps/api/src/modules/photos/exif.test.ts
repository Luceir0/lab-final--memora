import { describe, expect, it } from 'vitest';

import { createGpsJpeg, createJpeg, createWebp } from '../../test/image-fixtures.ts';
import { normalisePlaceName, parseExifDate, readPhotoExif } from './exif.ts';

describe('parseExifDate', () => {
  it('parses EXIF wall-clock time as UTC', () => {
    expect(parseExifDate('2024:05:06 07:08:09')?.toISOString()).toBe('2024-05-06T07:08:09.000Z');
    expect(parseExifDate('2024:05:06T07:08:09')?.toISOString()).toBe('2024-05-06T07:08:09.000Z');
  });

  it('rejects impossible dates and unknown values', () => {
    expect(parseExifDate('2024:02:31 00:00:00')).toBeNull();
    expect(parseExifDate('not-a-date')).toBeNull();
    expect(parseExifDate(undefined)).toBeNull();
    expect(parseExifDate(new Date('invalid'))).toBeNull();
  });
});

describe('readPhotoExif', () => {
  it('reads DateTimeOriginal and GPS from a JPEG', async () => {
    const exif = await readPhotoExif(await createGpsJpeg());

    expect(exif.takenAt?.toISOString()).toBe('2024-05-06T07:08:09.000Z');
    expect(exif.gps?.latitude).toBeCloseTo(39.5696, 3);
    expect(exif.gps?.longitude).toBeCloseTo(2.6502, 3);
  });

  it('returns no EXIF for a plain JPEG or a WebP', async () => {
    await expect(readPhotoExif(await createJpeg())).resolves.toEqual({
      takenAt: null,
      gps: null,
    });
    await expect(readPhotoExif(await createWebp())).resolves.toEqual({
      takenAt: null,
      gps: null,
    });
  });
});

describe('normalisePlaceName', () => {
  it('trims and caps the persisted place name', () => {
    expect(normalisePlaceName('  Palma, Mallorca  ')).toBe('Palma, Mallorca');
    expect(normalisePlaceName('')).toBeNull();
    expect(normalisePlaceName('   ')).toBeNull();
    expect(normalisePlaceName(null)).toBeNull();
    expect(normalisePlaceName('x'.repeat(500))).toHaveLength(200);
  });
});
