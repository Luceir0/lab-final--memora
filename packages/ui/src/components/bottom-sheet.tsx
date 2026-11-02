import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import {
  OverlayBackdrop,
  OverlayHeader,
  overlayFooterClasses,
  type OverlayFooterLayout,
} from './overlay-parts';
import { SHEET_DRAG_CLOSE_THRESHOLD, useOverlayModal, useOverlayPresence } from './overlay-utils';
import { cn } from './utils';

export interface BottomSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Nombre accesible de la hoja (`aria-labelledby`). */
  readonly title: string;
  readonly description?: string | undefined;
  readonly danger?: boolean | undefined;
  /** Permite cerrar con `Esc`, con el fondo, con el botón y arrastrando. */
  readonly dismissible?: boolean | undefined;
  readonly children?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  /** Disposición del pie: fila, columna o la responsive por defecto. */
  readonly footerLayout?: OverlayFooterLayout | undefined;
  readonly initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  /** Nombre accesible del cuerpo scrollable. Por defecto «Contenido». */
  readonly bodyLabel?: string | undefined;
  /**
   * Altura máxima de la hoja en porcentaje de viewport (`dvh`). Se recorta
   * entre 10 y 90. El gesto de arrastre solo cierra; no hay paradas
   * intermedias.
   */
  readonly maxHeightPercent?: number | undefined;
  readonly className?: string | undefined;
}

function clampMaxHeight(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 90;
  }

  return Math.min(90, Math.max(10, value));
}

/**
 * Hoja inferior para móvil.
 *
 * El cierre siempre tiene alternativas: botón «Cerrar» de 44 px, `Esc` y el
 * fondo. El arrastre con puntero es una mejora; el asa es decorativa
 * (`aria-hidden`) y no depende de ella ninguna acción.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  danger = false,
  dismissible = true,
  children,
  footer,
  footerLayout = 'responsive',
  initialFocusRef,
  bodyLabel = 'Contenido',
  maxHeightPercent,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;
  const { mounted, closing } = useOverlayPresence(open);
  const { onKeyDown } = useOverlayModal({
    open,
    onClose,
    panelRef,
    initialFocusRef,
    dismissible,
  });

  const maxHeight = clampMaxHeight(maxHeightPercent);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ pointerId: number; startY: number } | null>(null);
  const offsetRef = useRef(0);

  const finishDrag = useCallback(() => {
    const offset = offsetRef.current;
    dragOrigin.current = null;
    offsetRef.current = 0;
    setDragging(false);
    setDragOffset(0);

    if (offset >= SHEET_DRAG_CLOSE_THRESHOLD) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const origin = dragOrigin.current;

      if (!origin || event.pointerId !== origin.pointerId) {
        return;
      }

      const next = Math.max(0, event.clientY - origin.startY);
      offsetRef.current = next;
      setDragOffset(next);
    };

    const handleEnd = () => finishDrag();

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, [dragging, finishDrag]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dismissible || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    event.preventDefault();
    dragOrigin.current = { pointerId: event.pointerId, startY: event.clientY };
    offsetRef.current = 0;
    setDragging(true);
  };

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      data-memora-overlay-root=""
      data-state={closing ? 'closing' : 'open'}
      inert={closing || undefined}
      className={cn(
        'fixed inset-0 flex items-end justify-center',
        closing && 'pointer-events-none',
      )}
    >
      <OverlayBackdrop closing={closing} dismissible={dismissible} onClose={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        data-overlay="sheet"
        data-dragging={dragging ? 'true' : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={{
          maxHeight: `${maxHeight}dvh`,
          ...(dragging ? { transform: `translateY(${dragOffset}px)` } : {}),
        }}
        className={cn(
          'relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lg',
          "[[data-theme='dark']_&]:border-border-strong",
          dragging
            ? 'transition-none'
            : 'transition-[opacity,transform] duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
          closing ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
          className,
        )}
      >
        <div
          data-sheet-handle=""
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          className={cn(
            'flex h-6 w-full shrink-0 touch-none items-center justify-center',
            dismissible ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
          )}
        >
          {dismissible && <span className="h-1.5 w-10 rounded-full bg-border-strong" />}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0">
            <OverlayHeader
              titleId={titleId}
              descriptionId={descriptionId}
              title={title}
              description={description}
              danger={danger}
              dismissible={dismissible}
              onClose={onClose}
            />
          </div>
          {children && (
            <div
              role="region"
              aria-label={bodyLabel}
              tabIndex={0}
              className="mt-4 min-h-0 flex-1 overflow-y-auto text-body text-text"
            >
              {children}
            </div>
          )}
          {footer && (
            <div className={cn('shrink-0 pt-4', overlayFooterClasses(footerLayout))}>{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
