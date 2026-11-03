import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { NotFound } from '../components/not-found';
import { RouteError } from '../components/route-error';
import { ThemeProvider } from '../components/theme-provider';
import { getErrorMessage } from '../lib/error-message';
import type { RouterContext } from '../lib/query-client';
import {
  createThemeInitScript,
  FONT_PRELOAD,
  parseThemeMode,
  readThemeMode,
  resolveDocumentTheme,
  THEME_COLORS,
} from '../lib/theme';

import '../styles/app.css';

/**
 * Ruta raíz.
 *
 * `shellComponent` es el documento HTML y envuelve también los estados de
 * error y 404, así que el `QueryClientProvider` está disponible en todos
 * ellos. El contexto del router trae el `QueryClient` creado por petición.
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Memora' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { readonly children: ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  const mode = parseThemeMode(readThemeMode());
  const theme = resolveDocumentTheme(mode);

  return (
    /*
     * `suppressHydrationWarning` sigue justificado: el script de arranque
     * puede cambiar `data-theme` después del HTML del servidor (modo
     * «sistema»). En cliente `resolveDocumentTheme` lee el valor ya pintado,
     * así que el render coincide con el DOM; el atributo se protege por si el
     * script y la hidratación se cruzan.
     */
    <html lang="es" data-theme={theme} suppressHydrationWarning>
      <head>
        <HeadContent />
        {FONT_PRELOAD.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        <meta name="theme-color" content={THEME_COLORS[theme]} />
        {/* PWA (F14): manifiesto e iconos de instalación. Sin service worker. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        {/*
         * Chrome y los navegadores modernos usan `mobile-web-app-capable`. Se
         * mantiene la meta de Apple porque iOS antiguo solo entiende la suya;
         * el aviso de deprecación de Chrome es inofensivo.
         */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Memora" />
        {/*
         * `<script>` directo en `<head>` (no el API `scripts` de head): así el
         * navegador lo ejecuta antes de parsear `<body>` y no hay destello.
         * El contenido es una constante del código, no entrada del usuario.
         * F42 añadirá nonce/hash de CSP sobre este mismo bloque.
         */}
        <script
          data-memora-theme-init=""
          dangerouslySetInnerHTML={{ __html: createThemeInitScript() }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode={mode}>{children}</ThemeProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Error boundary de la raíz. `reset` vuelve a ejecutar la ruta y la
 * invalidación de queries descarta los datos que provocaron el fallo.
 *
 * En SSR, TanStack Router puede renderizar este bloque con `reset` sin
 * definir; el botón solo existe en cliente, pero se protege la llamada.
 */
function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    void queryClient.invalidateQueries();
    // `reset` no está definido en el render de error de servidor.
    if (typeof reset === 'function') {
      reset();
    }
  };

  return <RouteError message={getErrorMessage(error)} onRetry={handleRetry} />;
}
