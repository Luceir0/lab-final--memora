import { describe, expect, it } from 'vitest';

import { SITE_NAME } from './index.js';

describe('@memora/shared', () => {
  it('exposes the product name', () => {
    expect(SITE_NAME).toBe('Memora');
  });
});
