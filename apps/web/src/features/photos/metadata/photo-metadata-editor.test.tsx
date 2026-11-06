import type { PhotoDto, UpdatePhotoRequest } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { makePhoto } from '../../../test/fixtures/photos-fixtures';

import { PhotoMetadataEditor } from './photo-metadata-editor';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const PHOTO_URL = `${AUTH_TEST_API_BASE}/photos/pho_playa`;

const basePhoto = makePhoto({
  id: 'pho_playa',
  description: 'Atardecer en la playa',
  placeName: 'Deià',
  takenAt: '2026-08-01T10:00:00.000Z',
});

interface CapturedRequest {
  readonly body: UpdatePhotoRequest;
  readonly csrf: string | null;
}

function useEditorApi(
  options: {
    readonly failStatus?: number;
    readonly delayMs?: number;
    readonly onRequest?: (captured: CapturedRequest) => void;
  } = {},
) {
  server.use(
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
    http.patch(PHOTO_URL, async ({ request }) => {
      const body = (await request.json()) as UpdatePhotoRequest;

      options.onRequest?.({ body, csrf: request.headers.get('x-csrf-token') });

      if (options.delayMs !== undefined) {
        await delay(options.delayMs);
      }

      if (options.failStatus !== undefined) {
        return HttpResponse.json(
          { code: 'FORBIDDEN', message: 'No tienes permiso.' },
          { status: options.failStatus },
        );
      }

      return HttpResponse.json({
        ...basePhoto,
        ...body,
        updatedAt: '2026-08-05T00:00:00.000Z',
      });
    }),
  );
}

function renderEditor(
  options: {
    readonly photo?: PhotoDto;
    readonly onCancel?: () => void;
    readonly onSaved?: (photo: PhotoDto) => void;
  } = {},
) {
  const photo = options.photo ?? basePhoto;
  const onCancel = options.onCancel ?? vi.fn();
  const onSaved = options.onSaved ?? vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const rootRoute = createRootRoute({ component: Outlet });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: function EditorPage() {
      return (
        <PhotoMetadataEditor
          photo={photo}
          circleId="cir_familia"
          albumId="alb_verano"
          onCancel={onCancel}
          onSaved={onSaved}
        />
      );
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { onCancel, onSaved, queryClient };
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

describe('PhotoMetadataEditor', () => {
  it('carga los valores actuales y enfoca la descripción', async () => {
    useEditorApi();
    renderEditor();

    const description = await screen.findByLabelText('Descripción (opcional)');

    expect(description).toHaveProperty('value', 'Atardecer en la playa');
    expect(screen.getByLabelText(/Fecha de la foto/)).toHaveProperty('value', '2026-08-01');
    expect(screen.getByLabelText('Lugar (opcional)')).toHaveProperty('value', 'Deià');

    await waitFor(() => {
      expect(document.activeElement).toBe(description);
    });
  });

  it('guarda con el esquema compartido y conserva la hora original', async () => {
    const user = userEvent.setup();
    const requests: CapturedRequest[] = [];
    useEditorApi({
      onRequest: (captured) => {
        requests.push(captured);
      },
    });
    const { onSaved } = renderEditor();

    const description = await screen.findByLabelText('Descripción (opcional)');
    await user.clear(description);
    await user.type(description, 'Nueva descripción');

    const place = screen.getByLabelText('Lugar (opcional)');
    await user.clear(place);
    await user.type(place, 'Palma');

    fireEvent.change(screen.getByLabelText(/Fecha de la foto/), {
      target: { value: '2026-08-05' },
    });

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.body).toEqual({
      description: 'Nueva descripción',
      takenAt: '2026-08-05T10:00:00.000Z',
      placeName: 'Palma',
    });
    expect(requests[0]?.csrf).toBe('csrf-token');
  });

  it('no envía el PATCH si el lugar supera el máximo compartido', async () => {
    const user = userEvent.setup();
    const requests: CapturedRequest[] = [];
    useEditorApi({
      onRequest: (captured) => {
        requests.push(captured);
      },
    });
    renderEditor();

    const place = await screen.findByLabelText('Lugar (opcional)');

    fireEvent.change(place, { target: { value: 'x'.repeat(201) } });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('El lugar no puede superar los 200 caracteres.')).toBeTruthy();
    expect(requests).toHaveLength(0);
  });

  it('muestra el error del servidor con role=alert y conserva lo escrito', async () => {
    const user = userEvent.setup();
    useEditorApi({ failStatus: 403 });
    const { onSaved } = renderEditor();

    const description = await screen.findByLabelText('Descripción (opcional)');
    await user.clear(description);
    await user.type(description, 'Texto que no se debe perder');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toContain('No puedes editar esta foto');
    expect(description).toHaveProperty('value', 'Texto que no se debe perder');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('marca aria-busy y deshabilita los botones mientras guarda', async () => {
    const user = userEvent.setup();
    useEditorApi({ delayMs: 150 });
    renderEditor();

    await screen.findByLabelText('Descripción (opcional)');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(screen.getByTestId('photo-metadata-form').getAttribute('aria-busy')).toBe('true');
    });

    expect(screen.getByRole('button', { name: /Guardando cambios/ })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true);
  });

  it('Escape cancela la edición y no llega al documento', async () => {
    useEditorApi();
    const onCancel = vi.fn();
    renderEditor({ onCancel });

    const description = await screen.findByLabelText('Descripción (opcional)');
    const documentEscape = vi.fn();
    document.addEventListener('keydown', documentEscape);

    fireEvent.keyDown(description, { key: 'Escape' });

    document.removeEventListener('keydown', documentEscape);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(documentEscape).not.toHaveBeenCalled();
  });
});
