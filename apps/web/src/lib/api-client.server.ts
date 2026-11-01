/**
 * Cliente de API para SSR y server functions.
 *
 * El marcador `server-only` hace que el plugin de TanStack Start rechace
 * cualquier import de este módulo desde el entorno cliente. `API_INTERNAL_URL`
 * nunca debe acabar en `dist/client`.
 */
import '@tanstack/react-start/server-only';

import { createApiClient, type ApiClient, type FetchLike } from '@memora/api-client';

import { buildServerApiBasePath, resolveServerApiOrigin } from './env.server';

/** Opciones de test: permiten sustituir `fetch` y la base sin red real. */
export interface ServerApiClientOptions {
  /** Base completa (`http://host:puerto/api`) para tests. Si falta, se deriva del origen. */
  readonly basePath?: string;
  /** Implementación de `fetch` inyectable. En producción, la global. */
  readonly fetch?: FetchLike;
}

/**
 * Base del cliente de servidor a partir de `API_INTERNAL_URL`.
 *
 * `API_INTERNAL_URL` es un origen (`http://127.0.0.1:3001`); la base del
 * contrato (`/api`) se añade aquí. Así el proxy y el cliente no confunden
 * origen con base.
 */
export function resolveServerApiBasePath(
  value: string | undefined = process.env.API_INTERNAL_URL,
): string {
  return buildServerApiBasePath(resolveServerApiOrigin(value));
}

/** Crea un cliente de API para el servidor. */
export function createServerApiClient(options: ServerApiClientOptions = {}): ApiClient {
  // Evaluación perezosa: si el test pasa una base explícita, no se valida el
  // entorno. En producción, sin base, `resolveServerApiBasePath` falla rápido
  // ante un `API_INTERNAL_URL` inválido.
  const basePath = options.basePath ?? resolveServerApiBasePath();

  return createApiClient({
    basePath,
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
  });
}

/**
 * Instancia del servidor. Es stateless (sin sesión ni caché), así que puede
 * compartirse entre peticiones sin filtrar datos.
 */
export const serverApiClient = createServerApiClient();
