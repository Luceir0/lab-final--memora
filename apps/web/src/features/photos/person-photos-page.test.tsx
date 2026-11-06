import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';
import { albumNoCoverNoDate, albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../test/fixtures/photos-fixtures';
import { renderWithRouter } from '../../test/circles-harness';
import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { CircleDetailProvider } from '../circles/circle-detail-context';
import { defaultMembers } from '../members/members-fixtures';

import { PersonPhotosPage } from './person-photos-page';

const server = createAuthTestServer();
const MEMBERS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members`;
const ALBUMS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/albums`;
const PERSON_PHOTOS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members/usr_lucas/photos`;
const PERSON_EMPTY_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members/usr_laura/photos`;
const ALBUM_PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

interface PersonApiOptions {
  readonly onAlbumPhotosRequest?: (url: URL) => void;
  readonly onPersonPhotosRequest?: (url: URL) => void;
}

function usePersonApi(options: PersonApiOptions = {}) {
  server.use(
    http.get(MEMBERS_URL, () => HttpResponse.json({ items: defaultMembers, nextCursor: null })),
    http.get(ALBUMS_URL, () =>
      HttpResponse.json({
        items: [albumWithPhotos, albumNoCoverNoDate],
        nextCursor: null,
      }),
    ),
    http.get(PERSON_PHOTOS_URL, ({ request }) => {
      const url = new URL(request.url);
      const cursor = url.searchParams.get('cursor');

      options.onPersonPhotosRequest?.(url);

      if (cursor === 'next') {
        return HttpResponse.json({ items: [galleryPhotos[1]], nextCursor: null });
      }

      return HttpResponse.json({ items: [galleryPhotos[0]], nextCursor: 'next' });
    }),
    http.get(PERSON_EMPTY_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(ALBUM_PHOTOS_URL, ({ request }) => {
      options.onAlbumPhotosRequest?.(new URL(request.url));

      return HttpResponse.json({ items: [galleryPhotos[0]], nextCursor: null });
    }),
  );
}

function renderPersonPhotos(userId = 'usr_lucas') {
  return renderWithRouter(
    <CircleDetailProvider
      circle={circleDetail(circleWithCover)}
      openInvite={vi.fn()}
      focusTitle={vi.fn()}
    >
      <PersonPhotosPage userId={userId} />
    </CircleDetailProvider>,
    `/circles/cir_familia/people/${userId}/photos`,
  );
}

describe('PersonPhotosPage', () => {
  it('muestra la cabecera con total y álbumes, y el enlace de vuelta', async () => {
    usePersonApi();
    const { container } = renderPersonPhotos();

    expect(await screen.findByRole('heading', { level: 1, name: 'Lucas Vidal' })).toBeTruthy();
    expect(screen.getByText('Aparece en 142 fotos de 12 álbumes')).toBeTruthy();

    const backLinks = screen.getAllByRole('link', { name: 'Volver a Personas' });

    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    expect(backLinks[0]!.getAttribute('href')).toBe('/circles/cir_familia/people');
    expect(screen.getByRole('link', { name: 'Cambiar de persona' })).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('muestra los chips «Todos los álbumes» y uno por álbum con su conteo', async () => {
    usePersonApi();
    renderPersonPhotos();

    const allAlbums = await screen.findByRole('button', { name: /Todos los álbumes/ });

    expect(within(allAlbums).getByText('142')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Verano en Mallorca/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Recuerdos sueltos/ })).toBeTruthy();
  });

  it('filtra por álbum con `personId` y mantiene el scroll infinito', async () => {
    const requests: string[] = [];

    usePersonApi({
      onAlbumPhotosRequest: (url) => {
        requests.push(url.search);
      },
    });
    renderPersonPhotos();

    fireEvent.click(await screen.findByRole('button', { name: /Verano en Mallorca/ }));

    await waitFor(() => {
      expect(requests.some((search) => search.includes('personId=usr_lucas'))).toBe(true);
    });

    expect(await screen.findByRole('button', { name: /Atardecer en la playa/ })).toBeTruthy();
  });

  it('recorre con teclado y carga más fotos', async () => {
    usePersonApi();
    renderPersonPhotos();

    const firstTile = await screen.findByRole('button', { name: /Atardecer en la playa/ });

    firstTile.focus();
    expect(document.activeElement).toBe(firstTile);

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más fotos' }));

    expect(await screen.findByRole('button', { name: /Deià/ })).toBeTruthy();
  });

  it('muestra el vacío propio cuando la persona no aparece en ninguna foto', async () => {
    usePersonApi();
    renderPersonPhotos('usr_laura');

    expect(await screen.findByRole('heading', { level: 1, name: 'Laura Moreno' })).toBeTruthy();
    expect(screen.getByText('Todavía no aparece en ninguna foto')).toBeTruthy();
    expect(screen.getByText('Aún no hay fotos de Laura Moreno')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Filtrar las fotos por álbum' })).toBeNull();
  });

  it('no mezcla fotos de otro círculo: pide solo el endpoint del círculo', async () => {
    const requested: string[] = [];

    usePersonApi({
      onPersonPhotosRequest: (url) => {
        requested.push(url.pathname);
      },
    });

    renderPersonPhotos();

    await screen.findByRole('button', { name: /Atardecer en la playa/ });

    expect(requested).toContain('/api/circles/cir_familia/members/usr_lucas/photos');
    expect(requested.some((path) => path.includes('/circles/cir_otro/'))).toBe(false);
  });

  it('muestra el estado sin acceso cuando la persona no está en el círculo', async () => {
    usePersonApi();
    server.use(
      http.get(PERSON_PHOTOS_URL, () => HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })),
    );

    renderPersonPhotos();

    expect(await screen.findByText('Estas fotos no están disponibles')).toBeTruthy();
    expect(
      screen.getAllByRole('link', { name: 'Volver a Personas' }).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
