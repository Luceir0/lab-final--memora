import { createFileRoute } from '@tanstack/react-router';

import { ProfilePage } from '../features/profile/profile-page';

export const Route = createFileRoute('/_app/profile')({
  head: () => ({
    meta: [{ title: 'Perfil · Memora' }],
  }),
  component: ProfilePage,
});
