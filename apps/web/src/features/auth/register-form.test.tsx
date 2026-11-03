import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { GENERIC_ERROR_MESSAGE } from '../../lib/error-message';
import { AUTH_REGISTER_URL, testAuthClient, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { AUTH_RATE_LIMITED_MESSAGE } from './auth-errors';
import { RegisterForm } from './register-form';

const server = createAuthTestServer();

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface CapturedRequest {
  readonly url: string;
  readonly method: string;
  readonly contentType: string | null;
  readonly accept: string | null;
  readonly body: Record<string, unknown>;
}

function captureRegisterRequest(): { readonly current: () => CapturedRequest | null } {
  let captured: CapturedRequest | null = null;

  server.use(
    http.post(AUTH_REGISTER_URL, async ({ request }) => {
      captured = {
        url: request.url,
        method: request.method,
        contentType: request.headers.get('content-type'),
        accept: request.headers.get('accept'),
        body: (await request.json()) as Record<string, unknown>,
      };

      return HttpResponse.json({ user: testUser }, { status: 201 });
    }),
  );

  return { current: () => captured };
}

function renderRegister(props: { redirect?: unknown } = {}) {
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  const { container } = render(
    <RegisterForm
      {...(props.redirect === undefined ? {} : { redirect: props.redirect })}
      onSuccess={onSuccess}
      client={testAuthClient}
    />,
  );

  return { container, onSuccess, user };
}

async function fillValidRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Sofía Martín');
  await user.type(screen.getByLabelText('Email'), 'Sofia@Example.COM');
  await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
  await user.type(screen.getByLabelText('Repite la contraseña'), 'secreto123');
}

