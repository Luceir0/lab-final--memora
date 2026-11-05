/**
 * Minimal typings for `piexifjs@1.0.6`, which ships no `.d.ts`.
 *
 * Only the surface used by the deterministic image fixtures is declared.
 */
declare module 'piexifjs' {
  export type IfdTags = Record<number, unknown>;

  export interface ExifDict {
    '0th'?: IfdTags;
    Exif?: IfdTags;
    GPS?: IfdTags;
    Interop?: IfdTags;
    '1st'?: IfdTags;
    thumbnail?: string | null;
  }

  export interface Piexif {
    readonly ImageIFD: {
      readonly Orientation: number;
    };
    readonly ExifIFD: {
      readonly DateTimeOriginal: number;
    };
    readonly GPSIFD: {
      readonly GPSLatitudeRef: number;
      readonly GPSLatitude: number;
      readonly GPSLongitudeRef: number;
      readonly GPSLongitude: number;
    };
    dump(exif: ExifDict): string;
    insert(exif: string, jpeg: string): string;
    load(data: string): ExifDict;
  }

  const piexif: Piexif;

  export default piexif;
}
