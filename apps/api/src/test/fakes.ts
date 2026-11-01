import type {
  EmailMessage,
  EmailService,
  GeocodingService,
  ReverseGeocodingInput,
  Services,
  StorageService,
  StoredObject,
} from '../services/index.ts';

export interface FakeStorageService extends StorageService {
  /** Objects currently stored, keyed by server-generated object key. */
  readonly objects: Map<string, StoredObject>;
}

export function createFakeStorageService(): FakeStorageService {
  const objects = new Map<string, StoredObject>();

  return {
    objects,
    put: async (key, body, contentType) => {
      objects.set(key, { body: Buffer.from(body), contentType });
    },
    get: async (key) => {
      const stored = objects.get(key);

      return stored === undefined
        ? null
        : { body: Buffer.from(stored.body), contentType: stored.contentType };
    },
    delete: async (key) => {
      objects.delete(key);
    },
  };
}

export interface FakeEmailService extends EmailService {
  /** Captured messages; tests assert on them instead of sending real email. */
  readonly messages: EmailMessage[];
}

export function createFakeEmailService(): FakeEmailService {
  const messages: EmailMessage[] = [];

  return {
    messages,
    send: async (message) => {
      messages.push(message);
    },
  };
}

export interface FakeGeocodingService extends GeocodingService {
  readonly requests: ReverseGeocodingInput[];
  /** Value returned by `reverse`; `null` models a provider failure. */
  placeName: string | null;
}

export function createFakeGeocodingService(placeName: string | null = 'Palma, Mallorca'): FakeGeocodingService {
  const requests: ReverseGeocodingInput[] = [];

  return {
    requests,
    placeName,
    reverse: async (input) => {
      requests.push(input);

      return placeName;
    },
  };
}

export interface FakeServices extends Services {
  readonly storage: FakeStorageService;
  readonly email: FakeEmailService;
  readonly geocoding: FakeGeocodingService;
}

/** In-memory adapters: no network, no real bucket, no real SMTP. */
export function createFakeServices(): FakeServices {
  return {
    kind: 'fake',
    storage: createFakeStorageService(),
    email: createFakeEmailService(),
    geocoding: createFakeGeocodingService(),
  };
}
