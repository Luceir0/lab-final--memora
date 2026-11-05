import sharp, { type Metadata } from 'sharp';

/** Rejects pathological inputs before decoding them. */
export const MAX_INPUT_PIXELS = 50_000_000;

/** Square size of the thumbnail, in CSS-independent pixels. */
export const THUMB_SIZE = 400;

/** Longest side of the display variant, in pixels. */
export const DISPLAY_MAX_SIZE = 1600;

/** Formats the upload pipeline accepts; `file-type` proves the bytes. */
export type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/** Upload-oriented key extension for each accepted mime type. */
export const IMAGE_EXTENSIONS: Readonly<Record<SupportedImageMimeType, 'jpg' | 'png' | 'webp'>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface ProcessedOriginal {
  /** Re-encoded bytes with EXIF/GPS removed and orientation applied. */
  readonly buffer: Buffer;
  readonly width: number;
  readonly height: number;
  readonly mimeType: SupportedImageMimeType;
  readonly extension: 'jpg' | 'png' | 'webp';
}

/**
 * Rejects missing dimensions and decompression bombs before any transform.
 *
 * `sharp` also receives `limitInputPixels`, but this explicit check keeps the
 * upload pipeline's 50 MP rule independent from libvips' wording.
 */
export function assertPixelBudget(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('La imagen no tiene dimensiones válidas.');
  }

  if (width * height > MAX_INPUT_PIXELS) {
    throw new Error('La imagen supera el límite de píxeles.');
  }
}

/** Reads dimensions without decoding the whole image. */
export async function readImageDimensions(
  input: Buffer,
): Promise<{ readonly width: number; readonly height: number }> {
  const metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();

  if (metadata.width === undefined || metadata.height === undefined) {
    throw new Error('sharp no pudo leer las dimensiones de la imagen.');
  }

  assertPixelBudget(metadata.width, metadata.height);

  return { width: metadata.width, height: metadata.height };
}

/**
 * Produces the private `original` object: same format, no resizing, EXIF
 * orientation applied and every metadata block removed (sharp drops them
 * unless `withMetadata()`/`keepMetadata()` is called).
 */
export async function processOriginal(
  input: Buffer,
  mimeType: SupportedImageMimeType,
): Promise<ProcessedOriginal> {
  const rotated = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const encoded =
    mimeType === 'image/jpeg'
      ? rotated.jpeg({ quality: 95 })
      : mimeType === 'image/png'
        ? rotated.png()
        : rotated.webp({ quality: 95 });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    mimeType,
    extension: IMAGE_EXTENSIONS[mimeType],
  };
}

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
