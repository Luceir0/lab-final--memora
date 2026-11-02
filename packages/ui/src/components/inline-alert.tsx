import type { ReactNode } from 'react';

import { FeedbackIcon, toneSurfaceClasses, type FeedbackTone } from './feedback-tone';
import { useEnterExitPresence } from './overlay-utils';
import { cn } from './utils';

export type InlineAlertTone = FeedbackTone;

export interface InlineAlertProps {
  readonly tone?: InlineAlertTone | undefined;
  readonly title: string;
  readonly description?: ReactNode | undefined;
  readonly action?: ReactNode | undefined;
  /**
   * Controla entrada y salida. Por defecto `true`. Para animar la salida, el
   * consumidor debe mantener el mensaje montado y pasar `open={false}`.
   */
  readonly open?: boolean | undefined;
  readonly className?: string | undefined;
}

/**
 * Mensaje de estado en el flujo del documento.
 *
 * `role="alert"` solo en peligro; el resto usa `status`. `data-state` expone
 * `enter`, `open` o `exit` con transición corta y movimiento reducido. El
 * icono y el texto acompañan siempre al color.
 */
export function InlineAlert({
  tone = 'neutral',
  title,
  description,
  action,
  open = true,
  className,
}: InlineAlertProps) {
  const { mounted, state } = useEnterExitPresence(open);

  if (!mounted) {
    return null;
  }

  return (
    <div
      data-tone={tone}
      data-state={state}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        'transition-[opacity,transform] duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
        state === 'open' ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        toneSurfaceClasses[tone],
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
    </div>
  );
}
