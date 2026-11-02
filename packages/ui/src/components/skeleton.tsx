import { cn } from './utils';

export type SkeletonShape = 'rect' | 'circle' | 'text';
export type SkeletonSize = 'sm' | 'md' | 'lg';

export interface SkeletonProps {
  readonly shape?: SkeletonShape;
  readonly size?: SkeletonSize;
  /** Animación de pulso. Con `prefers-reduced-motion` se anula desde `theme.css`. */
  readonly animated?: boolean;
  readonly className?: string;
}

const shapeClasses: Record<SkeletonShape, string> = {
  rect: 'rounded-md w-full',
  circle: 'rounded-full aspect-square',
  text: 'rounded-sm w-full',
};

const sizeClasses: Record<SkeletonShape, Record<SkeletonSize, string>> = {
  rect: { sm: 'h-8', md: 'h-16', lg: 'h-24' },
  circle: { sm: 'size-8', md: 'size-10', lg: 'size-16' },
  text: { sm: 'h-3', md: 'h-4', lg: 'h-6' },
};

/**
 * Marcador de contenido. Es 100 % decorativo: `aria-hidden` y sin rol, para
 * que el lector no anuncie bloques vacíos. El estado de carga se comunica
 * con `Spinner` o con `aria-busy` en el contenedor real.
 */
export function Skeleton({
  shape = 'rect',
  size = 'md',
  animated = true,
  className,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-surface-2',
        shapeClasses[shape],
        sizeClasses[shape][size],
        animated && 'animate-pulse',
        className,
      )}
    />
  );
}
