import { createApiClient, type ApiClient, type FetchLike } from '@memora/api-client';

import { DEFAULT_BROWSER_API_BASE_PATH, resolveApiBasePath } from './env';

/** Opciones de test: permiten sustituir `fetch` y la base sin red real. */
export interface BrowserApiClientOptions {
  /** Ruta o URL absoluta de la API. Si falta, se usa `VITE_API_BASE_URL`. */
  readonly basePath?: string;
  /** Implementación de `fetch` inyectable. En producción, la global. */
  readonly fetch?: FetchLike;
}

/**
 * Base del cliente de navegador.
 *
 * `VITE_API_BASE_URL` llega desde el bundle (solo variables `VITE_*`). Si no
 * existe o está vacía, se usa `/api`, que en desarrollo pasa por el proxy de
 * Vite y en producción debe apuntar al mismo origen.
 */
export function resolveBrowserApiBasePath(
  value: string | undefined = import.meta.env.VITE_API_BASE_URL,
): string {
  return resolveApiBasePath(value, DEFAULT_BROWSER_API_BASE_PATH);
}

/**
 * Crea un cliente de API para el navegador.
 *
 * No guarda sesión ni CSRF: eso vive en capas superiores. Solo configura la
 * base y, en tests, un `fetch` sustituido.
 */
export function createBrowserApiClient(options: BrowserApiClientOptions = {}): ApiClient {
  return createApiClient({
    basePath: resolveApiBasePath(options.basePath, resolveBrowserApiBasePath()),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
  });
}

/** Instancia compartida por la app en el navegador. */
export const apiClient = createBrowserApiClient();
