import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from './utils';

export type FeedbackTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneIcons: Record<FeedbackTone, ReactNode> = {
  neutral: <Bell />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  danger: <CircleAlert />,
  info: <Info />,
};

/** Fondo y texto de estado; `*-text` garantiza AA sobre su `*-soft`. */
export const toneSurfaceClasses: Record<FeedbackTone, string> = {
  neutral: 'border-border bg-surface-2 text-text',
  success: 'border-border bg-success-soft text-success-text',
  warning: 'border-border bg-warning-soft text-warning-text',
  danger: 'border-border bg-danger-soft text-danger-text',
  info: 'border-border bg-info-soft text-info-text',
};

/** Icono decorativo del tono: el color nunca es la única señal. */
export function FeedbackIcon({
  tone,
  className,
}: {
  readonly tone: FeedbackTone;
  readonly className?: string | undefined;
}) {
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 [&>svg]:size-5', className)}>
      {toneIcons[tone]}
    </span>
  );
}
