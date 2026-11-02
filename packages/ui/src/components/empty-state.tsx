import { useId, type ReactNode } from 'react';

import { cn } from './utils';

export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type EmptyStateIconShape = 'circle' | 'square';

export interface EmptyStateProps {
  /** Icono decorativo; nunca sustituye al título. */
  readonly icon?: ReactNode | undefined;
  readonly title: string;
  readonly description?: ReactNode | undefined;
  readonly action?: ReactNode | undefined;
  /** Nivel del encabezado. Por defecto `h2`. */
  readonly headingLevel?: EmptyStateHeadingLevel | undefined;
  /** Forma del contenedor de 56 px del icono. */
  readonly iconShape?: EmptyStateIconShape | undefined;
  readonly className?: string | undefined;
}

/**
 * Estado vacío. El título es un encabezado real con nivel configurable y el
 * icono queda fuera del árbol de accesibilidad.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
  iconShape = 'circle',
  className,
}: EmptyStateProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <section
      aria-labelledby={titleId}
      className={cn('flex flex-col items-center text-center', className)}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            'mb-4 inline-flex size-14 items-center justify-center bg-primary-soft text-on-primary-soft [&>svg]:size-6',
            iconShape === 'square' ? 'rounded-lg' : 'rounded-full',
          )}
        >
          {icon}
        </span>
      )}
      <Heading id={titleId} className="text-h3 font-bold text-text">
        {title}
      </Heading>
      {description && <div className="mt-2 max-w-prose text-body text-muted">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
