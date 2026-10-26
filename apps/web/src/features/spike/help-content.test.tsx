import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FaqItem, HelpArticle } from './content';
import { HelpContent } from './help-content';

const articles: HelpArticle[] = [
  {
    id: 'article-1',
    language: 'es',
    lastUpdate: '2026-10-26T00:00:00.000Z',
    title: 'Cómo crear tu primer círculo',
    slug: 'como-crear-tu-primer-circulo',
    body: 'Primer párrafo de ejemplo.\n\nSegundo párrafo de ejemplo.',
    order: 1,
  },
];

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    language: 'es',
    lastUpdate: '2026-10-26T00:00:00.000Z',
    question: '¿Quién puede ver mis fotos?',
    answer: 'Solo las personas de tus círculos.',
    category: 'Privacidad',
    order: 1,
  },
];

describe('HelpContent', () => {
  it('renderiza artículos y preguntas frecuentes con datos de ejemplo', () => {
    render(<HelpContent articles={articles} faqs={faqs} />);

    expect(screen.getByRole('heading', { name: 'Guías' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cómo crear tu primer círculo' })).toBeTruthy();
    expect(screen.getByText('Primer párrafo de ejemplo.')).toBeTruthy();
    expect(screen.getByText('Segundo párrafo de ejemplo.')).toBeTruthy();
    expect(screen.getByText('¿Quién puede ver mis fotos?')).toBeTruthy();
    expect(screen.getByText('Solo las personas de tus círculos.')).toBeTruthy();
  });

  it('muestra el estado vacío sin datos', () => {
    render(<HelpContent articles={[]} faqs={[]} />);

    expect(screen.getByText('Todavía no hay guías publicadas.')).toBeTruthy();
    expect(screen.getByText('Todavía no hay preguntas frecuentes publicadas.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      'El contenido de ayuda estará disponible muy pronto.',
    );
  });
});
