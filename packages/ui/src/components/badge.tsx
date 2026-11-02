import type { ReactNode } from 'react';

import { cn } from './utils';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly children: ReactNode;
  readonly className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-soft text-on-primary-soft',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  neutral: 'bg-surface-2 text-muted',
};

/**
 * Etiqueta de estado. El texto es obligatorio: el color nunca es la única
 * fuente de información.
 */
export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
