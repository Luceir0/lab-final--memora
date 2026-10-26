import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import '../styles/app.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Memora' },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="es" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
