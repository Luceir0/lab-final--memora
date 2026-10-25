/** Base path used by the browser to reach the Memora API. */
export const DEFAULT_API_BASE_PATH = '/api' as const;

export type ApiBasePath = typeof DEFAULT_API_BASE_PATH;
