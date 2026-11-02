import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest de `packages/ui`.
 *
 * jsdom para los componentes React (F11) y para los tests de contrato de los
 * CSS (F10), que solo leen archivos con `?raw` y no dependen de Node. `css:
 * true` mantiene `?raw` devolviendo el contenido real.
 */
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
