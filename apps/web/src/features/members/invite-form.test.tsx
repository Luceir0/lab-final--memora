import type { CreatedInvitationDto } from '@memora/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { renderWithRouter } from '../../test/circles-harness';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';
import { CIRCLE_RATE_LIMITED_MESSAGE } from '../circles/errors';

import { emailInvitation } from './members-fixtures';
import { InviteDialog } from './invite-form';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const INVITATIONS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/invitations`;

const createdInvitation: CreatedInvitationDto = {
  ...emailInvitation,
  invitedEmail: null,
  token: 'tok_1',
};

const circle = circleDetail(circleWithCover);

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});

afterAll(() => {
  server.close();
});

interface CapturedRequest {
  body: unknown;
  csrf: string | null;
}

function captureCreate(requests: CapturedRequest[], response = createdInvitation) {
  server.use(
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
    http.post(INVITATIONS_URL, async ({ request }) => {
      requests.push({
        body: await request.json(),
        csrf: request.headers.get('x-csrf-token'),
      });

      return HttpResponse.json(response, { status: 201 });
    }),
  );
}

describe('InviteDialog', () => {
  it('crea un enlace sin email y muestra el token una sola vez', async () => {
    const requests: CapturedRequest[] = [];

    captureCreate(requests);
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);

    expect(await screen.findByLabelText('Correo electrónico (opcional)')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Crear enlace' }) as HTMLButtonElement).type).toBe(
      'submit',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear enlace' }));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0]?.body).toEqual({});
    expect(requests[0]?.csrf).toBe('csrf-invite');

    expect(await screen.findByText('Invitación creada')).toBeTruthy();
    expect(
      screen.getByText('Copia o comparte el enlace; no podrás recuperarlo después.'),
    ).toBeTruthy();

    const link = screen.getByLabelText('Enlace de invitación') as HTMLInputElement;

    expect(link.value).toBe(`${window.location.origin}/invite/tok_1`);
    expect(link.readOnly).toBe(true);
    expect(screen.queryByLabelText('Correo electrónico (opcional)')).toBeNull();

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('invite-created'));
    });
  });

  it('envía el email cuando se escribe y permite crear otra invitación', async () => {
    const requests: CapturedRequest[] = [];

    captureCreate(requests);
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);

    const email = await screen.findByLabelText('Correo electrónico (opcional)');

    fireEvent.change(email, { target: { value: 'ana@correo.es' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0]?.body).toEqual({ invitedEmail: 'ana@correo.es' });

    await screen.findByText('Invitación creada');
    fireEvent.click(screen.getByRole('button', { name: 'Crear otra invitación' }));

    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear enlace' })).toBeTruthy();
  });

  it('copia con el portapapeles y comparte con la hoja nativa', async () => {
    const requests: CapturedRequest[] = [];
    const writeText = vi.fn(() => Promise.resolve());
    const share = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    captureCreate(requests);
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Crear enlace' }));
    await screen.findByText('Invitación creada');

    const status = screen.getByTestId('invite-share-status');

    expect(status.textContent).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/invite/tok_1`);
    });
    expect(await screen.findByText('Enlace copiado.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        url: `${window.location.origin}/invite/tok_1`,
        title: 'Familia García',
        text: 'Te invito a Familia García en Memora.',
      });
    });
    expect(await screen.findByText('Enlace compartido.')).toBeTruthy();
  });

  it('muestra el 429 sin perder el formulario', async () => {
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(INVITATIONS_URL, () =>
        HttpResponse.json(
          { code: 'RATE_LIMITED', message: 'Demasiadas invitaciones.' },
          { status: 429 },
        ),
      ),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Crear enlace' }));

    expect(await screen.findByText('No hemos podido crear la invitación')).toBeTruthy();
    expect(screen.getByText(CIRCLE_RATE_LIMITED_MESSAGE)).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear enlace' })).toBeTruthy();
  });

  it('muestra un error de red sin perder el formulario', async () => {
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(INVITATIONS_URL, () => HttpResponse.error()),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Crear enlace' }));

    expect(await screen.findByText('No hemos podido crear la invitación')).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();
  });

  it('valida el correo antes de enviar sin lanzar la petición', async () => {
    const requests: CapturedRequest[] = [];

    captureCreate(requests);
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);

    const email = await screen.findByLabelText('Correo electrónico (opcional)');

    fireEvent.change(email, { target: { value: 'no-es-un-correo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    expect(
      screen.getByText(
        'Escribe un correo válido o déjalo vacío para crear un enlace sin destinatario.',
      ),
    ).toBeTruthy();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(requests).toHaveLength(0);
  });

  it('marca el campo cuando el 400 identifica el email', async () => {
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(INVITATIONS_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos introducidos.',
            details: [{ field: 'invitedEmail', message: 'El correo no es válido.' }],
          },
          { status: 400 },
        ),
      ),
    );

    const email = await screen.findByLabelText('Correo electrónico (opcional)');

    fireEvent.change(email, { target: { value: 'ana@correo.es' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    expect(await screen.findByText('El correo no es válido.')).toBeTruthy();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByText('No hemos podido crear la invitación')).toBeNull();
  });
});

describe('InviteDialog móvil', () => {
  it('abre el diálogo y crea una invitación con el mismo formulario', async () => {
    const requests: CapturedRequest[] = [];

    captureCreate(requests);
    renderWithRouter(<InviteDialog open circle={circle} onClose={vi.fn()} />);

    const dialog = await screen.findByRole('dialog', { name: 'Invitar a alguien' });

    expect(dialog).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Crear enlace' }));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(requests[0]?.body).toEqual({});
    expect(await screen.findByText('Invitación creada')).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('invite-created'));
    });
  });
});
