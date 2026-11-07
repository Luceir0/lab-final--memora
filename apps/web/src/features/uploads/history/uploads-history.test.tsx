import type { MyUploadsSummary, PhotoDto, PhotoSummary } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { renderAlbumsRouter } from '../../../test/fixtures/albums-router';
import {
  createFakeUploadQueue,
  pendingUploadItem,
} from '../../../test/fixtures/upload-queue-fixtures';
import { UploadQueueContext } from '../upload-queue-context';

import { UploadHistoryPage } from './uploads-history-page';

const server = createAuthTestServer();
const SUMMARY_URL = `${AUTH_TEST_API_BASE}/me/uploads`;
const PHOTOS_URL = `${AUTH_TEST_API_BASE}/me/uploads/photos`;

// La hora visible depende de la zona horaria del navegador; la fecha no.
const FIRST_PHOTO_ALT = /Foto de Costa Brava, subida el 5 abr 2025 a las \d{2}:\d{2}/;
const SECOND_PHOTO_ALT = /Foto de Costa Brava, subida el 1 mar 2025 a las \d{2}:\d{2}/;
const THIRD_PHOTO_ALT = /Foto de Costa Brava, subida el 1 feb 2025 a las \d{2}:\d{2}/;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function summaryPhoto(id: string): PhotoSummary {
  return {
    id,
    thumbUrl: `/api/photos/${id}/image?size=thumb`,
    width: 1200,
    height: 1600,
  };
}

function photo(
  id: string,
  albumId: string,
  circleId: string,
  overrides: Partial<PhotoDto> = {},
): PhotoDto {
  return {
    id,
    circleId,
    albumId,
    uploader: { id: 'usr_test_1', name: 'Sofía Martín', avatarUrl: null },
    clientUploadId: null,
    description: null,
    takenAt: null,
    placeName: null,
    mimeType: 'image/jpeg',
    size: 2048,
    width: 1200,
    height: 1600,
    thumbUrl: `/api/photos/${id}/image?size=thumb`,
    displayUrl: `/api/photos/${id}/image?size=display`,
    tags: [],
    createdAt: '2025-04-05T12:00:00.000Z',
    updatedAt: '2025-04-05T12:00:00.000Z',
    ...overrides,
  };
}

/** Dos círculos, tres carpetas y 7 fotos. */
function buildSummary(): MyUploadsSummary {
  return {
    total: 7,
    circles: [
      {
        circle: { id: 'cir_familia', name: 'Familia' },
        photosCount: 5,
        albums: [
          {
            album: { id: 'alb_costa', title: 'Costa Brava' },
            photosCount: 3,
            lastUploadAt: '2025-04-05T12:00:00.000Z',
            preview: [summaryPhoto('prev_1'), summaryPhoto('prev_2'), summaryPhoto('prev_3')],
          },
          {
            album: { id: 'alb_navidad', title: 'Navidad' },
            photosCount: 2,
            lastUploadAt: '2025-01-02T12:00:00.000Z',
            preview: [summaryPhoto('prev_4')],
          },
        ],
      },
      {
        circle: { id: 'cir_amigos', name: 'Amigos' },
        photosCount: 2,
        albums: [
          {
            album: { id: 'alb_ruta', title: 'Ruta' },
            photosCount: 2,
            lastUploadAt: '2025-03-10T12:00:00.000Z',
            preview: [summaryPhoto('prev_5'), summaryPhoto('prev_6')],
          },
        ],
      },
    ],
  };
}

function renderPage(queue = createFakeUploadQueue()) {
  return renderAlbumsRouter(
    <UploadQueueContext.Provider value={queue}>
      <UploadHistoryPage />
    </UploadQueueContext.Provider>,
    '/',
  );
}

function folderButton(name: RegExp) {
  return screen.getByRole('button', { name });
}

