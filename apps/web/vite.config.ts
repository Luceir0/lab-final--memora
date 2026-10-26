import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Configuración de F05.
 *
 * - Tailwind 4 CSS-first vía plugin de Vite (sin preset JS).
 * - Start con SSR selectivo y prerender de `/help`.
 * - Proxy `/api` hacia la API local, para que el navegador no necesite CORS.
 */
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePattern: '\\.test\\.(ts|tsx)$',
      },
      pages: [{ path: '/help', prerender: { enabled: true } }],
    }),
    viteReact(),
  ],
});
