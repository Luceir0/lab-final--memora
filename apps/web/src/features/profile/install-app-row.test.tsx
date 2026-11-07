import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';

import { InstallAppRow } from './install-app-row';

type UserChoiceOutcome = 'accepted' | 'dismissed';

interface PromptEvent extends Event {
  readonly prompt: ReturnType<typeof vi.fn>;
  readonly userChoice: Promise<{ readonly outcome: UserChoiceOutcome; readonly platform: string }>;
}

const navigatorObject = window.navigator;
const originalProperties = {
  userAgent: Object.getOwnPropertyDescriptor(navigatorObject, 'userAgent'),
  platform: Object.getOwnPropertyDescriptor(navigatorObject, 'platform'),
  maxTouchPoints: Object.getOwnPropertyDescriptor(navigatorObject, 'maxTouchPoints'),
  standalone: Object.getOwnPropertyDescriptor(navigatorObject, 'standalone'),
} as const;

function overrideNavigator(overrides: Readonly<Record<string, unknown>>) {
  for (const [key, value] of Object.entries(overrides)) {
    Object.defineProperty(navigatorObject, key, { configurable: true, value });
  }
}

function mockStandalone(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(display-mode: standalone)' ? matches : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

function fireBeforeInstallPrompt(outcome: UserChoiceOutcome = 'accepted'): PromptEvent {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  }) as PromptEvent;

  act(() => {
    window.dispatchEvent(event);
  });

  return event;
}

afterEach(() => {
  vi.restoreAllMocks();

  for (const [key, descriptor] of Object.entries(originalProperties)) {
    if (descriptor) {
      Object.defineProperty(navigatorObject, key, descriptor);
    } else {
      Reflect.deleteProperty(navigatorObject, key);
    }
  }
});

describe('InstallAppRow', () => {
  it('muestra el estado no soportado sin botón', () => {
    render(<InstallAppRow />);

    expect(screen.getByText('Abre Memora en Chrome o Safari para instalarla.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('detecta la app ya instalada por display-mode: standalone', () => {
    mockStandalone(true);
    render(<InstallAppRow />);

    expect(screen.getByRole('status').textContent).toBe('Ya tienes Memora instalada.');
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('detecta iOS por user agent', () => {
    overrideNavigator({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });

    render(<InstallAppRow />);

    expect(screen.getByText('Toca Compartir y elige “Añadir a pantalla de inicio”.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('detecta iPadOS que se anuncia como Macintosh', () => {
    overrideNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });

    render(<InstallAppRow />);

    expect(screen.getByText('Toca Compartir y elige “Añadir a pantalla de inicio”.')).toBeTruthy();
  });

  it('pasa a disponible al capturar beforeinstallprompt y el botón llama a prompt()', async () => {
    render(<InstallAppRow />);

    const event = fireBeforeInstallPrompt('dismissed');

    expect(event.defaultPrevented).toBe(true);

    const button = screen.getByRole('button', { name: 'Instalar' });

    fireEvent.click(button);

    await waitFor(() => {
      expect(event.prompt).toHaveBeenCalledTimes(1);
    });
  });

  it('anuncia la app instalada al recibir appinstalled', () => {
    render(<InstallAppRow />);

    fireBeforeInstallPrompt();
    expect(screen.getByRole('button', { name: 'Instalar' })).toBeTruthy();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(screen.getByRole('status').textContent).toBe('Ya tienes Memora instalada.');
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('se pinta también en escritorio dentro de la columna del perfil', () => {
    const { container } = render(<InstallAppRow />);
    const section = container.querySelector('section');

    expect(section?.className).not.toContain('lg:hidden');
    expect(section?.className).toContain('rounded-xl');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(<InstallAppRow />);

    fireBeforeInstallPrompt();

    await expectNoAxeViolations(container);
  });
});
