import type { FaqItem, HelpArticle } from './content';

export interface HelpContentProps {
  articles: HelpArticle[];
  faqs: FaqItem[];
}

function Paragraphs({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-body text-muted">
          {paragraph}
        </p>
      ))}
    </>
  );
}

/**
 * Componente presentacional de `/help`: solo props, sin fetch ni estado.
 * Se prueba de forma aislada y se reutilizará cuando F36 traiga la página real.
 */
export function HelpContent({ articles, faqs }: HelpContentProps) {
  const isEmpty = articles.length === 0 && faqs.length === 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby="help-articles-title">
        <h2 id="help-articles-title" className="text-h2 font-bold text-text">
          Guías
        </h2>
        {articles.length === 0 ? (
          <p className="mt-3 text-body-sm text-muted">Todavía no hay guías publicadas.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {articles.map((article) => (
              <li
                key={article.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm"
              >
                <h3 className="text-h3 font-bold text-text">{article.title}</h3>
                <Paragraphs text={article.body} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="help-faq-title">
        <h2 id="help-faq-title" className="text-h2 font-bold text-text">
          Preguntas frecuentes
        </h2>
        {faqs.length === 0 ? (
          <p className="mt-3 text-body-sm text-muted">
            Todavía no hay preguntas frecuentes publicadas.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <li key={faq.id}>
                <details className="rounded-lg border border-border bg-surface p-4">
                  <summary className="cursor-pointer text-body-sm font-semibold text-primary-text">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-body-sm text-muted">{faq.answer}</p>
                  {faq.category ? (
                    <p className="mt-2 text-caption font-semibold uppercase tracking-wide text-muted">
                      {faq.category}
                    </p>
                  ) : null}
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isEmpty ? (
        <p role="status" className="text-body-sm text-muted">
          El contenido de ayuda estará disponible muy pronto.
        </p>
      ) : null}
    </div>
  );
}
