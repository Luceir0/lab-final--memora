import type { ReactNode } from 'react';

import { cn } from './utils';

export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps {
  readonly children: ReactNode;
  readonly padding?: CardPadding;
  /** Añade hover y sombra elevada. Solo tiene sentido con `href`. */
  readonly interactive?: boolean;
  /** Si se pasa, la tarjeta entera es un enlace real. */
  readonly href?: string;
  readonly className?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Superficie de contenido.
 *
 * Con `href` la tarjeta es un único `<a>`: no hay `div` con `onClick` ni
 * enlaces anidados. Sin `href` es un `<div>` presentacional y `interactive`
 * solo aporta estilos de hover.
 *
 * El contenido no debe incluir `<a>`, `<button>` ni otros controles
 * interactivos: con `href` quedarían anidados dentro del enlace de la tarjeta.
 */
export function Card({
  children,
  padding = 'md',
  interactive = false,
  href,
  className,
}: CardProps) {
  const classes = cn(
    'block rounded-xl border border-border bg-surface shadow-sm',
    'transition-shadow duration-(--memora-duration-fast) ease-standard',
    paddingClasses[padding],
    interactive && 'hover:border-border-strong hover:shadow-md',
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return <div className={classes}>{children}</div>;
}
