import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { resolveServerApiOrigin } from './src/lib/env.server.ts';

/**
 * Configuración de F09.
 *
 * - Tailwind 4 CSS-first vía plugin de Vite (sin preset JS).
 * - Start con SSR selectivo y prerender de `/help`.
 * - Proxy `/api` hacia el origen de la API interna. El destino sale de
 *   `API_INTERNAL_URL` (misma variable que usa el cliente de servidor) y cae a
 *   `http://127.0.0.1:3001`, para que el navegador no necesite CORS.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = resolveServerApiOrigin(env.API_INTERNAL_URL);

  return {
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
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
  };
});
