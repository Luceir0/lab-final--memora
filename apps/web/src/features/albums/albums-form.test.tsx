import type { AlbumDto } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';

import { AlbumFormDialog } from './album-form-dialog';
import { currentMonthInput } from './format';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const ALBUMS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/albums`;
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface FormOptions {
  readonly mode?: 'create' | 'edit';
  readonly album?: AlbumDto;
}

function renderForm(options: FormOptions = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const result = renderAlbumsRouter(
    <AlbumFormDialog
      open
      mode={options.mode ?? 'create'}
      circle={circleDetail(circleWithCover)}
      album={options.album ?? null}
      onClose={onClose}
      onSaved={onSaved}
    />,
    '/circles/cir_familia',
  );

  return { ...result, onClose, onSaved };
}

function useCsrf(token = 'csrf-album') {
  let requests = 0;

  server.use(
    http.get(CSRF_URL, () => {
      requests += 1;
      return HttpResponse.json({ csrfToken: token });
    }),
  );

  return () => requests;
}

function titleInput(): HTMLInputElement {
  return screen.getByLabelText('Título') as HTMLInputElement;
}

function dateInput(): HTMLInputElement {
  return screen.getByLabelText('Fecha (opcional)') as HTMLInputElement;
}

function descriptionInput(): HTMLTextAreaElement {
  return screen.getByLabelText('Descripción (opcional)') as HTMLTextAreaElement;
}

describe('AlbumFormDialog · validación en cliente', () => {
  it('exige el título y no llama a la API', async () => {
    const csrfRequests = useCsrf();
    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('El título es obligatorio.')).toBeTruthy();
    expect(screen.getByText('Revisa el formulario')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    expect(csrfRequests()).toBe(0);
  });

  it('rechaza un título de más de 120 caracteres', async () => {
    renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    fireEvent.change(titleInput(), { target: { value: 'x'.repeat(121) } });
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('El título no puede superar los 120 caracteres.')).toBeTruthy();
  });

  it('rechaza una descripción de más de 1000 caracteres', async () => {
    renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');
    fireEvent.change(descriptionInput(), { target: { value: 'a'.repeat(1001) } });
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(
      await screen.findByText('La descripción no puede superar los 1000 caracteres.'),
    ).toBeTruthy();
  });

  it('rechaza un mes inválido en el fallback de texto y no llama a la API', async () => {
    const csrfRequests = useCsrf();
    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');

    // Simula un navegador sin soporte de `input[type=month]`: el control cae a
    // texto y conserva valores parciales o fuera de rango.
    dateInput().type = 'text';
    fireEvent.change(dateInput(), { target: { value: '2026-13' } });
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('Indica un mes válido.')).toBeTruthy();
    expect(dateInput().getAttribute('aria-invalid')).toBe('true');
    await waitFor(() => {
      expect(document.activeElement).toBe(dateInput());
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(csrfRequests()).toBe(0);
  });
});

describe('AlbumFormDialog · envío al contrato', () => {
  it('envía la fecha como día 1 a las 00:00 UTC, el CSRF y la descripción recortada', async () => {
    let body: unknown = null;
    let csrfHeader: string | null = null;

    useCsrf('csrf-create');
    server.use(
      http.post(ALBUMS_URL, async ({ request }) => {
        body = await request.json();
        csrfHeader = request.headers.get('x-csrf-token');
        return HttpResponse.json(albumWithPhotos, { status: 201 });
      }),
    );

    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');
    fireEvent.change(dateInput(), { target: { value: '2026-08' } });
    await user.type(descriptionInput(), '  Dos semanas en Dejà con los primos.  ');
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(albumWithPhotos);
    });

    expect(csrfHeader).toBe('csrf-create');
    expect(body).toEqual({
      title: 'Verano 2026',
      description: 'Dos semanas en Dejà con los primos.',
      date: '2026-08-01T00:00:00.000Z',
    });
  });

  it('envía null al limpiar la fecha y al dejar la descripción vacía', async () => {
    let body: unknown = null;

    useCsrf();
    server.use(
      http.post(ALBUMS_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(albumWithPhotos, { status: 201 });
      }),
    );

    renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');
    fireEvent.change(dateInput(), { target: { value: '2026-08' } });
    fireEvent.change(dateInput(), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    await waitFor(() => {
      expect(body).toEqual({ title: 'Verano 2026', description: null, date: null });
    });
  });

  it('precarga el mes actual en el alta y lo envía como ISO si no se toca', async () => {
    let body: unknown = null;
    const month = currentMonthInput();

    useCsrf();
    server.use(
      http.post(ALBUMS_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(albumWithPhotos, { status: 201 });
      }),
    );

    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await waitFor(() => {
      expect(dateInput().value).toBe(month);
    });

    await user.type(titleInput(), 'Verano 2026');
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(albumWithPhotos);
    });
    expect(body).toEqual({
      title: 'Verano 2026',
      description: null,
      date: `${month}-01T00:00:00.000Z`,
    });
  });

  it('bloquea el diálogo mientras guarda y no permite cerrarlo con Esc', async () => {
    useCsrf();
    server.use(
      http.post(ALBUMS_URL, async () => {
        await delay(80);
        return HttpResponse.json(albumWithPhotos, { status: 201 });
      }),
    );

    const { onClose, onSaved } = renderForm();
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo álbum' });

    await user.type(titleInput(), 'Verano 2026');
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    const saving = await screen.findByRole('button', { name: 'Guardando álbum…' });

    expect(saving.getAttribute('aria-busy')).toBe('true');
    // Región viva: anuncia el guardado sin depender del texto del botón.
    expect(within(dialog).getByRole('status').textContent).toBe('Guardando álbum…');
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(albumWithPhotos);
    });
  });
});

describe('AlbumFormDialog · errores del servidor', () => {
  it('pinta el 400 en el campo correcto y enfoca el primero', async () => {
    useCsrf();
    server.use(
      http.post(ALBUMS_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos.',
            details: [
              { field: 'title', message: 'Ese título ya existe en este círculo.' },
              { field: 'date', message: 'Esa fecha no es válida.' },
              { field: 'coverPhotoId', message: 'La portada no pertenece al álbum.' },
            ],
          },
          { status: 400 },
        ),
      ),
    );

    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('Revisa los datos del álbum')).toBeTruthy();
    expect(screen.getByText('Ese título ya existe en este círculo.')).toBeTruthy();
    expect(screen.getByText('Esa fecha no es válida.')).toBeTruthy();
    // Un detalle de un campo ajeno al formulario no se pinta.
    expect(screen.queryByText('La portada no pertenece al álbum.')).toBeNull();

    expect(titleInput().getAttribute('aria-invalid')).toBe('true');
    expect(dateInput().getAttribute('aria-invalid')).toBe('true');
    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput());
    });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('explica un 500 sin perder lo escrito', async () => {
    useCsrf();
    server.use(
      http.post(ALBUMS_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
          { status: 500 },
        ),
      ),
    );

    const { onSaved } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await user.type(titleInput(), 'Verano 2026');
    await user.click(screen.getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('No hemos podido crear el álbum')).toBeTruthy();
    expect(screen.getByText(/No has perdido nada de lo que has escrito/)).toBeTruthy();
    expect(titleInput().value).toBe('Verano 2026');
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('AlbumFormDialog · edición', () => {
  it('precarga los valores, envía un PATCH y muestra «Guardando cambios…»', async () => {
    let body: unknown = null;

    useCsrf();
    server.use(
      http.patch(ALBUM_URL, async ({ request }) => {
        body = await request.json();
        await delay(80);
        return HttpResponse.json({ ...albumWithPhotos, title: 'Verano 2026' });
      }),
    );

    const { onSaved } = renderForm({ mode: 'edit', album: albumWithPhotos });
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Editar álbum' });

    await waitFor(() => {
      expect(titleInput().value).toBe('Verano en Mallorca');
    });
    expect(descriptionInput().value).toBe('Dos semanas en Dejà con los primos.');
    expect(dateInput().value).toBe('2026-08');

    await user.clear(titleInput());
    await user.type(titleInput(), 'Verano 2026');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const saving = await screen.findByRole('button', { name: 'Guardando cambios…' });

    expect(saving.getAttribute('aria-busy')).toBe('true');
    expect(within(dialog).getByRole('status').textContent).toBe('Guardando cambios…');

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith({ ...albumWithPhotos, title: 'Verano 2026' });
    });
    expect(body).toEqual({
      title: 'Verano 2026',
      description: 'Dos semanas en Dejà con los primos.',
      date: '2026-08-01T00:00:00.000Z',
    });
  });

  it('guarda los valores precargados aunque no se cambie nada', async () => {
    let body: unknown = null;

    useCsrf();
    server.use(
      http.patch(ALBUM_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(albumWithPhotos);
      }),
    );

    renderForm({ mode: 'edit', album: albumWithPhotos });
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Editar álbum' });
    await waitFor(() => {
      expect(titleInput().value).toBe('Verano en Mallorca');
    });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(body).toEqual({
        title: 'Verano en Mallorca',
        description: 'Dos semanas en Dejà con los primos.',
        date: '2026-08-01T00:00:00.000Z',
      });
    });
  });
});

describe('AlbumFormDialog · portada, teclado y accesibilidad', () => {
  it('muestra la portada deshabilitada con su nota', async () => {
    renderForm();

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    const coverButton = within(dialog).getByRole('button', { name: 'Elegir portada' });

    expect((coverButton as HTMLButtonElement).disabled).toBe(true);
    expect(coverButton.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(dialog).getByText('Podrás elegirla cuando el álbum tenga fotos.')).toBeTruthy();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('enfoca el título al abrir y cierra con Esc cuando no está guardando', async () => {
    const { onClose } = renderForm();
    const user = userEvent.setup();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await waitFor(() => {
      expect(document.activeElement).toBe(titleInput());
    });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no tiene violaciones de axe con el diálogo abierto', async () => {
    renderForm();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });
    await expectNoAxeViolations(document.body);
  });
});

describe('AlbumFormDialog · estructura del formulario', () => {
  it('incluye un botón de envío oculto dentro del form', async () => {
    renderForm();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });

    const form = document.querySelector('form');

    expect(form).toBeTruthy();

    const defaultButton = form?.querySelector('button[type="submit"]');

    expect(defaultButton).toBeTruthy();
    expect((defaultButton as HTMLButtonElement).hidden).toBe(true);
    expect(defaultButton?.textContent).toBe('Guardar');

    // El botón visible vive en el footer del diálogo, fuera del form, y se
    // asocia con `form={id}`.
    const visible = screen.getByRole('button', { name: 'Crear álbum' });

    expect(form?.contains(visible)).toBe(false);
    expect(visible.getAttribute('form')).toBe(form?.id);
  });

  it('ordena Título → Fecha → Descripción en el DOM', async () => {
    renderForm();

    await screen.findByRole('dialog', { name: 'Nuevo álbum' });

    const title = titleInput();
    const description = descriptionInput();
    const date = dateInput();

    expect(title.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      date.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
