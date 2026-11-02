import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from './utils';

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Oculta contenido a la vista sin quitarlo del árbol de accesibilidad.
 * Se usa para labels de campos de búsqueda y textos solo para lectores.
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ className, ...rest }, ref) {
    return <span {...rest} ref={ref} className={cn('sr-only', className)} />;
  },
);
