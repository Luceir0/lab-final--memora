import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { ThemeProvider } from '../theme-provider';

import { AppShell } from './app-shell';

/**
 * `Link` real exige un router montado. En estas pruebas el shell se renderiza
 * aislado y solo necesitamos que el enlace sea un `<a>` con su `href` y sus
 * atributos de accesibilidad. La integración con el router real se cubre en
 * `app-shell.router.test.tsx`.
 */
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
  }: {
    readonly to: string;
    readonly children?: ReactNode;
    readonly className?: string;
    readonly 'aria-label'?: string;
    readonly 'aria-current'?: 'page' | undefined;
  }) => (
    <a href={to} className={className} aria-label={ariaLabel} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

function renderShell(
  options: {
    readonly currentPath?: string;
    readonly circleList?: ReactNode;
    readonly user?: { name: string };
  } = {},
) {
  return render(
    <ThemeProvider initialMode="system">
      <AppShell
        currentPath={options.currentPath}
        circleList={options.circleList}
        user={options.user}
      >
        <h1>Contenido de la página</h1>
      </AppShell>
    </ThemeProvider>,
  );
}

function getNav(): HTMLElement {
  const navs = screen.getAllByRole('navigation');
  expect(navs).toHaveLength(1);

  const nav = navs[0];

  if (!nav) {
    throw new Error('No hay navegación principal');
  }

  return nav;
}

function currentLinks(): HTMLElement[] {
  return within(getNav())
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page');
}

describe('AppShell', () => {
  it('monta una sola navegación con los cinco destinos, una vez cada uno', () => {
    renderShell();

    const links = within(getNav()).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/circles',
      '/uploads',
      '/profile',
      '/help',
      '/privacy',
    ]);
    expect(new Set(links.map((link) => link.getAttribute('href'))).size).toBe(5);
  });

  it('muestra las etiquetas móviles y las de escritorio en el mismo árbol', () => {
    renderShell();

    const nav = getNav();

    for (const label of ['Círculos', 'Subir', 'Perfil', 'Ayuda', 'Privacidad']) {
      expect(within(nav).getAllByText(label).length).toBeGreaterThan(0);
    }

    expect(within(nav).getByText('Mis círculos')).toBeTruthy();
    expect(within(nav).getByText('Subidas')).toBeTruthy();
  });

  it('da a «Subir» un nombre accesible desambiguado sin cambiar su etiqueta visible', () => {
    renderShell();

    const upload = within(getNav()).getByRole('link', { name: /Subir fotos/ });

    expect(upload.getAttribute('href')).toBe('/uploads');
    expect(upload.textContent).toContain('Subir');
  });

  it('marca con aria-current únicamente el destino activo', () => {
    renderShell({ currentPath: '/help' });

    const current = currentLinks();

    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute('href')).toBe('/help');
  });

  it('considera activo un destino también en sus rutas hijas', () => {
    renderShell({ currentPath: '/circles/familia-garcia' });

    expect(currentLinks().map((link) => link.getAttribute('href'))).toEqual(['/circles']);
  });

  it('no marca ningún destino cuando la ruta está fuera del shell', () => {
    renderShell({ currentPath: '/login' });

    expect(currentLinks()).toHaveLength(0);
  });

  it('neutraliza aria-current en los logotipos', () => {
    renderShell();

    const logos = screen.getAllByRole('link', { name: 'memora' });

    expect(logos).toHaveLength(2);

    for (const logo of logos) {
      expect(logo.getAttribute('aria-current')).toBe('false');
    }
  });

  it('pone el skip link como primer enfocable y apunta al main enfocable', () => {
    renderShell();

    const skip = screen.getByRole('link', { name: 'Saltar al contenido' });

    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(skip.className).toContain('focus:translate-y-0');

    const main = screen.getByRole('main');

    expect(main.getAttribute('id')).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');

    const firstFocusable = document.querySelector('a[href], button, input, [tabindex]');
    expect(firstFocusable).toBe(skip);
  });

  it('deriva la barra y el relleno del contenido de la misma altura, con safe areas', () => {
    renderShell();

    const nav = getNav();
    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');

    expect(nav.className).toContain(
      'min-h-[calc(var(--app-bottom-nav-min-height)+env(safe-area-inset-bottom))]',
    );
    expect(nav.className).toContain('env(safe-area-inset-left)');
    expect(nav.className).toContain('env(safe-area-inset-right)');

    expect(main.className).toContain('pb-[var(--app-bottom-nav-height)]');
    expect(main.className).toContain('env(safe-area-inset-left)');
    expect(main.className).toContain('env(safe-area-inset-right)');

    expect(header.className).toContain('--app-topbar-height');
    expect(header.className).toContain('env(safe-area-inset-left)');
    expect(header.className).toContain('env(safe-area-inset-right)');
  });

  it('deja «Subir» en el centro de la barra con 44 px de área táctil', () => {
    renderShell();

    const upload = within(getNav()).getByRole('link', { name: /Subir fotos/ });
    const iconShape = upload.querySelector('span');

    expect(upload.className).toContain('w-full');
    expect(upload.className).toContain('h-full');
    expect(iconShape?.className).toContain('size-11');
    expect(iconShape?.className).toContain('rounded-full');
    expect(iconShape?.className).toContain('bg-primary');
  });

  it('coloca la lista de círculos como grupo entre Subidas y Ayuda, sin encabezado', () => {
    const { rerender } = renderShell();

    expect(within(getNav()).queryByRole('heading')).toBeNull();
    expect(within(getNav()).queryByRole('group')).toBeNull();

    rerender(
      <ThemeProvider initialMode="system">
        <AppShell circleList={<a href="/circles/familia-garcia">Familia García</a>}>
          <h1>Contenido de la página</h1>
        </AppShell>
      </ThemeProvider>,
    );

    const nav = getNav();
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual([
      '/circles',
      '/uploads',
      '/circles/familia-garcia',
      '/profile',
      '/help',
      '/privacy',
    ]);

    const group = within(nav).getByRole('group');

    expect(group.tagName).toBe('DIV');

    const label = document.getElementById(group.getAttribute('aria-labelledby') ?? '');

    expect(label?.tagName).toBe('P');
    expect(label?.textContent).toBe('Círculos');
    expect(within(nav).queryByRole('heading')).toBeNull();
  });

  it('marca el bloque de cuenta como página actual en /profile', () => {
    renderShell({ currentPath: '/profile', user: { name: 'Sofía Martín' } });

    const account = screen.getByRole('link', {
      name: /Sofía Martín.*Perfil y preferencias.*Página actual/,
    });

    expect(account.getAttribute('href')).toBe('/profile');
    expect(account.className).toContain('bg-primary-soft');
    expect(account.className).toContain('text-primary-text');
  });

  it('monta el tema compacto en la cabecera y en el pie del sidebar', () => {
    renderShell();

    const banner = screen.getByRole('banner');
    const aside = screen.getByRole('complementary', { name: 'Cuenta y navegación' });

    expect(within(banner).getByRole('button', { name: /^Apariencia:/ })).toBeTruthy();
    expect(within(aside).getByRole('button', { name: /^Apariencia:/ })).toBeTruthy();
    expect(within(banner).queryByRole('link', { name: /Perfil/ })).toBeNull();
  });

  it('no usa dos regiones ni deja el shell sin landmarks', () => {
    renderShell({ user: { name: 'Sofía Martín' } });

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('complementary', { name: 'Cuenta y navegación' })).toHaveLength(1);
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderShell({
      currentPath: '/profile',
      user: { name: 'Sofía Martín' },
      circleList: <a href="/circles/familia-garcia">Familia García</a>,
    });

    await expectNoAxeViolations(container);
  });
});
