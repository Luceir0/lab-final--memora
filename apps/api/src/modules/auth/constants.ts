/** Opaque session cookie. Only its SHA-256 hash is persisted. */
export const SESSION_COOKIE_NAME = 'memora_session';

/** Readable double-submit cookie; the token is HMAC-bound to the session token. */
export const CSRF_COOKIE_NAME = 'memora_csrf';

/** Header that carries the CSRF token on authenticated mutations. */
export const CSRF_HEADER_NAME = 'x-csrf-token';
