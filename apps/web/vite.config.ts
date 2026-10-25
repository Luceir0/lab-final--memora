import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Configuración mínima de F04: Start con su plugin de Vite y React.
 * SSR selectivo, prerender y proxy `/api` pertenecen a F05.
 */
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  plugins: [tanstackStart(), viteReact()],
});