describe('RegisterForm', () => {
  it('etiqueta los campos y declara type, autocomplete e inputMode', async () => {
    const { container } = renderRegister();

    const name = screen.getByLabelText('Nombre');
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Contraseña');
    const confirmPassword = screen.getByLabelText('Repite la contraseña');

    expect(name.getAttribute('aria-required')).toBe('true');
    expect(email.getAttribute('aria-required')).toBe('true');
    expect(password.getAttribute('aria-required')).toBe('true');
    expect(confirmPassword.getAttribute('aria-required')).toBe('true');

    expect(screen.getByText('Al menos 8 caracteres')).toBeTruthy();

    expect(name.getAttribute('autoComplete')).toBe('name');

    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('autoComplete')).toBe('email');
    expect(email.getAttribute('inputMode')).toBe('email');
    expect(email.getAttribute('autocapitalize')).toBe('none');
    expect(email.getAttribute('spellcheck')).toBe('false');

    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autoComplete')).toBe('new-password');

    expect(confirmPassword.getAttribute('type')).toBe('password');
    expect(confirmPassword.getAttribute('autoComplete')).toBe('new-password');

    expect(name.getAttribute('enterkeyhint')).toBeNull();
    expect(email.getAttribute('enterkeyhint')).toBeNull();
    expect(password.getAttribute('enterkeyhint')).toBeNull();
    expect(confirmPassword.getAttribute('enterkeyhint')).toBe('done');

    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('declara method post y action /register para el envío nativo', () => {
    const { container } = renderRegister();
    const form = container.querySelector('form');

    expect(form?.getAttribute('method')).toBe('post');
    expect(form?.getAttribute('action')).toBe('/register');
  });

  it('el envío normal cancela el comportamiento nativo y usa el POST interno', async () => {
    const capture = captureRegisterRequest();
    const { container, user } = renderRegister();

    await fillValidRegistration(user);

    const form = container.querySelector('form');
    expect(form).not.toBeNull();

    const dispatched = fireEvent.submit(form!);
    expect(dispatched).toBe(false);

    await waitFor(() => {
      expect(capture.current()).not.toBeNull();
    });

    expect(new URL(capture.current()!.url).pathname).toBe('/api/auth/register');
  });

  it('valida en cliente, anuncia el resumen y enfoca el primer campo inválido', async () => {
    const { user, onSuccess } = renderRegister();

    await user.type(screen.getByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'otro12345');

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Revisa 2 campos')).toBeTruthy();
    expect(screen.getByText('Corrige los campos marcados para crear la cuenta.')).toBeTruthy();
    expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();

    const name = screen.getByLabelText('Nombre');
    const confirmPassword = screen.getByLabelText('Repite la contraseña');

    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(confirmPassword.getAttribute('aria-invalid')).toBe('true');

    await waitFor(() => {
      expect(document.activeElement).toBe(name);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('usa el mensaje compartido cuando la contraseña es corta', async () => {
    const { user } = renderRegister();

    await user.type(screen.getByLabelText('Nombre'), 'Sofía Martín');
    await user.type(screen.getByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'corta');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'corta');

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    // Mismo texto que `VALIDATION_MESSAGES.passwordTooShort` de `@memora/shared`
    // (el catálogo no forma parte de las exportaciones públicas del paquete).
    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();
  });

  it('la confirmación vacía tiene su propio mensaje', async () => {
    const { user } = renderRegister();

    await user.type(screen.getByLabelText('Nombre'), 'Sofía Martín');
    await user.type(screen.getByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Repite la contraseña.')).toBeTruthy();
    expect(screen.queryByText('Introduce tu contraseña.')).toBeNull();
  });

  it('envía el POST desde el navegador sin el campo de confirmación', async () => {
    const capture = captureRegisterRequest();
    const { user, onSuccess } = renderRegister();

    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/circles');
    });

    const request = capture.current();
    expect(request).not.toBeNull();
    expect(new URL(request!.url).pathname).toBe('/api/auth/register');
    expect(request!.method).toBe('POST');
    expect(request!.contentType).toBe('application/json');
    expect(request!.accept).toBe('application/json');
    expect(request!.body).toEqual({
      name: 'Sofía Martín',
      email: 'sofia@example.com',
      password: 'secreto123',
    });
    expect(request!.body).not.toHaveProperty('confirmPassword');
  });

  it('con 409 marca el error en email y lo enfoca', async () => {
    server.use(
      http.post(AUTH_REGISTER_URL, () =>
        HttpResponse.json(
          {
            code: 'CONFLICT',
            message: 'La operación no se puede completar por un conflicto.',
            details: [{ field: 'email', message: 'Ya existe una cuenta con ese email.' }],
          },
          { status: 409 },
        ),
      ),
    );

    const { user, onSuccess } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Ya existe una cuenta con ese email.')).toBeTruthy();
    expect(screen.getByText('Revisa 1 campo')).toBeTruthy();

    const email = screen.getByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');

    await waitFor(() => {
      expect(document.activeElement).toBe(email);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('con 400 reparte los details del envelope por campo', async () => {
    server.use(
      http.post(AUTH_REGISTER_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos introducidos.',
            details: [{ field: 'email', message: 'Introduce un email válido.' }],
          },
          { status: 400 },
        ),
      ),
    );

    const { user } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Revisa los datos introducidos.')).toBeTruthy();
    expect(screen.getByText('Introduce un email válido.')).toBeTruthy();

    const email = screen.getByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');

    await waitFor(() => {
      expect(document.activeElement).toBe(email);
    });
  });

  it('con 429 muestra el bloqueo temporal sin marcar campos', async () => {
    server.use(
      http.post(AUTH_REGISTER_URL, () =>
        HttpResponse.json(
          {
            code: 'RATE_LIMITED',
            message: 'Demasiadas peticiones. Inténtalo de nuevo en un momento.',
            details: null,
          },
          { status: 429 },
        ),
      ),
    );

    const { user } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(AUTH_RATE_LIMITED_MESSAGE)).toBeTruthy();
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('Contraseña').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('Repite la contraseña').getAttribute('aria-invalid')).toBeNull();
  });

  it('con 500 muestra un mensaje genérico reintentable', async () => {
    server.use(
      http.post(AUTH_REGISTER_URL, () =>
        HttpResponse.json(
          {
            code: 'INTERNAL_ERROR',
            message: 'Ha ocurrido un error inesperado.',
            details: null,
          },
          { status: 500 },
        ),
      ),
    );

    const { user } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
  });

  it('con fallo de red muestra el mismo mensaje genérico', async () => {
    server.use(http.post(AUTH_REGISTER_URL, () => HttpResponse.error()));

    const { user } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
  });

  it('mantiene el foco, anuncia el envío y no usa disabled mientras envía', async () => {
    let release: (() => void) | undefined;

    server.use(
      http.post(AUTH_REGISTER_URL, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ user: testUser }, { status: 201 });
      }),
    );

    const { container, user, onSuccess } = renderRegister();
    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const pendingButton = await screen.findByRole('button', { name: 'Creando cuenta…' });
    const form = container.querySelector('form');

    expect((pendingButton as HTMLButtonElement).disabled).toBe(false);
    expect(pendingButton.getAttribute('aria-disabled')).toBe('true');
    expect(pendingButton.getAttribute('aria-busy')).toBe('true');
    expect(form?.getAttribute('aria-busy')).toBeNull();
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Creando cuenta…');
    expect(form?.contains(status)).toBe(false);

    await waitFor(() => {
      expect(document.activeElement).toBe(pendingButton);
    });

    release?.();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/circles');
    });
  });

  it('tras el 201 navega al redirect interno validado', async () => {
    captureRegisterRequest();
    const { user, onSuccess } = renderRegister({ redirect: '/profile?tab=cuenta' });

    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/profile?tab=cuenta');
    });
  });
});
