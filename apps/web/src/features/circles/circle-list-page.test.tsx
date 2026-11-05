import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { renderWithRouter } from '../../test/circles-harness';
import {
  circleDetail,
  circleThird,
  circleWithCover,
  circleWithoutCover,
  defaultCircles,
  testMeResponse,
} from '../../test/circles-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { CircleListPage } from './circle-list-page';
import { circleKeys } from './queries';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;
const NOW = new Date(2026, 9, 17, 18);

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function statsHandlers(circles = defaultCircles) {
  return circles.map((circle) =>
    http.get(`${CIRCLES_URL}/${circle.id}`, () => HttpResponse.json(circleDetail(circle))),
  );
}

function useHappyPath(circles = defaultCircles) {
  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(CIRCLES_URL, () => HttpResponse.json({ items: circles, nextCursor: null })),
    ...statsHandlers(circles),
  );
}

describe('CircleListPage', () => {
  it('muestra el saludo y el destacado con la portada del primer círculo', async () => {
    useHappyPath();

    const { container } = renderWithRouter(<CircleListPage now={NOW} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Sofía' }, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText('Sábado, 17 de octubre')).toBeTruthy();

    const featured = await screen.findByRole('link', { name: /Destacado.*Familia García/ });
    expect(featured.getAttribute('href')).toBe('/circles/cir_familia');

    // «Tus círculos» lista todos, también el destacado: tres cards y un
    // contador de tres.
    expect(screen.getAllByRole('link', { name: /Familia García/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Lisboa 2026/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Amigas de la uni/ })).toBeTruthy();
    expect(screen.getByText('3 círculos')).toBeTruthy();

    await screen.findAllByText('8 personas · 12 álbumes · 1.240 fotos');
    await expectNoAxeViolations(container);
  });

  it('usa una rejilla en escritorio y una columna en móvil', async () => {
    useHappyPath();

    renderWithRouter(<CircleListPage now={NOW} />);

    const list = await screen.findByRole('list');
    expect(list.className).toContain('grid');
    expect(list.className).toContain('md:grid-cols-2');
    expect(list.className).toContain('lg:grid-cols-3');

    const card = screen.getByRole('link', { name: /Lisboa 2026/ });
    expect(card.className).toContain('lg:block');

    const fab = screen.getByRole('link', { name: 'Crear círculo' });
    expect(fab.className).toContain('lg:hidden');
    expect(fab.className).toContain('var(--app-bottom-nav-height)');

    const createCard = screen.getByRole('button', { name: 'Crear un círculo' });
    expect(createCard.closest('li')?.className).toContain('hidden');
    expect(createCard.closest('li')?.className).toContain('lg:block');
  });

  it('muestra el estado vacío y guía a crear el primer círculo', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    );

    renderWithRouter(<CircleListPage now={NOW} />);

    expect(await screen.findByText('Todavía no tienes círculos')).toBeTruthy();
    expect(screen.getByText('Te damos la bienvenida')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crear mi primer círculo' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Crear círculo' })).toBeNull();
    expect(screen.queryByText('Tus círculos')).toBeNull();
  });

  it('anuncia la carga con aria-busy y no pinta contenido privado', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, async () => {
        await delay(80);
        return HttpResponse.json({ items: defaultCircles, nextCursor: null });
      }),
      ...statsHandlers(),
    );

    const { container } = renderWithRouter(<CircleListPage now={NOW} />);

    expect(await screen.findByText('Cargando tus círculos…')).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: 'Tus círculos' })).toBeNull();

    expect((await screen.findAllByText('Familia García')).length).toBeGreaterThan(0);
  });

  it('pide la página siguiente con «Cargar más» y respeta el cursor', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        if (cursor === 'cursor-2') {
          return HttpResponse.json({ items: [circleThird], nextCursor: null });
        }

        return HttpResponse.json({
          items: [circleWithCover, circleWithoutCover],
          nextCursor: 'cursor-2',
        });
      }),
      ...statsHandlers(),
    );

    renderWithRouter(<CircleListPage now={NOW} />);

    await screen.findByText('Lisboa 2026');
    expect(screen.getByText('2+ círculos')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByRole('link', { name: /Amigas de la uni/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).toBeNull();
    expect(screen.getByText('3 círculos')).toBeTruthy();
  });

  it('ofrece reintentar y ver la ayuda cuando falla la lista', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderWithRouter(<CircleListPage now={NOW} />);

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'No hemos podido cargar tus círculos',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Código del error: HTTP-500/)).toBeTruthy();

    const help = screen.getByRole('link', { name: 'Ver la ayuda' });
    expect(help.getAttribute('href')).toBe('/help');

    server.use(
      http.get(CIRCLES_URL, () => HttpResponse.json({ items: defaultCircles, nextCursor: null })),
      ...statsHandlers(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'No hemos podido cargar tus círculos' }),
      ).toBeNull();
    });
    expect((await screen.findAllByText('Familia García')).length).toBeGreaterThan(0);
  });

  it('mantiene los datos y avisa si falla una actualización', async () => {
    useHappyPath();

    const { queryClient } = renderWithRouter(<CircleListPage now={NOW} />);

    await screen.findAllByText('Familia García');

    server.use(
      http.get(CIRCLES_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    await queryClient.invalidateQueries({ queryKey: circleKeys.list });

    expect(await screen.findByText('No hemos podido actualizar la lista')).toBeTruthy();
    expect(screen.getAllByText('Familia García').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('usa el primer círculo con degradado si ninguno tiene portada', async () => {
    const noCover = { ...circleThird, coverPhoto: null };

    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, () =>
        HttpResponse.json({ items: [noCover, circleWithoutCover], nextCursor: null }),
      ),
      http.get(`${CIRCLES_URL}/${noCover.id}`, () => HttpResponse.json(circleDetail(noCover))),
      http.get(`${CIRCLES_URL}/${circleWithoutCover.id}`, () =>
        HttpResponse.json(circleDetail(circleWithoutCover)),
      ),
    );

    renderWithRouter(<CircleListPage now={NOW} />);

    const featured = await screen.findByRole('link', { name: /Destacado.*Amigas de la uni/ });

    expect(featured.querySelector('img')).toBeNull();
    expect(featured.textContent).toContain('AD');
  });

  it('muestra un fallback con iniciales si la portada no carga', async () => {
    const broken = {
      ...circleWithCover,
      coverPhoto: { ...circleWithCover.coverPhoto!, thumbUrl: '/roto.jpg' },
    };

    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, () => HttpResponse.json({ items: [broken], nextCursor: null })),
      http.get(`${CIRCLES_URL}/${broken.id}`, () => HttpResponse.json(circleDetail(broken))),
    );

    renderWithRouter(<CircleListPage now={NOW} />);

    const image = await screen.findByRole('link', { name: /Destacado.*Familia García/ });
    const img = image.querySelector('img');

    expect(img).toBeTruthy();
    fireEvent.error(img!);

    await waitFor(() => {
      expect(image.querySelector('img')).toBeNull();
    });
    expect(image.textContent).toContain('FG');
  });
});
