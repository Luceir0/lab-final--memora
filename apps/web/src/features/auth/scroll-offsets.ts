/** Separación mínima entre el campo enfocado y las barras del layout. */
export const AUTH_SCROLL_GAP = 8;

export interface AuthScrollMargins {
  readonly scrollMarginTop: number;
  readonly scrollMarginBottom: number;
}

/**
 * Calcula los márgenes de scroll de un campo a partir de la altura real de la
 * cabecera y la barra inferior. Se redondea y se descarta lo negativo; así el
 * resultado es estable con zoom de texto y no depende de valores fijos.
 */
export function authFieldScrollMargins(
  topbarHeight: number,
  bottomBarHeight: number,
): AuthScrollMargins {
  return {
    scrollMarginTop: Math.max(0, Math.round(topbarHeight)) + AUTH_SCROLL_GAP,
    scrollMarginBottom: Math.max(0, Math.round(bottomBarHeight)) + AUTH_SCROLL_GAP,
  };
}
