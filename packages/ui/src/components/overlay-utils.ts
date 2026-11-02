import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';

/**
 * Duración de la animación de salida. Es el valor de
 * `--memora-duration-fast` (150 ms); el timer solo decide cuándo se desmonta
 * el portal, la animación real la pinta CSS con el token.
 */
export const OVERLAY_EXIT_MS = 150;

/** Umbral de arrastre para cerrar una hoja. Es un gesto, no una medida de diseño. */
export const SHEET_DRAG_CLOSE_THRESHOLD = 96;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

/** Elementos interactivos visibles y alcanzables con Tab dentro de un contenedor. */
export function getFocusableElements(container: HTMLElement): readonly HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex >= 0 &&
      !element.closest('[hidden], [inert]'),
  );
}

/**
 * Mantiene el foco dentro del diálogo y devuelve `Tab`/`Shift+Tab` al extremo
 * opuesto. El navegador sigue encargándose del resto de la navegación; aquí
 * solo se corrige el salto fuera del overlay.
 */
export function trapTabKey(
  event: ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
): void {
  if (event.key !== 'Tab' || !container) {
    return;
  }

  const focusables = getFocusableElements(container);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (!first || !last) {
    event.preventDefault();
    container.focus();
    return;
  }

  const active = document.activeElement;
  const outside = !(active instanceof Node) || !container.contains(active);

  if (event.shiftKey) {
    if (active === first || active === container || outside) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || active === container || outside) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Mantiene el overlay montado durante la animación de salida. El foco se
 * libera en cuanto `open` pasa a `false`; el portal se desmonta al terminar.
 *
 * Al abrir, el montaje es síncrono con el primer render (`open || visible`)
 * para que el efecto de foco encuentre el panel en el DOM.
 */
export function useOverlayPresence(
  open: boolean,
  exitMs: number = OVERLAY_EXIT_MS,
): { readonly mounted: boolean; readonly closing: boolean } {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }

    if (!visible) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(false), exitMs);

    return () => window.clearTimeout(timer);
  }, [open, visible, exitMs]);

  return {
    mounted: open || visible,
    closing: !open && visible,
  };
}

export type EnterExitState = 'enter' | 'open' | 'exit';

/**
 * Presencia de entrada/salida para piezas de feedback, sin efectos modales.
 * La salida mantiene el nodo montado durante `OVERLAY_EXIT_MS`; después
 * devuelve `mounted: false`.
 */
export function useEnterExitPresence(open: boolean): {
  readonly mounted: boolean;
  readonly state: EnterExitState;
} {
  const { mounted, closing } = useOverlayPresence(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(open);
  }, [open]);

  if (!mounted) {
    return { mounted: false, state: 'exit' };
  }

  return {
    mounted: true,
    state: closing ? 'exit' : entered ? 'open' : 'enter',
  };
}

/**
 * Contador monótono de apertura. Se asigna en render (padre antes que hijo),
 * no en el efecto: así dos overlays anidados montados en el mismo commit
 * quedan ordenados con el interno por encima.
 */
let nextOverlaySequence = 0;

export function useOverlaySequence(open: boolean): number | null {
  const sequence = useRef<number | null>(null);

  if (open && sequence.current === null) {
    nextOverlaySequence += 1;
    sequence.current = nextOverlaySequence;
  } else if (!open && sequence.current !== null) {
    sequence.current = null;
  }

  return sequence.current;
}

interface OverlayLayer {
  readonly sequence: number;
  readonly root: HTMLElement;
}

const overlayLayers: OverlayLayer[] = [];
const NON_VISUAL_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META']);

let backgroundSnapshot: Map<HTMLElement, boolean> | null = null;
let savedOverflow: string | null = null;

function topOverlaySequence(): number | null {
  return overlayLayers[overlayLayers.length - 1]?.sequence ?? null;
}

function readZToken(name: string, fallback: number): number {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback;
  }

  const value = Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(name),
    10,
  );

  return Number.isFinite(value) ? value : fallback;
}

/**
 * El z-index sale del turno de apertura, no del tipo de overlay: una hoja
 * abierta desde un diálogo debe pintarse por encima de su scrim. Se mantiene
 * por debajo de la capa de toasts, que sigue siendo la superior.
 */
function applyLayerZIndex(): void {
  const base = readZToken('--memora-z-sheet', 60);
  const ceiling = readZToken('--memora-z-toast', 80);

  overlayLayers.forEach((layer, index) => {
    layer.root.style.zIndex = String(Math.min(base + index * 2, ceiling - 1));
  });
}

