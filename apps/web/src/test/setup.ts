import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom no implementa `window.scrollTo`; TanStack Router lo usa al restaurar
// el scroll. Sin este stub, cada render deja un aviso "Not implemented".
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
