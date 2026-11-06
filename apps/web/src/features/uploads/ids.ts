/**
 * Identificador local y `clientUploadId`.
 *
 * `crypto.randomUUID()` no existe en navegadores antiguos ni en algunos
 * contextos no seguros. El fallback usa `getRandomValues` cuando está
 * disponible; el último recurso solo se usa si no hay Web Crypto.
 */
export function createClientUploadId(): string {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject !== undefined && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }

  if (cryptoObject !== undefined && typeof cryptoObject.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoObject.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Id local del item; estable durante toda su vida en la cola. */
export function createUploadItemId(): string {
  return createClientUploadId();
}
