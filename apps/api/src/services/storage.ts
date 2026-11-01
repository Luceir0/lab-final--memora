/**
 * Private object storage adapter. Implemented in F25 (S3/Silo) and replaced by
 * an in-memory fake in tests.
 */
export interface StoredObject {
  readonly body: Buffer;
  readonly contentType: string;
}

export interface StorageService {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}
