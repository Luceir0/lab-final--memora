import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../packages/ui/src/test/axe';
import { CircleDetailLayout } from '../features/circles/circle-detail-layout';
import { ownerMember } from '../features/members/members-fixtures';
import { PeoplePage } from '../features/members/people-page';
import { AUTH_TEST_API_BASE } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';
import { renderWithRouter } from '../test/circles-harness';
import { circleDetail, circleWithCover, testMeResponse } from '../test/circles-fixtures';

import { Route } from './_app.circles.$circleId.people';

const server = createAuthTestServer();
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const MEMBERS_URL = `${DETAIL_URL}/members`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const ME_URL = `${AUTH_TEST_API_BASE}/me`;

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
    throw new Error('La ruta de personas no define head');
  }

  const result = (await head({} as never)) as { meta?: Array<{ title?: string }> } | undefined;

  return result?.meta?.find((meta) => meta.title !== undefined)?.title ?? '';
}

function renderPeoplePage() {
  server.use(
    http.get(DETAIL_URL, () =>
      HttpResponse.json(circleDetail(circleWithCover, { membersCount: 8 })),
    ),
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(MEMBERS_URL, () => HttpResponse.json({ items: [ownerMember], nextCursor: null })),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
  );

  return renderWithRouter(
    <CircleDetailLayout circleId="cir_familia">
      <PeoplePage />
    </CircleDetailLayout>,
    '/circles/cir_familia/people',
  );
}

describe('ruta /circles/$circleId/people', () => {
  it('declara el título de Personas', async () => {
    expect(await headTitle()).toBe('Personas · Memora');
  });

  it('usa el héroe compartido, migas y navegación de sección', async () => {
    const { container } = renderPeoplePage();

    expect(await screen.findByText(/8 personas/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invitar' })).toBeTruthy();

    const breadcrumb = screen.getByRole('navigation', { name: 'Ruta del círculo' });

    expect(within(breadcrumb).getByText('Personas')).toBeTruthy();
    expect(within(breadcrumb).getByText('Familia García')).toBeTruthy();

    const sections = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const albums = within(sections).getByRole('link', { name: /Álbumes/ });
    const people = within(sections).getByRole('link', { name: /Personas/ });
    const settings = within(sections).getByRole('link', { name: /Ajustes/ });

    expect(albums.getAttribute('href')).toBe('/circles/cir_familia');
    expect(albums.getAttribute('aria-current')).toBeNull();
    expect(people.getAttribute('href')).toBe('/circles/cir_familia/people');
    expect(people.getAttribute('aria-current')).toBe('page');
    expect(people.getAttribute('aria-disabled')).toBeNull();
    expect(settings.getAttribute('aria-disabled')).toBeNull();
    expect(settings.getAttribute('href')).toBe('/circles/cir_familia/settings');
    expect(settings.getAttribute('aria-current')).toBeNull();

    await waitFor(() => {
      expect(screen.queryByTestId('pending-invitations-section')).toBeNull();
    });
    await expectNoAxeViolations(container);
  });
});