describe('UploadHistoryPage · resumen', () => {
  it('pinta cabecera, dos círculos, tres carpetas, contadores, fechas y mosaico', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())));

    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Subidas' })).toBeTruthy();
    expect(screen.getByText('Tus fotos')).toBeTruthy();
    expect(await screen.findByText('7 fotos en 2 círculos')).toBeTruthy();

    const familia = screen.getByRole('region', { name: 'Familia' });
    const amigos = screen.getByRole('region', { name: 'Amigos' });

    expect(within(familia).getByRole('heading', { level: 2, name: 'Familia' })).toBeTruthy();
    expect(within(amigos).getByRole('heading', { level: 2, name: 'Amigos' })).toBeTruthy();
    expect(familia.querySelector('h2')?.className).toContain('font-bold');
    expect(within(familia).getByText('5 fotos')).toBeTruthy();
    expect(within(amigos).getByText('2 fotos')).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);

    const costa = folderButton(/Costa Brava/);

    expect(screen.getByRole('heading', { level: 3, name: /Costa Brava/ })).toBeTruthy();
    expect(within(familia).getByRole('button', { name: /Navidad/ })).toBeTruthy();
    expect(within(amigos).getByRole('button', { name: /Ruta/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(3);

    expect(costa.closest('li')?.className).toContain('overflow-hidden');
    expect(costa.textContent).toContain('3 fotos');
    expect(costa.textContent).toContain('Última subida el 5 abr 2025');

    const lastUpload = costa.querySelector('time');

    expect(lastUpload?.getAttribute('datetime')).toBe('2025-04-05T12:00:00.000Z');
    expect(lastUpload?.textContent).toBe('5 abr 2025');

    // Tres previews y un hueco relleno con `surface-2`.
    expect(costa.querySelectorAll('img')).toHaveLength(3);

    const mosaic = costa.querySelector('.grid.size-16');

    expect(mosaic?.className).toContain('overflow-hidden');
    expect(mosaic?.className).toContain('rounded-md');
    expect(mosaic?.className).toContain('gap-1');

    // Solo se pinta lo que devuelve el resumen.
    expect(screen.queryByText('Compañeros')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Trabajo' })).toBeNull();

    const costaTitle = within(costa).getByText('Costa Brava');

    expect(costaTitle.className).toContain('line-clamp-2');
    expect(costaTitle.className).toContain('break-words');
  });

  it('mueve el foco al título principal al montar la página', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())));

    renderPage();

    const title = await screen.findByRole('heading', { level: 1, name: 'Subidas' });

    expect(title.getAttribute('tabindex')).toBe('-1');

    await waitFor(() => {
      expect(document.activeElement).toBe(title);
    });
  });

  it('con un único círculo lo nombra en el resumen', async () => {
    const summary = buildSummary();

    server.use(
      http.get(SUMMARY_URL, () =>
        HttpResponse.json({ total: 2, circles: summary.circles.slice(0, 1) }),
      ),
    );

    renderPage();

    expect(await screen.findByText(/2 fotos en/)).toBeTruthy();
    expect(screen.getByText('2 fotos en Familia')).toBeTruthy();
  });

  it('rompe un nombre de círculo largo en el resumen sin desbordar', async () => {
    const summary = buildSummary();
    const familia = summary.circles.at(0);

    if (familia === undefined) {
      throw new Error('La fixture debe incluir el círculo Familia');
    }

    const longName = 'A'.repeat(80);

    server.use(
      http.get(SUMMARY_URL, () =>
        HttpResponse.json({
          total: familia.photosCount,
          circles: [{ ...familia, circle: { id: familia.circle.id, name: longName } }],
        }),
      ),
    );

    renderPage();

    const line = await screen.findByText(`5 fotos en ${longName}`);

    expect(line.tagName).toBe('P');
    expect(line.className).toContain('break-words');
    expect(line.className).toContain('[overflow-wrap:anywhere]');
  });

  it('no tiene violaciones de axe en el estado cargado', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())));
    server.use(
      http.get(PHOTOS_URL, () =>
        HttpResponse.json({
          items: [
            photo('ph_1', 'alb_costa', 'cir_familia'),
            photo('ph_2', 'alb_costa', 'cir_familia', {
              createdAt: '2025-03-01T12:00:00.000Z',
            }),
          ],
          nextCursor: null,
          total: 2,
        }),
      ),
    );

    const { container } = renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    const costa = folderButton(/Costa Brava/);

    fireEvent.click(costa);

    expect(await screen.findByAltText(SECOND_PHOTO_ALT)).toBeTruthy();

    await expectNoAxeViolations(container);
  });
});

