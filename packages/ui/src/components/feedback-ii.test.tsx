import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import { Breadcrumb } from './breadcrumb';
import { EmptyState } from './empty-state';
import { InlineAlert } from './inline-alert';
import { OVERLAY_EXIT_MS } from './overlay-utils';
import { Toast, ToastViewport } from './toast';
import { Tooltip, tooltipShiftFor } from './tooltip';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Toast', () => {
  it('usa status para avisos y alert para peligro', () => {
    const { rerender } = render(<Toast tone="success" title="Enlace copiado" onClose={() => {}} />);

    expect(screen.getByRole('status').textContent).toContain('Enlace copiado');

    rerender(<Toast tone="danger" title="No se pudo subir la foto" onClose={() => {}} />);

    expect(screen.getByRole('alert').textContent).toContain('No se pudo subir la foto');
  });

  it('muestra la acción y siempre permite cerrar', () => {
    const onClose = vi.fn();
    const onAction = vi.fn();

    render(
      <Toast
        tone="info"
        title="Foto movida"
        action={
          <button type="button" onClick={onAction}>
            Deshacer
          </button>
        }
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deja cierre y acción fuera de la región viva, con foco inverso y cierre compacto', () => {
    render(
      <Toast
        tone="info"
        title="Foto movida"
        action={<button type="button">Deshacer</button>}
        onClose={() => {}}
      />,
    );

    const status = screen.getByRole('status');
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const action = screen.getByRole('button', { name: 'Deshacer' });

    expect(status.contains(close)).toBe(false);
    expect(status.contains(action)).toBe(false);
    expect(close.className).toContain('size-9');
    expect(close.className).toContain('after:size-11');
    expect(close.className).toContain('outline-on-inverse');
  });

  it('no mueve el foco al aparecer', () => {
    const { rerender } = render(<button type="button">Foco previo</button>);
    const trigger = screen.getByRole('button', { name: 'Foco previo' });
    trigger.focus();

    rerender(
      <>
        <button type="button">Foco previo</button>
        <Toast tone="success" title="Guardado" onClose={() => {}} />
      </>,
    );

    expect(document.activeElement).toBe(trigger);
  });

  it('cierra con el temporizador opcional', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<Toast tone="success" title="Guardado" duration={1000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pausa el temporizador al pasar el ratón y lo reanuda al salir', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<Toast tone="success" title="Guardado" duration={1000} onClose={onClose} />);
    const toast = screen.getByRole('status');

    act(() => {
      vi.advanceTimersByTime(400);
    });

    fireEvent.mouseOver(toast);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseOut(toast);

    act(() => {
      vi.advanceTimersByTime(599);
    });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pausa el temporizador al enfocar un control del aviso', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<Toast tone="success" title="Guardado" duration={1000} onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Cerrar' });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    fireEvent.focusIn(close);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).not.toHaveBeenCalled();

    fireEvent.focusOut(close);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mantiene el aviso durante la salida y lo desmonta al terminar', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Toast open title="Guardado" onClose={() => {}} />);

    expect(container.firstElementChild?.getAttribute('data-state')).toBe('open');

    rerender(<Toast open={false} title="Guardado" onClose={() => {}} />);

    expect(container.firstElementChild?.getAttribute('data-state')).toBe('exit');

    act(() => {
      vi.advanceTimersByTime(OVERLAY_EXIT_MS);
    });

    expect(container.firstElementChild).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    render(
      <Toast
        tone="danger"
        title="No se pudo subir la foto"
        description="Revisa la conexión e inténtalo de nuevo."
        action={
          <button type="button" className="text-on-inverse underline">
            Reintentar
          </button>
        }
        onClose={() => {}}
      />,
    );

    await expectNoAxeViolations(document.body);
  });
});

