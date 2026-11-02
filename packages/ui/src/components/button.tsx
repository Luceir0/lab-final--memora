import { Loader2 } from 'lucide-react';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from 'react';

import { cn } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Icono decorativo a la izquierda del texto. */
  readonly icon?: ReactNode;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary',
  secondary: 'border border-border-strong bg-surface text-text',
  ghost: 'bg-transparent text-primary-text',
  // `on-inverse` es blanco en claro (5,49:1 sobre danger) y casi negro en
  // oscuro (6,95:1 sobre danger claro); `on-primary` fallaría en oscuro.
  danger: 'bg-danger text-on-inverse',
  soft: 'bg-primary-soft text-on-primary-soft',
};

/**
 * Hover y active se omiten en `loading` para que el control no sugiera que se
 * puede pulsar. `not-disabled` evita que un botón deshabilitado cambie al pasar
 * el ratón y funciona igual sobre `<a>` (que no admite `:enabled`).
 */
const variantInteractiveClasses: Record<ButtonVariant, string> = {
  primary: 'not-disabled:hover:bg-primary-hover not-disabled:active:bg-primary-active',
  secondary: 'not-disabled:hover:bg-surface-2 not-disabled:active:bg-surface-active',
  ghost: 'not-disabled:hover:bg-surface-2 not-disabled:active:bg-surface-active',
  danger: 'not-disabled:hover:bg-danger-text not-disabled:active:bg-danger',
  soft: 'not-disabled:hover:bg-primary-soft-hover not-disabled:active:bg-primary-soft-active',
};

const sizeClasses: Record<ButtonSize, string> = {
  // 36 px visuales + un `::after` de 44 px centrado: el área táctil no depende
  // del borde ni del padding box (con borde, el patrón anterior daba 42 px).
  sm: 'relative h-9 gap-1.5 px-3 text-body-sm after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 after:content-[""]',
  md: 'h-11 gap-2 px-4 text-body-sm',
  lg: 'h-13 gap-2 px-6 text-body',
};

/** Clases compartidas con `LinkButton`, que es un `<a>` real. */
export function buttonStyles(options: {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly loading?: boolean;
  readonly className?: string | undefined;
}): string {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    className,
  } = options;

  return cn(
    'inline-flex select-none items-center justify-center rounded-md font-semibold',
    'transition-[background-color,border-color,color] duration-(--memora-duration-fast) ease-standard',
    'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-muted disabled:opacity-100',
    variantClasses[variant],
    loading ? 'cursor-progress' : variantInteractiveClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  );
}

/**
 * Botón de acción.
 *
 * - `<button>` real, nunca un `div` con `onClick`.
 * - `loading` usa `aria-disabled` y una guarda en `onClick`: el botón sigue en
 *   el orden de tabulación y conserva el foco. `disabled` queda para el estado
 *   deshabilitado real.
 * - El foco visible lo aporta la regla global de `theme.css`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    onClick,
    type = 'button',
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
      disabled={disabled}
      aria-disabled={loading ? true : undefined}
      aria-busy={loading ? true : undefined}
      onClick={handleClick}
      className={buttonStyles({ variant, size, fullWidth, loading, className })}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        icon && (
          <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-[1.25em]">
            {icon}
          </span>
        )
      )}
      {children}
    </button>
  );
});
