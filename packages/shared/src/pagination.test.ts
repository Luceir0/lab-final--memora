import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  MIN_PAGE_LIMIT,
  buildPageQuery,
  createPageSchema,
  pageQuerySchema,
  type Page,
} from './pagination.js';

describe('pageQuerySchema', () => {
  it('defaults the limit to 24 and leaves the cursor undefined', () => {
    expect(pageQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_LIMIT });
    expect(DEFAULT_PAGE_LIMIT).toBe(24);
  });

  it('coerces the limit from the query string', () => {
    expect(pageQuerySchema.parse({ limit: '50' })).toEqual({ limit: 50 });
    expect(pageQuerySchema.parse({ limit: '100' })).toEqual({ limit: 100 });
  });

  it('rejects limits outside 1..100 and non-integers', () => {
    expect(pageQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: '2.5' }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
    expect(MIN_PAGE_LIMIT).toBe(1);
    expect(MAX_PAGE_LIMIT).toBe(100);
  });

  it('accepts an opaque cursor and rejects an empty one', () => {
    expect(pageQuerySchema.parse({ cursor: 'clx-photo-1', limit: '10' })).toEqual({
      cursor: 'clx-photo-1',
      limit: 10,
    });
    expect(pageQuerySchema.safeParse({ cursor: '' }).success).toBe(false);
  });

  it('strips unknown query parameters', () => {
    expect(pageQuerySchema.parse({ limit: '10', personId: 'user-1' })).toEqual({ limit: 10 });
  });
});

describe('createPageSchema', () => {
  const itemSchema = z.object({ id: z.string().min(1) });
  const pageSchema = createPageSchema(itemSchema);

  it('parses a full page', () => {
    const parsed = pageSchema.parse({
      items: [{ id: 'a' }, { id: 'b' }],
      nextCursor: 'cursor-2',
    });

    expect(parsed).toEqual({ items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'cursor-2' });
  });

  it('accepts the last page with a null cursor', () => {
    const parsed = pageSchema.parse({ items: [], nextCursor: null });
    const typed: Page<{ id: string }> = parsed;

    expect(typed.nextCursor).toBeNull();
    expect(typed.items).toEqual([]);
  });

  it('rejects a malformed page', () => {
    expect(pageSchema.safeParse({ items: [{ id: '' }], nextCursor: null }).success).toBe(false);
    expect(pageSchema.safeParse({ items: [], nextCursor: '' }).success).toBe(false);
    expect(pageSchema.safeParse({ items: [] }).success).toBe(false);
    expect(pageSchema.safeParse({ items: {}, nextCursor: null }).success).toBe(false);
  });

  it('applies the item schema to every element', () => {
    const strictItem = z.object({ id: z.string(), extra: z.number() });
    const strictPage = createPageSchema(strictItem);

    expect(strictPage.safeParse({ items: [{ id: 'a', extra: 1 }], nextCursor: null }).success).toBe(
      true,
    );
    expect(strictPage.safeParse({ items: [{ id: 'a' }], nextCursor: null }).success).toBe(false);
  });
});

describe('buildPageQuery', () => {
  function parseQuery(query: string): Record<string, string> {
    const pairs = query.replace(/^\?/, '').split('&').filter(Boolean);

    return Object.fromEntries(
      pairs.map((pair) => {
        const [key = '', value = ''] = pair.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value)];
      }),
    );
  }

  it('returns an empty string when there is nothing to send', () => {
    expect(buildPageQuery()).toBe('');
    expect(buildPageQuery({})).toBe('');
    expect(buildPageQuery({ cursor: null, limit: null })).toBe('');
    expect(buildPageQuery({ cursor: '' })).toBe('');
  });

  it('serialises cursor and limit in a stable order', () => {
    expect(buildPageQuery({ cursor: 'abc', limit: 24 })).toBe('?cursor=abc&limit=24');
    expect(buildPageQuery({ limit: 10, cursor: 'abc' })).toBe('?cursor=abc&limit=10');
  });

  it('omits only the missing value', () => {
    expect(buildPageQuery({ cursor: 'abc' })).toBe('?cursor=abc');
    expect(buildPageQuery({ limit: 5 })).toBe('?limit=5');
  });

  it('encodes opaque cursors', () => {
    expect(buildPageQuery({ cursor: 'a b&c=d/e' })).toBe('?cursor=a%20b%26c%3Dd%2Fe');
  });

  it('round-trips through the query schema', () => {
    const query = buildPageQuery({ cursor: 'next page', limit: MAX_PAGE_LIMIT });

    expect(pageQuerySchema.parse(parseQuery(query))).toEqual({
      cursor: 'next page',
      limit: MAX_PAGE_LIMIT,
    });
  });
});
