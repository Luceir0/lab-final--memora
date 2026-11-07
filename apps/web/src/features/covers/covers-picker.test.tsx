import type { PhotoDto, PhotoSummary } from '@memora/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { renderWithRouter } from '../../test/circles-harness';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import {
  albumEmpty,
  albumNoCoverNoDate,
  albumWithPhotos,
} from '../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../test/fixtures/photos-fixtures';

import { CircleCoverPickerDialog } from './circle-cover-picker-dialog';
import { CoverPhotoPicker } from './cover-photo-picker';
import { CoverPreview } from './cover-preview';

const server = createAuthTestServer();
const ALBUMS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/albums`;
const PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/${albumWithPhotos.id}/photos`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface PickerHarnessProps {
  readonly initial?: string | null;
  readonly onChange?: (selected: string | null) => void;
}

function PickerHarness({ initial = null, onChange }: PickerHarnessProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  const update = (next: string | null) => {
    setSelectedId(next);
    onChange?.(next);
  };

  return (
    <div>
      <CoverPhotoPicker
        label="Fotos del álbum para la portada"
        photos={galleryPhotos}
        selectedId={selectedId}
        onSelect={(photo: PhotoDto) => update(photo.id)}
        onClear={() => update(null)}
      />
      <p data-testid="selected-id">{selectedId ?? 'ninguna'}</p>
    </div>
  );
}

