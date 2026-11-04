import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { renderWithRouter } from '../../test/circles-harness';
import { circleWithCover } from '../../test/circles-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { CreateCircleDialog } from './create-circle-dialog';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function renderDialog() {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  const result = renderWithRouter(<CreateCircleDialog onClose={onClose} onCreated={onCreated} />);

  return { ...result, onClose, onCreated };
}

describe('CreateCircleDialog', () => {
  it('enfoca el nombre al abrir y tiene una estructura accesible', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    const name = screen.getByLabelText('Nombre del círculo');

    await waitFor(() => {
      expect(document.activeElement).toBe(name);
    });

    expect(dialog.textContent).toContain('Un espacio privado: solo entrará quien invites.');
    expect(document.querySelector('form')?.noValidate).toBe(true);
    expect(screen.getByLabelText('Descripción (opcional)').getAttribute('maxlength')).toBe('200');
    await expectNoAxeViolations(document.body);
  });

  it('no muestra portada ni ninguna acción de foto en el alta', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo círculo' });

    expect(dialog.querySelector('img')).toBeNull();
    expect(screen.queryByText(/portada/i)).toBeNull();
    expect(screen.queryByText(/imagen genérica/)).toBeNull();
    expect(screen.queryByRole('button', { name: /foto|imagen|portada|cambiar/i })).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
    await expectNoAxeViolations(document.body);
  });

  it('distribuye los permisos en dos columnas 2+2 desde lg', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo círculo' });

    const layouts = dialog.querySelectorAll<HTMLElement>('[class*="lg:grid-cols-2"]');
    expect(layouts).toHaveLength(1);

    const layout = layouts[0];
    if (layout === undefined) {
      throw new Error('No se encontró la rejilla de permisos.');
    }

    expect(layout.className).toContain('mx-auto');
    expect(layout.className).toContain('max-w-md');
    expect(layout.className).toContain('lg:max-w-none');
    expect(layout.querySelectorAll('[role="switch"]')).toHaveLength(4);

    const columns = Array.from(layout.children);
    expect(columns).toHaveLength(2);

    const [left, right] = columns;
    expect(left?.querySelectorAll('[role="switch"]').length).toBe(2);
    expect(right?.querySelectorAll('[role="switch"]').length).toBe(2);
    expect(right?.className).toContain('lg:border-l');
    await expectNoAxeViolations(document.body);
  });

  it('valida en cliente antes de pedir CSRF ni crear nada', async () => {
    const { onCreated } = renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    expect(await screen.findByText('El nombre es obligatorio.')).toBeTruthy();
    expect(screen.getByText('Revisa el formulario')).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('envía el CSRF, los cuatro permisos y la descripción normalizada', async () => {
    let body: unknown = null;
    let csrfHeader: string | null = null;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-test' })),
      http.post(CIRCLES_URL, async ({ request }) => {
        body = await request.json();
        csrfHeader = request.headers.get('x-csrf-token');
        return HttpResponse.json(circleWithCover, { status: 201 });
      }),
    );

    const { onCreated } = renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.type(screen.getByLabelText('Nombre del círculo'), 'Familia García');
    await user.type(
      screen.getByLabelText('Descripción (opcional)'),
      '  Las fotos de casa y los veranos.  ',
    );
    await user.click(screen.getByRole('switch', { name: 'Descargar fotos' }));
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(circleWithCover);
    });

    expect(csrfHeader).toBe('csrf-test');
    expect(body).toEqual({
      name: 'Familia García',
      description: 'Las fotos de casa y los veranos.',
      settings: {
        membersCanCreateAlbums: true,
        membersCanUpload: true,
        membersCanDownload: false,
        membersCanTag: true,
      },
    });
  });

  it('marca el campo del contrato cuando el servidor devuelve un 400', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-test' })),
      http.post(CIRCLES_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos.',
            details: [{ field: 'name', message: 'Ese nombre no es válido.' }],
          },
          { status: 400 },
        ),
      ),
    );

    renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.type(screen.getByLabelText('Nombre del círculo'), 'Familia García');
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    expect(await screen.findByText('Revisa los datos del círculo')).toBeTruthy();
    expect(await screen.findByText('Ese nombre no es válido.')).toBeTruthy();
  });

  it('si el alta devuelve 401, limpia y vuelve a /login con redirect', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-test' })),
      http.post(CIRCLES_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.', details: null },
          { status: 401 },
        ),
      ),
    );

    const onClose = vi.fn();
    const onCreated = vi.fn();
    const user = userEvent.setup();
    const { router } = renderWithRouter(
      <CreateCircleDialog onClose={onClose} onCreated={onCreated} />,
      '/circles/new',
    );

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.type(screen.getByLabelText('Nombre del círculo'), 'Familia García');
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toEqual({ redirect: '/circles/new' });
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('conserva lo escrito y muestra un resumen si el servidor falla', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-test' })),
      http.post(CIRCLES_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    const { onCreated } = renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    const name = screen.getByLabelText('Nombre del círculo');

    await user.type(name, 'Familia García');
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    expect(await screen.findByText('No hemos podido guardar el círculo')).toBeTruthy();
    expect(screen.getByText(/No has perdido nada de lo que has escrito/)).toBeTruthy();
    expect((name as HTMLInputElement).value).toBe('Familia García');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('cierra con Esc y devuelve el control', async () => {
    const { onClose } = renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no deja cerrar mientras guarda', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-test' })),
      http.post(CIRCLES_URL, async () => {
        await delay(80);
        return HttpResponse.json(circleWithCover, { status: 201 });
      }),
    );

    const { onClose, onCreated } = renderDialog();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo círculo' });
    await user.type(screen.getByLabelText('Nombre del círculo'), 'Familia García');
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    const saving = await screen.findByRole('button', { name: 'Guardando…' });
    expect(saving.getAttribute('aria-busy')).toBe('true');

    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(circleWithCover);
    });
  });
});
