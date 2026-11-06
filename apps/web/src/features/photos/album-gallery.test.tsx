import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { galleryPhotos } from '../../test/fixtures/photos-fixtures';
import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { defaultMembers } from '../members/members-fixtures';

import { AlbumGallery } from './album-gallery';

const server = createAuthTestServer();
const MEMBERS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members`;
const PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;

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

function useGalleryApi(
  options: {
    readonly onPhotosRequest?: (url: URL) => void;
  } = {},
) {
  server.use(
    http.get(MEMBERS_URL, () => HttpResponse.json({ items: defaultMembers, nextCursor: null })),
    http.get(PHOTOS_URL, ({ request }) => {
      const url = new URL(request.url);

      options.onPhotosRequest?.(url);

      if (url.searchParams.get('personId') === 'usr_lucas') {
        return HttpResponse.json({ items: [galleryPhotos[0]], nextCursor: null });
      }

      if (url.searchParams.get('cursor') === 'next') {
        return HttpResponse.json({ items: [galleryPhotos[2]], nextCursor: null });
      }

      return HttpResponse.json({
        items: [galleryPhotos[0], galleryPhotos[1]],
        nextCursor: 'next',
      });
    }),
  );
}

function renderGallery() {
  return renderAlbumsRouter(<AlbumGallery album={albumWithPhotos} />, '/');
}

describe('AlbumGallery', () => {
  it('pinta la galería con scroll infinito por cursor', async () => {
    useGalleryApi();
    const { container } = renderGallery();

    expect(await screen.findByRole('button', { name: /Atardecer en la playa/ })).toBeTruthy();
    expect(screen.getByText('Mostrando 2 de 342 fotos · se cargan más al desplazar')).toBeTruthy();

    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más fotos' }));

    expect(await screen.findByRole('button', { name: /Foto de Sofía Martín/ })).toBeTruthy();
    expect(screen.getByText('Mostrando 3 de 342 fotos')).toBeTruthy();
  });

  it('filtra por persona del círculo y limpia la selección al cambiar', async () => {
    const requests: string[] = [];

    useGalleryApi({
      onPhotosRequest: (url) => {
        requests.push(url.search);
      },
    });
    renderGallery();

    expect(
      await screen.findByRole('group', { name: 'Filtrar las fotos por persona' }),
    ).toBeTruthy();

    const lucas = screen.getByRole('button', { name: /Lucas Vidal/ });

    fireEvent.click(lucas);

    await waitFor(() => {
      expect(requests.some((search) => search.includes('personId=usr_lucas'))).toBe(true);
    });

    expect(await screen.findByRole('button', { name: /Atardecer en la playa/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Deià/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));

    expect(await screen.findByRole('button', { name: /Deià/ })).toBeTruthy();
  });

  it('selecciona desde la casilla sin abrir el visor', async () => {
    useGalleryApi();
    renderGallery();

    const checkbox = await screen.findByRole('checkbox', {
      name: /Seleccionar foto: Atardecer en la playa/,
    });

    fireEvent.click(checkbox);

    expect(checkbox).toHaveProperty('checked', true);
    expect(screen.getByText('1 foto seleccionada')).toBeTruthy();
  });

  it('restaura la posición de scroll guardada', async () => {
    useGalleryApi();
    const scrollTo = vi.spyOn(window, 'scrollTo');

    window.sessionStorage.setItem('memora:gallery-scroll:album:alb_verano:all', '480');

    renderGallery();

    await screen.findByRole('button', { name: /Atardecer en la playa/ });

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({ top: 480 });
    });
  });

  it('muestra un vacío propio cuando la persona no aparece en el álbum', async () => {
    useGalleryApi();
    server.use(
      http.get(PHOTOS_URL, ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get('personId') === 'usr_laura') {
          return HttpResponse.json({ items: [], nextCursor: null });
        }

        return HttpResponse.json({ items: galleryPhotos, nextCursor: null });
      }),
    );

    renderGallery();

    fireEvent.click(await screen.findByRole('button', { name: /Laura Moreno/ }));

    expect(await screen.findByText('Laura Moreno no aparece en este álbum')).toBeTruthy();
  });

  it('muestra el error de carga con reintento', async () => {
    useGalleryApi();
    server.use(
      http.get(PHOTOS_URL, () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })),
    );

    renderGallery();

    expect(await screen.findByText('No hemos podido cargar las fotos')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
