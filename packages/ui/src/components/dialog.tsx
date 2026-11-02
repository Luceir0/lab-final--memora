import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import {
  OverlayBackdrop,
  OverlayHeader,
  overlayFooterClasses,
  type OverlayFooterLayout,
} from './overlay-parts';
import { useOverlayModal, useOverlayPresence } from './overlay-utils';
import { cn } from './utils';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Nombre accesible del diálogo (`aria-labelledby`). */
  readonly title: string;
  /** Texto de apoyo enlazado con `aria-describedby`. */
  readonly description?: string | undefined;
  readonly size?: DialogSize | undefined;
  /** Añade el icono de aviso y el tono de peligro a la cabecera. */
  readonly danger?: boolean | undefined;
  /**
   * Permite cerrar con `Esc`, con el fondo y con el botón de cerrar.
   * Por defecto `true`. Con `false` el consumidor debe ofrecer una acción
   * explícita en `footer` para no dejar el diálogo sin salida.
   */
  readonly dismissible?: boolean | undefined;
  readonly children?: ReactNode | undefined;
  /** Acciones al pie. Se apilan en móvil y se alinean a la derecha en escritorio. */
  readonly footer?: ReactNode | undefined;
  /** Disposición del pie: fila, columna o la responsive por defecto. */
  readonly footerLayout?: OverlayFooterLayout | undefined;
  /** Foco inicial. Por defecto, el primer elemento interactivo del panel. */
  readonly initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  readonly className?: string | undefined;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Diálogo modal propio, sin `<dialog>` nativo (jsdom 30 no implementa
 * `showModal`/`close`).
 *
 * - `role="dialog"` + `aria-modal`; nombre por el título y descripción por
 *   `aria-describedby`.
 * - Foco inicial, trampa de `Tab`, `Esc` y retorno al disparador.
 * - El fondo es inerte y el scroll del documento se bloquea mientras está
 *   abierto.
 * - `dismissible={false}` desactiva `Esc`, el fondo y el botón de cerrar.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  danger = false,
  dismissible = true,
  children,
  footer,
  footerLayout = 'responsive',
  initialFocusRef,
  className,
}: DialogProps) {
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

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      data-memora-overlay-root=""
      data-state={closing ? 'closing' : 'open'}
      inert={closing || undefined}
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
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
        data-overlay="dialog"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8',
          "[[data-theme='dark']_&]:border-border-strong",
          'transition-[opacity,transform] duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
          closing ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
          sizeClasses[size],
          className,
        )}
      >
        <OverlayHeader
          titleId={titleId}
          descriptionId={descriptionId}
          title={title}
          description={description}
          danger={danger}
          dismissible={dismissible}
          onClose={onClose}
        />
        {children && <div className="mt-4 text-body text-text">{children}</div>}
        {footer && <div className={cn('mt-6', overlayFooterClasses(footerLayout))}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
