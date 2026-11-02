import { Loader2 } from 'lucide-react';

import { VisuallyHidden } from './visually-hidden';
import { cn } from './utils';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  /** Animación de giro. Con `false` queda estático (capturas, reduced motion manual). */
  readonly animated?: boolean;
  /** Texto solo para lectores. Por defecto, «Cargando». */
  readonly label?: string;
  readonly className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

/**
 * Indicador de carga. `role="status"` anuncia el texto oculto; el icono queda
 * decorativo. El contenedor que carga marca `aria-busy` por su cuenta.
 */
export function Spinner({
  size = 'md',
  animated = true,
  label = 'Cargando',
  className,
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('inline-flex items-center justify-center text-muted', className)}
    >
      <Loader2 aria-hidden="true" className={cn(sizeClasses[size], animated && 'animate-spin')} />
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
}
