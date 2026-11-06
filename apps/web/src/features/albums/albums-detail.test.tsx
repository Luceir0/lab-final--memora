import type { AlbumDto, CircleDetailDto } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouterState } from '@tanstack/react-router';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import {
  albumCreator,
  albumEmpty,
  albumSinglePhoto,
  albumWithPhotos,
} from '../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../test/fixtures/photos-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CircleDetailProvider } from '../circles/circle-detail-context';
import { CircleDetailLayout } from '../circles/circle-detail-layout';
import { CircleDetailPage } from '../circles/circle-detail-page';
import { defaultMembers } from '../members/members-fixtures';
import type { UploadTransport } from '../uploads/transport';
import { UploadProvider } from '../uploads/upload-provider';
import { UploadQueueHost } from '../uploads/upload-queue-host';

import { AlbumDetailPage } from './album-detail-page';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const ALBUMS_URL = `${DETAIL_URL}/albums`;
const MEMBERS_URL = `${DETAIL_URL}/members`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;
const EMPTY_ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_vacio`;
const SINGLE_ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_una`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function ownerCircle(): CircleDetailDto {
  return circleDetail(circleWithCover);
}

function memberCircle(membersCanCreateAlbums: boolean): CircleDetailDto {
  return circleDetail({
    ...circleWithCover,
    role: 'member',
    settings: { ...circleWithCover.settings, membersCanCreateAlbums },
  });
}

function memberCircleWithoutUpload(): CircleDetailDto {
  return circleDetail({
    ...circleWithCover,
    role: 'member',
    settings: { ...circleWithCover.settings, membersCanUpload: false },
  });
}

interface DetailOptions {
  readonly circle?: CircleDetailDto;
  readonly album?: AlbumDto;
  /** Handlers específicos del test; se registran después de los base. */
  readonly setup?: () => void;
  /** Contenido de `/circles/$circleId` para el flujo de eliminación. */
  readonly circleRoute?: ReactNode;
  /** Contenido de la ruta de detalle según el `pathname` (redirección canónica). */
  readonly albumDetailRoute?: (pathname: string) => ReactNode | undefined;
  /** Transporte falso para probar la integración de subida. */
  readonly transport?: UploadTransport;
}

function renderDetail(options: DetailOptions = {}) {
  const circle = options.circle ?? ownerCircle();
  const album = options.album ?? albumWithPhotos;
  const albumUrl = `${AUTH_TEST_API_BASE}/albums/${album.id}`;

  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(DETAIL_URL, () => HttpResponse.json(circle)),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(MEMBERS_URL, () => HttpResponse.json({ items: defaultMembers, nextCursor: null })),
    http.get(ALBUMS_URL, () => HttpResponse.json({ items: [album], nextCursor: null })),
    http.get(albumUrl, () => HttpResponse.json(album)),
    http.get(`${AUTH_TEST_API_BASE}/albums/${album.id}/photos`, () =>
      HttpResponse.json({ items: galleryPhotos, nextCursor: null }),
    ),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-detail' })),
  );

  options.setup?.();

  return renderAlbumsRouter(
    <UploadProvider {...(options.transport === undefined ? {} : { transport: options.transport })}>
      <UploadQueueHost />
      <CircleDetailProvider
        circle={circle}
        openInvite={vi.fn()}
        focusTitle={vi.fn()}
        canCreateAlbum
      >
        <AlbumDetailPage circleId={circle.id} albumId={album.id} />
      </CircleDetailProvider>
    </UploadProvider>,
    `/circles/${circle.id}/albums/${album.id}`,
    {
      ...(options.circleRoute === undefined ? {} : { circleRoute: options.circleRoute }),
      ...(options.albumDetailRoute === undefined
        ? {}
        : { albumDetailRoute: options.albumDetailRoute }),
    },
  );
}

function openAlbumMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Acciones del álbum' }));
}

