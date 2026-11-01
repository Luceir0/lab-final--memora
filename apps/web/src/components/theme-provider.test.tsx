import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { THEME_COLORS, THEME_COOKIE } from '../lib/theme';

import { ThemeProvider, useTheme } from './theme-provider';

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'change') {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'change') {
        listeners.delete(listener);
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  const matchMedia = vi.fn(() => media as unknown as MediaQueryList);

  vi.stubGlobal('matchMedia', matchMedia);

  return {
    matchMedia,
    media,
    setMatches(matches: boolean) {
      media.matches = matches;

      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };
}

function installThemeColorMeta(): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  document.head.appendChild(meta);

  return meta;
}

function ThemeProbe() {
  const { mode, resolvedTheme, setMode } = useTheme();

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setMode('light')}>
        Claro
      </button>
      <button type="button" onClick={() => setMode('dark')}>
        Oscuro
      </button>
      <button type="button" onClick={() => setMode('system')}>
        Sistema
      </button>
    </div>
  );
}

function renderProvider(initialMode: 'light' | 'dark' | 'system') {
  return render(
    <ThemeProvider initialMode={initialMode}>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelector('meta[name="theme-color"]')?.remove();
});

describe('ThemeProvider', () => {
  it('toma el estado inicial del data-theme ya pintado en el documento', () => {
    document.documentElement.dataset.theme = 'dark';

    renderProvider('light');

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('sin data-theme resuelve system con matchMedia', () => {
    installMatchMedia(true);

    renderProvider('system');

    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('lee el modo guardado en la cookie cuando no recibe initialMode', () => {
    document.cookie = `${THEME_COOKIE}=dark; Path=/`;

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('setMode actualiza el atributo, theme-color y la cookie', () => {
    installMatchMedia(false);
    const meta = installThemeColorMeta();

    renderProvider('light');
    fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }));

    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark);
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it('en modo system sigue los cambios del sistema', () => {
    const controller = installMatchMedia(false);

    renderProvider('system');

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      controller.setMatches(true);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => {
      controller.setMatches(false);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('light');
  });

  it('no escucha al sistema en modos explícitos', () => {
    const controller = installMatchMedia(true);

    const { unmount } = renderProvider('dark');

    expect(controller.matchMedia).not.toHaveBeenCalled();
    expect(screen.getByTestId('resolved').textContent).toBe('dark');

    unmount();
  });

  it('limpia el listener de matchMedia al desmontar o cambiar de modo', () => {
    const controller = installMatchMedia(false);

    const { unmount } = renderProvider('system');

    expect(controller.listenerCount()).toBe(1);

    unmount();

    expect(controller.listenerCount()).toBe(0);
    expect(controller.media.removeEventListener).toHaveBeenCalled();
  });

  it('lanza un error claro fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeProbe />)).toThrow('useTheme debe usarse dentro de ThemeProvider');

    spy.mockRestore();
  });
});
