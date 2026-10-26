import { createFileRoute } from '@tanstack/react-router';

import { loadHelpContent } from '../features/spike/content';
import { HelpContent } from '../features/spike/help-content';

export const Route = createFileRoute('/help')({
  loader: () => loadHelpContent(),
  head: () => ({
    meta: [{ title: 'Ayuda · Memora' }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { articles, faqs } = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
          Ayuda
        </p>
        <h1 className="mt-2 text-h1 font-extrabold text-text">Centro de ayuda</h1>
        <p className="mt-2 max-w-prose text-body text-muted">
          Guías y respuestas rápidas para sacar partido a tus círculos.
        </p>
      </header>

      <HelpContent articles={articles} faqs={faqs} />
    </main>
  );
}
