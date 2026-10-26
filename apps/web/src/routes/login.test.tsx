import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoginPage } from './login';

describe('route /login', () => {
  it('renderiza el h1 y un formulario accesible', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Entra en Memora' })).toBeTruthy();

    const email = screen.getByLabelText('Correo electrónico');
    const password = screen.getByLabelText('Contraseña');

    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('name')).toBe('email');
    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('name')).toBe('password');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  });
});
