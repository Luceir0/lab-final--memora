import { cn } from './utils';

export type ProgressBarTone = 'primary' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps {
  /** Nombre accesible: qué se está completando. */
  readonly label: string;
  /** 0–100. Si se omite, la barra es indeterminada. */
  readonly value?: number;
  readonly size?: 6 | 8 | undefined;
  readonly tone?: ProgressBarTone | undefined;
  readonly className?: string;
}

const toneClasses: Record<ProgressBarTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const sizeClasses: Record<6 | 8, string> = {
  6: 'h-1.5',
  8: 'h-2',
};

/**
 * Barra de progreso.
 *
 * - Determinada: `role="progressbar"` con `aria-valuemin/max/now` y el nombre
 *   accesible en `aria-label`.
 * - Indeterminada: sin `aria-valuenow`; el estado «en curso» va en el propio
 *   `aria-label` porque Chromium no expone `aria-valuetext` de forma fiable.
 * - Con `prefers-reduced-motion` el relleno pasa a una capa tenue de ancho
 *   completo: se lee como estado de carga, no como un 40 % real.
 */
export function ProgressBar({
  label,
  value,
  size = 6,
  tone = 'primary',
  className,
}: ProgressBarProps) {
  const determined = typeof value === 'number';
  const percent = determined ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={determined ? label : `${label}, en curso`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determined ? percent : undefined}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-2',
        sizeClasses[size],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'h-full rounded-full transition-[width] duration-(--memora-duration-base) ease-standard',
          toneClasses[tone],
          determined
            ? undefined
            : 'w-2/5 animate-pulse motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-30',
        )}
        style={determined ? { width: `${percent}%` } : undefined}
      />
    </div>
  );
}
