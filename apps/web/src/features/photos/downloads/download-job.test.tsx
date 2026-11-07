import type { DownloadJobDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';

import { DownloadJobToast } from './download-job-toast';
import { useDownloadJobController } from './use-download-job';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const CREATE_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/downloads`;
const JOB_URL = `${AUTH_TEST_API_BASE}/downloads/:jobId`;

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

function makeJob(overrides: Partial<DownloadJobDto> = {}): DownloadJobDto {
  const id = overrides.id ?? 'job_1';

  return {
    id,
    kind: 'selection',
    status: 'pending',
    albumId: 'alb_verano',
    progress: null,
    createdAt: '2026-11-07T10:00:00.000Z',
    expiresAt: '2026-11-08T10:00:00.000Z',
    completedAt: null,
    errorMessage: null,
    ...overrides,
  };
}

function Harness() {
  const controller = useDownloadJobController({ albumId: 'alb_verano' });

  return (
    <>
      <button type="button" onClick={() => controller.start({ photoIds: ['pho_playa'] })}>
        Crear
      </button>
      <DownloadJobToast controller={controller} />
    </>
  );
}

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe('job de descarga', () => {
  it('crea el job con CSRF, sondea y descarga el ZIP listo', async () => {
    const posts: unknown[] = [];
    const csrfHeaders: Array<string | null> = [];
    let getCount = 0;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-download' })),
      http.post(CREATE_URL, async ({ request }) => {
        posts.push(await request.json());
        csrfHeaders.push(request.headers.get('x-csrf-token'));

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
      http.get(JOB_URL, () => {
        getCount += 1;

        return HttpResponse.json(
          makeJob({ status: getCount === 1 ? 'processing' : 'ready', progress: 40 }),
        );
      }),
    );

    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Generando el ZIP…')).toBeTruthy();
    expect(
      await screen.findByText('ZIP listo, descarga iniciada', {}, { timeout: 5000 }),
    ).toBeTruthy();

    expect(posts).toEqual([{ photoIds: ['pho_playa'] }]);
    expect(csrfHeaders).toEqual(['csrf-download']);
    expect(getCount).toBeGreaterThanOrEqual(2);

    const anchors = clickSpy.mock.instances as unknown as HTMLAnchorElement[];
    const lastAnchor = anchors.at(-1);

    expect(lastAnchor?.getAttribute('href')).toBe('/api/downloads/job_1/file');
    expect(lastAnchor?.hasAttribute('download')).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Volver a descargar' }));

    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('muestra el error del job y «Reintentar» crea otro job', async () => {
    let posts = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-download' })),
      http.post(CREATE_URL, () => {
        posts += 1;

        return HttpResponse.json(makeJob({ id: `job_${posts}` }), { status: 202 });
      }),
      http.get(JOB_URL, ({ params }) =>
        HttpResponse.json(
          makeJob({
            id: String(params.jobId),
            status: 'error',
            errorMessage: 'El archivo superó el límite del servidor.',
          }),
        ),
      ),
    );

    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('No hemos podido generar el ZIP')).toBeTruthy();
    expect(screen.getByText('El archivo superó el límite del servidor.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(posts).toBe(2));
  });

  it('anuncia el enlace caducado y «Generar otro» crea otro job', async () => {
    let posts = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-download' })),
      http.post(CREATE_URL, () => {
        posts += 1;

        return HttpResponse.json(makeJob({ id: `job_${posts}` }), { status: 202 });
      }),
      http.get(JOB_URL, ({ params }) =>
        HttpResponse.json(makeJob({ id: String(params.jobId), status: 'expired' })),
      ),
    );

    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('El enlace ha caducado')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Generar otro' }));

    await waitFor(() => expect(posts).toBe(2));
  });
});