describe('CoverPhotoPicker', () => {
  it('mantiene una sola foto seleccionada y permite quitar la selección', async () => {
    const onChange = vi.fn();

    render(<PickerHarness onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar foto: Atardecer/ }));

    expect(screen.getByTestId('selected-id').textContent).toBe('pho_playa');
    expect(screen.getByRole('button', { name: /Quitar selección: Atardecer/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar foto: Dei/ }));

    expect(screen.getByTestId('selected-id').textContent).toBe('pho_cena');
    expect(screen.getByRole('button', { name: /Seleccionar foto: Atardecer/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Quitar selección: Dei/ }));

    expect(screen.getByTestId('selected-id').textContent).toBe('ninguna');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('se recorre con teclado y la casilla alterna la selección con Espacio', async () => {
    render(<PickerHarness />);
    const user = userEvent.setup();

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getAllByRole('button', { name: /Seleccionar foto|Abrir foto/ })[0],
    );

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getAllByRole('checkbox', { name: /Seleccionar foto: Atardecer/ })[0],
    );

    await user.keyboard(' ');

    expect(screen.getByTestId('selected-id').textContent).toBe('pho_playa');
  });

  it('muestra la carga con una región viva', () => {
    render(
      <CoverPhotoPicker
        label="Fotos del álbum para la portada"
        photos={[]}
        selectedId={null}
        onSelect={vi.fn()}
        loading
      />,
    );

    expect(screen.getByRole('status').textContent).toBe('Cargando fotos…');
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('muestra el vacío propio sin fotos', () => {
    render(
      <CoverPhotoPicker
        label="Fotos del álbum para la portada"
        photos={[]}
        selectedId={null}
        onSelect={vi.fn()}
        empty={<p>Este álbum no tiene fotos.</p>}
      />,
    );

    expect(screen.getByText('Este álbum no tiene fotos.')).toBeTruthy();
  });

  it('muestra el error y reintenta', async () => {
    const onRetry = vi.fn();

    render(
      <CoverPhotoPicker
        label="Fotos del álbum para la portada"
        photos={[]}
        selectedId={null}
        onSelect={vi.fn()}
        error={new Error('fallo')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('No hemos podido cargar las fotos')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Fotos del álbum para la portada' })).toBeNull();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('no tiene violaciones de axe con selección activa', async () => {
    const { container } = render(<PickerHarness initial="pho_playa" />);

    await expectNoAxeViolations(container);
  });

  it('la miniatura de portada rota cae al hueco vacío', () => {
    const { container } = render(
      <CoverPreview
        photo={{
          id: 'pho_playa',
          thumbUrl: '/api/photos/pho_playa/image?size=thumb',
          width: 1600,
          height: 1200,
        }}
      />,
    );

    const image = container.querySelector('img');

    if (image === null) {
      throw new Error('La miniatura debería estar montada');
    }

    fireEvent.error(image);

    expect(container.querySelector('img')).toBeNull();
  });
});

interface DialogHarnessProps {
  readonly onSelected: (photo: PhotoSummary) => void;
  readonly onClose?: () => void;
  readonly selectedPhoto?: PhotoSummary | null;
}

function DialogHarness({ onSelected, onClose, selectedPhoto = null }: DialogHarnessProps) {
  return (
    <CircleCoverPickerDialog
      open
      onClose={onClose ?? vi.fn()}
      circleId="cir_familia"
      selectedPhoto={selectedPhoto}
      onSelect={onSelected}
    />
  );
}

describe('CircleCoverPickerDialog', () => {
  it('navega del álbum a sus fotos, marca una y la confirma', async () => {
    const onSelected = vi.fn();

    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={onSelected} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(await within(dialog).findByText('Álbumes del círculo')).toBeTruthy();
    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));

    expect(
      await screen.findByRole('list', { name: 'Fotos del álbum para la portada' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver a los álbumes' })).toBeTruthy();

    await user.click(screen.getByRole('checkbox', { name: /Seleccionar foto: Atardecer/ }));

    expect(screen.getByText('Atardecer en la playa')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }));

    expect(onSelected).toHaveBeenCalledWith({
      id: 'pho_playa',
      thumbUrl: '/api/photos/pho_playa/image?size=thumb',
      width: 1600,
      height: 1200,
    });
  });

  it('mantiene «Usar esta foto» deshabilitado hasta elegir una foto', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(
      (within(dialog).getByRole('button', { name: 'Usar esta foto' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));

    expect(
      (within(dialog).getByRole('button', { name: 'Usar esta foto' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('muestra el vacío cuando el círculo no tiene álbumes', async () => {
    server.use(http.get(ALBUMS_URL, () => HttpResponse.json({ items: [], nextCursor: null })));

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(await within(dialog).findByText('Todavía no hay álbumes')).toBeTruthy();
  });

  it('avisa cuando hay álbumes pero ninguno tiene fotos', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumEmpty], nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(
      await within(dialog).findByText(
        'Ningún álbum tiene fotos todavía. Sube fotos a uno para poder elegir una portada.',
      ),
    ).toBeTruthy();
    expect(
      (within(dialog).getByRole('button', { name: /Sin fotos todavía/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('carga más álbumes cuando hay otra página', async () => {
    server.use(
      http.get(ALBUMS_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        return cursor === 'cursor-2'
          ? HttpResponse.json({ items: [albumNoCoverNoDate], nextCursor: null })
          : HttpResponse.json({ items: [albumWithPhotos], nextCursor: 'cursor-2' });
      }),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await within(dialog).findByRole('button', { name: /Verano en Mallorca/ });
    await user.click(within(dialog).getByRole('button', { name: 'Cargar más álbumes' }));

    expect(await within(dialog).findByRole('button', { name: /Recuerdos sueltos/ })).toBeTruthy();

    const albumsHeading = within(dialog).getByRole('heading', {
      level: 2,
      name: 'Álbumes del círculo',
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(albumsHeading);
    });
  });

  it('no avisa de álbumes sin fotos mientras quedan páginas por cargar', async () => {
    server.use(
      http.get(ALBUMS_URL, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');

        return cursor === 'cursor-2'
          ? HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })
          : HttpResponse.json({ items: [albumEmpty], nextCursor: 'cursor-2' });
      }),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await within(dialog).findByRole('button', { name: /Sin fotos todavía/ });

    expect(
      within(dialog).queryByText(
        'Ningún álbum tiene fotos todavía. Sube fotos a uno para poder elegir una portada.',
      ),
    ).toBeNull();

    await user.click(within(dialog).getByRole('button', { name: 'Cargar más álbumes' }));

    expect(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ })).toBeTruthy();
  });

  it('mueve el foco al encabezado al entrar y al volver de un álbum', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));

    const photosHeading = screen.getByRole('heading', { level: 2, name: 'Fotos del álbum' });

    await waitFor(() => {
      expect(document.activeElement).toBe(photosHeading);
    });

    await user.click(screen.getByRole('button', { name: 'Volver a los álbumes' }));

    const albumsHeading = screen.getByRole('heading', { level: 2, name: 'Álbumes del círculo' });

    await waitFor(() => {
      expect(document.activeElement).toBe(albumsHeading);
    });
  });

  it('marca la portada actual en la rejilla al navegar a su álbum', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    );

    renderWithRouter(
      <DialogHarness
        onSelected={vi.fn()}
        selectedPhoto={{
          id: 'pho_playa',
          thumbUrl: '/api/photos/pho_playa/image?size=thumb',
          width: 1600,
          height: 1200,
        }}
      />,
      '/circles/cir_familia',
    );
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(within(dialog).getByText('Foto seleccionada')).toBeTruthy();
    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));

    expect(
      (await screen.findByRole('checkbox', {
        name: /Quitar selección: Atardecer/,
      })) as HTMLInputElement,
    ).toHaveProperty('checked', true);
  });

  it('muestra el error de la lista y reintenta', async () => {
    let calls = 0;

    server.use(
      http.get(ALBUMS_URL, () => {
        calls += 1;

        if (calls === 1) {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Fallo', details: null },
            { status: 500 },
          );
        }

        return HttpResponse.json({ items: [albumWithPhotos], nextCursor: null });
      }),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    expect(await within(dialog).findByText('No hemos podido cargar los álbumes')).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Reintentar' }));

    expect(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ })).toBeTruthy();
  });

  it('devuelve el foco al disparador al cerrar el selector', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
    );

    function FocusHarness() {
      const [open, setOpen] = useState(false);

      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir selector
          </button>
          <CircleCoverPickerDialog
            open={open}
            onClose={() => setOpen(false)}
            circleId="cir_familia"
            selectedPhoto={{
              id: 'pho_playa',
              thumbUrl: '/api/photos/pho_playa/image?size=thumb',
              width: 1600,
              height: 1200,
            }}
            onSelect={vi.fn()}
          />
        </div>
      );
    }

    renderWithRouter(<FocusHarness />, '/circles/cir_familia');
    const user = userEvent.setup();
    const trigger = await screen.findByRole('button', { name: 'Abrir selector' });

    await user.click(trigger);
    await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('pasa axe en el paso de álbumes', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await expectNoAxeViolations(dialog);
  });

  it('pasa axe en el paso de fotos', async () => {
    server.use(
      http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
      http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    );

    renderWithRouter(<DialogHarness onSelected={vi.fn()} />, '/circles/cir_familia');
    const user = userEvent.setup();

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));
    await within(dialog).findByRole('list', { name: 'Fotos del álbum para la portada' });

    await expectNoAxeViolations(dialog);
  });
});
