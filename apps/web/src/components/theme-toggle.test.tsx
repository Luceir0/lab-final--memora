import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { THEME_COOKIE } from '../lib/theme';

import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

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

function renderToggle() {
  stubMatchMedia(false);

  return render(
    <ThemeProvider initialMode="system">
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('expone un radiogroup con las tres etiquetas visibles', () => {
    renderToggle();

    const group = screen.getByRole('radiogroup', { name: 'Apariencia' });

    expect(group).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Apariencia' })).toBeTruthy();
  });

  it('marca la opción del modo actual y usa radios nativos', () => {
    renderToggle();

    const system = screen.getByRole('radio', { name: 'Sistema' }) as HTMLInputElement;
    const light = screen.getByRole('radio', { name: 'Claro' }) as HTMLInputElement;

    expect(system.checked).toBe(true);
    expect(light.checked).toBe(false);
    expect(system.tagName).toBe('INPUT');
    expect(system.getAttribute('type')).toBe('radio');
  });

  it('cambia el modo al elegir otra opción y persiste la cookie', () => {
    renderToggle();

    const light = screen.getByRole('radio', { name: 'Claro' }) as HTMLInputElement;

    fireEvent.click(light);

    expect(light.checked).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.cookie).toContain(`${THEME_COOKIE}=light`);
  });

  it('es alcanzable con teclado y conserva el foco en el radio', () => {
    renderToggle();

    const light = screen.getByRole('radio', { name: 'Claro' }) as HTMLInputElement;

    light.focus();

    expect(document.activeElement).toBe(light);
  });

  it('marca los iconos como decorativos y reserva 44 px de área táctil', () => {
    const { container } = renderToggle();
    const icons = [...container.querySelectorAll('svg')];

    expect(icons).toHaveLength(3);

    for (const icon of icons) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.closest('label')?.className).toContain('min-h-11');
    }
  });

  it('señala la opción activa sin depender solo del color', () => {
    renderToggle();

    const activeLabel = screen.getByRole('radio', { name: 'Sistema' }).closest('label');
    const className = activeLabel?.className ?? '';

    expect(className).toContain('has-[:checked]:border-primary');
    expect(className).toContain('has-[:checked]:font-semibold');
  });

  it('describe el grupo una sola vez y asocia la ayuda de Sistema', () => {
    renderToggle();

    const group = screen.getByRole('radiogroup', { name: 'Apariencia' });
    const describedBy = group.getAttribute('aria-describedby')?.split(' ') ?? [];

    expect(group.getAttribute('aria-labelledby')).toBeTruthy();
    expect(describedBy).toHaveLength(2);

    for (const id of describedBy) {
      expect(document.getElementById(id), `Falta el nodo ${id}`).toBeTruthy();
    }

    expect(group.closest('section')?.hasAttribute('aria-describedby')).toBe(false);
  });
});
