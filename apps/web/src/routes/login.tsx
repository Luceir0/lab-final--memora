import { createFileRoute } from '@tanstack/react-router';

import { LoginPage } from '../features/spike/login-page';

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Entrar · Memora' }],
  }),
  component: LoginPage,
});
