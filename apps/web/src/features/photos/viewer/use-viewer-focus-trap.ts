import { useEffect, useRef, type RefObject } from 'react';

import { takeViewerOrigin } from './origin';

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

function getFocusableElements(container: HTMLElement): readonly HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex >= 0 &&
      !element.closest('[hidden], [inert]'),
  );
}

function focusOriginTile(): void {
  const origin = takeViewerOrigin();

  if (origin !== null) {
    const tile = document.querySelector<HTMLElement>(`[data-photo-tile=${JSON.stringify(origin)}]`);

    if (tile !== null) {
      tile.focus();
      return;
    }
  }

  document.querySelector<HTMLElement>('[data-photo-grid]')?.focus();
}

export interface ViewerFocusTrapOptions {
  readonly containerRef: RefObject<HTMLElement | null>;
  /** Foco inicial. Por defecto, el primer elemento interactivo del visor. */
  readonly initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  readonly onEscape: () => void;
  readonly onPrevious?: (() => void) | undefined;
  readonly onNext?: (() => void) | undefined;
}

/**
 * Comportamiento modal del visor, compartido por móvil y escritorio.
 *
 * - Foco inicial en el control de cierre.
 * - `Tab`/`Shift+Tab` quedan atrapados dentro del visor.
 * - `Esc` delega en el consumidor para que pueda limpiar la selección antes de
 *   cerrar.
 * - Flechas izquierda/derecha navegan; no se disparan si el evento ya lo ha
 *   consumido otro control.
 * - Al desmontar, el foco vuelve a la miniatura de origen o, si no existe, a
 *   la rejilla. Se espera un frame para que la ruta del álbum haya retirado
 *   `inert` del contenido de fondo.
 */
export function useViewerFocusTrap({
  containerRef,
  initialFocusRef,
  onEscape,
  onPrevious,
  onNext,
}: ViewerFocusTrapOptions): void {
  const handlersRef = useRef({ onEscape, onPrevious, onNext });

  handlersRef.current = { onEscape, onPrevious, onNext };

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null;
    const initial = initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;

    initial.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Tab') {
        const focusables = getFocusableElements(container);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (first === undefined || last === undefined) {
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
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        handlersRef.current.onEscape();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlersRef.current.onPrevious?.();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handlersRef.current.onNext?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      window.requestAnimationFrame(() => {
        if (previouslyFocused !== null && document.contains(previouslyFocused)) {
          previouslyFocused.focus();
          return;
        }

        focusOriginTile();
      });
    };
  }, [containerRef, initialFocusRef]);
}
