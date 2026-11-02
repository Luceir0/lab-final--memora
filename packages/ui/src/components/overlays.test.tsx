import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/axe';
import tokensCss from '../styles/tokens.css?raw';
import { BottomSheet } from './bottom-sheet';
import bottomSheetSource from './bottom-sheet?raw';
import { ConfirmDialog } from './confirm-dialog';
import { Dialog } from './dialog';
import dialogSource from './dialog?raw';
import { OVERLAY_EXIT_MS } from './overlay-utils';
import { ResponsiveDialog } from './responsive-dialog';

function DialogHarness({
  initialOpen = true,
  onClose = () => {},
  dismissible,
}: {
  readonly initialOpen?: boolean;
  readonly onClose?: () => void;
  readonly dismissible?: boolean | undefined;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div>
      <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
        Abrir diálogo
      </button>
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Compartir álbum"
        description="Elige quién puede ver el álbum."
        dismissible={dismissible}
        footer={
          <button type="button" onClick={() => setOpen(false)}>
            Listo
          </button>
        }
      >
        <p>Contenido del diálogo</p>
        <button type="button">Acción interna</button>
      </Dialog>
    </div>
  );
}

function BottomSheetHarness({ onClose = () => {} }: { readonly onClose?: () => void }) {
  const [open, setOpen] = useState(true);

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        onClose();
        setOpen(false);
      }}
      title="Acciones de la foto"
      description="Elige qué hacer con este recuerdo."
      maxHeightPercent={75}
      footer={
        <button type="button" onClick={() => setOpen(false)}>
          Hecho
        </button>
      }
    >
      <p>Contenido de la hoja</p>
      <button type="button">Mover a un álbum</button>
    </BottomSheet>
  );
}

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'change') {
        listeners.add(listener);
      }
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'change') {
        listeners.delete(listener);
      }
    },
    dispatchEvent: () => false,
  };
  const matchMedia = vi.fn((query: string) => {
    media.media = query;
    return media as unknown as MediaQueryList;
  });

  vi.stubGlobal('matchMedia', matchMedia);

  return {
    matchMedia,
    setMatches(matches: boolean) {
      media.matches = matches;

      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}

function overlayRootByTitle(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  const panel = heading.closest<HTMLElement>('[data-overlay]');
  const root = panel?.closest<HTMLElement>('[data-memora-overlay-root]');

  if (!root) {
    throw new Error(`No se encontró el root del overlay «${title}»`);
  }

  return root;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('contrato de animación de overlays', () => {
  it('usa la duración rápida y coincide con OVERLAY_EXIT_MS', () => {
    expect(dialogSource).toContain('duration-(--memora-duration-fast)');
    expect(bottomSheetSource).toContain('duration-(--memora-duration-fast)');

    const token = tokensCss.match(/--memora-duration-fast:\s*(\d+)ms/);

    expect(token).not.toBeNull();
    expect(Number(token?.[1])).toBe(OVERLAY_EXIT_MS);
  });
});

describe('Dialog', () => {
  it('expone rol, aria-modal, nombre y descripción', () => {
    render(<DialogHarness />);

    const dialog = screen.getByRole('dialog', { name: 'Compartir álbum' });
    const describedBy = dialog.getAttribute('aria-describedby');
    const description = describedBy ? document.getElementById(describedBy) : null;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(description?.textContent).toBe('Elige quién puede ver el álbum.');
  });

  it('usa padding responsive y borde fuerte solo en oscuro', () => {
    render(<DialogHarness />);

    const dialog = screen.getByRole('dialog');

    expect(dialog.className).toContain('p-6');
    expect(dialog.className).toContain('sm:p-8');
    expect(dialog.className).toContain("[[data-theme='dark']_&]:border-border-strong");
  });

  it('lleva el foco inicial al primer elemento interactivo', () => {
    render(<DialogHarness />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });

  it('cicla el foco con Tab y Shift+Tab dentro del diálogo', () => {
    render(<DialogHarness />);

    const dialog = screen.getByRole('dialog', { name: 'Compartir álbum' });
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const last = screen.getByRole('button', { name: 'Listo' });

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    close.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('cierra con Esc y devuelve el foco al disparador', () => {
    render(<DialogHarness initialOpen={false} />);

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    fireEvent.click(trigger);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.querySelector('[data-memora-overlay-root]')?.getAttribute('data-state')).toBe(
      'closing',
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('cierra con el fondo cuando es descartable', () => {
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);

    const backdrop = document.querySelector<HTMLButtonElement>('[data-overlay-backdrop]');
    if (!backdrop) {
      throw new Error('No se encontró el fondo del diálogo');
    }

    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('con dismissible=false ignora Esc, el fondo y oculta el botón de cerrar', () => {
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} dismissible={false} />);

    expect(screen.queryByRole('button', { name: 'Cerrar' })).toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });

    const backdrop = document.querySelector<HTMLButtonElement>('[data-overlay-backdrop]');
    if (!backdrop) {
      throw new Error('No se encontró el fondo del diálogo');
    }
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('el fondo cancela pointerdown y mousedown sin mover el foco', () => {
    render(<DialogHarness dismissible={false} />);

    const internal = screen.getByRole('button', { name: 'Acción interna' });
    internal.focus();

    const backdrop = document.querySelector<HTMLButtonElement>('[data-overlay-backdrop]');
    if (!backdrop) {
      throw new Error('No se encontró el fondo del diálogo');
    }

    const pointerDown = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
    expect(backdrop.dispatchEvent(pointerDown)).toBe(false);
    expect(pointerDown.defaultPrevented).toBe(true);

    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    expect(backdrop.dispatchEvent(mouseDown)).toBe(false);
    expect(mouseDown.defaultPrevented).toBe(true);

    expect(document.activeElement).toBe(internal);
  });

  it('bloquea el scroll y deja inerte el fondo mientras está abierto', () => {
    render(<DialogHarness />);

    const trigger = screen.getByTestId('trigger');

    expect(document.body.style.overflow).toBe('hidden');
    expect(trigger.closest('[inert]')).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.body.style.overflow).toBe('');
    expect(trigger.closest('[inert]')).toBeNull();
  });

  it('mantiene el portal montado durante la animación de salida', () => {
    vi.useFakeTimers();

    try {
      render(<DialogHarness />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(document.querySelector('[data-overlay="dialog"]')).not.toBeNull();
      expect(document.querySelector('[data-memora-overlay-root]')?.getAttribute('data-state')).toBe(
        'closing',
      );

      act(() => {
        vi.advanceTimersByTime(OVERLAY_EXIT_MS + 20);
      });

      expect(document.querySelector('[data-overlay="dialog"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('no tiene violaciones de axe', async () => {
    render(<DialogHarness />);

    await expectNoAxeViolations(document.body);
  });
});

describe('ConfirmDialog', () => {
  function renderConfirm(options: {
    readonly onConfirm?: () => void;
    readonly onClose?: () => void;
    readonly confirmPhrase?: string | undefined;
  }) {
    return render(
      <ConfirmDialog
        open
        onClose={options.onClose ?? (() => {})}
        onConfirm={options.onConfirm ?? (() => {})}
        title="Eliminar recuerdo"
        description="Esta acción no se puede deshacer."
        danger
        confirmLabel="Eliminar recuerdo"
        confirmPhrase={options.confirmPhrase}
      >
        <p>El recuerdo se borrará para todos los miembros.</p>
      </ConfirmDialog>,
    );
  }

  it('empieza con el foco en Cancelar', () => {
    renderConfirm({});

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
  });

  it('exige escribir la frase y anuncia el error con aria-describedby', () => {
    const onConfirm = vi.fn();
    renderConfirm({ onConfirm, confirmPhrase: 'eliminar' });

    const input = screen.getByLabelText('Escribe «eliminar» para confirmar');
    const confirm = screen.getByRole('button', { name: 'Eliminar recuerdo' });

    expect(confirm.hasAttribute('disabled')).toBe(true);

    fireEvent.change(input, { target: { value: 'otra cosa' } });

    const error = screen.getByText('La frase no coincide.');
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? [];

    expect(confirm.hasAttribute('disabled')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy).toContain(error.id);

    fireEvent.change(input, { target: { value: 'eliminar' } });

    expect(confirm.hasAttribute('disabled')).toBe(false);
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('usa la piel destructiva suave y un neutro deshabilitado distinto', () => {
    renderConfirm({ confirmPhrase: 'eliminar' });

    const confirm = screen.getByRole('button', { name: 'Eliminar recuerdo' });
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    const dialog = screen.getByRole('dialog');
    const input = screen.getByLabelText('Escribe «eliminar» para confirmar');

    expect(confirm.className).toContain('border-danger');
    expect(confirm.className).toContain('bg-danger-soft');
    expect(confirm.className).toContain('text-danger-text');
    expect(confirm.className).toContain('not-disabled:hover:bg-danger-soft-hover');
    expect(confirm.className).not.toContain('bg-inverse');
    expect(confirm.className).not.toContain('disabled:opacity-100');
    expect(confirm.className).toContain('disabled:bg-surface-2');
    expect(confirm.className).toContain('disabled:text-muted');
    expect(confirm).toHaveProperty('disabled', true);
    expect(confirm.querySelector('svg')).not.toBeNull();
    expect(cancel.className).toContain('bg-surface-2');
    expect(dialog.querySelector('[aria-hidden="true"].bg-danger-soft')).toBeNull();

    fireEvent.change(input, { target: { value: 'eliminar' } });

    expect(confirm).toHaveProperty('disabled', false);
  });

  it('se presenta como hoja en móvil', () => {
    installMatchMedia(false);
    renderConfirm({});

    expect(document.querySelector('[data-overlay="sheet"]')).not.toBeNull();
    expect(document.querySelector('[data-overlay="dialog"]')).toBeNull();
  });

  it('se presenta como diálogo desde 768 px', () => {
    installMatchMedia(true);
    renderConfirm({});

    expect(document.querySelector('[data-overlay="dialog"]')).not.toBeNull();
    expect(document.querySelector('[data-overlay="sheet"]')).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    renderConfirm({ confirmPhrase: 'eliminar' });

    await expectNoAxeViolations(document.body);
  });
});

describe('BottomSheet', () => {
  it('expone título accesible y se cierra con el botón', () => {
    const onClose = vi.fn();
    render(<BottomSheetHarness onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Acciones de la foto' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con Esc', () => {
    const onClose = vi.fn();
    render(<BottomSheetHarness onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('arrastra con puntero y vuelve a su sitio sin cerrar', () => {
    const onClose = vi.fn();
    render(<BottomSheetHarness onClose={onClose} />);

    const handle = document.querySelector<HTMLDivElement>('[data-sheet-handle]');
    const panel = document.querySelector<HTMLElement>('[data-overlay="sheet"]');

    if (!handle || !panel) {
      throw new Error('No se encontró el asa o el panel de la hoja');
    }

    fireEvent.pointerDown(handle, { pointerId: 1, pointerType: 'touch', clientY: 20 });
    expect(panel.getAttribute('data-dragging')).toBe('true');

    fireEvent.pointerMove(window, { pointerId: 1, clientY: 60 });
    expect(panel.style.transform).toBe('translateY(40px)');

    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(panel.hasAttribute('data-dragging')).toBe(false);
    expect(panel.style.transform).toBe('');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cierra al arrastrar más allá del umbral', () => {
    const onClose = vi.fn();
    render(<BottomSheetHarness onClose={onClose} />);

    const handle = document.querySelector<HTMLDivElement>('[data-sheet-handle]');

    if (!handle) {
      throw new Error('No se encontró el asa de la hoja');
    }

    fireEvent.pointerDown(handle, { pointerId: 2, pointerType: 'touch', clientY: 10 });
    fireEvent.pointerMove(window, { pointerId: 2, clientY: 200 });
    fireEvent.pointerUp(window, { pointerId: 2 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('aplica maxHeightPercent como altura máxima', () => {
    render(<BottomSheetHarness />);

    const panel = document.querySelector<HTMLElement>('[data-overlay="sheet"]');

    expect(panel?.style.maxHeight).toBe('75dvh');
  });

  it('hace enfocable el cuerpo con nombre accesible por defecto', () => {
    render(<BottomSheetHarness />);

    const body = screen.getByRole('region', { name: 'Contenido' });

    expect(body.getAttribute('tabindex')).toBe('0');
    body.focus();
    expect(document.activeElement).toBe(body);
  });

  it('mantiene asa, cabecera y footer fuera del cuerpo con scroll', () => {
    render(
      <BottomSheet
        open
        onClose={() => {}}
        title="Hoja con contenido largo"
        bodyLabel="Detalle de la hoja"
        footer={<button type="button">Hecho</button>}
        footerLayout="row"
      >
        <div style={{ height: 1200 }}>Contenido muy largo</div>
      </BottomSheet>,
    );

    const panel = document.querySelector<HTMLElement>('[data-overlay="sheet"]');
    const body = screen.getByRole('region', { name: 'Detalle de la hoja' });
    const footer = screen.getByRole('button', { name: 'Hecho' }).parentElement;

    expect(panel?.className).toContain('overflow-hidden');
    expect(panel?.className).not.toContain('overflow-y-auto');
    expect(panel?.className).toContain('px-5');
    expect(panel?.className).toContain("[[data-theme='dark']_&]:border-border-strong");
    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body?.className).toContain('min-h-0');
    expect(body?.className).toContain('overflow-y-auto');
    expect(footer?.className).toContain('shrink-0');
    expect(footer?.className).toContain('flex-row');
  });

  it('oculta el asa si la hoja no es descartable y conserva el espaciador', () => {
    render(
      <BottomSheet open dismissible={false} onClose={() => {}} title="Hoja fija">
        <p>Contenido</p>
      </BottomSheet>,
    );

    const handle = document.querySelector<HTMLElement>('[data-sheet-handle]');

    expect(handle).not.toBeNull();
    expect(handle?.className).toContain('h-6');
    expect(handle?.querySelector('span')).toBeNull();
  });

  it('no tiene violaciones de axe', async () => {
    render(<BottomSheetHarness />);

    await expectNoAxeViolations(document.body);
  });
});

describe('ResponsiveDialog', () => {
  it('renderiza Dialog en escritorio sin duplicar el contenido y pasa axe', async () => {
    installMatchMedia(true);

    render(
      <ResponsiveDialog open onClose={() => {}} title="Ajustes del círculo">
        <p>Contenido único</p>
      </ResponsiveDialog>,
    );

    expect(document.querySelector('[data-overlay="dialog"]')).not.toBeNull();
    expect(document.querySelector('[data-overlay="sheet"]')).toBeNull();
    expect(screen.getAllByText('Ajustes del círculo')).toHaveLength(1);
    expect(screen.getAllByText('Contenido único')).toHaveLength(1);

    await expectNoAxeViolations(document.body);
  });

  it('cambia de hoja a diálogo al cruzar el breakpoint sin duplicar', () => {
    const media = installMatchMedia(false);

    render(
      <ResponsiveDialog open onClose={() => {}} title="Ajustes del círculo">
        <p>Contenido único</p>
      </ResponsiveDialog>,
    );

    expect(document.querySelector('[data-overlay="sheet"]')).not.toBeNull();

    act(() => {
      media.setMatches(true);
    });

    expect(document.querySelector('[data-overlay="dialog"]')).not.toBeNull();
    expect(document.querySelector('[data-overlay="sheet"]')).toBeNull();
    expect(screen.getAllByText('Ajustes del círculo')).toHaveLength(1);
    expect(screen.getAllByText('Contenido único')).toHaveLength(1);
  });

  it('renderiza BottomSheet en móvil sin duplicar el contenido', () => {
    installMatchMedia(false);

    render(
      <ResponsiveDialog open onClose={() => {}} title="Ajustes del círculo">
        <p>Contenido único</p>
      </ResponsiveDialog>,
    );

    expect(document.querySelector('[data-overlay="sheet"]')).not.toBeNull();
    expect(document.querySelector('[data-overlay="dialog"]')).toBeNull();
    expect(screen.getAllByText('Ajustes del círculo')).toHaveLength(1);
    expect(screen.getAllByText('Contenido único')).toHaveLength(1);
  });

  it('no tiene violaciones de axe en móvil', async () => {
    installMatchMedia(false);

    render(
      <ResponsiveDialog open onClose={() => {}} title="Ajustes del círculo">
        <p>Contenido único</p>
      </ResponsiveDialog>,
    );

    await expectNoAxeViolations(document.body);
  });
});

function NestedOverlayHarness({
  initialInner = true,
  onOuterClose = () => {},
}: {
  readonly initialInner?: boolean;
  readonly onOuterClose?: () => void;
}) {
  const [outerOpen, setOuterOpen] = useState(true);
  const [innerOpen, setInnerOpen] = useState(initialInner);

  return (
    <Dialog
      open={outerOpen}
      onClose={() => {
        onOuterClose();
        setOuterOpen(false);
      }}
      title="Exterior"
      footer={
        <button type="button" onClick={() => setInnerOpen(true)}>
          Abrir interior
        </button>
      }
    >
      <p>Contenido exterior</p>
      <Dialog open={innerOpen} onClose={() => setInnerOpen(false)} title="Interior">
        <p>Contenido interior</p>
      </Dialog>
    </Dialog>
  );
}

function SequentialOverlayHarness() {
  const [outerOpen, setOuterOpen] = useState(true);
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <>
      <Dialog
        open={outerOpen}
        onClose={() => setOuterOpen(false)}
        title="Exterior"
        footer={
          <button type="button" onClick={() => setInnerOpen(true)}>
            Abrir interior
          </button>
        }
      >
        <p>Contenido exterior</p>
      </Dialog>
      <Dialog open={innerOpen} onClose={() => setInnerOpen(false)} title="Interior">
        <p>Contenido interior</p>
      </Dialog>
    </>
  );
}

function SiblingOverlayHarness() {
  const [outerOpen, setOuterOpen] = useState(true);
  const [innerOpen, setInnerOpen] = useState(true);

  return (
    <>
      <button type="button" data-testid="close-outer" onClick={() => setOuterOpen(false)}>
        Cerrar exterior
      </button>
      <Dialog open={outerOpen} onClose={() => setOuterOpen(false)} title="Exterior">
        <p>Contenido exterior</p>
      </Dialog>
      <Dialog open={innerOpen} onClose={() => setInnerOpen(false)} title="Interior">
        <p>Contenido interior</p>
      </Dialog>
    </>
  );
}

function SheetWithDialogHarness() {
  const [dialogOpen, setDialogOpen] = useState(true);

  return (
    <BottomSheet open onClose={() => {}} title="Exterior">
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Interior">
        <p>Contenido del diálogo</p>
      </Dialog>
    </BottomSheet>
  );
}

function DialogWithSheetHarness() {
  const [sheetOpen, setSheetOpen] = useState(true);

  return (
    <Dialog open onClose={() => {}} title="Exterior">
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Interior">
        <p>Contenido de la hoja</p>
      </BottomSheet>
    </Dialog>
  );
}

describe('apilado visual por turno de apertura', () => {
  it('pone la hoja por encima del diálogo que la abre', () => {
    render(<DialogWithSheetHarness />);

    const dialogRoot = overlayRootByTitle('Exterior');
    const sheetRoot = overlayRootByTitle('Interior');

    expect(Number(sheetRoot.style.zIndex)).toBeGreaterThan(Number(dialogRoot.style.zIndex));
    expect(sheetRoot.hasAttribute('inert')).toBe(false);
    expect(dialogRoot.hasAttribute('inert')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(overlayRootByTitle('Interior').getAttribute('data-state')).toBe('closing');
    expect(overlayRootByTitle('Exterior')).toBeTruthy();
  });

  it('pone el diálogo por encima de la hoja que lo abre', () => {
    render(<SheetWithDialogHarness />);

    const sheetRoot = overlayRootByTitle('Exterior');
    const dialogRoot = overlayRootByTitle('Interior');

    expect(Number(dialogRoot.style.zIndex)).toBeGreaterThan(Number(sheetRoot.style.zIndex));
    expect(dialogRoot.hasAttribute('inert')).toBe(false);
    expect(sheetRoot.hasAttribute('inert')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(overlayRootByTitle('Interior').getAttribute('data-state')).toBe('closing');
    expect(overlayRootByTitle('Exterior')).toBeTruthy();
  });
});
describe('overlays anidados', () => {
  it('ordena dos overlays montados juntos: el interno es operable y Esc lo cierra', () => {
    const onOuterClose = vi.fn();
    render(<NestedOverlayHarness onOuterClose={onOuterClose} />);

    const outerRoot = overlayRootByTitle('Exterior');
    const innerRoot = overlayRootByTitle('Interior');

    expect(innerRoot.hasAttribute('inert')).toBe(false);
    expect(outerRoot.hasAttribute('inert')).toBe(true);
    expect(innerRoot.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOuterClose).not.toHaveBeenCalled();
    expect(overlayRootByTitle('Interior').getAttribute('data-state')).toBe('closing');
    expect(overlayRootByTitle('Exterior').hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('en commits separados Esc cierra B, A vuelve a ser operable y el scroll espera a A', () => {
    render(<SequentialOverlayHarness />);

    const openInner = screen.getByRole('button', { name: 'Abrir interior' });
    openInner.focus();
    fireEvent.click(openInner);

    const outerRoot = overlayRootByTitle('Exterior');
    const innerRoot = overlayRootByTitle('Interior');

    expect(innerRoot.hasAttribute('inert')).toBe(false);
    expect(outerRoot.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(overlayRootByTitle('Exterior').hasAttribute('inert')).toBe(false);
    expect(overlayRootByTitle('Interior').getAttribute('data-state')).toBe('closing');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(openInner);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.body.style.overflow).toBe('');
  });

  it('cerrar el externo con el interno abierto mantiene el scroll bloqueado', () => {
    render(<SiblingOverlayHarness />);

    expect(overlayRootByTitle('Interior').hasAttribute('inert')).toBe(false);
    expect(overlayRootByTitle('Exterior').hasAttribute('inert')).toBe(true);

    fireEvent.click(screen.getByTestId('close-outer'));

    expect(overlayRootByTitle('Exterior').getAttribute('data-state')).toBe('closing');
    expect(overlayRootByTitle('Interior').hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.body.style.overflow).toBe('');
  });
});