describe('AlbumDetailPage · metadatos', () => {
  it('pinta título, descripción, círculo, fecha, fotos y autor', async () => {
    const { container } = renderDetail();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' }),
    ).toBeTruthy();
    expect(screen.getByText('Dos semanas en Dejà con los primos.')).toBeTruthy();
    expect(screen.getAllByText('Familia García').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('agosto 2026')).toBeTruthy();
    expect(screen.getByText('342 fotos')).toBeTruthy();
    expect(screen.getByText('Creado por Sofía Martín')).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('muestra «Sin fecha» cuando el álbum no tiene fecha', async () => {
    renderDetail({ album: albumEmpty });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' }),
    ).toBeTruthy();
    expect(screen.getByText('Sin fecha')).toBeTruthy();
    expect(screen.getByText('Creado por Lucas Vidal')).toBeTruthy();
  });
});

describe('AlbumDetailPage · contenido según fotos', () => {
  it('con 0 fotos pinta el vacío y una acción real de subida', async () => {
    renderDetail({ album: albumEmpty });

    expect(await screen.findByText('Este álbum todavía no tiene fotos')).toBeTruthy();
    expect(
      screen.getByText('Sube las primeras desde la galería o la cámara. Las verá todo el círculo.'),
    ).toBeTruthy();

    const uploadButtons = screen.getAllByRole('button', { name: 'Subir fotos' });

    expect(uploadButtons.length).toBeGreaterThanOrEqual(1);

    for (const button of uploadButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    }

    const emptyRegion = screen.getByRole('region', { name: 'Álbum vacío' });

    expect(within(emptyRegion).getAllByRole('button', { name: 'Subir fotos' })).toHaveLength(1);
    expect(document.querySelector('[data-upload-fab]')).toBeNull();

    expect(screen.queryByText(/llegará en la siguiente entrega/)).toBeNull();
    expect(screen.queryByText('La galería llega en la siguiente entrega')).toBeNull();
  });

  it('sin permiso de subida no muestra la acción y explica por qué', async () => {
    renderDetail({ album: albumEmpty, circle: memberCircleWithoutUpload() });

    expect(await screen.findByText('Este álbum todavía no tiene fotos')).toBeTruthy();
    expect(
      screen.getByText(
        'Las subidas están desactivadas en este círculo. Pídele a quien lo creó que las active.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Subir fotos' })).toBeNull();
  });

  it('con fotos pinta la galería real y el filtro por persona', async () => {
    renderDetail();

    expect(await screen.findByRole('region', { name: 'Galería del álbum' })).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: /Seleccionar foto: Atardecer en la playa/ }),
    ).toBeTruthy();
    expect(
      await screen.findByRole('group', { name: 'Filtrar las fotos por persona' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lucas Vidal/ })).toBeTruthy();
    expect(screen.queryByText('La galería llega en la siguiente entrega')).toBeNull();
    expect(screen.queryByText('Este álbum todavía no tiene fotos')).toBeNull();
  });

  it('mantiene «Descargar álbum» deshabilitado y habilita «Subir fotos»', async () => {
    renderDetail();

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    expect(
      (screen.getByRole('button', { name: 'Descargar álbum' }) as HTMLButtonElement).disabled,
    ).toBe(true);

    const uploadButtons = screen.getAllByRole('button', { name: 'Subir fotos' });

    expect(uploadButtons.length).toBeGreaterThanOrEqual(1);

    for (const button of uploadButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it('al elegir un archivo lo encola y abre la cola global', async () => {
    const upload = vi.fn(() => new Promise<never>(() => {}));
    renderDetail({ transport: { upload } });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const galleryInputs = screen.getAllByLabelText('Elegir fotos de la galería');
    const firstInput = galleryInputs[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, new File(['x'], 'playa.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();
  });
});

describe('AlbumDetailPage · acciones por permisos', () => {
  it('el owner con fotos ve editar, vaciar y eliminar', async () => {
    renderDetail();

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();

    expect(screen.getByRole('menuitem', { name: 'Editar álbum' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Vaciar álbum' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Eliminar álbum' })).toBeTruthy();
  });

  it('el owner con álbum vacío ve editar y eliminar, sin vaciar', async () => {
    renderDetail({ album: albumEmpty });

    await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' });
    openAlbumMenu();

    expect(screen.getByRole('menuitem', { name: 'Editar álbum' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Vaciar álbum' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Eliminar álbum' })).toBeTruthy();
  });

  it('el miembro creador con la flag activa ve editar, vaciar y eliminar', async () => {
    renderDetail({ circle: memberCircle(true), album: albumWithPhotos });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();

    expect(screen.getByRole('menuitem', { name: 'Editar álbum' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Vaciar álbum' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Eliminar álbum' })).toBeTruthy();
  });

  it('el miembro creador sin la flag ve vaciar y eliminar, sin editar', async () => {
    renderDetail({ circle: memberCircle(false), album: albumWithPhotos });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();

    expect(screen.queryByRole('menuitem', { name: 'Editar álbum' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Vaciar álbum' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Eliminar álbum' })).toBeTruthy();
  });

  it('el miembro que no creó el álbum no tiene menú', async () => {
    renderDetail({ circle: memberCircle(true), album: albumEmpty });

    await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' });

    expect(screen.queryByRole('button', { name: 'Acciones del álbum' })).toBeNull();
  });

  it('no hay menú si `/me` aún no ha resuelto', async () => {
    let resolveMe!: (value: Response) => void;
    const meResponse = new Promise<Response>((resolve) => {
      resolveMe = resolve;
    });

    renderDetail({
      circle: memberCircle(true),
      album: albumWithPhotos,
      setup: () => {
        server.use(http.get(ME_URL, () => meResponse));
      },
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Acciones del álbum' })).toBeNull();

    resolveMe(HttpResponse.json(testMeResponse));

    expect(await screen.findByRole('button', { name: 'Acciones del álbum' })).toBeTruthy();
  });
});

describe('AlbumDetailPage · editar', () => {
  it('abre el diálogo, guarda con PATCH y muestra el toast', async () => {
    let patched: unknown = null;
    let album = albumWithPhotos;
    let detailRequests = 0;

    renderDetail({
      setup: () => {
        server.use(
          http.get(ALBUM_URL, () => {
            detailRequests += 1;
            return HttpResponse.json(album);
          }),
          http.patch(ALBUM_URL, async ({ request }) => {
            patched = await request.json();
            album = { ...album, title: 'Verano 2026' };
            return HttpResponse.json(album);
          }),
        );
      },
    });

    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Editar álbum' });
    const title = within(dialog).getByLabelText('Título') as HTMLInputElement;

    await waitFor(() => {
      expect(title.value).toBe('Verano en Mallorca');
    });

    await user.clear(title);
    await user.type(title, 'Verano 2026');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Álbum actualizado')).toBeTruthy();
    expect(screen.getByText('Los cambios de «Verano 2026» ya están guardados.')).toBeTruthy();
    expect(patched).toMatchObject({ title: 'Verano 2026' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Verano 2026' })).toBeTruthy();
    // El PATCH actualiza la caché del detalle con `setQueryData`; no debe
    // volver a pedirlo al servidor.
    expect(detailRequests).toBe(1);
  });
});

describe('AlbumDetailPage · vaciar', () => {
  it('pide confirmación con el recuento, borra fotos y actualiza el vacío', async () => {
    let album = albumWithPhotos;
    let deletedCount = 0;

    renderDetail({
      album,
      setup: () => {
        server.use(
          http.get(ALBUM_URL, () => HttpResponse.json(album)),
          http.delete(`${ALBUM_URL}/photos`, () => {
            deletedCount = album.photosCount;
            album = { ...album, photosCount: 0, coverPhoto: null };
            return HttpResponse.json({ deletedCount });
          }),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Vaciar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Vaciar álbum' });

    expect(
      within(dialog).getByText(
        'Se borrarán 342 fotos de «Verano en Mallorca» y sus etiquetas. Esta acción no se puede deshacer.',
      ),
    ).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Vaciar álbum' }));

    expect(await screen.findByText('Álbum vaciado')).toBeTruthy();
    expect(screen.getByText('Se han eliminado 342 fotos.')).toBeTruthy();
    expect(deletedCount).toBe(342);

    const emptyRegion = await screen.findByRole('region', { name: 'Álbum vacío' });

    await waitFor(() => {
      expect(document.activeElement).toBe(emptyRegion);
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Verano en Mallorca' })).toBeTruthy();
  });

  it('un 5xx al vaciar aclara que el álbum no ha cambiado', async () => {
    renderDetail({
      setup: () => {
        server.use(
          http.delete(`${ALBUM_URL}/photos`, () =>
            HttpResponse.json(
              { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
              { status: 500 },
            ),
          ),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Vaciar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Vaciar álbum' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Vaciar álbum' }));

    expect(await within(dialog).findByText('No hemos podido vaciar el álbum')).toBeTruthy();
    expect(
      within(dialog).getByText(
        'Parece un problema del servidor. El álbum no ha cambiado: vuelve a intentarlo en unos segundos.',
      ),
    ).toBeTruthy();
    expect(within(dialog).queryByText(/No has perdido nada de lo que has escrito/)).toBeNull();
  });

  it('usa el singular al vaciar un álbum con una foto', async () => {
    let album = albumSinglePhoto;

    renderDetail({
      album,
      setup: () => {
        server.use(
          http.get(SINGLE_ALBUM_URL, () => HttpResponse.json(album)),
          http.delete(`${SINGLE_ALBUM_URL}/photos`, () => {
            album = { ...album, photosCount: 0, coverPhoto: null };
            return HttpResponse.json({ deletedCount: 1 });
          }),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'La primera' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Vaciar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Vaciar álbum' });

    expect(
      within(dialog).getByText(
        'Se borrará 1 foto de «La primera» y sus etiquetas. Esta acción no se puede deshacer.',
      ),
    ).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Vaciar álbum' }));

    expect(await screen.findByText('Álbum vaciado')).toBeTruthy();
    expect(screen.getByText('Se ha eliminado 1 foto.')).toBeTruthy();
  });
});

describe('AlbumDetailPage · eliminar', () => {
  it('con fotos muestra ALBUM_NOT_EMPTY y guía a vaciar', async () => {
    renderDetail({
      setup: () => {
        server.use(
          http.delete(ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'ALBUM_NOT_EMPTY', message: 'El álbum tiene fotos.', details: null },
              { status: 409 },
            ),
          ),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar álbum' }));

    const deleteDialog = await screen.findByRole('dialog', { name: 'Eliminar álbum' });

    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Eliminar álbum' }));

    expect(await screen.findByText('El álbum todavía tiene fotos')).toBeTruthy();
    expect(screen.getByText('Vacíalo antes de eliminarlo.')).toBeTruthy();

    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Vaciar álbum' }));

    expect(await screen.findByRole('dialog', { name: 'Vaciar álbum' })).toBeTruthy();
  });

  it('el 409 con caché de 0 fotos refresca y abre el vaciado con el recuento real', async () => {
    let detailRequests = 0;
    const refreshed = { ...albumEmpty, photosCount: 2 };

    renderDetail({
      album: albumEmpty,
      setup: () => {
        server.use(
          http.get(EMPTY_ALBUM_URL, () => {
            detailRequests += 1;
            return HttpResponse.json(detailRequests === 1 ? albumEmpty : refreshed);
          }),
          http.delete(EMPTY_ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'ALBUM_NOT_EMPTY', message: 'El álbum tiene fotos.', details: null },
              { status: 409 },
            ),
          ),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar álbum' }));

    const deleteDialog = await screen.findByRole('dialog', { name: 'Eliminar álbum' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Eliminar álbum' }));

    expect(await screen.findByText('El álbum todavía tiene fotos')).toBeTruthy();

    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Vaciar álbum' }));

    const emptyDialog = await screen.findByRole('dialog', { name: 'Vaciar álbum' });

    expect(
      within(emptyDialog).getByText(
        'Se borrarán 2 fotos de «Sin fotos todavía» y sus etiquetas. Esta acción no se puede deshacer.',
      ),
    ).toBeTruthy();
    expect(detailRequests).toBe(2);
  });

  it('un 5xx al eliminar aclara que el álbum no ha cambiado', async () => {
    renderDetail({
      setup: () => {
        server.use(
          http.delete(ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
              { status: 500 },
            ),
          ),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar álbum' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar álbum' }));

    expect(await within(dialog).findByText('No hemos podido eliminar el álbum')).toBeTruthy();
    expect(
      within(dialog).getByText(
        'Parece un problema del servidor. El álbum no ha cambiado: vuelve a intentarlo en unos segundos.',
      ),
    ).toBeTruthy();
    expect(within(dialog).queryByText(/No has perdido nada de lo que has escrito/)).toBeNull();
  });

  it('un 403 al eliminar explica el permiso y no navega', async () => {
    const { router } = renderDetail({
      setup: () => {
        server.use(
          http.delete(ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'FORBIDDEN', message: 'No puedes eliminar este álbum.', details: null },
              { status: 403 },
            ),
          ),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar álbum' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar álbum' }));

    expect(await within(dialog).findByText('No tienes permiso para esta acción')).toBeTruthy();
    expect(
      within(dialog).getByText(
        'Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.',
      ),
    ).toBeTruthy();
    // Sin guía de vaciado: el 403 no es ALBUM_NOT_EMPTY.
    expect(within(dialog).queryByRole('button', { name: 'Vaciar álbum' })).toBeNull();

    expect(router.state.location.pathname).toBe('/circles/cir_familia/albums/alb_verano');
    expect(router.state.location.search).not.toMatchObject({ albumDeleted: true });
  });

  it('vacío responde 204, navega con albumDeleted y la página del círculo muestra el toast', async () => {
    function CircleAlbumsProbe() {
      const albumDeleted = useRouterState({
        select: (state) =>
          (state.location.search as { albumDeleted?: boolean }).albumDeleted === true,
      });

      return (
        <CircleDetailLayout circleId="cir_familia">
          <CircleDetailPage albumDeleted={albumDeleted} onAlbumDeletedToastClose={vi.fn()} />
        </CircleDetailLayout>
      );
    }

    let deleted = false;

    const { router } = renderDetail({
      album: albumEmpty,
      circleRoute: <CircleAlbumsProbe />,
      setup: () => {
        server.use(
          http.get(EMPTY_ALBUM_URL, () =>
            deleted
              ? HttpResponse.json(
                  { code: 'NOT_FOUND', message: 'No encontrado.', details: null },
                  { status: 404 },
                )
              : HttpResponse.json(albumEmpty),
          ),
          http.delete(EMPTY_ALBUM_URL, () => {
            deleted = true;
            return new HttpResponse(null, { status: 204 });
          }),
        );
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar álbum' });

    expect(
      within(dialog).getByText('El álbum «Sin fotos todavía» se eliminará para siempre.'),
    ).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar álbum' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_familia');
    });
    expect(router.state.location.search).toMatchObject({ albumDeleted: true });

    expect(await screen.findByText('Álbum eliminado')).toBeTruthy();
    expect(screen.getByText('El álbum se ha eliminado del círculo.')).toBeTruthy();

    const heroTitle = screen.getByRole('heading', { level: 1, name: 'Familia García' });

    await waitFor(() => {
      expect(document.activeElement).toBe(heroTitle);
    });
    expect(document.activeElement).not.toBe(document.body);
  });
});

describe('AlbumDetailPage · acceso y errores', () => {
  it('un 404 muestra «no existe o ya no tienes acceso» con enlace a Mis círculos', async () => {
    renderDetail({
      setup: () => {
        server.use(
          http.get(ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'NOT_FOUND', message: 'No encontrado.', details: null },
              { status: 404 },
            ),
          ),
        );
      },
    });

    expect(await screen.findByText('Este álbum no existe o ya no tienes acceso')).toBeTruthy();

    const link = screen.getByRole('link', { name: 'Volver a Mis círculos' });

    expect(link.getAttribute('href')).toBe('/circles');

    const heading = screen.getByRole('heading', { level: 1, name: 'Álbum no disponible' });

    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
    expect(document.activeElement).not.toBe(document.body);
  });

  it('un 500 muestra el error y se recupera con Reintentar', async () => {
    let requests = 0;

    renderDetail({
      setup: () => {
        server.use(
          http.get(ALBUM_URL, () => {
            requests += 1;

            if (requests === 1) {
              return HttpResponse.json(
                { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
                { status: 500 },
              );
            }

            return HttpResponse.json(albumWithPhotos);
          }),
        );
      },
    });

    const alert = await screen.findByRole('alert');

    expect(within(alert).getByText('No hemos podido cargar el álbum')).toBeTruthy();
    expect(within(alert).getByText(/Tus fotos siguen a salvo/)).toBeTruthy();

    const errorHeading = screen.getByRole('heading', {
      level: 1,
      name: 'No hemos podido cargar el álbum',
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(errorHeading);
    });
    expect(document.activeElement).not.toBe(document.body);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    const albumHeading = await screen.findByRole('heading', {
      level: 1,
      name: 'Verano en Mallorca',
    });

    expect(albumHeading).toBeTruthy();
    expect(requests).toBeGreaterThanOrEqual(2);

    await waitFor(() => {
      expect(document.activeElement).toBe(albumHeading);
    });
    expect(document.activeElement).not.toBe(document.body);
  });

  it('un fallo de red muestra el error de conexión con Reintentar', async () => {
    renderDetail({
      setup: () => {
        server.use(http.get(ALBUM_URL, () => HttpResponse.error()));
      },
    });

    const alert = await screen.findByRole('alert');

    expect(within(alert).getByText('No hemos podido cargar el álbum')).toBeTruthy();
    expect(
      within(alert).getByText(
        'Parece un problema de conexión. Vuelve a intentarlo en unos segundos.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('no confunde un 401 con un error de carga', async () => {
    const { router } = renderDetail({
      setup: () => {
        server.use(
          http.get(ALBUM_URL, () =>
            HttpResponse.json(
              { code: 'UNAUTHENTICATED', message: 'Sesión caducada.', details: null },
              { status: 401 },
            ),
          ),
        );
      },
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toMatchObject({
      redirect: '/circles/cir_familia/albums/alb_verano',
    });
    expect(screen.queryByText('No hemos podido cargar el álbum')).toBeNull();
  });
});

describe('AlbumDetailPage · accesibilidad', () => {
  it('no tiene violaciones de axe con el vacío', async () => {
    const { container } = renderDetail({ album: albumEmpty });

    await screen.findByText('Este álbum todavía no tiene fotos');
    await expectNoAxeViolations(container);
  });

  it('el menú de acciones es accesible por teclado', async () => {
    renderDetail();

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const trigger = screen.getByRole('button', { name: 'Acciones del álbum' });

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const items = screen.getAllByRole('menuitem');

    expect(items).toHaveLength(3);
    // Roving tabindex: solo un ítem entra en el orden de tabulación.
    expect(items.filter((item) => item.getAttribute('tabindex') === '0')).toHaveLength(1);
  });
});

describe('AlbumDetailPage · autoría', () => {
  it('usa el nombre del creador del álbum, no el de la sesión', async () => {
    renderDetail({ album: albumEmpty });

    await screen.findByRole('heading', { level: 1, name: 'Sin fotos todavía' });

    expect(screen.getByText('Creado por Lucas Vidal')).toBeTruthy();
    expect(screen.queryByText(`Creado por ${testUser.name}`)).toBeNull();
    expect(albumCreator.name).toBe(testUser.name);
  });
});

describe('AlbumDetailPage · redirección canónica', () => {
  it('navega al círculo real del álbum y no pinta datos bajo el círculo equivocado', async () => {
    const foreignAlbum: AlbumDto = { ...albumWithPhotos, circleId: 'cir_otro' };

    const { router } = renderDetail({
      album: foreignAlbum,
      setup: () => {
        server.use(http.get(ALBUM_URL, () => HttpResponse.json(foreignAlbum)));
      },
      albumDetailRoute: (pathname) =>
        pathname.startsWith('/circles/cir_otro/') ? <h1>Álbum canónico de cir_otro</h1> : undefined,
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_otro/albums/alb_verano');
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Álbum canónico de cir_otro' }),
    ).toBeTruthy();

    // Bajo el círculo equivocado no se pinta el álbum: ni título ni autor.
    expect(screen.queryByRole('heading', { level: 1, name: 'Verano en Mallorca' })).toBeNull();
    expect(screen.queryByText('Creado por Sofía Martín')).toBeNull();
  });
});
