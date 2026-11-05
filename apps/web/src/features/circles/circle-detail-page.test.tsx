import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { renderWithRouter } from '../../test/circles-harness';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';

import { CircleDetailProvider } from './circle-detail-context';
import { CircleDetailPage } from './circle-detail-page';

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderPage(
  circle = circleDetail(circleWithCover),
  props: Parameters<typeof CircleDetailPage>[0] = {},
) {
  const focusTitle = vi.fn();

  return {
    focusTitle,
    ...renderWithRouter(
      <CircleDetailProvider circle={circle} openInvite={vi.fn()} focusTitle={focusTitle}>
        <CircleDetailPage {...props} />
      </CircleDetailProvider>,
      '/circles/cir_familia',
    ),
  };
}

describe('CircleDetailPage', () => {
  it('muestra el panel de álbumes con el estado y las acciones de F24', async () => {
    const { container } = renderPage(
      circleDetail(circleWithCover, { membersCount: 8, albumsCount: 3, photosCount: 1240 }),
    );

    expect(
      await screen.findByText('La lista de álbumes estará disponible próximamente'),
    ).toBeTruthy();
    expect(screen.getByText(/Este círculo tiene 3 álbumes/)).toBeTruthy();
    expect(screen.queryByText('Todavía no hay álbumes')).toBeNull();

    const create = screen.getByRole('button', { name: /^Crear álbum/ });

    expect((create as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getAllByText('La creación de álbumes estará disponible próximamente.').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/F2[248]/)).toBeNull();

    await expectNoAxeViolations(container);
  });

  it('muestra el estado vacío real de álbumes', async () => {
    renderPage(circleDetail(circleWithCover, { albumsCount: 0 }));

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    expect(
      screen.getByText(
        'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.',
      ),
    ).toBeTruthy();

    const create = screen.getByRole('button', { name: /^Crear el primer álbum/ });

    expect((create as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText(/F2[248]/)).toBeNull();
  });

  it('enfoca el título del héroe y muestra el toast de círculo creado', async () => {
    const onCreatedToastClose = vi.fn();
    const { focusTitle } = renderPage(circleDetail(circleWithCover), {
      created: true,
      onCreatedToastClose,
    });

    await waitFor(() => {
      expect(focusTitle).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Círculo creado')).toBeTruthy();
    expect(screen.getByText('Ya puedes invitar a tu gente.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onCreatedToastClose).toHaveBeenCalledTimes(1);
  });
});