describe('ToastViewport', () => {
  it('no declara regiones vivas propias y no mueve el foco', () => {
    render(
      <ToastViewport assertive={<Toast tone="danger" title="Error al subir" onClose={() => {}} />}>
        <Toast tone="success" title="Enlace copiado" onClose={() => {}} />
      </ToastViewport>,
    );

    expect(document.querySelector('[aria-live]')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Enlace copiado');
    expect(screen.getByRole('alert').textContent).toContain('Error al subir');
    expect(document.activeElement).toBe(document.body);
  });

  it('calcula scroll-padding-bottom desde la parte superior de la pila y lo restaura', () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 600, height: 120 } as unknown as DOMRect);

    const { rerender } = render(
      <ToastViewport>
        <Toast tone="success" title="Enlace copiado" onClose={() => {}} />
      </ToastViewport>,
    );

    expect(document.documentElement.style.scrollPaddingBottom).toBe('216px');

    rerender(<ToastViewport />);

    expect(document.documentElement.style.scrollPaddingBottom).toBe('');
    rect.mockRestore();
  });

  it('usa left/right sin w-full y mantiene varios avisos dentro', () => {
    const { container } = render(
      <ToastViewport>
        <Toast tone="success" title="Uno" onClose={() => {}} />
        <Toast tone="info" title="Dos" onClose={() => {}} />
        <Toast tone="warning" title="Tres" onClose={() => {}} />
      </ToastViewport>,
    );

    const viewport = container.firstElementChild;

    if (!(viewport instanceof HTMLElement)) {
      throw new Error('No se encontró el viewport de toasts');
    }

    expect(viewport.className).toContain('left-4');
    expect(viewport.className).toContain('right-4');
    expect(viewport.className).not.toContain('w-full');
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });
});

describe('InlineAlert', () => {
  it('usa alert en peligro y status en el resto', () => {
    const { rerender } = render(<InlineAlert tone="warning" title="Cambios sin guardar" />);

    expect(screen.getByRole('status').textContent).toContain('Cambios sin guardar');

    rerender(<InlineAlert tone="danger" title="No se pudo guardar" />);

    expect(screen.getByRole('alert').textContent).toContain('No se pudo guardar');
  });

  it('muestra descripción y acción', () => {
    render(
      <InlineAlert
        tone="success"
        title="Cambios guardados"
        description="El círculo se ha actualizado."
        action={<button type="button">Ver círculo</button>}
      />,
    );

    expect(screen.getByText('El círculo se ha actualizado.')).toBeTruthy();

    const status = screen.getByRole('status');
    const action = screen.getByRole('button', { name: 'Ver círculo' });

    expect(status.contains(action)).toBe(false);
  });

  it('mantiene el mensaje durante la salida y lo desmonta al terminar', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <InlineAlert open tone="success" title="Cambios guardados" />,
    );

    expect(container.firstElementChild?.getAttribute('data-state')).toBe('open');

    rerender(<InlineAlert open={false} tone="success" title="Cambios guardados" />);

    expect(container.firstElementChild?.getAttribute('data-state')).toBe('exit');

    act(() => {
      vi.advanceTimersByTime(OVERLAY_EXIT_MS);
    });

    expect(container.firstElementChild).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    render(
      <InlineAlert tone="danger" title="No se pudo guardar" description="Inténtalo de nuevo." />,
    );

    await expectNoAxeViolations(document.body);
  });
});

