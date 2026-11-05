import { describe, expect, it } from 'vitest';

import type { StorageService } from '../../services/storage.ts';
import { DELETE_OBJECTS_CONCURRENCY, deleteObjects } from './objects.ts';

describe('deleteObjects', () => {
  it('bounds concurrency and reports failures without stopping the rest', async () => {
    let active = 0;
    let maxActive = 0;
    let attempts = 0;

    const storage: StorageService = {
      put: async () => undefined,
      get: async () => null,
      delete: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        attempts += 1;
        const attempt = attempts;
        await new Promise((resolve) => {
          setTimeout(resolve, 1);
        });
        active -= 1;

        if (attempt % 10 === 0) {
          throw new Error('storage failure');
        }
      },
    };

    const keys = Array.from({ length: 40 }, (_, index) => `circles/c/photos/p/object-${index}`);
    const result = await deleteObjects(storage, keys);

    expect(maxActive).toBeLessThanOrEqual(DELETE_OBJECTS_CONCURRENCY);
    expect(result).toEqual({ total: 40, failures: 4 });
  });
});
