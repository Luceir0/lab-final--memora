import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest de `apps/web` (F05). jsdom para componentes; los tests que solo leen
 * archivos usan `node:fs`, disponible también en este entorno.
 */
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
