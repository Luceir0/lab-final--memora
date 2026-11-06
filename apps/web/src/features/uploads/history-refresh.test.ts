import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { uploadHistoryKeys } from './history/queries';
import { invalidateUploadHistoryAfterUpload } from './history-refresh';

describe('invalidateUploadHistoryAfterUpload', () => {
  it('invalida el prefijo completo de «Mis subidas»', () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateUploadHistoryAfterUpload(queryClient);

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me', 'uploads'] });
    expect(uploadHistoryKeys.all).toEqual(['me', 'uploads']);
  });
});