describe('UploadHistoryPage · bloque «En curso»', () => {
  const DOCUMENT_POSITION_FOLLOWING = 4;

  it('aparece encima de las secciones de círculos y sale de la cola de F26', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())));

    renderPage(createFakeUploadQueue([pendingUploadItem({ originalName: 'costa-1.jpg' })]));

    const block = await screen.findByRole('region', { name: 'En curso' });
    const familia = await screen.findByRole('region', { name: 'Familia' });

    expect(within(block).getByText('costa-1.jpg')).toBeTruthy();
    expect(block.compareDocumentPosition(familia) & DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('también aparece por encima del estado vacío', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json({ total: 0, circles: [] })));

    renderPage(createFakeUploadQueue([pendingUploadItem()]));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Aún no has subido fotos' }),
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'En curso' })).toBeTruthy();
  });

  it('se mantiene visible mientras carga el resumen', async () => {
    server.use(http.get(SUMMARY_URL, () => new Promise<Response>(() => undefined)));

    renderPage(createFakeUploadQueue([pendingUploadItem()]));

    expect(await screen.findByText('Cargando tus subidas…')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'En curso' })).toBeTruthy();
  });
});

describe('UploadHistoryPage · carpetas', () => {
  it('abrir una carpeta pide solo sus fotos y «Ver más» añade sin duplicar', async () => {
    const requests: URLSearchParams[] = [];
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');
    const p2 = photo('ph_2', 'alb_costa', 'cir_familia', {
      createdAt: '2025-03-01T12:00:00.000Z',
    });
    const p3 = photo('ph_3', 'alb_costa', 'cir_familia', {
      createdAt: '2025-02-01T12:00:00.000Z',
    });

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');

        requests.push(url.searchParams);

        if (cursor === null) {
          return HttpResponse.json({ items: [p1, p2], nextCursor: 'next-1', total: 3 });
        }

        // La segunda página repite `p1` a propósito: la UI no debe duplicarlo.
        return HttpResponse.json({ items: [p1, p3], nextCursor: null, total: 3 });
      }),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    const button = folderButton(/Costa Brava/);

    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });
    const firstAlt = FIRST_PHOTO_ALT;

    expect(panel.getAttribute('aria-label')).toBe('Costa Brava');
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
    expect(await within(panel).findByAltText(firstAlt)).toBeTruthy();
    expect(within(panel).getByAltText(SECOND_PHOTO_ALT)).toBeTruthy();
    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });

    const firstRequest = requests[0];

    expect(firstRequest?.get('albumId')).toBe('alb_costa');
    expect(firstRequest?.get('cursor')).toBeNull();
    expect(firstRequest?.get('limit')).toBe('24');

    fireEvent.click(within(panel).getByRole('button', { name: 'Ver más' }));

    expect(await within(panel).findByAltText(THIRD_PHOTO_ALT)).toBeTruthy();
    await waitFor(() => {
      expect(requests).toHaveLength(2);
    });

    expect(requests[1]?.get('cursor')).toBe('next-1');
    expect(requests[1]?.get('albumId')).toBe('alb_costa');
    expect(within(panel).getAllByAltText(firstAlt)).toHaveLength(1);
    expect(within(panel).getAllByAltText(/^Foto de Costa Brava/)).toHaveLength(3);
    expect(within(panel).queryByRole('button', { name: 'Ver más' })).toBeNull();
  });

  it('si falla «Ver más» conserva la rejilla y permite reintentar', async () => {
    let photosRequests = 0;
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');
    const p2 = photo('ph_2', 'alb_costa', 'cir_familia', {
      createdAt: '2025-03-01T12:00:00.000Z',
    });
    const firstAlt = FIRST_PHOTO_ALT;
    const secondAlt = SECOND_PHOTO_ALT;

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, ({ request }) => {
        photosRequests += 1;

        const cursor = new URL(request.url).searchParams.get('cursor');

        if (cursor === null) {
          return HttpResponse.json({ items: [p1], nextCursor: 'next-1', total: 2 });
        }

        if (photosRequests === 2) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
            { status: 500 },
          );
        }

        return HttpResponse.json({ items: [p2], nextCursor: null, total: 2 });
      }),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });

    expect(await within(panel).findByAltText(firstAlt)).toBeTruthy();

    fireEvent.click(within(panel).getByRole('button', { name: 'Ver más' }));

    const alert = await within(panel).findByRole('alert');

    expect(within(alert).getByText('No hemos podido cargar más fotos')).toBeTruthy();
    // La primera página sigue visible: el fallo de paginación no desmonta la rejilla.
    expect(within(panel).getByAltText(firstAlt)).toBeTruthy();
    expect(within(panel).queryByAltText(secondAlt)).toBeNull();
    expect(within(panel).getByRole('button', { name: 'Ver más' })).toBeTruthy();
    // Un fallo de paginación no anuncia fotos añadidas.
    expect(within(panel).getByRole('status').textContent).toBe('');

    fireEvent.click(within(panel).getByRole('button', { name: 'Reintentar' }));

    expect(await within(panel).findByAltText(secondAlt)).toBeTruthy();
    expect(within(panel).getByAltText(firstAlt)).toBeTruthy();
    expect(photosRequests).toBe(3);
  });

  it('al terminar «Ver más» mueve el foco a la primera foto nueva', async () => {
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');
    const p2 = photo('ph_2', 'alb_costa', 'cir_familia', {
      createdAt: '2025-03-01T12:00:00.000Z',
    });

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        return cursor === null
          ? HttpResponse.json({ items: [p1], nextCursor: 'next-1', total: 2 })
          : HttpResponse.json({ items: [p2], nextCursor: null, total: 2 });
      }),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });

    expect(await within(panel).findByAltText(FIRST_PHOTO_ALT)).toBeTruthy();

    const user = userEvent.setup();
    const more = within(panel).getByRole('button', { name: 'Ver más' });

    more.focus();
    expect(document.activeElement).toBe(more);

    await user.keyboard('{Enter}');

    const newImage = await within(panel).findByAltText(SECOND_PHOTO_ALT);
    const newPhoto = newImage.closest('li');

    expect(newPhoto).not.toBeNull();
    expect(newPhoto?.getAttribute('tabindex')).toBe('-1');
    expect(within(panel).queryByRole('button', { name: 'Ver más' })).toBeNull();

    await waitFor(() => {
      expect(document.activeElement).toBe(newPhoto);
    });
  });

  it('anuncia las fotos añadidas solo tras «Ver más»', async () => {
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');
    const p2 = photo('ph_2', 'alb_costa', 'cir_familia', {
      createdAt: '2025-03-01T12:00:00.000Z',
    });
    const p3 = photo('ph_3', 'alb_costa', 'cir_familia', {
      createdAt: '2025-02-01T12:00:00.000Z',
    });

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        return cursor === null
          ? HttpResponse.json({ items: [p1], nextCursor: 'next-1', total: 3 })
          : HttpResponse.json({ items: [p2, p3], nextCursor: null, total: 3 });
      }),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });

    expect(await within(panel).findByAltText(FIRST_PHOTO_ALT)).toBeTruthy();

    // La primera carga no deja una segunda región viva ni anuncia nada.
    const initialStatus = within(panel).getAllByRole('status');

    expect(initialStatus).toHaveLength(1);
    expect(initialStatus[0]?.textContent).toBe('');

    fireEvent.click(within(panel).getByRole('button', { name: 'Ver más' }));

    expect(await within(panel).findByAltText(THIRD_PHOTO_ALT)).toBeTruthy();

    const updatedStatus = within(panel).getAllByRole('status');

    expect(updatedStatus).toHaveLength(1);
    expect(updatedStatus[0]?.textContent).toBe('Se han añadido 2 fotos');
  });

  it('se abre y se cierra con Enter y Espacio manteniendo aria-expanded', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())));

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    const user = userEvent.setup();
    const button = folderButton(/Costa Brava/);

    button.focus();
    await user.keyboard('{Enter}');

    expect(button.getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('[Space]');

    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('si una miniatura falla pinta un bloque de reserva sin icono nativo', async () => {
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');
    const p2 = photo('ph_2', 'alb_costa', 'cir_familia', {
      createdAt: '2025-03-01T12:00:00.000Z',
    });

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, () =>
        HttpResponse.json({ items: [p1, p2], nextCursor: null, total: 2 }),
      ),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });
    const image = await within(panel).findByAltText(FIRST_PHOTO_ALT);
    const alt = image.getAttribute('alt') ?? '';

    fireEvent.error(image);

    expect(within(panel).queryByAltText(FIRST_PHOTO_ALT)).toBeNull();

    const fallback = within(panel).getByRole('img', { name: alt });

    expect(fallback.tagName).toBe('DIV');
    expect(panel.querySelectorAll('img')).toHaveLength(1);
  });

  it('abre el visor desde la miniatura con un enlace accesible', async () => {
    const p1 = photo('ph_1', 'alb_costa', 'cir_familia');

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: [p1], nextCursor: null, total: 1 })),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });
    const link = await within(panel).findByRole('link', { name: /^Abrir foto: / });

    expect(link.getAttribute('href')).toBe('/circles/cir_familia/albums/alb_costa/photos/ph_1');
  });

  it('usa la descripción como alt cuando existe', async () => {
    const described = photo('ph_desc', 'alb_costa', 'cir_familia', {
      description: 'Mirador al atardecer',
    });

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, () =>
        HttpResponse.json({ items: [described], nextCursor: null, total: 1 }),
      ),
    );

    renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });

    expect(await within(panel).findByAltText('Mirador al atardecer')).toBeTruthy();
    expect(within(panel).queryByAltText(FIRST_PHOTO_ALT)).toBeNull();
  });

  it('un error al cargar la carpeta no tumba la página y permite reintentar', async () => {
    let photosRequests = 0;

    server.use(
      http.get(SUMMARY_URL, () => HttpResponse.json(buildSummary())),
      http.get(PHOTOS_URL, () => {
        photosRequests += 1;

        if (photosRequests === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          items: [photo('ph_1', 'alb_costa', 'cir_familia')],
          nextCursor: null,
          total: 1,
        });
      }),
    );

    const { container } = renderPage();

    await screen.findByRole('heading', { level: 2, name: 'Familia' });

    fireEvent.click(folderButton(/Costa Brava/));

    const panel = await screen.findByRole('region', { name: /Costa Brava/ });
    const alert = await within(panel).findByRole('alert');

    expect(within(alert).getByText('No hemos podido cargar estas fotos')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Familia' })).toBeTruthy();

    fireEvent.click(within(panel).getByRole('button', { name: 'Reintentar' }));

    expect(await within(panel).findByAltText(FIRST_PHOTO_ALT)).toBeTruthy();
    expect(photosRequests).toBe(2);
    expect(container.textContent).toContain('Navidad');
  });
});

