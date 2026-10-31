/** Product name, shared by every workspace that renders it. */
export const SITE_NAME = 'Memora' as const;

export type SiteName = typeof SITE_NAME;

export * from './errors.js';
export * from './pagination.js';
export * from './permissions.js';
export * from './schemas/index.js';
