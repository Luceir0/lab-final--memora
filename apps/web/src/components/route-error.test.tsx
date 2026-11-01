import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RouteError } from './route-error';

describe('RouteError', () => {
  it('renderiza un mensaje accesible y mueve el foco al título', () => {
    render(<RouteError message="El servidor no responde." onRetry={() => {}} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'No hemos podido cargar esta página',
    });
    expect(alert.contains(heading)).toBe(true);
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText('El servidor no responde.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Volver al inicio' }).getAttribute('href')).toBe('/');
  });

  it('llama a la acción de reintento al pulsar el botón', () => {
    const onRetry = vi.fn();
    render(<RouteError message="Fallo de prueba." onRetry={onRetry} />);

    screen.getByRole('button', { name: 'Reintentar' }).click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
