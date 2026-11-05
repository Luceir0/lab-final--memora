import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CircleDetailLayout } from '../features/circles/circle-detail-layout';
import { AUTH_TEST_API_BASE } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';
import { renderWithRouter } from '../test/circles-harness';
import { circleDetail, circleWithCover } from '../test/circles-fixtures';

import { Route } from './_app.circles.$circleId';

const server = createAuthTestServer();
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

async function headTitle(): Promise<string> {
  const head = Route.options.head;

  if (typeof head !== 'function') {
    throw new Error('La ruta de detalle no define head');
  }

  const result = (await head({} as never)) as { meta?: Array<{ title?: string }> } | undefined;

  return result?.meta?.find((meta) => meta.title !== undefined)?.title ?? '';
}

describe('ruta /circles/$circleId', () => {
  it('declara ssr: false, un título propio y valida la marca de creado', async () => {
    expect(Route.options.ssr).toBe(false);
    expect(await headTitle()).toBe('Círculo · Memora');

    const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
      created?: boolean;
    };

    expect(validateSearch({ created: '1' })).toEqual({ created: true });
    expect(validateSearch({ created: true })).toEqual({ created: true });
    expect(validateSearch({})).toEqual({});
  });

  it('resuelve el layout con la sección hija en un router de test', async () => {
    server.use(
      http.get(DETAIL_URL, () => HttpResponse.json(circleDetail(circleWithCover))),
      // El círculo es owner: el layout pide las invitaciones pendientes.
      http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    );

    const { router } = renderWithRouter(
      <CircleDetailLayout circleId="cir_familia">
        <p>Contenido de la sección</p>
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    expect(router.state.location.pathname).toBe('/circles/cir_familia');
    expect(await screen.findByText('Contenido de la sección')).toBeTruthy();
  });
});
