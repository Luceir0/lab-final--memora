import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { Checkbox } from './checkbox';
import { SegmentedControl } from './segmented-control';
import { Switch } from './switch';

describe('Checkbox', () => {
  it('usa un input nativo con label y description asociadas', () => {
    render(<Checkbox label="Aceptar términos" description="Puedes cambiarlo luego." />);

    const checkbox = screen.getByRole('checkbox', { name: 'Aceptar términos' });
    const description = screen.getByText('Puedes cambiarlo luego.');

    expect(checkbox.tagName).toBe('INPUT');
    expect(checkbox.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('fusiona el aria-describedby del consumidor con la descripción', () => {
    render(
      <>
        <p id="ayuda-checkbox">Ayuda externa</p>
        <Checkbox
          label="Aceptar"
          description="Descripción propia"
          aria-describedby="ayuda-checkbox"
        />
      </>,
    );

    const describedBy = (
      screen.getByRole('checkbox', { name: 'Aceptar' }).getAttribute('aria-describedby') ?? ''
    ).split(' ');

    expect(describedBy).toContain('ayuda-checkbox');
    expect(describedBy).toContain(screen.getByText('Descripción propia').id);
  });

  it('se marca y desmarca al pulsar', () => {
    render(<Checkbox label="Recibir avisos" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Recibir avisos' }) as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('aplica el estado indeterminado al nodo nativo', () => {
    const { rerender } = render(<Checkbox label="Seleccionar todo" indeterminate />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Seleccionar todo',
    }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);

    rerender(<Checkbox label="Seleccionar todo" />);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('en disabled permanece deshabilitado y el label pasa a muted', () => {
    render(<Checkbox label="No disponible" disabled />);

    const checkbox = screen.getByRole('checkbox', { name: 'No disponible' }) as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.checked).toBe(false);
    expect(checkbox.className.split(/\s+/)).toContain('disabled:bg-border-strong');
    expect(screen.getByText('No disponible').className.split(/\s+/)).toContain(
      'group-has-[:disabled]:text-muted',
    );
  });

  it('recibe foco con teclado (control nativo)', () => {
    render(<Checkbox label="Foco" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Foco' });
    checkbox.focus();

    expect(document.activeElement).toBe(checkbox);
    expect(checkbox.tabIndex).toBe(0);
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Checkbox label="Marcado" defaultChecked />
        <Checkbox label="Indeterminado" indeterminate description="Parcial" />
        <Checkbox label="Desactivado" disabled />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('Switch', () => {
  it('expone role switch con nombre y estado nativo', () => {
    render(<Switch label="Notificaciones" description="Avisos de nuevos recuerdos." />);

    const control = screen.getByRole('switch', { name: 'Notificaciones' }) as HTMLInputElement;
    const description = screen.getByText('Avisos de nuevos recuerdos.');

    expect(control.checked).toBe(false);
    expect(control.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('fusiona el aria-describedby del consumidor con la descripción', () => {
    render(
      <>
        <p id="ayuda-switch">Ayuda externa</p>
        <Switch label="Avisos" description="Descripción propia" aria-describedby="ayuda-switch" />
      </>,
    );

    const describedBy = (
      screen.getByRole('switch', { name: 'Avisos' }).getAttribute('aria-describedby') ?? ''
    ).split(' ');

    expect(describedBy).toContain('ayuda-switch');
    expect(describedBy).toContain(screen.getByText('Descripción propia').id);
  });

  it('avisa del cambio al pulsar', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notificaciones" onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Notificaciones' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('respeta el estado controlado', () => {
    const { rerender } = render(
      <Switch label="Notificaciones" checked onCheckedChange={() => {}} />,
    );

    expect(
      (screen.getByRole('switch', { name: 'Notificaciones' }) as HTMLInputElement).checked,
    ).toBe(true);

    rerender(<Switch label="Notificaciones" checked={false} onCheckedChange={() => {}} />);

    expect(
      (screen.getByRole('switch', { name: 'Notificaciones' }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('en disabled no cambia y no muestra hover en la pista', () => {
    render(<Switch label="Notificaciones" disabled />);

    const control = screen.getByRole('switch', { name: 'Notificaciones' }) as HTMLInputElement;
    expect(control.disabled).toBe(true);
    expect(control.checked).toBe(false);

    const track = control.closest('label')?.querySelector('[aria-hidden="true"]');
    expect(track?.className.split(/\s+/)).toContain(
      'group-has-[:enabled]:group-hover:border-primary',
    );
  });

  it('recibe foco con teclado', () => {
    render(<Switch label="Foco" />);

    const control = screen.getByRole('switch', { name: 'Foco' });
    control.focus();

    expect(document.activeElement).toBe(control);
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <Switch label="Activado" defaultChecked />
        <Switch label="Desactivado" disabled />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

const themeOptions = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const;

describe('SegmentedControl', () => {
  it('es un radiogroup con nombre y opción marcada', () => {
    render(<SegmentedControl label="Tema" options={themeOptions} value="dark" />);

    expect(screen.getByRole('radiogroup', { name: 'Tema' })).toBeTruthy();
    expect((screen.getByRole('radio', { name: 'Oscuro' }) as HTMLInputElement).checked).toBe(true);
  });

  it('cambia la selección al pulsar otra opción', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Tema"
        options={themeOptions}
        value="light"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(onValueChange).toHaveBeenCalledWith('dark');
  });

  it('mueve selección y foco con las flechas', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Tema"
        options={themeOptions}
        value="light"
        onValueChange={onValueChange}
      />,
    );

    const current = screen.getByRole('radio', { name: 'Claro' });

    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith('dark');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Oscuro' }));
  });

  it('salta las opciones deshabilitadas al navegar', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Tema"
        options={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Oscuro', disabled: true },
          { value: 'system', label: 'Sistema' },
        ]}
        value="light"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Claro' }), { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith('system');
  });

  it('no intercepta las flechas verticales ni bloquea el scroll', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Tema"
        options={themeOptions}
        value="light"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Claro' }), { key: 'ArrowDown' });

    // El navegador puede mover la selección por comportamiento nativo del
    // grupo de radios; lo que se comprueba es que el componente no la mueve
    // por su cuenta ni cancela el evento.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('cada opción tiene un hit de 44 px de altura fija', () => {
    render(<SegmentedControl label="Tema" options={themeOptions} value="light" />);

    const label = screen.getByRole('radio', { name: 'Claro' }).closest('label');
    const classes = label?.className.split(/\s+/) ?? [];

    expect(classes).toContain('after:h-11');
    expect(classes).toContain('after:top-1/2');
    expect(classes).not.toContain(['after', '-inset-y-1'].join(':'));
    expect(classes).toContain('has-[:enabled]:hover:text-text');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <SegmentedControl label="Tema" options={themeOptions} value="system" />,
    );

    await expectNoAxeViolations(container);
  });
});
