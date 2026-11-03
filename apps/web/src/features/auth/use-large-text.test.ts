import { describe, expect, it } from 'vitest';

import { isLargeRootFont, LARGE_TEXT_ROOT_FONT_PX } from './use-large-text';

describe('isLargeRootFont', () => {
  it('acepta el tamaño normal de 16 px', () => {
    expect(isLargeRootFont('16px')).toBe(false);
    expect(isLargeRootFont(16)).toBe(false);
  });

  it('detecta el 200 % de texto', () => {
    expect(LARGE_TEXT_ROOT_FONT_PX).toBe(24);
    expect(isLargeRootFont('32px')).toBe(true);
    expect(isLargeRootFont(32)).toBe(true);
  });

  it('tolera valores no numéricos', () => {
    expect(isLargeRootFont('normal')).toBe(false);
  });
});
