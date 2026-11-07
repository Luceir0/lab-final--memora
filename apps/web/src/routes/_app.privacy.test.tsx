import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../packages/ui/src/test/axe';

import { PrivacyContent } from './_app.privacy';
import type { LegalPage } from '../features/spike/content';

const page: LegalPage = {
  id: 'legal-1',
  language: 'es',
  lastUpdate: '2026-10-26T15:23:46.758Z',
  title: 'Política de privacidad',
  slug: 'privacidad',
  body: 'Primer párrafo de ejemplo.\n\nSegundo párrafo de ejemplo.',
  updatedAt: '2026-10-26T00:00:00.000Z',
};

describe('PrivacyContent', () => {
  it('renderiza un único h1 con el título y los párrafos del cuerpo', () => {
    render(<PrivacyContent page={page} />);

    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe('Política de privacidad');
    expect(screen.getByText('Primer párrafo de ejemplo.')).toBeTruthy();
    expect(screen.getByText('Segundo párrafo de ejemplo.')).toBeTruthy();
    expect(screen.getByText('26 de octubre de 2026')).toBeTruthy();
  });

  it('muestra un estado vacío si el cuerpo no tiene texto', () => {
    render(<PrivacyContent page={{ ...page, body: '   ' }} />);

    expect(screen.getByRole('status').textContent).toContain(
      'Esta página todavía no tiene contenido publicado.',
    );
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = render(<PrivacyContent page={page} />);

    await expectNoAxeViolations(container);
  });
});
