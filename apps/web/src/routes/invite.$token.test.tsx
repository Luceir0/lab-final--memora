import {
  HeadContent,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { InvitationPage } from '../features/invitations/invitation-page';
import { invitationData } from '../features/invitations/test-fixtures';

import { Route } from './invite.$token';

const data = invitationData();

async function renderServerHtml(): Promise<string> {
  const rootRoute = createRootRoute({
    shellComponent: ({ children }) => (
      <html lang="es">
        <head>
          <HeadContent />
        </head>
        <body>{children}</body>
      </html>
    ),
  });

  const head = Route.options.head;

  if (typeof head !== 'function') {
    throw new Error('La ruta /invite/$token no define head');
  }

  const inviteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/invite/$token',
    loader: () => data,
    head: async ({ loaderData }) => head({ loaderData } as never),
    component: () => <InvitationPage data={data} onAccepted={() => {}} />,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([inviteRoute]),
    history: createMemoryHistory({ initialEntries: [`/invite/${data.token}`] }),
    scrollRestoration: false,
  });

  await router.load();

  return renderToString(<RouterProvider router={router} />);
}

describe('ruta /invite/$token', () => {
  it('mantiene el modo SSR por defecto', () => {
    expect(Route.options.ssr).toBeUndefined();
  });

  it('marca el documento como privado y dependiente de cookie (M-01)', () => {
    const headers = Route.options.headers;

    if (typeof headers !== 'function') {
      throw new Error('La ruta /invite/$token no define headers');
    }

    expect(headers({} as never)).toEqual({
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
    });
  });

  it('incluye Open Graph en el HTML generado por el servidor (AC-07)', async () => {
    const html = await renderServerHtml();

    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('og:image');
    expect(html).toContain('og:url');
    expect(html).toContain('og:type');
    expect(html).toContain('twitter:card');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('Lucas Vidal te invita a Familia García');
    expect(html).toContain('https://memora.test/og/invite.png');
    expect(html).toContain(`https://memora.test/invite/${data.token}`);
    expect(html).toContain('summary_large_image');
  });
});