describe('EmptyState', () => {
  it('usa un encabezado h2 por defecto y permite cambiar el nivel', () => {
    const { rerender } = render(
      <EmptyState title="Aún no hay álbumes" description="Crea el primero para empezar." />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Aún no hay álbumes' })).toBeTruthy();
    expect(screen.getByText('Crea el primero para empezar.').className).toContain('text-body');

    rerender(
      <EmptyState
        headingLevel={3}
        title="Aún no hay álbumes"
        description="Crea el primero para empezar."
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Aún no hay álbumes' })).toBeTruthy();
  });

  it('permite icono circular o cuadrado redondeado sin cambiar su tamaño', () => {
    const { container, rerender } = render(
      <EmptyState icon={<svg aria-hidden="true" />} title="Sin fotos" />,
    );

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon?.className).toContain('size-14');
    expect(icon?.className).toContain('rounded-full');

    rerender(<EmptyState icon={<svg aria-hidden="true" />} title="Sin fotos" iconShape="square" />);

    const square = container.querySelector('[aria-hidden="true"]');
    expect(square?.className).toContain('size-14');
    expect(square?.className).toContain('rounded-lg');
    expect(square?.className).not.toContain('rounded-xl');
  });

  it('marca el icono como decorativo y muestra la acción', () => {
    const { container } = render(
      <EmptyState
        icon={<svg aria-hidden="true" />}
        title="Sin resultados"
        description="Prueba con otra búsqueda."
        action={<button type="button">Limpiar filtros</button>}
      />,
    );

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeTruthy();
  });

  it('no tiene violaciones de axe', async () => {
    render(<EmptyState title="Sin fotos" description="Sube la primera foto del álbum." />);

    await expectNoAxeViolations(document.body);
  });
});

describe('Breadcrumb', () => {
  it('marca solo el último elemento como página actual y sin enlace', () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Mis círculos', href: '/circles' },
          { label: 'Lisboa 2026', href: '/circles/lisboa' },
          { label: 'Álbumes' },
        ]}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Ruta' });

    expect(within(nav).getByRole('list')).toBeTruthy();
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]?.className).toContain('after:h-11');

    const current = within(nav).getByText('Álbumes');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.className).toContain('font-medium');
    expect(current.closest('a')).toBeNull();
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelectorAll('li [aria-hidden="true"]')).toHaveLength(2);
  });

  it('no tiene violaciones de axe', async () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Mis círculos', href: '/circles' },
          { label: 'Lisboa 2026', href: '/circles/lisboa' },
          { label: 'Álbumes' },
        ]}
      />,
    );

    await expectNoAxeViolations(document.body);
  });
});

describe('Tooltip', () => {
  it('aparece con foco y enlaza el contenido con aria-describedby', () => {
    render(
      <main>
        <Tooltip content="Descarga el álbum en calidad original">
          <button type="button">Descargar</button>
        </Tooltip>
      </main>,
    );

    const trigger = screen.getByRole('button', { name: 'Descargar' });

    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.focusIn(trigger);

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip.textContent).toBe('Descarga el álbum en calidad original');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.className).toContain('[@media(hover:hover)]:block');
    expect(tooltip.className).not.toContain('min-width');
  });

  it('aparece con hover y se oculta al salir', () => {
    render(
      <main>
        <Tooltip content="Descarga el álbum">
          <button type="button">Descargar</button>
        </Tooltip>
      </main>,
    );

    const trigger = screen.getByRole('button', { name: 'Descargar' });

    fireEvent.mouseOver(trigger);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.mouseOut(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('se oculta con Esc y retira la descripción', () => {
    render(
      <main>
        <Tooltip content="Descarga el álbum">
          <button type="button">Descargar</button>
        </Tooltip>
      </main>,
    );

    const trigger = screen.getByRole('button', { name: 'Descargar' });

    fireEvent.focusIn(trigger);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  it('calcula el desplazamiento para no salir del viewport', () => {
    expect(tooltipShiftFor(-49, 207, 768)).toBe(57);
    expect(tooltipShiftFor(600, 820, 768)).toBe(-60);
    expect(tooltipShiftFor(100, 300, 768)).toBe(0);
  });

  it('no tiene violaciones de axe con el globo visible', async () => {
    render(
      <main>
        <Tooltip content="Descarga el álbum">
          <button type="button">Descargar</button>
        </Tooltip>
      </main>,
    );

    fireEvent.focusIn(screen.getByRole('button', { name: 'Descargar' }));

    await expectNoAxeViolations(document.body);
  });
});
