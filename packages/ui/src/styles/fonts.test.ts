import { describe, expect, it } from 'vitest';

import fontsCss from './fonts.css?raw';

describe('fonts.css', () => {
  it('declara los dos subsets variables con swap y pesos 200–800', () => {
    const faces = [...fontsCss.matchAll(/@font-face\s*\{([\s\S]*?)\n\}/g)].map(
      (match) => match[1] ?? '',
    );

    expect(faces).toHaveLength(2);

    for (const face of faces) {
      expect(face).toMatch(/font-family:\s*'Plus Jakarta Sans'/);
      expect(face).toMatch(/font-weight:\s*200 800/);
      expect(face).toMatch(/font-style:\s*normal/);
      expect(face).toMatch(/font-display:\s*swap/);
      expect(face).toContain('unicode-range:');
    }

    expect(fontsCss).toContain('/fonts/plus-jakarta-sans-latin-wght-normal.woff2');
    expect(fontsCss).toContain('/fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2');
  });

  it('no carga fuentes de terceros', () => {
    expect(fontsCss).not.toMatch(/https?:\/\//);
  });

  it('separa los rangos latin y latin-ext', () => {
    expect(fontsCss).toContain('U+0000-00FF');
    expect(fontsCss).toContain('U+0100-02BA');
  });
});
