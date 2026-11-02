import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from './utils';

/** Margen mínimo entre el globo y los bordes del viewport. */
const TOOLTIP_VIEWPORT_MARGIN = 8;

/**
 * Desplazamiento horizontal necesario para que el globo quede dentro del
 * viewport con al menos `margin` px a cada lado. Positivo mueve a la derecha.
 */
export function tooltipShiftFor(
  left: number,
  right: number,
  viewportWidth: number,
  margin: number = TOOLTIP_VIEWPORT_MARGIN,
): number {
  if (left < margin) {
    return margin - left;
  }

  if (right > viewportWidth - margin) {
    return viewportWidth - margin - right;
  }

  return 0;
}

interface TooltipTriggerProps {
  'aria-describedby'?: string | undefined;
}

export interface TooltipProps {
  readonly content: ReactNode;
  /** Elemento interactivo que recibe el foco y el `aria-describedby`. */
  readonly children: ReactElement<TooltipTriggerProps>;
  readonly className?: string | undefined;
}

/**
 * Descripción contextual para escritorio.
 *
 * Aparece con foco y con hover, se oculta con `Esc` y enlaza su contenido al
 * disparador con `aria-describedby`. En táctil el globo no se muestra: la
 * comprobación `@media (hover: hover)` es CSS y el contenido nunca es la única
 * fuente de información.
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [shift, setShift] = useState(0);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const child = Children.only(children) as ReactElement<TooltipTriggerProps>;
  const visible = hovered || focused;

  useEffect(() => {
    if (!visible) {
      setShift(0);
      return;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const tooltip = tooltipRef.current;

    if (!tooltip) {
      return;
    }

    const rect = tooltip.getBoundingClientRect();
    setShift(tooltipShiftFor(rect.left, rect.right, window.innerWidth));
  }, [visible, content]);

  const isOutside = (currentTarget: HTMLElement, relatedTarget: EventTarget | null) =>
    !(relatedTarget instanceof Node) || !currentTarget.contains(relatedTarget);

  const handleFocus = () => setFocused(true);

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setFocused(false);
    }
  };

  const handleMouseOver = (event: MouseEvent<HTMLSpanElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setHovered(true);
    }
  };

  const handleMouseOut = (event: MouseEvent<HTMLSpanElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setHovered(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape' && visible) {
      event.stopPropagation();
      setHovered(false);
      setFocused(false);
    }
  };

  const existingDescription = child.props['aria-describedby'];
  const describedBy = visible
    ? [existingDescription, tooltipId].filter(Boolean).join(' ')
    : existingDescription;

  return (
    <span
      className={cn('relative inline-flex', className)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onKeyDown={handleKeyDown}
    >
      {cloneElement(child, { 'aria-describedby': describedBy })}
      {visible && (
        <span
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{ left: `calc(50% + ${shift}px)` }}
          className={cn(
            'absolute bottom-full left-1/2 z-nav mb-2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md bg-inverse px-2.5 py-1.5 text-caption font-medium text-on-inverse shadow-lg',
            'hidden [@media(hover:hover)]:block',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
