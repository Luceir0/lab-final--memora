import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { DISPLAY_MAX_SIZE, THUMB_SIZE, processImage } from './images.ts';

async function buildOrientedFixture(): Promise<Buffer> {
  return sharp({
    create: {
      width: 900,
      height: 400,
      channels: 3,
      background: { r: 51, g: 102, b: 153 },
    },
  })
    .withMetadata({ orientation: 6 })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Rewrites the SOF dimensions of a JPEG in place.
 *
 * The scan data is untouched, but sharp rejects oversized inputs as soon as it
 * reads the header, before decoding, so this is enough to exercise the 50 MP
 * limit without allocating a real 60 MP image.
 */
function patchJpegDimensions(jpeg: Buffer, width: number, height: number): Buffer {
  const patched = Buffer.from(jpeg);
  let offset = 2;

  while (offset + 9 < patched.length) {
    if (patched[offset] !== 0xff) {
      throw new Error('Invalid JPEG segment marker');
    }

    const marker = patched[offset + 1];

    if (marker === undefined) {
      break;
    }

    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    if (marker === 0xda) {
      break;
    }

    const segmentLength = patched.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isStartOfFrame) {
      patched.writeUInt16BE(height, offset + 5);
      patched.writeUInt16BE(width, offset + 7);
      return patched;
    }

    offset += 2 + segmentLength;
  }

  throw new Error('JPEG SOF marker not found');
}

describe('processImage', () => {
  it('honours EXIF orientation and emits metadata-free WebP variants', async () => {
    const input = await buildOrientedFixture();

    const before = await sharp(input).metadata();
    expect(before.orientation).toBe(6);
    expect(before.exif).toBeDefined();

    const result = await processImage(input);

    expect(result.thumb.width).toBe(THUMB_SIZE);
    expect(result.thumb.height).toBe(THUMB_SIZE);

    // 900×400 rotated by EXIF 6 becomes 400×900, below the 1600 px cap.
    expect(result.display.width).toBe(400);
    expect(result.display.height).toBe(900);

    for (const variant of [result.thumb, result.display]) {
      const metadata = await sharp(variant.buffer).metadata();

      expect(metadata.format).toBe('webp');
      expect(metadata.orientation).toBeUndefined();
      expect(metadata.exif).toBeUndefined();
      expect(metadata.icc).toBeUndefined();
      expect(metadata.width).toBe(variant.width);
      expect(metadata.height).toBe(variant.height);
    }
  });

  it('caps the display variant at 1600 px on the longest side', async () => {
    const input = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await processImage(input);

    expect(result.display.width).toBe(DISPLAY_MAX_SIZE);
    expect(result.display.height).toBeLessThanOrEqual(DISPLAY_MAX_SIZE);
    expect(result.display.height).toBeGreaterThan(0);
  });

  it('never upscales small images', async () => {
    const input = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const result = await processImage(input);

    expect(result.display.width).toBe(200);
    expect(result.display.height).toBe(100);
  });

  it('rejects images whose declared size exceeds the 50 MP limit', async () => {
    const input = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();

    const oversized = patchJpegDimensions(input, 10_000, 6_000);

    await expect(processImage(oversized)).rejects.toThrow(/pixel limit/i);
  });

  it('drops ICC profiles from both variants', async () => {
    const input = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 18, g: 52, b: 86 },
      },
    })
      .withIccProfile('srgb')
      .jpeg()
      .toBuffer();

    const before = await sharp(input).metadata();
    expect(before.icc).toBeDefined();

    const result = await processImage(input);

    for (const variant of [result.thumb, result.display]) {
      const metadata = await sharp(variant.buffer).metadata();
      expect(metadata.icc).toBeUndefined();
    }
  });
});
