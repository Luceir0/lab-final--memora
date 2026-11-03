import { createFileRoute } from '@tanstack/react-router';

import { SectionPlaceholder } from '../components/layout/section-placeholder';
import { InstallAppRow } from '../features/profile/install-app-row';
import { ProfileQuickLinks } from '../features/profile/profile-quick-links';

/** Provisional hasta F34 (Perfil). */
export const Route = createFileRoute('/_app/profile')({
  head: () => ({
    meta: [{ title: 'Perfil · Memora' }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <SectionPlaceholder
      eyebrow="Tu cuenta"
      title="Perfil"
      description="Aquí podrás editar tus datos y decidir cómo quieres ver Memora."
    >
      <InstallAppRow />
      <ProfileQuickLinks />
    </SectionPlaceholder>
  );
}
