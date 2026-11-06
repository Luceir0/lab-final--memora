import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { galleryPhotos } from '../../test/fixtures/photos-fixtures';

import { PhotoGrid } from './photo-grid';
import { SelectionBar } from './selection-bar';
import { usePhotoSelection } from './use-photo-selection';

function SelectionHarness() {
  const selection = usePhotoSelection(galleryPhotos);

  return (
    <div>
      {selection.selectedCount > 0 ? (
        <SelectionBar
          selectedCount={selection.selectedCount}
          loadedCount={galleryPhotos.length}
          onClear={selection.clear}
          onSelectAll={() => selection.selectAll(galleryPhotos)}
        />
      ) : null}
      <PhotoGrid
        label="Fotos del álbum"
        photos={galleryPhotos}
        selectedIds={selection.selectedIds}
        onToggle={(photo, event) => selection.toggle(photo, event)}
      />
    </div>
  );
}

describe('PhotoGrid', () => {
  it('usa 3 columnas en móvil y de 4 a 7 en escritorio', () => {
    render(<PhotoGrid label="Fotos del álbum" photos={galleryPhotos} />);

    const list = screen.getByRole('list', { name: 'Fotos del álbum' });

    expect(list.className).toContain('grid-cols-3');
    expect(list.className).toContain('md:grid-cols-4');
    expect(list.className).toContain('lg:grid-cols-5');
    expect(list.className).toContain('xl:grid-cols-6');
    expect(list.className).toContain('2xl:grid-cols-7');
  });

  it('adapta las imágenes con srcset, sizes, lazy y dimensiones', () => {
    render(<PhotoGrid label="Fotos del álbum" photos={galleryPhotos} />);

    const image = document.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('srcset')).toContain('size=thumb');
    expect(image.getAttribute('srcset')).toContain('size=display');
    expect(image.getAttribute('sizes')).toContain('min-width: 768px');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('width')).toBe('1600');
    expect(image.getAttribute('height')).toBe('1200');
  });

  it('selecciona con clic, Shift y Ctrl y limpia con Escape', () => {
    render(<SelectionHarness />);

    const tiles = screen.getAllByRole('button', { name: /Seleccionar foto:/ });

    expect(tiles).toHaveLength(galleryPhotos.length);

    fireEvent.click(tiles[0]!);
    expect(tiles[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('1 foto seleccionada')).toBeTruthy();

    fireEvent.click(tiles[2]!, { shiftKey: true });
    expect(tiles[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(tiles[1]!.getAttribute('aria-pressed')).toBe('true');
    expect(tiles[2]!.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('3 fotos seleccionadas')).toBeTruthy();

    fireEvent.click(tiles[1]!, { ctrlKey: true });
    expect(tiles[1]!.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('2 fotos seleccionadas')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(tiles.every((tile) => tile.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(screen.queryByRole('region', { name: 'Selección de fotos' })).toBeNull();
  });

  it('la barra permite seleccionar todo y mantiene las acciones futuras deshabilitadas', () => {
    render(<SelectionHarness />);

    fireEvent.click(screen.getAllByRole('button', { name: /Seleccionar foto:/ })[0]!);

    const bar = screen.getByRole('region', { name: 'Selección de fotos' });

    expect(within(bar).getByRole('button', { name: 'Descargar' })).toHaveProperty('disabled', true);
    expect(within(bar).getByRole('button', { name: 'Etiquetar' })).toHaveProperty('disabled', true);
    expect(within(bar).getByRole('button', { name: 'Eliminar' })).toHaveProperty('disabled', true);

    fireEvent.click(
      within(bar).getByRole('button', { name: `Seleccionar las ${galleryPhotos.length}` }),
    );

    expect(screen.getByText(`${galleryPhotos.length} fotos seleccionadas`)).toBeTruthy();
  });

  it('carga la página siguiente con el botón accesible', () => {
    const onLoadMore = vi.fn();

    render(
      <PhotoGrid
        label="Fotos del álbum"
        photos={galleryPhotos}
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más fotos' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('carga la siguiente página cuando el centinela entra en pantalla', async () => {
    const onLoadMore = vi.fn();

    class MockIntersectionObserver {
      static instances: MockIntersectionObserver[] = [];

      readonly callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        MockIntersectionObserver.instances.push(this);
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    render(
      <PhotoGrid
        label="Fotos del álbum"
        photos={galleryPhotos}
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    );

    await act(async () => {
      const observer = MockIntersectionObserver.instances[0];

      observer?.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('muestra estados de carga, error y vacío', () => {
    const { rerender } = render(<PhotoGrid label="Fotos" photos={[]} loading />);

    expect(screen.getByText('Cargando fotos…')).toBeTruthy();

    rerender(<PhotoGrid label="Fotos" photos={[]} error={new Error('boom')} />);

    expect(screen.getByText('No hemos podido cargar las fotos')).toBeTruthy();

    rerender(<PhotoGrid label="Fotos" photos={[]} />);

    expect(screen.getByText('Todavía no hay fotos que mostrar')).toBeTruthy();
  });

  it('sustituye una imagen rota sin dejar el icono nativo', () => {
    render(<PhotoGrid label="Fotos del álbum" photos={galleryPhotos} />);

    const image = document.querySelector('img') as HTMLImageElement;

    fireEvent.error(image);

    expect(screen.getAllByTestId('photo-tile-fallback')).toHaveLength(1);
  });
});
