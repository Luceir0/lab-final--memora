import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

import { buttonStyles, type ButtonSize, type ButtonVariant } from './button';

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Destino real del enlace: obligatorio. */
  readonly href: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Icono decorativo a la izquierda del texto. */
  readonly icon?: ReactNode;
  readonly fullWidth?: boolean;
}

/**
 * Misma piel que `Button`, pero sobre un enlace real: navegación, no acción.
 * No admite `loading` ni `disabled` porque un `<a>` no los tiene.
 */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { variant = 'primary', size = 'md', icon, fullWidth = false, className, children, ...rest },
  ref,
) {
  return (
    <a {...rest} ref={ref} className={buttonStyles({ variant, size, fullWidth, className })}>
      {icon && (
        <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-[1.25em]">
          {icon}
        </span>
      )}
      {children}
    </a>
  );
});
