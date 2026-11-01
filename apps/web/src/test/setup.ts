import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();

  // Estado de tema entre tests: el documento es compartido por jsdom.
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  document.cookie = 'memora-theme=; Max-Age=0; Path=/';
});

// jsdom no implementa `window.scrollTo`; TanStack Router lo usa al restaurar
// el scroll. Sin este stub, cada render deja un aviso "Not implemented".
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

// jsdom tampoco implementa `matchMedia`. Los tests que lo necesitan lo
// sustituyen con `vi.stubGlobal`; este stub evita fallos accidentales.
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
