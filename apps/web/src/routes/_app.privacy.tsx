import { createFileRoute } from '@tanstack/react-router';

import { PageContainer } from '../components/layout/page-container';
import { loadLegalPage } from '../features/spike/content';
import type { LegalPage } from '../features/spike/content';

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : UPDATED_AT_FORMATTER.format(date);
}

function Paragraphs({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return (
      <p role="status" className="mt-6 max-w-prose text-body text-muted">
        Esta página todavía no tiene contenido publicado.
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-prose space-y-4">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-body text-muted">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export interface PrivacyContentProps {
  readonly page: LegalPage;
}

/**
 * Contenido presentacional de `/privacy`. Separado de la ruta para poder
 * probar el render sin depender del loader ni del router.
 */
export function PrivacyContent({ page }: PrivacyContentProps) {
  return (
    <PageContainer>
      <article aria-labelledby="privacy-title" className="max-w-3xl">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
            Legal
          </p>
          <h1 id="privacy-title" className="mt-2 text-h1 font-extrabold text-text">
            {page.title}
          </h1>
          <p className="mt-3 text-body-sm text-muted">
            Última actualización:{' '}
            <time dateTime={page.updatedAt}>{formatUpdatedAt(page.updatedAt)}</time>
          </p>
        </header>

        <Paragraphs text={page.body} />
      </article>
    </PageContainer>
  );
}

export const Route = createFileRoute('/_app/privacy')({
  loader: () => loadLegalPage(),
  head: () => ({
    meta: [{ title: 'Privacidad · Memora' }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const page = Route.useLoaderData();

  return <PrivacyContent page={page} />;
}
