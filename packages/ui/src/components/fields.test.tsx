import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { SearchField } from './search-field';
import { TextArea } from './text-area';
import { TextField } from './text-field';

describe('TextField', () => {
  it('asocia label y hint con el input', () => {
    render(<TextField label="Email" hint="Lo usamos para avisarte." />);

    const input = screen.getByLabelText('Email');
    const hint = screen.getByText('Lo usamos para avisarte.');

    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('en error añade aria-invalid y describe label, hint y error', () => {
    render(
      <TextField label="Email" hint="Lo usamos para avisarte." error="Escribe un email válido" />,
    );

    const input = screen.getByLabelText('Email');
    const error = screen.getByText('Escribe un email válido');
    const describedBy = input.getAttribute('aria-describedby') ?? '';

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy.split(' ')).toContain(error.id);
  });

  it('respeta id y aria-describedby del consumidor', () => {
    render(
      <>
        <p id="ayuda-externa">Texto de ayuda</p>
        <TextField label="Nombre" id="nombre" aria-describedby="ayuda-externa" />
      </>,
    );

    const input = screen.getByLabelText('Nombre');
    expect(input.id).toBe('nombre');
    expect(input.getAttribute('aria-describedby')).toBe('ayuda-externa');
  });

  it('respeta el aria-invalid del consumidor cuando no hay error', () => {
    render(<TextField label="Código" aria-invalid />);

    expect(screen.getByLabelText('Código').getAttribute('aria-invalid')).toBe('true');
  });

  it('marca el error con role alert y aria-invalid', () => {
    render(<TextField label="Email" error="Escribe un email válido" />);

    expect(screen.getByRole('alert').textContent).toContain('Escribe un email válido');
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
  });

  it('dos TextField en la misma página generan ids y descripciones distintas', () => {
    render(
      <>
        <TextField label="Nombre" hint="Como apareces en el perfil." />
        <TextField label="Ciudad" hint="Solo el nombre de la ciudad." />
      </>,
    );

    const name = screen.getByLabelText('Nombre');
    const city = screen.getByLabelText('Ciudad');
    const nameHint = screen.getByText('Como apareces en el perfil.');
    const cityHint = screen.getByText('Solo el nombre de la ciudad.');

    expect(name.id).not.toBe(city.id);
    expect(name.getAttribute('aria-describedby')).toBe(nameHint.id);
    expect(city.getAttribute('aria-describedby')).toBe(cityHint.id);
    expect(name.getAttribute('aria-describedby')).not.toBe(city.getAttribute('aria-describedby'));
  });

  it('en disabled no se puede editar', () => {
    render(<TextField label="Nombre" disabled />);

    expect(screen.getByLabelText('Nombre')).toHaveProperty('disabled', true);
  });

  it('oculta el label solo a la vista cuando se pide', () => {
    render(<TextField label="Nombre" hideLabel />);

    expect(screen.getByLabelText('Nombre')).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <div>
        <TextField label="Nombre" hint="Como aparece en tu perfil." />
        <TextField label="Email" error="Escribe un email válido" />
        <TextField label="Desactivado" disabled />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe('TextArea', () => {
  it('asocia label, hint y error', () => {
    render(<TextArea label="Descripción" hint="Opcional" error="Máximo 200 caracteres" />);

    const textarea = screen.getByLabelText('Descripción');
    const describedBy = textarea.getAttribute('aria-describedby') ?? '';

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy.split(' ')).toContain(screen.getByText('Máximo 200 caracteres').id);
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(<TextArea label="Descripción" hint="Opcional" />);

    await expectNoAxeViolations(container);
  });
});

describe('SearchField', () => {
  it('expone el label oculto y el rol searchbox', () => {
    render(<SearchField value="" onChange={() => {}} />);

    const input = screen.getByRole('searchbox', { name: 'Buscar' });
    expect(input.getAttribute('type')).toBe('search');
  });

  it('oculta limpiar cuando está vacío y lo muestra con texto', () => {
    const onClear = vi.fn();
    const { rerender } = render(<SearchField value="" onChange={() => {}} onClear={onClear} />);

    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).toBeNull();

    rerender(<SearchField value="Lisboa" onChange={() => {}} onClear={onClear} />);

    const clear = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    expect(clear).toHaveProperty('disabled', false);

    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(
      <SearchField value="Lisboa" onChange={() => {}} onClear={() => {}} />,
    );

    await expectNoAxeViolations(container);
  });
});
