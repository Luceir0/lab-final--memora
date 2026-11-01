/**
 * Valores por defecto de las dos bases de la API.
 *
 * - El navegador habla con `/api` y Vite hace de proxy (sin CORS en local).
 * - El servidor de SSR habla con el origen interno; la base `/api` se añade
 *   en `env.server.ts`, que no entra en el bundle del navegador.
 *
 * Ninguno de los dos valores es un secreto: se pueden documentar y cambiar.
 */
export const DEFAULT_BROWSER_API_BASE_PATH = '/api';

/**
 * Normaliza una base de API y aplica el valor por defecto.
 *
 * Reglas:
 * - `undefined`, vacío o solo espacios usan el fallback.
 * - Se quitan las barras finales para que el cliente construya URLs sin `//`.
 * - Nunca devuelve una cadena vacía.
 *
 * Acepta tanto una ruta (`/api`) como una URL absoluta
 * (`http://127.0.0.1:3001/api`), igual que `createApiClient` de
 * `@memora/api-client`.
 */
export function resolveApiBasePath(value: string | undefined, fallback: string): string {
  const fallbackBase = fallback.replace(/\/+$/, '');
  const trimmed = value?.trim();
  const candidate = trimmed !== undefined && trimmed.length > 0 ? trimmed : fallbackBase;
  const normalized = candidate.replace(/\/+$/, '');

  return normalized.length > 0 ? normalized : fallbackBase;
}
