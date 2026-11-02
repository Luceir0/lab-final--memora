import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { ProgressBar } from './progress-bar';
import { Skeleton } from './skeleton';
import { Spinner } from './spinner';
import { VisuallyHidden } from './visually-hidden';

describe('ProgressBar', () => {
  it('determinada expone rol, nombre y valor', () => {
    render(<ProgressBar label="Subida de fotos" value={64} />);

    const bar = screen.getByRole('progressbar', { name: 'Subida de fotos' });
    expect(bar.getAttribute('aria-valuenow')).toBe('64');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuetext')).toBeNull();
  });

  it('indeterminada anuncia el estado en el nombre accesible', () => {
    render(<ProgressBar label="Preparando" />);

    const bar = screen.getByRole('progressbar', { name: 'Preparando, en curso' });
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
    expect(bar.getAttribute('aria-valuetext')).toBeNull();
  });

  it('recorta valores fuera de rango', () => {
    render(<ProgressBar label="Subida" value={140} />);

    expect(screen.getByRole('progressbar', { name: 'Subida' }).getAttribute('aria-valuenow')).toBe(
      '100',
    );
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <ProgressBar label="Subida" value={40} size={8} tone="success" />
        <ProgressBar label="Preparando" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('Spinner', () => {
  it('anuncia el estado con texto para lectores', () => {
    render(<Spinner />);

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Cargando');
  });

  it('acepta un texto propio', () => {
    render(<Spinner label="Subiendo fotos" />);

    expect(screen.getByText('Subiendo fotos')).toBeTruthy();
  });

  it('con animated=false queda estático sin perder el anuncio', () => {
    const { container } = render(<Spinner animated={false} label="Sin animación" />);

    expect(screen.getByRole('status').textContent).toBe('Sin animación');
    expect(container.querySelector('svg')?.getAttribute('class')).not.toContain('animate-spin');
  });

  it('por defecto gira', () => {
    const { container } = render(<Spinner />);

    expect(container.querySelector('svg')?.getAttribute('class')).toContain('animate-spin');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Spinner size="sm" />
        <Spinner label="Subiendo fotos" size="lg" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('Skeleton', () => {
  it('es decorativo y no se anuncia', () => {
    render(
      <div>
        <Skeleton shape="text" />
        <Skeleton shape="circle" size="lg" animated={false} />
      </div>,
    );

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Skeleton />
        <Skeleton shape="text" animated={false} />
        <Skeleton shape="circle" size="sm" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('VisuallyHidden', () => {
  it('deja el texto en el árbol de accesibilidad', () => {
    render(
      <button type="button">
        <span aria-hidden="true">×</span>
        <VisuallyHidden>Cerrar</VisuallyHidden>
      </button>,
    );

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <p>
        Texto visible <VisuallyHidden>y texto solo para lectores</VisuallyHidden>
      </p>,
    );

    await expectNoAxeViolations(container);
  });
});
