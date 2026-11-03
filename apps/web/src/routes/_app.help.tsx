import { createFileRoute } from '@tanstack/react-router';

import { PageContainer } from '../components/layout/page-container';
import { loadHelpContent } from '../features/spike/content';
import { HelpContent } from '../features/spike/help-content';

export const Route = createFileRoute('/_app/help')({
  loader: () => loadHelpContent(),
  head: () => ({
    meta: [{ title: 'Ayuda · Memora' }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { articles, faqs } = Route.useLoaderData();

  return (
    <PageContainer>
      <header className="mb-8">
        <p className="text-caption font-semibold uppercase text-primary-text">Ayuda</p>
        <h1 className="mt-2 text-h1 font-extrabold text-text">Centro de ayuda</h1>
        <p className="mt-2 max-w-prose text-body text-muted">
          Guías y respuestas rápidas para sacar partido a tus círculos.
        </p>
      </header>

      <HelpContent articles={articles} faqs={faqs} />
    </PageContainer>
  );
}
