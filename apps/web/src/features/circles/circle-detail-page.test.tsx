import type { AlbumDto } from '@memora/shared';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { albumKeys } from '../albums/queries';
import { renderWithRouter } from '../../test/circles-harness';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';

import { CircleDetailProvider } from './circle-detail-context';
import { CircleDetailPage } from './circle-detail-page';

afterEach(() => {
  vi.unstubAllGlobals();
});

const veranoAlbum: AlbumDto = {
  id: 'alb_verano',
  circleId: 'cir_familia',
  title: 'Verano en Mallorca',
  description: 'Dos semanas en Dejà con los primos.',
  date: '2026-08-01T00:00:00.000Z',
  coverPhoto: null,
  photosCount: 342,
  createdBy: { id: 'usr_sofia', name: 'Sofía Martín', avatarUrl: null },
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

function renderPage(
  circle = circleDetail(circleWithCover),
  props: Parameters<typeof CircleDetailPage>[0] = {},
  options: {
    readonly albums?: readonly AlbumDto[];
    readonly canCreateAlbum?: boolean;
  } = {},
) {
  const focusTitle = vi.fn();
  const openCreateAlbum = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
    },
  });

  queryClient.setQueryData(albumKeys.list(circle.id), {
    pages: [{ items: options.albums ?? [], nextCursor: null }],
    pageParams: [null],
  });

  return {
    focusTitle,
    openCreateAlbum,
    ...renderWithRouter(
      <CircleDetailProvider
        circle={circle}
        openInvite={vi.fn()}
        focusTitle={focusTitle}
        openCreateAlbum={openCreateAlbum}
        canCreateAlbum={options.canCreateAlbum ?? true}
      >
        <CircleDetailPage {...props} />
      </CircleDetailProvider>,
      '/circles/cir_familia',
      { queryClient },
    ),
  };
}

describe('CircleDetailPage', () => {
  it('muestra la rejilla real de álbumes', async () => {
    const { container } = renderPage(
      circleDetail(circleWithCover, { membersCount: 8, albumsCount: 3, photosCount: 1240 }),
      {},
      { albums: [veranoAlbum] },
    );

    expect(await screen.findByText('Verano en Mallorca')).toBeTruthy();
    expect(screen.getByText('342 fotos')).toBeTruthy();
    expect(screen.getByText(/342 fotos · agosto 2026/)).toBeTruthy();

    const link = screen.getByRole('link', { name: /Verano en Mallorca/ });

    expect(link.getAttribute('href')).toBe('/circles/cir_familia/albums/alb_verano');
    expect(screen.queryByText('Todavía no hay álbumes')).toBeNull();
    expect(screen.queryByText(/F2[248]/)).toBeNull();

    await expectNoAxeViolations(container);
  });

  it('muestra el estado vacío y abre el alta desde él', async () => {
    const { openCreateAlbum } = renderPage(
      circleDetail(circleWithCover, { albumsCount: 0 }),
      {},
      {
        albums: [],
      },
    );

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    expect(
      screen.getByText(
        'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.',
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Crear el primer álbum' }));
    expect(openCreateAlbum).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/F2[248]/)).toBeNull();
  });

  it('enfoca el título del héroe y muestra el toast de círculo creado', async () => {
    const onCreatedToastClose = vi.fn();
    const { focusTitle } = renderPage(circleDetail(circleWithCover), {
      created: true,
      onCreatedToastClose,
    });

    await waitFor(() => {
      expect(focusTitle).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Círculo creado')).toBeTruthy();
    expect(screen.getByText('Ya puedes invitar a tu gente.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onCreatedToastClose).toHaveBeenCalledTimes(1);
  });
});
