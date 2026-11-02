import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createThemeInitScript,
  FONT_PRELOAD,
  parseThemeMode,
  prefersDarkColorScheme,
  readCookieValue,
  readThemeModeFromBrowserCookie,
  resolveDocumentTheme,
  resolveTheme,
  serializeThemeCookie,
  THEME_COLORS,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
} from './theme';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '../..');
const tokensPath = path.join(repoRoot, 'packages/ui/src/styles/tokens.css');

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => {
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  });
}

function executeInitScript(): void {
  new Function(createThemeInitScript())();
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelector('meta[name="theme-color"]')?.remove();
});

describe('parseThemeMode', () => {
  it('acepta los tres modos y cae a system con valores desconocidos', () => {
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('system')).toBe('system');
    expect(parseThemeMode('auto')).toBe('system');
    expect(parseThemeMode('')).toBe('system');
    expect(parseThemeMode(null)).toBe('system');
    expect(parseThemeMode(undefined)).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('respeta el modo explícito y usa la preferencia del sistema en system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('resolveDocumentTheme', () => {
  it('en cliente manda el data-theme ya pintado', () => {
    document.documentElement.dataset.theme = 'dark';

    /*
     * Intencionado: el valor pintado gana al modo explícito. `ThemeProvider`
     * mantiene `painted === resolvedTheme`, así el shell nunca pisa lo que el
     * usuario ve al navegar.
     */
    expect(resolveDocumentTheme('system')).toBe('dark');
    expect(resolveDocumentTheme('light')).toBe('dark');
  });

  it('sin data-theme resuelve system con matchMedia', () => {
    delete document.documentElement.dataset.theme;
    stubMatchMedia(true);

    expect(resolveDocumentTheme('system')).toBe('dark');
  });

  it('en servidor no toca document y resuelve el modo explícito', () => {
    vi.stubGlobal('document', undefined);

    expect(resolveDocumentTheme('system')).toBe('light');
    expect(resolveDocumentTheme('light')).toBe('light');
    expect(resolveDocumentTheme('dark')).toBe('dark');
  });
});

describe('serializeThemeCookie', () => {
  it('serializa Path, Max-Age y SameSite, con Secure solo en https', () => {
    expect(serializeThemeCookie('system', { secure: false })).toBe(
      `${THEME_COOKIE}=system; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`,
    );
    expect(serializeThemeCookie('dark', { secure: true })).toBe(
      `${THEME_COOKIE}=dark; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
    );
  });
});

describe('lectura de cookie', () => {
  it('encuentra la cookie entre otras y decodifica el valor', () => {
    expect(readCookieValue('a=1; memora-theme=dark; b=2', THEME_COOKIE)).toBe('dark');
    expect(readCookieValue('a=1; other=dark', THEME_COOKIE)).toBeUndefined();
    expect(readCookieValue('', THEME_COOKIE)).toBeUndefined();
    expect(readCookieValue(`${THEME_COOKIE}=%E0%A4%A`, THEME_COOKIE)).toBe('%E0%A4%A');
  });

  it('resuelve el modo desde document.cookie en cliente', () => {
    expect(readThemeModeFromBrowserCookie()).toBe('system');

    document.cookie = `${THEME_COOKIE}=dark; Path=/`;

    expect(readThemeModeFromBrowserCookie()).toBe('dark');
  });
});

describe('guardas de SSR', () => {
  it('no toca document cuando no existe', () => {
    vi.stubGlobal('document', undefined);

    expect(readThemeModeFromBrowserCookie()).toBe('system');
  });

  it('no toca window cuando no existe', () => {
    vi.stubGlobal('window', undefined);

    expect(prefersDarkColorScheme()).toBe(false);
  });

  it('devuelve false si el navegador no implementa matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(prefersDarkColorScheme()).toBe(false);
  });
});

describe('script de arranque', () => {
  it('aplica oscuro desde system y actualiza theme-color antes del pintado', () => {
    stubMatchMedia(true);
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    executeInitScript();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);
  });

  it('respeta un modo explícito por encima de la preferencia del sistema', () => {
    stubMatchMedia(true);
    document.cookie = `${THEME_COOKIE}=light; Path=/`;
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    executeInitScript();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.light);
  });

  it('trata una cookie inválida como system', () => {
    stubMatchMedia(false);
    document.cookie = `${THEME_COOKIE}=auto; Path=/`;

    executeInitScript();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('no falla si falta el meta theme-color', () => {
    stubMatchMedia(false);

    expect(() => executeInitScript()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('no duplica hex: el script solo contiene los valores de THEME_COLORS', () => {
    const script = createThemeInitScript();
    const hexes = [...script.matchAll(/#[0-9a-f]{6}/gi)].map((match) => match[0].toUpperCase());

    expect(script).toContain(JSON.stringify(THEME_COLORS.light));
    expect(script).toContain(JSON.stringify(THEME_COLORS.dark));
    expect(new Set(hexes)).toEqual(new Set([THEME_COLORS.light, THEME_COLORS.dark]));
  });
});

describe('THEME_COLORS y fuentes', () => {
  it('coincide con --memora-bg de tokens.css en claro y oscuro', () => {
    const tokensCss = readFileSync(tokensPath, 'utf8');
    const light = tokensCss.match(/:root\s*\{[\s\S]*?--memora-bg:\s*(#[0-9a-f]{6})/i)?.[1];
    const dark = tokensCss.match(
      /\[data-theme='dark'\]\s*\{[\s\S]*?--memora-bg:\s*(#[0-9a-f]{6})/i,
    )?.[1];

    expect(light?.toLowerCase()).toBe(THEME_COLORS.light.toLowerCase());
    expect(dark?.toLowerCase()).toBe(THEME_COLORS.dark.toLowerCase());
  });

  it('precarga solo el subset latin', () => {
    expect(FONT_PRELOAD).toEqual(['/fonts/plus-jakarta-sans-latin-wght-normal.woff2']);
  });

  it('vendoriza los .woff2 reales y la licencia OFL', () => {
    const fontsDir = path.join(webRoot, 'public', 'fonts');
    const files = [
      'plus-jakarta-sans-latin-wght-normal.woff2',
      'plus-jakarta-sans-latin-ext-wght-normal.woff2',
    ];

    for (const file of files) {
      const fullPath = path.join(fontsDir, file);

      expect(existsSync(fullPath), `Falta ${file}`).toBe(true);

      const bytes = readFileSync(fullPath);

      expect(bytes.subarray(0, 4).toString('ascii'), `${file} no es un woff2`).toBe('wOF2');
      expect(bytes.byteLength).toBeGreaterThan(1000);
    }

    const ofl = readFileSync(path.join(fontsDir, 'OFL.txt'), 'utf8');

    expect(ofl).toContain('SIL Open Font License');
  });
});
