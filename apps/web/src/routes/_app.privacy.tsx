import { createFileRoute } from '@tanstack/react-router';

import { SectionPlaceholder } from '../components/layout/section-placeholder';

/** Provisional hasta F36 (Privacidad). */
export const Route = createFileRoute('/_app/privacy')({
  head: () => ({
    meta: [{ title: 'Privacidad · Memora' }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SectionPlaceholder
      eyebrow="Tus datos"
      title="Privacidad"
      description="Aquí explicaremos cómo cuidamos tus recuerdos y qué decides tú sobre ellos."
    />
  );
}