describe('UploadHistoryPage · estados', () => {
  it('muestra esqueletos y aria-busy mientras carga', async () => {
    let resolveSummary!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveSummary = resolve;
    });

    server.use(http.get(SUMMARY_URL, () => pending));

    const { container } = renderPage();

    expect(await screen.findByText('Cargando tus subidas…')).toBeTruthy();

    const busy = container.querySelector('[aria-busy="true"]');

    expect(busy).not.toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Familia' })).toBeNull();

    const mosaicSkeletons = busy?.querySelectorAll('.size-16.shrink-0');

    expect(mosaicSkeletons).toHaveLength(4);

    for (const mosaic of mosaicSkeletons ?? []) {
      expect(mosaic.firstElementChild?.className).toContain('size-full');
    }

    for (const skeleton of busy?.querySelectorAll('[aria-hidden="true"]') ?? []) {
      expect(skeleton.className).not.toMatch(/\bw-(?:40|24|20|2\/3|1\/2)\b/);
    }

    const summarySkeleton = container.querySelector('.mt-2.h-6.w-40');

    expect(summarySkeleton).not.toBeNull();
    expect(container.querySelector('[aria-hidden="true"].w-40')).toBeNull();

    resolveSummary(HttpResponse.json(buildSummary()));

    expect(await screen.findByRole('heading', { level: 2, name: 'Familia' })).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });
  });

  it('muestra el vacío propio con enlace a Mis círculos y sin violaciones de axe', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json({ total: 0, circles: [] })));

    const { container } = renderPage();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Aún no has subido fotos' }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Cuando subas fotos desde un álbum, aparecerán aquí agrupadas por círculo y carpeta.',
      ),
    ).toBeTruthy();

    const link = screen.getByRole('link', { name: 'Mis círculos' });

    expect(link.getAttribute('href')).toBe('/circles');
    expect(screen.queryByRole('button', { expanded: false })).toBeNull();

    await expectNoAxeViolations(container);
  });

  it('muestra el error con Reintentar y se recupera', async () => {
    let requests = 0;

    server.use(
      http.get(SUMMARY_URL, () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
            { status: 500 },
          );
        }

        return HttpResponse.json(buildSummary());
      }),
    );

    renderPage();

    const alert = await screen.findByRole('alert');

    expect(within(alert).getByText('No hemos podido cargar tus subidas')).toBeTruthy();

    const alertCard = alert.closest('[data-tone="danger"]');

    expect(alertCard?.className).toContain('mx-auto');
    expect(alertCard?.className).toContain('max-w-xl');

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Familia' })).toBeTruthy();
    expect(requests).toBe(2);
  });
});
