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
import { getErrorMessage } from '../lib/error-message';
import type { RouterContext } from '../lib/query-client';

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
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Memora' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { readonly children: ReactNode }) {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="es" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
