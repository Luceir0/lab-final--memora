import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { albumKeys } from '../albums/queries';

import { invalidateAlbumAfterUpload } from './album-refresh';

describe('invalidateAlbumAfterUpload', () => {
  it('invalida el detalle y la lista del círculo si el álbum está en caché', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(albumKeys.detail(albumWithPhotos.id), albumWithPhotos);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAlbumAfterUpload(queryClient, albumWithPhotos.id);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: albumKeys.detail(albumWithPhotos.id) });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: albumKeys.list(albumWithPhotos.circleId),
    });
  });

  it('sin detalle en caché solo invalida el detalle', () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateAlbumAfterUpload(queryClient, 'alb_desconocido');

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: albumKeys.detail('alb_desconocido') });
  });
});
