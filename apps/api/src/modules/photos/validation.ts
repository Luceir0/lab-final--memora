import { fileTypeFromBuffer } from 'file-type';

import { ApiError } from '../../errors.ts';
import { readImageDimensions, type SupportedImageMimeType } from '../../services/images.ts';

const SUPPORTED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
] satisfies SupportedImageMimeType[]);

export interface ValidatedImage {
  readonly mimeType: SupportedImageMimeType;
  readonly width: number;
  readonly height: number;
}

function isSupportedMimeType(value: string | undefined): value is SupportedImageMimeType {
  return value !== undefined && SUPPORTED_MIME_TYPES.has(value);
}

/**
 * Best-effort SVG detection for inputs `file-type` does not recognise.
 *
 * `file-type` works on binary signatures and deliberately ignores text formats,
 * so an SVG reaches this module as "unknown". The declared browser MIME is not
 * authoritative, hence the byte sniff. XML declarations and leading whitespace
 * are allowed before the root `<svg>` element.
 */
export function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer
    .subarray(0, 4_096)
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();

  return /<svg(?:\s|>)/i.test(head);
}

/**
 * Validates the magic bytes and the pixel budget.
 *
 * Decisions:
 * - A detected JPEG/PNG/WebP is decoded for dimensions; a header `sharp` cannot
 *   read is `422 INVALID_IMAGE`.
 * - A detected non-allowed format (GIF, HEIC/HEIF, AVIF...) is `415`.
 * - No detection at all is `415 UNSUPPORTED_MEDIA_TYPE`: the bytes do not prove
 *   an allowed format. SVG is sniffed explicitly because `file-type` ignores
 *   text formats. A truncated JPEG still carries its signature and therefore
 *   reaches the `sharp` check as `422`.
 *
 * The browser `Content-Type` is never consulted.
 */
export async function validateImageBytes(buffer: Buffer): Promise<ValidatedImage> {
  if (buffer.length === 0) {
    throw new ApiError('VALIDATION_ERROR', {
      details: [{ field: 'file', message: 'El archivo está vacío.' }],
    });
  }

  let detected: Awaited<ReturnType<typeof fileTypeFromBuffer>>;

  try {
    detected = await fileTypeFromBuffer(buffer);
  } catch {
    detected = undefined;
  }

  if (detected === undefined) {
    if (looksLikeSvg(buffer)) {
      throw new ApiError('UNSUPPORTED_MEDIA_TYPE');
    }

    throw new ApiError('UNSUPPORTED_MEDIA_TYPE', {
      message: 'El formato del archivo no se puede identificar como JPEG, PNG o WebP.',
    });
  }

  const mimeType = detected.mime;

  if (!isSupportedMimeType(mimeType)) {
    throw new ApiError('UNSUPPORTED_MEDIA_TYPE');
  }

  try {
    const dimensions = await readImageDimensions(buffer);

    return {
      mimeType,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    throw new ApiError('INVALID_IMAGE');
  }
}
