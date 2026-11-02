import { Loader2 } from 'lucide-react';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from 'react';

import { cn } from './utils';

export type IconButtonVariant = 'solid' | 'outline' | 'ghost' | 'danger' | 'onMedia';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Nombre accesible obligatorio: el botón solo contiene un icono. */
  readonly label: string;
  readonly icon: ReactNode;
  readonly variant?: IconButtonVariant;
  /** Muestra un spinner, marca `aria-busy` y bloquea la acción sin deshabilitar. */
  readonly loading?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  solid: 'bg-primary text-on-primary',
  outline: 'border border-border-strong bg-surface text-text',
  ghost: 'bg-transparent text-text',
  // Acción destructiva: misma piel suave que Button.
  danger: 'border border-danger bg-danger-soft text-danger-text',
  // Sobre una foto: fondo del visor translúcido y texto blanco en ambos temas.
  onMedia: 'bg-viewer-bg/70 text-on-primary backdrop-blur-sm',
};

const variantInteractiveClasses: Record<IconButtonVariant, string> = {
  solid: 'not-disabled:hover:bg-primary-hover not-disabled:active:bg-primary-active',
  outline: 'not-disabled:hover:bg-surface-2 not-disabled:active:bg-surface-active',
  ghost: 'not-disabled:hover:bg-surface-2 not-disabled:active:bg-surface-active',
  danger: 'not-disabled:hover:bg-danger-soft-hover not-disabled:active:bg-danger-soft-active',
  onMedia: 'not-disabled:hover:bg-viewer-bg/85 not-disabled:active:bg-viewer-bg',
};

/**
 * Botón cuadrado de un solo icono. Siempre 44 × 44 px (`h-11 w-11`), el
 * mínimo de área táctil del contrato, y con `aria-label` obligatorio.
 *
 * Como `Button`, `loading` no usa `disabled`: conserva foco y tabulación con
 * `aria-disabled` y una guarda en `onClick`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = 'ghost',
    loading = false,
    className,
    type = 'button',
    disabled,
    onClick,
    ...rest
  },
  ref,
) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (loading) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      aria-busy={loading ? true : undefined}
      aria-disabled={loading ? true : undefined}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-md',
        'transition-[background-color,border-color,color] duration-(--memora-duration-fast) ease-standard',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-muted disabled:opacity-100 [&>svg]:size-5',
        variantClasses[variant],
        loading ? 'cursor-progress' : variantInteractiveClasses[variant],
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex">
        {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
      </span>
    </button>
  );
});
