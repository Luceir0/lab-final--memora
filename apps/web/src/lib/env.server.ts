/**
 * Entorno del servidor web.
 *
 * Este módulo solo lo importan `api-client.server.ts` y `vite.config.ts`;
 * nunca entra en el bundle del navegador. Por eso el valor por defecto del
 * origen interno puede vivir aquí en lugar de en `env.ts`.
 */

/** Origen por defecto de la API interna. No incluye `/api`. */
export const DEFAULT_SERVER_API_ORIGIN = 'http://127.0.0.1:3001';

/**
 * Mensaje seguro de configuración inválida.
 *
 * No incluye el valor ofensivo: podría contener credenciales o detalles de
 * infraestructura que no deben acabar en logs ni en una pantalla.
 */
export const INVALID_SERVER_API_ORIGIN_MESSAGE =
  'API_INTERNAL_URL debe ser una URL absoluta con protocolo http:// o https://, sin ruta, credenciales, query ni hash (por ejemplo, http://127.0.0.1:3001).';

/**
 * Resuelve y valida `API_INTERNAL_URL`.
 *
 * - Ausente, vacía o solo espacios: usa `DEFAULT_SERVER_API_ORIGIN`.
 * - Debe ser una URL absoluta con protocolo `http:` o `https:`.
 * - Debe ser un origen puro: sin ruta, query, hash ni credenciales.
 *
 * Lanza un `Error` en español ante un valor inválido para fallar al arrancar,
 * no en la primera petición.
 */
export function resolveServerApiOrigin(
  value: string | undefined = process.env.API_INTERNAL_URL,
): string {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed.length === 0) {
    return DEFAULT_SERVER_API_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(INVALID_SERVER_API_ORIGIN_MESSAGE);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(INVALID_SERVER_API_ORIGIN_MESSAGE);
  }

  const hasPath = url.pathname !== '/' && url.pathname !== '';
  const hasCredentials = url.username !== '' || url.password !== '';
  if (hasPath || hasCredentials || url.search !== '' || url.hash !== '') {
    throw new Error(INVALID_SERVER_API_ORIGIN_MESSAGE);
  }

  return url.origin;
}

/**
 * Base del cliente de servidor: el origen más `/api`.
 *
 * El proxy de Vite apunta al origen; el cliente HTTP necesita la base del
 * contrato (`/api`), igual que el navegador.
 */
export function buildServerApiBasePath(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/api`;
}
