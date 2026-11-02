import { defineConfig } from 'vitest/config';

/**
 * Vitest de `packages/ui` (F10).
 *
 * Solo Node: aquí se prueba el contrato de los CSS (tokens, tema, fuentes),
 * no componentes React. Los tests de integración de la app viven en
 * `apps/web`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Necesario para que `?raw` devuelva el CSS real en Vitest.
    css: true,
  },
});
