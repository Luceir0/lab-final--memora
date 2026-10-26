import sharp, { type Metadata } from 'sharp';

/** Rejects pathological inputs before decoding them. */
export const MAX_INPUT_PIXELS = 50_000_000;

/** Square size of the thumbnail, in CSS-independent pixels. */
export const THUMB_SIZE = 400;

/** Longest side of the display variant, in pixels. */
export const DISPLAY_MAX_SIZE = 1600;

export interface ProcessedVariant {
  /** Encoded WebP bytes, without EXIF/GPS metadata. */
  readonly buffer: Buffer;
  readonly width: number;
  readonly height: number;
}

export interface ProcessedImage {
  readonly thumb: ProcessedVariant;
  readonly display: ProcessedVariant;
}

function readDimensions(metadata: Metadata): { width: number; height: number } {
  if (metadata.width === undefined || metadata.height === undefined) {
    throw new Error('sharp did not report dimensions for the processed image');
  }

  return { width: metadata.width, height: metadata.height };
}

/**
 * Generates the two F05 image variants.
 *
 * - `thumb`: 400×400, cover crop, WebP.
 * - `display`: longest side capped at 1600 px, never upscaled, WebP.
 *
 * `.rotate()` without arguments applies the EXIF orientation and drops the
 * orientation tag. WebP output carries no EXIF/GPS unless `withMetadata()`
 * is called, which we never do.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const inputOptions = { limitInputPixels: MAX_INPUT_PIXELS } as const;

  const thumbBuffer = await sharp(input, inputOptions)
    .rotate()
    .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const displayBuffer = await sharp(input, inputOptions)
    .rotate()
    .resize({
      width: DISPLAY_MAX_SIZE,
      height: DISPLAY_MAX_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const [thumbMetadata, displayMetadata] = await Promise.all([
    sharp(thumbBuffer).metadata(),
    sharp(displayBuffer).metadata(),
  ]);

  return {
    thumb: { buffer: thumbBuffer, ...readDimensions(thumbMetadata) },
    display: { buffer: displayBuffer, ...readDimensions(displayMetadata) },
  };
}
