import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE, testUser } from '../../test/auth-fixtures';
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
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const DELETE_PHOTO_URL = `${AUTH_TEST_API_BASE}/photos/:photoId`;

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

function renderGallery(meId: string | null = null) {
  return renderAlbumsRouter(<AlbumGallery album={albumWithPhotos} meId={meId} />, '/');
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

  it('elimina la selección propia con CSRF, limpia y anuncia el resultado', async () => {
    const deletes: { readonly id: string; readonly csrf: string | null }[] = [];

    useGalleryApi();
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.delete(DELETE_PHOTO_URL, ({ params, request }) => {
        deletes.push({
          id: String(params.photoId),
          csrf: request.headers.get('x-csrf-token'),
        });

        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderGallery(testUser.id);

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /Seleccionar foto: Atardecer en la playa/,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(deletes).toEqual([{ id: 'pho_playa', csrf: 'csrf-token' }]);
    });

    expect(await screen.findByText('Se ha eliminado 1 foto.')).toBeTruthy();
    expect(screen.queryByText('1 foto seleccionada')).toBeNull();
  });

  it('informa del resultado parcial si una foto de la selección falla', async () => {
    const deletes: string[] = [];

    useGalleryApi();
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.delete(DELETE_PHOTO_URL, ({ params }) => {
        const id = String(params.photoId);

        deletes.push(id);

        return id === 'pho_playa'
          ? new HttpResponse(null, { status: 204 })
          : HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
      }),
    );

    renderGallery(testUser.id);

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /Seleccionar foto: Atardecer en la playa/,
      }),
    );
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Seleccionar foto: Deià/,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText('Se ha eliminado 1 foto. 1 foto no se pudo eliminar.'),
    ).toBeTruthy();
    expect(deletes.sort()).toEqual(['pho_cena', 'pho_playa']);
  });

  it('permite eliminar al propietario del círculo aunque no sea el autor', async () => {
    useGalleryApi();
    renderAlbumsRouter(
      <AlbumGallery album={albumWithPhotos} circleRole="owner" meId="usr_otro" />,
      '/',
    );

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /Seleccionar foto: Atardecer en la playa/,
      }),
    );

    expect(screen.getByRole('button', { name: 'Eliminar' }).hasAttribute('disabled')).toBe(false);
  });

  it('deshabilita «Eliminar» si alguna foto seleccionada no es borrable', async () => {
    useGalleryApi();
    renderGallery('usr_otro');

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /Seleccionar foto: Atardecer en la playa/,
      }),
    );

    expect(screen.getByRole('button', { name: 'Eliminar' }).hasAttribute('disabled')).toBe(true);
    expect(
      screen.getByText(
        'Solo puedes eliminar las fotos que hayas subido tú o si eres propietario del círculo.',
      ),
    ).toBeTruthy();
  });
});
