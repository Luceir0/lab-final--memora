export interface ReverseGeocodingInput {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Reverse geocoding adapter. Coordinates are transient: callers must never
 * persist them, only the returned `placeName` (or `null` on failure).
 */
export interface GeocodingService {
  reverse(input: ReverseGeocodingInput): Promise<string | null>;
}
