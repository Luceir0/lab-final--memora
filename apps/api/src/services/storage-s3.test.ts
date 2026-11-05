import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';

import {
  createS3StorageService,
  StorageError,
  type S3ClientLike,
  type S3StorageOptions,
} from './storage-s3.ts';

interface CapturedCommand {
  readonly input: Record<string, unknown>;
}

const OPTIONS: Omit<S3StorageOptions, 'client'> = {
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  bucket: 'memora-test',
  accessKeyId: 'memora',
  secretAccessKey: 'memora123',
  forcePathStyle: true,
};

function createFakeClient(handler?: (command: CapturedCommand) => Promise<unknown>): {
  readonly client: S3ClientLike;
  readonly commands: CapturedCommand[];
  readonly signals: Array<AbortSignal | undefined>;
} {
  const commands: CapturedCommand[] = [];
  const signals: Array<AbortSignal | undefined> = [];

  return {
    commands,
    signals,
    client: {
      send: vi.fn(async (command: unknown, options?: { readonly abortSignal?: AbortSignal }) => {
        const captured = command as CapturedCommand;
        commands.push(captured);
        signals.push(options?.abortSignal);

        return handler === undefined ? {} : handler(captured);
      }),
    },
  };
}

function createService(client: S3ClientLike) {
  return createS3StorageService({ ...OPTIONS, client });
}

describe('createS3StorageService', () => {
  it('puts an object with its content type under the server-generated key', async () => {
    const { client, commands } = createServiceClient();
    const storage = createService(client);
    const body = Buffer.from('fake-jpeg');

    await storage.put('circles/c1/photos/p1/original.jpg', body, 'image/jpeg');

    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeInstanceOf(PutObjectCommand);
    expect(commands[0]?.input).toMatchObject({
      Bucket: 'memora-test',
      Key: 'circles/c1/photos/p1/original.jpg',
      ContentType: 'image/jpeg',
      ContentLength: body.byteLength,
    });
    expect(commands[0]?.input.Body).toEqual(body);
  });

  it('passes a fresh abort signal to put, get and delete', async () => {
    const { client, signals } = createServiceClient(async () => ({
      Body: { transformToByteArray: async () => new Uint8Array([1]) },
      ContentType: 'application/octet-stream',
    }));
    const storage = createService(client);

    await storage.put('circles/c1/photos/p1/original.jpg', Buffer.from('x'), 'image/jpeg');
    await storage.get('circles/c1/photos/p1/original.jpg');
    await storage.delete('circles/c1/photos/p1/original.jpg');

    expect(signals).toHaveLength(3);

    for (const signal of signals) {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);
    }

    expect(signals[0]).not.toBe(signals[1]);
    expect(signals[1]).not.toBe(signals[2]);
  });

  it('gets an object body and content type', async () => {
    const payload = new TextEncoder().encode('webp-bytes');
    const { client } = createServiceClient(async () => ({
      Body: { transformToByteArray: async () => payload },
      ContentType: 'image/webp',
    }));
    const storage = createService(client);

    const stored = await storage.get('circles/c1/photos/p1/thumb.webp');

    expect(stored).not.toBeNull();
    expect(stored?.body).toEqual(Buffer.from(payload));
    expect(stored?.contentType).toBe('image/webp');
  });

  it('returns null when S3 reports NoSuchKey', async () => {
    const { client } = createServiceClient(async () => {
      throw Object.assign(new Error('missing'), { name: 'NoSuchKey' });
    });
    const storage = createService(client);

    await expect(storage.get('circles/c1/photos/missing.jpg')).resolves.toBeNull();
  });

  it('returns null for a 404 response', async () => {
    const { client } = createServiceClient(async () => {
      throw Object.assign(new Error('not found'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      });
    });
    const storage = createService(client);

    await expect(storage.get('circles/c1/photos/missing.jpg')).resolves.toBeNull();
  });

  it('deletes an object', async () => {
    const { client, commands } = createServiceClient();
    const storage = createService(client);

    await storage.delete('circles/c1/photos/p1/original.jpg');

    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeInstanceOf(DeleteObjectCommand);
    expect(commands[0]?.input).toMatchObject({
      Bucket: 'memora-test',
      Key: 'circles/c1/photos/p1/original.jpg',
    });
  });

  it('propagates get and delete failures as typed errors', async () => {
    const getClient = createServiceClient(async () => {
      throw new Error('network down');
    }).client;
    const deleteClient = createServiceClient(async () => {
      throw new Error('network down');
    }).client;

    await expect(createService(getClient).get('circles/c1/photos/p1/original.jpg')).rejects.toThrow(
      StorageError,
    );
    await expect(
      createService(deleteClient).delete('circles/c1/photos/p1/original.jpg'),
    ).rejects.toThrow(StorageError);
  });

  it('never echoes credentials when wrapping a failure', async () => {
    const original = new Error('access key memora rejected: secret memora123');
    const { client } = createServiceClient(async () => {
      throw original;
    });

    try {
      await createService(client).put(
        'circles/c1/photos/p1/original.jpg',
        Buffer.from('x'),
        'image/jpeg',
      );
      throw new Error('put should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError);
      expect((error as Error).message).not.toContain('memora123');
      expect((error as Error).message).not.toContain('access key memora rejected');
      expect((error as Error).cause).toBe(original);
    }
  });
});

function createServiceClient(handler?: (command: CapturedCommand) => Promise<unknown>) {
  return createFakeClient(handler);
}
