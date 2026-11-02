import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

/**
 * Tema de Memora (F10).
 *
 * - La cookie `memora-theme` guarda la preferencia (`light`, `dark`, `system`).
 * - El servidor resuelve el modo explícito para pintar `data-theme` en el HTML.
 * - Un script previo al primer pintado resuelve `system` con `matchMedia`.
 *
 * `THEME_COLORS` es la única fuente de hex fuera de los tokens: `theme-color`
 * necesita un valor concreto en `<meta>` y el script de arranque no puede leer
 * variables CSS. Un test comprueba que coincide con `tokens.css`.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_COOKIE = 'memora-theme';
export const DEFAULT_THEME_MODE: ThemeMode = 'system';
export const THEME_COOKIE_MAX_AGE = 31_536_000;

export const THEME_COLORS: Readonly<Record<ResolvedTheme, string>> = {
  light: '#F6F6FA',
  dark: '#0B0F1E',
};

export const FONT_PRELOAD: readonly string[] = ['/fonts/plus-jakarta-sans-latin-wght-normal.woff2'];

export function parseThemeMode(value: string | null | undefined): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_THEME_MODE;
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === 'dark') {
    return 'dark';
  }

  if (mode === 'light') {
    return 'light';
  }

  return prefersDark ? 'dark' : 'light';
}

/**
 * Resuelve el tema que debe llevar el documento. En cliente manda lo que el
 * script de arranque ya pintó: así el shell y `ThemeProvider` no se pelean por
 * `data-theme` cuando el modo es «sistema». En servidor no hay documento y se
 * resuelve el modo explícito (system → light hasta que el script lo ajuste).
 */
export function resolveDocumentTheme(mode: ThemeMode): ResolvedTheme {
  if (typeof document === 'undefined') {
    return resolveTheme(mode, false);
  }

  const painted = document.documentElement.dataset.theme;

  if (painted === 'light' || painted === 'dark') {
    return painted;
  }

  return resolveTheme(mode, prefersDarkColorScheme());
}

export function serializeThemeCookie(
  mode: ThemeMode,
  options: { readonly secure: boolean },
): string {
  const parts = [
    `${THEME_COOKIE}=${mode}`,
    'Path=/',
    `Max-Age=${THEME_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/** Lee una cookie de un `cookieString` sin tocar `document`. */
export function readCookieValue(cookieString: string, name: string): string | undefined {
  for (const pair of cookieString.split(';')) {
    const separator = pair.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (pair.slice(0, separator).trim() === name) {
      const raw = pair.slice(separator + 1).trim();

      try {
        return decodeURIComponent(raw);
      } catch {
        // Cookie corrupta: no debe tumbar el render SSR.
        return raw;
      }
    }
  }

  return undefined;
}

/** Guarda de SSR: fuera del navegador no hay cookie accesible. */
export function readThemeModeFromBrowserCookie(): ThemeMode {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME_MODE;
  }

  return parseThemeMode(readCookieValue(document.cookie, THEME_COOKIE));
}

/** Preferencia del sistema, con guarda para SSR y navegadores sin `matchMedia`. */
export function prefersDarkColorScheme(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resuelve la cookie en servidor (SSR) y en cliente. El plugin de TanStack
 * Start sustituye la implementación según el entorno; el servidor usa
 * `getCookie` dentro del ámbito de la petición.
 */
export const readThemeMode = createIsomorphicFn()
  .server((): ThemeMode => parseThemeMode(getCookie(THEME_COOKIE)))
  .client((): ThemeMode => readThemeModeFromBrowserCookie());

/**
 * Script de arranque. Se inyecta en `<head>` antes de cualquier contenido para
 * que `data-theme` y `theme-color` estén resueltos antes del primer pintado.
 * No usa `const`/`let` para minimizar el riesgo con CSP y no duplica hex: los
 * valores vienen de `THEME_COLORS`.
 */
export function createThemeInitScript(): string {
  const light = JSON.stringify(THEME_COLORS.light);
  const dark = JSON.stringify(THEME_COLORS.dark);

  return [
    '(function(){try{',
    `var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);`,
    `var v=m?decodeURIComponent(m[1]):'${DEFAULT_THEME_MODE}';`,
    `if(v!=='light'&&v!=='dark'&&v!=='system'){v='${DEFAULT_THEME_MODE}';}`,
    "var d=v==='dark'||(v==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);",
    "document.documentElement.dataset.theme=d?'dark':'light';",
    'var t=document.querySelector(\'meta[name="theme-color"]\');',
    `if(t){t.setAttribute('content',d?${dark}:${light});}`,
    '}catch(e){}})();',
  ].join('');
}
