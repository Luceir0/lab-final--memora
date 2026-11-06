import { createFileRoute } from '@tanstack/react-router';

import { UploadHistoryPage } from '../features/uploads/history';

/** «Mis subidas»: todas las fotos propias agrupadas por círculo y carpeta. */
export const Route = createFileRoute('/_app/uploads')({
  head: () => ({
    meta: [{ title: 'Subidas · Memora' }],
  }),
  component: UploadHistoryPage,
});
