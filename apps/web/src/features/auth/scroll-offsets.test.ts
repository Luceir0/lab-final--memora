import { describe, expect, it } from 'vitest';

import { AUTH_SCROLL_GAP, authFieldScrollMargins } from './scroll-offsets';

describe('authFieldScrollMargins', () => {
  it('suma la altura real de las dos barras y el hueco', () => {
    expect(authFieldScrollMargins(76, 101)).toEqual({
      scrollMarginTop: 76 + AUTH_SCROLL_GAP,
      scrollMarginBottom: 101 + AUTH_SCROLL_GAP,
    });
  });

  it('funciona con las alturas crecidas al 200 % de texto', () => {
    expect(authFieldScrollMargins(152, 180)).toEqual({
      scrollMarginTop: 160,
      scrollMarginBottom: 188,
    });
  });

  it('nunca devuelve márgenes negativos y redondea', () => {
    expect(authFieldScrollMargins(-10, 10.6)).toEqual({
      scrollMarginTop: AUTH_SCROLL_GAP,
      scrollMarginBottom: 19,
    });
  });
});
