import { describe, expect, it } from 'vitest';

import {
  createAvif,
  createCorruptJpeg,
  createGif,
  createHeic,
  createJpeg,
  createPng,
  createSvg,
  createWebp,
} from '../../test/image-fixtures.ts';
import { looksLikeSvg, validateImageBytes } from './validation.ts';

describe('validateImageBytes', () => {
  it('accepts JPEG, PNG and WebP and reports their dimensions', async () => {
    await expect(validateImageBytes(await createJpeg(120, 80))).resolves.toEqual({
      mimeType: 'image/jpeg',
      width: 120,
      height: 80,
    });
    await expect(validateImageBytes(await createPng(60, 40))).resolves.toEqual({
      mimeType: 'image/png',
      width: 60,
      height: 40,
    });
    await expect(validateImageBytes(await createWebp(30, 20))).resolves.toEqual({
      mimeType: 'image/webp',
      width: 30,
      height: 20,
    });
  });

  it('rejects SVG, GIF and HEIC as unsupported', async () => {
    await expect(validateImageBytes(createSvg())).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
    await expect(validateImageBytes(createGif())).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
    await expect(validateImageBytes(createHeic())).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
    await expect(validateImageBytes(createAvif())).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });

  it('rejects unknown bytes and empty files', async () => {
    await expect(validateImageBytes(Buffer.from('plain text'))).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
    await expect(validateImageBytes(Buffer.alloc(0))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('maps a truncated JPEG to INVALID_IMAGE', async () => {
    await expect(validateImageBytes(await createCorruptJpeg())).rejects.toMatchObject({
      code: 'INVALID_IMAGE',
    });
  });
});

describe('looksLikeSvg', () => {
  it('detects SVG with XML prologue and leading whitespace', () => {
    expect(looksLikeSvg(createSvg())).toBe(true);
    expect(
      looksLikeSvg(
        Buffer.from('  \n<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg">'),
      ),
    ).toBe(true);
    expect(looksLikeSvg(Buffer.from('<html><body>no</body></html>'))).toBe(false);
  });
});
