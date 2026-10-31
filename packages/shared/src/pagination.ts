import { z } from 'zod';

import { VALIDATION_MESSAGES, pageLimitRangeMessage } from './validation-messages.js';

/** Items returned per page when the client does not send `limit`. */
export const DEFAULT_PAGE_LIMIT = 24;

export const MIN_PAGE_LIMIT = 1;

/** Hard ceiling enforced by the API for every cursor-paginated list. */
export const MAX_PAGE_LIMIT = 100;

export const MAX_CURSOR_LENGTH = 512;

/**
 * Shared query contract: `?cursor=<opaque>&limit=24`.
 *
 * `limit` arrives as a string in the URL, so it is coerced to a number and
 * validated against 1..100. Values outside the range are rejected, not
 * clamped.
 */
export const pageQuerySchema = z.object({
  cursor: z
    .string()
    .min(1, VALIDATION_MESSAGES.cursorRequired)
    .max(MAX_CURSOR_LENGTH, VALIDATION_MESSAGES.cursorTooLong)
    .optional(),
  limit: z.coerce
    .number()
    .int(VALIDATION_MESSAGES.limitInteger)
    .min(MIN_PAGE_LIMIT, pageLimitRangeMessage(MIN_PAGE_LIMIT, MAX_PAGE_LIMIT))
    .max(MAX_PAGE_LIMIT, pageLimitRangeMessage(MIN_PAGE_LIMIT, MAX_PAGE_LIMIT))
    .default(DEFAULT_PAGE_LIMIT),
});

export type PageQuery = z.output<typeof pageQuerySchema>;

export type PageQueryInput = z.input<typeof pageQuerySchema>;

/** Generic paginated payload: `{ items, nextCursor }`. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Builds the page schema for any item schema. */
export function createPageSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().min(1).nullable(),
  });
}

export interface BuildPageQueryParams {
  readonly cursor?: string | null | undefined;
  readonly limit?: number | null | undefined;
}

/**
 * Builds the cursor query string for a list request. Empty values are omitted
 * so the API applies its defaults. Pure: safe to use on server and client.
 */
export function buildPageQuery(params: BuildPageQueryParams = {}): string {
  const search: string[] = [];

  if (params.cursor !== undefined && params.cursor !== null && params.cursor !== '') {
    search.push(`cursor=${encodeURIComponent(params.cursor)}`);
  }

  if (params.limit !== undefined && params.limit !== null) {
    search.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }

  return search.length === 0 ? '' : `?${search.join('&')}`;
}
