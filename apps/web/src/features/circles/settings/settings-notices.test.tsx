import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { renderWithRouter } from '../../../test/circles-harness';
import { testMeResponse } from '../../../test/circles-fixtures';
import { CircleListPage } from '../circle-list-page';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

/**
 * Avisos que deja F28 al borrar un círculo o salir de él.
 *
 * La limpieza de `?deleted`/`?left` la ejecuta la ruta `/circles` con
 * `replace`; aquí se verifica el contrato de la página: pinta el aviso y llama
 * a `onNoticeClose` al cerrarlo.
 */
function useEmptyList() {
  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(CIRCLES_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
}

describe('avisos de F28 en Mis círculos', () => {
  it('muestra el aviso de círculo eliminado y lo cierra avisando al consumidor', async () => {
    useEmptyList();
    const onNoticeClose = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(<CircleListPage deleted onNoticeClose={onNoticeClose} />, '/');

    expect(await screen.findByText('Círculo eliminado')).toBeTruthy();
    expect(screen.getByText('El círculo se ha eliminado para todas las personas.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onNoticeClose).toHaveBeenCalledTimes(1);
  });

  it('unifica los dos avisos en un único viewport si coinciden', async () => {
    useEmptyList();

    renderWithRouter(<CircleListPage deleted left />, '/');

    expect(await screen.findByText('Círculo eliminado')).toBeTruthy();
    expect(await screen.findByText('Has salido del círculo')).toBeTruthy();
    expect(document.querySelectorAll('.z-toast')).toHaveLength(1);
  });

  it('muestra el aviso de salida y lo cierra avisando al consumidor', async () => {
    useEmptyList();
    const onNoticeClose = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(<CircleListPage left onNoticeClose={onNoticeClose} />, '/');

    expect(await screen.findByText('Has salido del círculo')).toBeTruthy();
    expect(screen.getByText('Ya no verás sus fotos en Mis círculos.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onNoticeClose).toHaveBeenCalledTimes(1);
  });
});
