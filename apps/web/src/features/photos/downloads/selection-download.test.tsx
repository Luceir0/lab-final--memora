import { fireEvent, screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { albumWithPhotos } from '../../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../../test/fixtures/albums-router';
import { galleryPhotos, makePhoto } from '../../../test/fixtures/photos-fixtures';
import { defaultMembers } from '../../members/members-fixtures';

import { AlbumGallery } from '../album-gallery';

const server = createAuthTestServer();
const MEMBERS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members`;
const PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;
const MEGABYTE = 1024 * 1024;

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

function useGalleryApi(photos: readonly ReturnType<typeof makePhoto>[] = galleryPhotos) {
  server.use(
    http.get(MEMBERS_URL, () => HttpResponse.json({ items: defaultMembers, nextCursor: null })),
    http.get(PHOTOS_URL, () => HttpResponse.json({ items: photos, nextCursor: null })),
  );
}

function renderGallery(options: { readonly canDownload?: boolean } = {}) {
  const onDownload = vi.fn();

  renderAlbumsRouter(
    <AlbumGallery
      album={albumWithPhotos}
      canDownload={options.canDownload ?? true}
      onDownload={onDownload}
    />,
    '/',
  );

  return { onDownload };
}

describe('AlbumGallery · descarga de la selección', () => {
  it('crea la descarga con los ids seleccionados sin aviso si pesa poco', async () => {
    useGalleryApi();
    const { onDownload } = renderGallery();

    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Seleccionar foto: Atardecer en la playa/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }));

    expect(onDownload).toHaveBeenCalledWith(['pho_playa']);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('avisa antes de generar si la selección supera 100 MB (AC-06)', async () => {
    const largePhotos = [
      makePhoto({ id: 'pho_grande_1', size: 60 * MEGABYTE, description: 'Grande 1' }),
      makePhoto({ id: 'pho_grande_2', size: 60 * MEGABYTE, description: 'Grande 2' }),
    ];

    useGalleryApi(largePhotos);
    const { onDownload } = renderGallery();

    fireEvent.click(await screen.findByRole('checkbox', { name: /Seleccionar foto: Grande 1/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Seleccionar foto: Grande 2/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 2 fotos' });

    expect(onDownload).not.toHaveBeenCalled();
    expect(within(dialog).getByText(/120 MB/)).toBeTruthy();
    expect(within(dialog).getByText(/iPhone y Android/)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Generar ZIP' }));

    expect(onDownload).toHaveBeenCalledWith(['pho_grande_1', 'pho_grande_2']);
  });

  it('sin permiso deshabilita «Descargar» y explica el motivo', async () => {
    useGalleryApi();
    renderGallery({ canDownload: false });

    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Seleccionar foto: Atardecer en la playa/ }),
    );

    expect((screen.getByRole('button', { name: 'Descargar' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText('La descarga está desactivada en este círculo.')).toBeTruthy();
  });
});
