import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { GENERIC_ERROR_MESSAGE } from '../../lib/error-message';
import { AUTH_LOGIN_URL, testAuthClient, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { AUTH_RATE_LIMITED_MESSAGE } from './auth-errors';
import { LoginForm } from './login-form';

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
  readonly body: unknown;
}

function captureLoginRequest(): { readonly current: () => CapturedRequest | null } {
  let captured: CapturedRequest | null = null;

  server.use(
    http.post(AUTH_LOGIN_URL, async ({ request }) => {
      captured = {
        url: request.url,
        method: request.method,
        contentType: request.headers.get('content-type'),
        accept: request.headers.get('accept'),
        body: await request.json(),
      };

      return HttpResponse.json({ user: testUser });
    }),
  );

  return { current: () => captured };
}

function renderLogin(props: { redirect?: unknown } = {}) {
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  const { container } = render(
    <LoginForm
      {...(props.redirect === undefined ? {} : { redirect: props.redirect })}
      onSuccess={onSuccess}
      client={testAuthClient}
    />,
  );

  return { container, onSuccess, user };
}

async function fillValidCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'Sofia@Example.COM');
  await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
}

describe('LoginForm', () => {
  it('etiqueta los campos y declara type, autocomplete e inputMode', async () => {
    const { container } = renderLogin();

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Contraseña');

    expect(email.getAttribute('aria-required')).toBe('true');
    expect(password.getAttribute('aria-required')).toBe('true');

    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('autoComplete')).toBe('email');
    expect(email.getAttribute('inputMode')).toBe('email');
    expect(email.getAttribute('autocapitalize')).toBe('none');
    expect(email.getAttribute('spellcheck')).toBe('false');

    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autoComplete')).toBe('current-password');

    expect(email.getAttribute('enterkeyhint')).toBeNull();
    expect(password.getAttribute('enterkeyhint')).toBe('done');

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('declara method post y action /login para el envío nativo', () => {
    const { container } = renderLogin();
    const form = container.querySelector('form');

    expect(form?.getAttribute('method')).toBe('post');
    expect(form?.getAttribute('action')).toBe('/login');
  });

  it('el envío normal cancela el comportamiento nativo y usa el POST interno', async () => {
    const capture = captureLoginRequest();
    const { container, user } = renderLogin();

    await fillValidCredentials(user);

    const form = container.querySelector('form');
    expect(form).not.toBeNull();

    // `dispatchEvent` devuelve false cuando el submit fue cancelado.
    const dispatched = fireEvent.submit(form!);
    expect(dispatched).toBe(false);

    await waitFor(() => {
      expect(capture.current()).not.toBeNull();
    });

    expect(new URL(capture.current()!.url).pathname).toBe('/api/auth/login');
  });

  it('valida en cliente, anuncia el resumen y enfoca el primer campo inválido', async () => {
    const { user, onSuccess } = renderLogin();

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Revisa 2 campos')).toBeTruthy();
    expect(screen.getByText('Introduce un email válido.')).toBeTruthy();
    expect(screen.getByText('Introduce tu contraseña.')).toBeTruthy();

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Contraseña');

    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-invalid')).toBe('true');

    const describedBy = email.getAttribute('aria-describedby');
    const emailError = screen.getByText('Introduce un email válido.');
    expect(describedBy).toContain(emailError.id);

    await waitFor(() => {
      expect(document.activeElement).toBe(email);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('envía el POST desde el navegador con JSON y sin CSRF', async () => {
    const capture = captureLoginRequest();
    const { user, onSuccess } = renderLogin();

    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/circles');
    });

    const request = capture.current();
    expect(request).not.toBeNull();
    expect(new URL(request!.url).pathname).toBe('/api/auth/login');
    expect(request!.method).toBe('POST');
    expect(request!.contentType).toBe('application/json');
    expect(request!.accept).toBe('application/json');
    expect(request!.body).toEqual({
      email: 'sofia@example.com',
      password: 'secreto123',
    });
  });

  it('con 401 muestra el mensaje único de credenciales incorrectas', async () => {
    server.use(
      http.post(AUTH_LOGIN_URL, () =>
        HttpResponse.json(
          {
            code: 'UNAUTHENTICATED',
            message: 'Email o contraseña incorrectos.',
            details: null,
          },
          { status: 401 },
        ),
      ),
    );

    const { user, onSuccess } = renderLogin();
    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Email o contraseña incorrectos.');
    expect(screen.queryByText(/no existe/i)).toBeNull();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('con 429 muestra el bloqueo temporal sin marcar campos', async () => {
    server.use(
      http.post(AUTH_LOGIN_URL, () =>
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

    const { user } = renderLogin();
    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(AUTH_RATE_LIMITED_MESSAGE)).toBeTruthy();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('Contraseña').getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByText('Introduce un email válido.')).toBeNull();
  });

  it('con 500 muestra un mensaje genérico reintentable', async () => {
    server.use(
      http.post(AUTH_LOGIN_URL, () =>
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

    const { user } = renderLogin();
    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
  });

  it('con fallo de red muestra el mismo mensaje genérico', async () => {
    server.use(http.post(AUTH_LOGIN_URL, () => HttpResponse.error()));

    const { user } = renderLogin();
    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
  });

  it('mantiene el foco, anuncia el envío y no usa disabled mientras envía', async () => {
    let release: (() => void) | undefined;

    server.use(
      http.post(AUTH_LOGIN_URL, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ user: testUser });
      }),
    );

    const { container, user, onSuccess } = renderLogin();
    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    const pendingButton = await screen.findByRole('button', { name: 'Entrando…' });
    const form = container.querySelector('form');

    expect((pendingButton as HTMLButtonElement).disabled).toBe(false);
    expect(pendingButton.getAttribute('aria-disabled')).toBe('true');
    expect(pendingButton.getAttribute('aria-busy')).toBe('true');
    expect(form?.getAttribute('aria-busy')).toBeNull();
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Entrando…');
    expect(form?.contains(status)).toBe(false);

    await waitFor(() => {
      expect(document.activeElement).toBe(pendingButton);
    });

    release?.();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/circles');
    });
  });

  it('navega al redirect interno validado', async () => {
    captureLoginRequest();
    const { user, onSuccess } = renderLogin({ redirect: '/profile?tab=cuenta' });

    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/profile?tab=cuenta');
    });
  });

  it('ignora un redirect externo y usa /circles', async () => {
    captureLoginRequest();
    const { user, onSuccess } = renderLogin({ redirect: 'https://evil.example/phishing' });

    await fillValidCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('/circles');
    });
  });
});
