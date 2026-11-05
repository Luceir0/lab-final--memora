import { randomUUID } from 'node:crypto';

import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createS3StorageService } from './storage-s3.ts';
import type { StorageService } from './storage.ts';

/**
 * Optional real round-trip against the local Silo/MinIO container.
 *
 * Runs only with `S3_INTEGRATION=1`; the normal suite skips it, so CI never
 * needs a bucket. Defaults match `docker-compose.yml`; override them through
 * the environment without writing an `.env`.
 */
const ENABLED = process.env.S3_INTEGRATION === '1';

const ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
const REGION = process.env.S3_REGION ?? 'us-east-1';
const BUCKET = process.env.S3_BUCKET ?? 'memora-test';
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? 'memora';
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? 'memora123';
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE !== 'false';

function isMissingBucket(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    readonly name?: unknown;
    readonly $metadata?: { readonly httpStatusCode?: unknown };
  };

  return (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchBucket' ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

describe.skipIf(!ENABLED)('S3 adapter against Silo (integration)', () => {
  const key = `_integration/${randomUUID()}.txt`;
  const body = Buffer.from('memora integration test');
  const client = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    forcePathStyle: FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
  let storage: StorageService;

  beforeAll(async () => {
    try {
      await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    } catch (error) {
      if (!isMissingBucket(error)) {
        throw error;
      }

      await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    }

    storage = createS3StorageService({
      endpoint: ENDPOINT,
      region: REGION,
      bucket: BUCKET,
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      forcePathStyle: FORCE_PATH_STYLE,
    });
  });

  afterAll(async () => {
    try {
      await storage.delete(key);
    } catch {
      // Best-effort cleanup: the assertion below is what matters.
    } finally {
      client.destroy();
    }
  });

  it('puts, gets and deletes a small object', async () => {
    await storage.put(key, body, 'text/plain');

    const stored = await storage.get(key);

    expect(stored).not.toBeNull();
    expect(stored?.body).toEqual(body);
    expect(stored?.contentType).toContain('text/plain');

    await storage.delete(key);

    await expect(storage.get(key)).resolves.toBeNull();
  });
});
