import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { Button } from './button';
import { IconButton } from './icon-button';
import { LinkButton } from './link-button';

describe('Button', () => {
  it('renderiza un button real con nombre accesible y tipo button por defecto', () => {
    render(<Button>Crear círculo</Button>);

    const button = screen.getByRole('button', { name: 'Crear círculo' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('llama al handler al pulsar', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('en loading expone aria-busy/aria-disabled, conserva foco y no responde a clics', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardando
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Guardando' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button).toHaveProperty('disabled', false);

    button.focus();
    expect(document.activeElement).toBe(button);

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('en disabled no responde y sigue siendo anunciado', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Eliminar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(button);

    expect(button).toHaveProperty('disabled', true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('es alcanzable con teclado', () => {
    render(<Button>Foco</Button>);

    const button = screen.getByRole('button', { name: 'Foco' });
    button.focus();

    expect(document.activeElement).toBe(button);
    expect(button.tabIndex).toBe(0);
  });

  it('oculta el icono decorativo a lectores de pantalla', () => {
    render(<Button icon={<svg data-testid="icon" />}>Con icono</Button>);

    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('el botón sm usa un hit de 44 px de altura fija, no `-inset-y`', () => {
    render(
      <Button size="sm" variant="secondary">
        Pequeño
      </Button>,
    );

    const classes = screen.getByRole('button', { name: 'Pequeño' }).className.split(/\s+/);

    expect(classes).toContain('after:h-11');
    expect(classes).toContain('after:top-1/2');
    expect(classes).toContain('after:-translate-y-1/2');
    expect(classes).not.toContain(['after', '-inset-y-1'].join(':'));
  });

  it('en loading muestra cursor de progreso y no conserva hover/active', () => {
    render(<Button loading>Subiendo</Button>);

    const classes = screen.getByRole('button', { name: 'Subiendo' }).className.split(/\s+/);

    expect(classes).toContain('cursor-progress');
    expect(classes).not.toContain('not-disabled:hover:bg-primary-hover');
    expect(classes).not.toContain('not-disabled:active:bg-primary-active');
  });

  it('en disabled conserva el hover guardado por `not-disabled`', () => {
    render(<Button variant="secondary">Secundario</Button>);

    const classes = screen.getByRole('button', { name: 'Secundario' }).className.split(/\s+/);

    expect(classes).toContain('not-disabled:hover:bg-surface-2');
  });

  it('no tiene violaciones de axe en sus estados', async () => {
    const { container } = render(
      <div>
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="danger" loading>
          Eliminando
        </Button>
        <Button disabled>Desactivado</Button>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('IconButton', () => {
  it('expone el label como nombre accesible y el icono queda oculto', () => {
    render(<IconButton label="Cerrar" icon={<svg data-testid="icon" />} />);

    const button = screen.getByRole('button', { name: 'Cerrar' });
    expect(button.getAttribute('aria-label')).toBe('Cerrar');
    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('mantiene el área táctil al deshabilitarse', () => {
    render(<IconButton label="Más opciones" icon={<svg />} disabled />);

    expect(screen.getByRole('button', { name: 'Más opciones' })).toHaveProperty('disabled', true);
  });

  it('en loading expone aria-busy/aria-disabled, conserva foco y bloquea la acción', () => {
    const onClick = vi.fn();
    render(<IconButton label="Subiendo" icon={<svg />} loading onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Subiendo' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button).toHaveProperty('disabled', false);
    expect(button.className.split(/\s+/)).toContain('cursor-progress');

    button.focus();
    expect(document.activeElement).toBe(button);

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <IconButton label="Cerrar" icon={<svg />} />
        <IconButton label="Compartir" icon={<svg />} variant="solid" />
        <IconButton label="Quitar" icon={<svg />} variant="onMedia" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('LinkButton', () => {
  it('renderiza un enlace real con href', () => {
    render(<LinkButton href="/circles">Ver círculos</LinkButton>);

    const link = screen.getByRole('link', { name: 'Ver círculos' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/circles');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <LinkButton href="/a">Primario</LinkButton>
        <LinkButton href="/b" variant="secondary">
          Secundario
        </LinkButton>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
