import type { AlbumDto, CircleDetailDto } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import {
  albumEmpty,
  albumLongTitle,
  albumNoCoverNoDate,
  albumSinglePhoto,
  albumWithPhotos,
} from '../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';
import { CircleDetailProvider } from '../circles/circle-detail-context';

import { AlbumFormDialog } from './album-form-dialog';
import { AlbumGrid } from './album-grid';

const server = createAuthTestServer();
const ALBUMS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/albums`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface Page {
  readonly items: readonly AlbumDto[];
  readonly nextCursor: string | null;
}

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

interface GridOptions {
  readonly circle?: CircleDetailDto;
  readonly canCreateAlbum?: boolean;
  readonly pages?: readonly Page[];
  readonly onRequest?: (cursor: string | null) => void;
}

function renderGrid(options: GridOptions = {}) {
  const circle = options.circle ?? ownerCircle();
  const canCreateAlbum = options.canCreateAlbum ?? true;
  const pages = options.pages ?? [{ items: [], nextCursor: null }];
  const openCreateAlbum = vi.fn();
  const openInvite = vi.fn();

  server.use(
    http.get(ALBUMS_URL, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor');

      options.onRequest?.(cursor);

      const index = cursor === null ? 0 : Number(cursor);

      return HttpResponse.json(pages[index] ?? { items: [], nextCursor: null });
    }),
  );

  const result = renderAlbumsRouter(
    <CircleDetailProvider
      circle={circle}
      openInvite={openInvite}
      focusTitle={vi.fn()}
      openCreateAlbum={openCreateAlbum}
      canCreateAlbum={canCreateAlbum}
    >
      <AlbumGrid />
    </CircleDetailProvider>,
    '/circles/cir_familia',
  );

  return { ...result, openCreateAlbum, openInvite };
}

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

describe('AlbumGrid · carga', () => {
  it('anuncia la carga y pinta esqueletos hasta que llegan los álbumes', async () => {
    const pending = deferred<Response>();

    server.use(http.get(ALBUMS_URL, () => pending.promise));

    const { container } = renderAlbumsRouter(
      <CircleDetailProvider
        circle={ownerCircle()}
        openInvite={vi.fn()}
        focusTitle={vi.fn()}
        canCreateAlbum
      >
        <AlbumGrid />
      </CircleDetailProvider>,
      '/circles/cir_familia',
    );

    const status = await screen.findByRole('status');

    expect(status.textContent).toBe('Cargando álbumes…');
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(
      container.querySelectorAll('[aria-busy="true"] [aria-hidden="true"]').length,
    ).toBeGreaterThanOrEqual(4);

    // La portada del esqueleto conserva la proporción 4/3 de la tarjeta real.
    const covers = Array.from(
      container.querySelectorAll('[aria-busy="true"] [aria-hidden="true"]'),
    ).filter((node) => node.className.includes('aspect-[4/3]'));

    expect(covers).toHaveLength(4);

    for (const cover of covers) {
      expect(cover.className).toContain('h-auto!');
    }

    pending.resolve(HttpResponse.json({ items: [albumWithPhotos], nextCursor: null }));

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' }),
    ).toBeTruthy();
  });
});

describe('AlbumGrid · error', () => {
  it('muestra el error y se recupera con Reintentar', async () => {
    let requests = 0;

    server.use(
      http.get(ALBUMS_URL, () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo interno.', details: null },
            { status: 500 },
          );
        }

        return HttpResponse.json({ items: [albumWithPhotos], nextCursor: null });
      }),
    );

    renderAlbumsRouter(
      <CircleDetailProvider
        circle={ownerCircle()}
        openInvite={vi.fn()}
        focusTitle={vi.fn()}
        canCreateAlbum
      >
        <AlbumGrid />
      </CircleDetailProvider>,
      '/circles/cir_familia',
    );

    expect(await screen.findByText('No hemos podido cargar los álbumes')).toBeTruthy();
    expect(screen.getByText(/Tus fotos siguen a salvo/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' }),
    ).toBeTruthy();
    expect(requests).toBeGreaterThanOrEqual(2);

    const gridHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Álbumes del círculo',
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(gridHeading);
    });
    expect(document.activeElement).not.toBe(document.body);
  });
});

describe('AlbumGrid · sesión', () => {
  it('un 401 redirige a /login y no deja el error con Reintentar', async () => {
    server.use(
      http.get(ALBUMS_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Sesión caducada.', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router } = renderAlbumsRouter(
      <CircleDetailProvider
        circle={ownerCircle()}
        openInvite={vi.fn()}
        focusTitle={vi.fn()}
        canCreateAlbum
      >
        <AlbumGrid />
      </CircleDetailProvider>,
      '/circles/cir_familia',
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toMatchObject({
      redirect: '/circles/cir_familia',
    });
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(screen.queryByText('No hemos podido cargar los álbumes')).toBeNull();
  });
});

describe('AlbumGrid · vacío', () => {
  it('ofrece crear el primer álbum cuando hay permiso', async () => {
    const { openCreateAlbum } = renderGrid({
      circle: memberCircle(true),
      canCreateAlbum: true,
    });

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    expect(
      screen.getByText(
        'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.',
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Crear el primer álbum' }));

    expect(openCreateAlbum).toHaveBeenCalledTimes(1);
  });

  it('sin permiso no ofrece crear y remite a quien administra', async () => {
    const { openCreateAlbum } = renderGrid({
      circle: memberCircle(false),
      canCreateAlbum: false,
    });

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    expect(
      screen.getByText('Pide a quien administra el círculo que cree el primero.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Crear el primer álbum' })).toBeNull();
    expect(openCreateAlbum).not.toHaveBeenCalled();
  });

  it('el owner puede invitar a alguien desde el vacío', async () => {
    const { openInvite } = renderGrid({ circle: ownerCircle(), canCreateAlbum: true });

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Invitar a alguien' }));

    expect(openInvite).toHaveBeenCalledTimes(1);
  });

  it('devuelve el foco al heading cuando el alta convierte el vacío en rejilla', async () => {
    const post = deferred<Response>();
    let releaseList!: () => void;
    const listGate = new Promise<void>((resolve) => {
      releaseList = resolve;
    });
    let listCalls = 0;
    let albums: AlbumDto[] = [];
    const circle = ownerCircle();

    server.use(
      http.get(ALBUMS_URL, async () => {
        listCalls += 1;

        // La segunda petición (refetch tras el alta) espera a que el diálogo
        // se haya cerrado: así reproducimos que el disparador del vacío ya no
        // existe y el foco cae en `body`.
        if (listCalls > 1) {
          await listGate;
        }

        return HttpResponse.json({ items: albums, nextCursor: null });
      }),
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-empty' })),
      http.post(ALBUMS_URL, () => post.promise),
    );

    function EmptyCreateHarness() {
      const [open, setOpen] = useState(false);

      return (
        <CircleDetailProvider
          circle={circle}
          openInvite={vi.fn()}
          focusTitle={vi.fn()}
          openCreateAlbum={() => {
            setOpen(true);
          }}
          canCreateAlbum
        >
          <AlbumGrid />
          <AlbumFormDialog
            open={open}
            mode="create"
            circle={circle}
            onClose={() => {
              setOpen(false);
            }}
            onSaved={() => {
              setOpen(false);
            }}
          />
        </CircleDetailProvider>
      );
    }

    renderAlbumsRouter(<EmptyCreateHarness />, '/circles/cir_familia');

    const user = userEvent.setup();

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Crear el primer álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo álbum' });

    await user.type(within(dialog).getByLabelText('Título'), 'Verano 2026');
    await user.click(within(dialog).getByRole('button', { name: 'Crear álbum' }));

    expect(await within(dialog).findByRole('button', { name: 'Guardando álbum…' })).toBeTruthy();

    albums = [albumWithPhotos];
    post.resolve(HttpResponse.json(albumWithPhotos, { status: 201 }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nuevo álbum' })).toBeNull();
    });

    releaseList();

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' }),
    ).toBeTruthy();

    const gridHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Álbumes del círculo',
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(gridHeading);
    });
    expect(document.activeElement).not.toBe(document.body);
  });
});

describe('AlbumGrid · con álbumes', () => {
  it('pinta tarjetas con enlace, fotos, mes y una columna en móvil', async () => {
    const { container } = renderGrid({
      pages: [{ items: [albumWithPhotos, albumSinglePhoto, albumNoCoverNoDate], nextCursor: null }],
    });

    const link = await screen.findByRole('link', { name: /Verano en Mallorca/ });

    expect(link.getAttribute('href')).toBe('/circles/cir_familia/albums/alb_verano');
    expect(screen.getByRole('heading', { level: 3, name: 'Verano en Mallorca' })).toBeTruthy();
    expect(screen.getByText('342 fotos · agosto 2026')).toBeTruthy();
    expect(screen.getByText('1 foto · octubre 2026')).toBeTruthy();
    expect(screen.getByText('12 fotos · Sin fecha · álbum continuo')).toBeTruthy();

    const list = screen.getByRole('list');

    expect(list.className).toContain('grid-cols-1');
    expect(list.className).toContain('auto-rows-fr');
    expect(list.className).toContain('md:grid-cols-2');
    expect(list.className).toContain('lg:grid-cols-3');
    expect(list.className).toContain('xl:grid-cols-4');
    expect(link.className).toContain('h-full');

    await expectNoAxeViolations(container);
  });

  it('carga la siguiente página y añade sus tarjetas', async () => {
    const cursors: Array<string | null> = [];

    renderGrid({
      pages: [
        { items: [albumWithPhotos], nextCursor: '1' },
        { items: [albumEmpty], nextCursor: null },
      ],
      onRequest: (cursor) => {
        cursors.push(cursor);
      },
    });

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' }),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3, name: 'Sin fotos todavía' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Sin fotos todavía' }),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Cargar más' })).toBeNull();
    });
    expect(cursors).toEqual([null, '1']);
  });

  it('no ofrece «Cargar más» cuando no hay siguiente página', async () => {
    renderGrid({ pages: [{ items: [albumWithPhotos], nextCursor: null }] });

    await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' });

    expect(screen.queryByRole('button', { name: 'Cargar más' })).toBeNull();
    // La rejilla sigue siendo una lista accesible con un solo elemento.
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(1);
  });

  it('pinta una tarjeta con título largo sin romper la rejilla', async () => {
    renderGrid({ pages: [{ items: [albumLongTitle], nextCursor: null }] });

    const heading = await screen.findByRole('heading', { level: 3 });

    expect(heading.textContent).toBe(albumLongTitle.title);

    const link = screen.getByRole('link');

    expect(link.getAttribute('href')).toBe('/circles/cir_familia/albums/alb_largo');

    const list = screen.getByRole('list');

    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(list.className).toContain('md:grid-cols-2');
    expect(list.className).toContain('lg:grid-cols-3');
    expect(list.className).toContain('xl:grid-cols-4');
  });
});
