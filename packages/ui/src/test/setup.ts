import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Setup compartido de RTL. jsdom no implementa `matchMedia`; los componentes
 * de F11 no lo consultan, pero el stub evita fallos accidentales si un test
 * monta algo que sí lo use.
 */
afterEach(() => {
  cleanup();
});

/*
 * jsdom no implementa canvas. axe lo sondea para algunas reglas (aunque el
 * contraste esté desactivado); devolver `null` evita el aviso en consola sin
 * afectar al resultado.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
