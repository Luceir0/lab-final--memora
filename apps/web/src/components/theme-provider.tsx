import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  readThemeModeFromBrowserCookie,
  resolveTheme,
  serializeThemeCookie,
  THEME_COLORS,
  prefersDarkColorScheme,
  type ResolvedTheme,
  type ThemeMode,
} from '../lib/theme';

interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolvedTheme: ResolvedTheme;
  readonly setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** `useLayoutEffect` en cliente para no pintar un frame con el tema anterior. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function readPaintedTheme(): ResolvedTheme {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function initialResolvedTheme(mode: ThemeMode): ResolvedTheme {
  if (typeof document === 'undefined') {
    return resolveTheme(mode, false);
  }

  // El script de arranque ya dejó `data-theme` antes de hidratar.
  if (document.documentElement.dataset.theme) {
    return readPaintedTheme();
  }

  return resolveTheme(mode, mode === 'system' && prefersDarkColorScheme());
}

interface ThemeProviderProps {
  readonly children: ReactNode;
  /** Preferencia resuelta en servidor desde la cookie. */
  readonly initialMode?: ThemeMode;
}

/**
 * Aplica el tema al documento y escucha al sistema solo en modo `system`.
 *
 * El estado inicial de `resolvedTheme` sale del `data-theme` que el script de
 * arranque ya dejó pintado, para no provocar un desajuste de hidratación. La
 * cookie sigue siendo la fuente de verdad del modo explícito.
 */
export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => initialMode ?? readThemeModeFromBrowserCookie(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    initialResolvedTheme(mode),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setResolvedTheme(resolveTheme(next, prefersDarkColorScheme()));

    if (typeof document !== 'undefined') {
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const cookie = serializeThemeCookie(next, { secure });

      // `Max-Age` se pone explícitamente para que jsdom y navegadores reales
      // guarden la preferencia durante un año.
      document.cookie = cookie;
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      meta.setAttribute('content', THEME_COLORS[resolvedTheme]);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (
      mode !== 'system' ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = () => {
      setResolvedTheme(media.matches ? 'dark' : 'light');
    };

    applySystemTheme();
    media.addEventListener('change', applySystemTheme);

    return () => {
      media.removeEventListener('change', applySystemTheme);
    };
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme, setMode }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }

  return context;
}
