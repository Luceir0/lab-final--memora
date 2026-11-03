/**
 * Destino de vuelta tras iniciar sesión o registrarse.
 *
 * El parámetro `redirect` viaja en la URL, así que es entrada no confiable.
 * Solo se aceptan rutas internas de la propia aplicación; cualquier otra cosa
 * se ignora en silencio y se usa el destino por defecto.
 */
export const DEFAULT_AUTH_REDIRECT = '/circles';

const INTERNAL_ORIGIN = 'http://internal';
const AUTH_PATHS = new Set(['/login', '/register']);

/** Caracteres de control que el navegador podría normalizar de forma engañosa. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/** Decodifica el pathname; una codificación inválida no es una ruta segura. */
function decodePathname(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

/**
 * Canoniza una ruta interna. Devuelve `null` si no es segura.
 *
 * - Empieza por `/` y no contiene `\` (los navegadores lo normalizan a `/`).
 * - `new URL` conserva el origen interno: bloquea `//host`, `http:`,
 *   `javascript:` y `data:`.
 * - El pathname decodificado se compara en minúsculas y sin barra final con
 *   `/login` y `/register`; así `/%6Cogin` y `/foo/../login` no pasan.
 * - Rechaza caracteres de control, `//` inicial, `\` y `://` ya decodificados.
 * - Devuelve la URL normalizada: `pathname + search + hash`.
 */
export function normalizeAuthRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\')) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== INTERNAL_ORIGIN) {
    return null;
  }

  const decoded = decodePathname(url.pathname);

  if (decoded === null) {
    return null;
  }

  if (
    CONTROL_CHARACTERS.test(decoded) ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    decoded.includes('://')
  ) {
    return null;
  }

  const pathname = decoded.toLowerCase().replace(/\/+$/, '');
  const normalized = pathname === '' ? '/' : pathname;

  if (AUTH_PATHS.has(normalized)) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/** Indica si un valor es una ruta interna segura a la que volver. */
export function isValidAuthRedirect(value: unknown): value is string {
  return normalizeAuthRedirect(value) !== null;
}

/** Devuelve la ruta a la que volver, o el destino por defecto si no es válida. */
export function resolveAuthRedirect(value: unknown): string {
  return normalizeAuthRedirect(value) ?? DEFAULT_AUTH_REDIRECT;
}

/**
 * Normaliza el `redirect` para pasarlo a un enlace cruzado: una ruta interna
 * válida o `undefined`. Así nunca se propaga una URL maliciosa.
 */
export function safeAuthRedirect(redirect: unknown): string | undefined {
  return normalizeAuthRedirect(redirect) ?? undefined;
}