/**
 * Todo hijo de `body` queda inerte salvo el root de la capa superior. Se
 * recalcula en cada cambio de pila para que cerrar una capa devuelva el foco
 * y la interacción a la anterior. Al vaciarse la pila se restaura el estado
 * inicial de `inert` y del scroll.
 */
function applyOverlayLayering(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const body = document.body;
  const top = overlayLayers[overlayLayers.length - 1];

  if (!top) {
    restoreOverlayBackground();
    return;
  }

  if (!backgroundSnapshot) {
    backgroundSnapshot = new Map();
    savedOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
  }

  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement) || NON_VISUAL_TAGS.has(child.tagName)) {
      continue;
    }

    if (!backgroundSnapshot.has(child)) {
      backgroundSnapshot.set(child, child.hasAttribute('inert'));
    }

    if (child === top.root) {
      child.removeAttribute('inert');
    } else {
      child.setAttribute('inert', '');
    }
  }

  applyLayerZIndex();
}

function restoreOverlayBackground(): void {
  if (typeof document === 'undefined' || !backgroundSnapshot) {
    return;
  }

  for (const [element, hadInert] of backgroundSnapshot) {
    if (hadInert) {
      element.setAttribute('inert', '');
    } else {
      element.removeAttribute('inert');
    }
  }

  backgroundSnapshot = null;

  if (savedOverflow !== null) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = null;
  }
}

function registerOverlay(sequence: number, root: HTMLElement): void {
  if (overlayLayers.some((layer) => layer.sequence === sequence)) {
    return;
  }

  overlayLayers.push({ sequence, root });
  overlayLayers.sort((a, b) => a.sequence - b.sequence);
  applyOverlayLayering();
}

function unregisterOverlay(sequence: number): void {
  const index = overlayLayers.findIndex((layer) => layer.sequence === sequence);

  if (index !== -1) {
    const [removed] = overlayLayers.splice(index, 1);
    removed?.root.style.removeProperty('z-index');
  }

  applyOverlayLayering();
}

export interface OverlayModalOptions {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly panelRef: RefObject<HTMLElement | null>;
  readonly initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  readonly dismissible?: boolean | undefined;
}

/**
 * Comportamiento común de Dialog y BottomSheet mientras están abiertos:
 *
 * - foco inicial solo si la capa es la superior, y retorno al disparador;
 * - `Esc` solo en el overlay superior de la pila;
 * - trampa de `Tab` mediante el handler devuelto;
 * - fondo inerte y scroll del documento bloqueado por la pila compartida.
 *
 * Se ejecuta con `open` y se limpia al cerrar, de modo que el foco vuelve al
 * disparador aunque el panel siga montado durante la animación de salida.
 */
export function useOverlayModal({
  open,
  onClose,
  panelRef,
  initialFocusRef,
  dismissible = true,
}: OverlayModalOptions): {
  readonly onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
} {
  const sequence = useOverlaySequence(open);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open || sequence === null || typeof document === 'undefined') {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const root = panel.closest<HTMLElement>('[data-memora-overlay-root]');

    if (!root) {
      return;
    }

    const currentTop = topOverlaySequence();
    const becomesTop = currentTop === null || sequence > currentTop;
    const previouslyFocused =
      becomesTop && document.activeElement instanceof HTMLElement ? document.activeElement : null;

    registerOverlay(sequence, root);

    if (topOverlaySequence() === sequence) {
      const target = initialFocusRef?.current ?? getFocusableElements(panel)[0] ?? panel;
      target.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key !== 'Escape' || !dismissibleRef.current) {
        return;
      }

      if (topOverlaySequence() !== sequence) {
        return;
      }

      event.preventDefault();
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      const hadLayerAbove = overlayLayers.some((layer) => layer.sequence > sequence);
      unregisterOverlay(sequence);

      if (hadLayerAbove) {
        return;
      }

      const active = document.activeElement;
      const shouldRestore = !active || active === document.body || panel.contains(active);

      if (shouldRestore && previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
        return;
      }

      const nextTop = overlayLayers[overlayLayers.length - 1];
      nextTop?.root.querySelector<HTMLElement>('[data-overlay]')?.focus();
    };
  }, [open, sequence, panelRef, initialFocusRef]);

  return {
    onKeyDown: useCallback(
      (event: ReactKeyboardEvent<HTMLElement>) => trapTabKey(event, panelRef.current),
      [panelRef],
    ),
  };
}

function matchesQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(query).matches;
}

/**
 * Media query reactiva con snapshot de servidor `false`: el SSR y la primera
 * hidratación asumen móvil y el cambio a escritorio ocurre en cliente.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }

      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);

      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => matchesQuery(query),
    () => false,
  );
}
