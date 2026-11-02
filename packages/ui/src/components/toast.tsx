import { X } from 'lucide-react';
import {
  Children,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import { FeedbackIcon, type FeedbackTone } from './feedback-tone';
import { IconButton } from './icon-button';
import { useEnterExitPresence } from './overlay-utils';
import { cn } from './utils';

export type ToastTone = FeedbackTone;

export interface ToastProps {
  readonly tone?: ToastTone | undefined;
  readonly title: string;
  readonly description?: ReactNode | undefined;
  /** Acción recomendada: `Button variant="secondary" size="sm"` sobre el fondo inverso. */
  readonly action?: ReactNode | undefined;
  readonly onClose: () => void;
  readonly closeLabel?: string | undefined;
  /** Milisegundos antes del cierre automático. Sin valor no hay temporizador. */
  readonly duration?: number | undefined;
  /**
   * Controla entrada y salida. Por defecto `true`. Para animar la salida, el
   * consumidor debe mantener el toast montado y pasar `open={false}`; el
   * componente se desmonta solo al terminar la transición de 150 ms.
   */
  readonly open?: boolean | undefined;
  readonly className?: string | undefined;
}

/**
 * Aviso flotante no modal.
 *
 * - `role="status"` para informativos y `role="alert"` cuando el tono es
 *   `danger` (AC-06).
 * - Cierre manual siempre visible; el temporizador es opcional y se pausa al
 *   pasar el ratón o al enfocar cualquier control del aviso.
 * - `data-state` expone `enter`, `open` o `exit`; la transición usa el token
 *   rápido y se anula con movimiento reducido.
 * - Nunca mueve el foco al aparecer.
 * - El tono cambia icono y rol, no solo color.
 */
export function Toast({
  tone = 'neutral',
  title,
  description,
  action,
  onClose,
  closeLabel = 'Cerrar',
  duration,
  open = true,
  className,
}: ToastProps) {
  const { mounted, state } = useEnterExitPresence(open);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const remaining = useRef(duration ?? 0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    remaining.current = duration ?? 0;
  }, [duration]);

  useEffect(() => {
    if (!duration || duration <= 0 || paused || !open) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setTimeout(() => onCloseRef.current(), remaining.current);

    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [duration, open, paused]);

  if (!mounted) {
    return null;
  }

  const isOutside = (currentTarget: HTMLElement, relatedTarget: EventTarget | null) =>
    !(relatedTarget instanceof Node) || !currentTarget.contains(relatedTarget);

  const handleMouseOver = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setHovered(true);
    }
  };

  const handleMouseOut = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setHovered(false);
    }
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (isOutside(event.currentTarget, event.relatedTarget)) {
      setFocused(false);
    }
  };

  return (
    <div
      data-tone={tone}
      data-state={state}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-inverse p-4 text-on-inverse shadow-lg',
        'transition-[opacity,transform] duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
        '[&_button:focus-visible]:outline-on-inverse! [&_a:focus-visible]:outline-on-inverse!',
        state === 'open' ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        state === 'exit' && 'pointer-events-none',
        className,
      )}
    >
      <FeedbackIcon tone={tone} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div role={tone === 'danger' ? 'alert' : 'status'} aria-atomic="true">
          <p className="text-body-sm font-semibold">{title}</p>
          {description && <div className="mt-1 text-body-sm">{description}</div>}
        </div>
        {action && <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      <IconButton
        label={closeLabel}
        icon={<X />}
        variant="outline"
        onClick={onClose}
        className="relative size-9! shrink-0 after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] focus-visible:outline-on-inverse!"
      />
    </div>
  );
}

export interface ToastViewportProps {
  /** Avisos informativos. */
  readonly children?: ReactNode | undefined;
  /** Avisos urgentes, agrupados visualmente. */
  readonly assertive?: ReactNode | undefined;
  readonly className?: string | undefined;
}

/**
 * Contenedor fijo de avisos. Es solo estructura visual y de posicionamiento:
 * no declara regiones vivas propias, porque el `role="status"`/`alert` de cada
 * Toast ya anuncia el contenido y duplicaría el anuncio. Nunca mueve el foco.
 *
 * Mientras hay avisos montados ajusta `scroll-padding-bottom` del documento a
 * la altura real de la pila (más un margen) para que 2.4.11 no tape el
 * elemento con foco. El límite de avisos simultáneos se decidirá en F26.
 */
export function ToastViewport({ children, assertive, className }: ToastViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemCount = Children.count(children) + Children.count(assertive);

  useEffect(() => {
    if (itemCount === 0 || typeof document === 'undefined') {
      return;
    }

    const update = () => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const top = viewport.getBoundingClientRect().top;
      document.documentElement.style.scrollPaddingBottom = `${Math.ceil(
        window.innerHeight - top + 16,
      )}px`;
    };

    const previousPadding = document.documentElement.style.scrollPaddingBottom;
    update();
    window.addEventListener('resize', update);

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => update());

    if (observer && viewportRef.current) {
      observer.observe(viewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
      document.documentElement.style.scrollPaddingBottom = previousPadding;
    };
  }, [itemCount]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        'pointer-events-none fixed left-4 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-toast mx-auto flex max-w-md flex-col gap-2 sm:bottom-6',
        className,
      )}
    >
      <div className="flex flex-col gap-2">{children}</div>
      <div className="flex flex-col gap-2">{assertive}</div>
    </div>
  );
}
