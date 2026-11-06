import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_TEST_API_BASE, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { useUploadQueue } from '../uploads/upload-queue-context';
import { UploadProvider } from '../uploads/upload-provider';

/**
 * Subida real por XHR contra MSW.
 *
 * A diferencia de `use-upload-queue.test.tsx` (transporte falso), aquí se
 * ejercitan el transporte XHR por defecto, el cliente HTTP, el CSRF y el
 * proveedor completos. El primer `POST` responde 500 y el reintento 201, con el
 * mismo `clientUploadId` en ambos intentos.
 *
 * Limitación conocida de MSW 3.0.3 + jsdom: `request.formData()` falla al
 * parsear el multipart porque el parser de undici solo acepta su propio `File`,
 * no el de jsdom. Por eso el `clientUploadId` se extrae del cuerpo multipart
 * crudo con `request.text()`. El resto de la petición (método, URL, cabeceras y
 * cuerpo) sí pasa por MSW de verdad: no hay transporte falso.
 */

const server = createAuthTestServer();

const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const UPLOAD_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const photo: PhotoDto = {
  id: 'photo-xhr-1',
  circleId: 'cir_familia',
  albumId: 'alb_verano',
  uploader: { id: testUser.id, name: testUser.name, avatarUrl: null },
  clientUploadId: 'client-xhr',
  description: null,
  takenAt: null,
  placeName: null,
  mimeType: 'image/jpeg',
  size: 10,
  width: 100,
  height: 100,
  thumbUrl: '/api/photos/photo-xhr-1/image?size=thumb',
  displayUrl: '/api/photos/photo-xhr-1/image?size=display',
  tags: [],
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
};

function extractClientUploadId(body: string): string {
  const match = /name="clientUploadId"\r?\n\r?\n([^\r\n]+)/.exec(body);

  return match?.[1] ?? '';
}

function Harness() {
  const { items, summary, enqueue, retry } = useUploadQueue();
  const item = items[0];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          enqueue([new File(['contenido'], 'playa.jpg', { type: 'image/jpeg' })], {
            albumId: 'alb_verano',
            albumTitle: 'Verano en Mallorca',
            source: 'desktop',
          });
        }}
      >
        subir
      </button>
      <button
        type="button"
        onClick={() => {
          if (item !== undefined) {
            retry(item.id);
          }
        }}
      >
        reintentar
      </button>
      <p data-testid="status">{item?.status ?? 'none'}</p>
      <p data-testid="completed">{summary.completed}</p>
      <p data-testid="error-code">{item?.status === 'error' ? item.error.code : 'none'}</p>
      <p data-testid="error-message">{item?.status === 'error' ? item.error.message : 'none'}</p>
    </>
  );
}

function renderWithRealXhr() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider>
        <Harness />
      </UploadProvider>
    </QueryClientProvider>,
  );
}

describe('subida real por XHR + MSW', () => {
  it('un 500 deja el archivo en error y el reintento con el mismo clientUploadId termina en done', async () => {
    let attempts = 0;
    let csrfRequests = 0;
    const clientUploadIds: string[] = [];
    const csrfHeaders: (string | null)[] = [];
    const contentTypes: (string | null)[] = [];

    server.use(
      http.get(CSRF_URL, () => {
        csrfRequests += 1;
        return HttpResponse.json({ csrfToken: 'csrf-xhr' });
      }),
      http.post(UPLOAD_URL, async ({ request }) => {
        attempts += 1;
        contentTypes.push(request.headers.get('content-type'));
        csrfHeaders.push(request.headers.get('x-csrf-token'));

        const body = await request.text();
        clientUploadIds.push(extractClientUploadId(body));

        if (attempts === 1) {
          return HttpResponse.json(
            {
              code: 'INTERNAL_ERROR',
              message: 'No se pudo completar la subida.',
              details: null,
            },
            { status: 500 },
          );
        }

        return HttpResponse.json(photo, { status: 201 });
      }),
    );

    renderWithRealXhr();

    fireEvent.click(screen.getByRole('button', { name: 'subir' }));

    await waitFor(
      () => {
        expect(screen.getByTestId('status').textContent).toBe('error');
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId('error-code').textContent).toBe('INTERNAL_ERROR');
    expect(screen.getByTestId('error-message').textContent).toBe('No se pudo completar la subida.');
    expect(attempts).toBe(1);
    expect(clientUploadIds[0]).not.toBe('');
    expect(contentTypes[0]).toContain('multipart/form-data');
    expect(csrfHeaders[0]).toBe('csrf-xhr');

    fireEvent.click(screen.getByRole('button', { name: 'reintentar' }));

    await waitFor(
      () => {
        expect(screen.getByTestId('status').textContent).toBe('done');
      },
      { timeout: 3000 },
    );

    expect(attempts).toBe(2);
    expect(clientUploadIds[1]).toBe(clientUploadIds[0]);
    expect(csrfHeaders[1]).toBe('csrf-xhr');
    expect(screen.getByTestId('completed').textContent).toBe('1');
    // Un token por lote: el reintento no vuelve a pedir CSRF.
    expect(csrfRequests).toBe(1);
  });

  it('normaliza un 500 sin cuerpo contractual a INTERNAL_ERROR', async () => {
    let attempts = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-xhr' })),
      http.post(UPLOAD_URL, () => {
        attempts += 1;

        return HttpResponse.json({ unexpected: true }, { status: 500 });
      }),
    );

    renderWithRealXhr();

    fireEvent.click(screen.getByRole('button', { name: 'subir' }));

    await waitFor(
      () => {
        expect(screen.getByTestId('status').textContent).toBe('error');
      },
      { timeout: 3000 },
    );

    expect(attempts).toBe(1);
    expect(screen.getByTestId('error-code').textContent).toBe('INTERNAL_ERROR');
  });
});
