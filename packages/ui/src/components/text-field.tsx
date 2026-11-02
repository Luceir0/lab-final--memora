import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { controlBorderClasses, FieldLabel, FieldMessages } from './field';
import { cn } from './utils';

export type TextFieldType = 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly type?: TextFieldType;
  readonly leadingIcon?: ReactNode;
  /**
   * Acción al final del control. La usa `SearchField` para el botón de limpiar;
   * no es un icono decorativo.
   */
  readonly trailingAction?: ReactNode;
  /** Oculta el label visualmente, sin quitarlo del árbol de accesibilidad. */
  readonly hideLabel?: boolean;
  readonly containerClassName?: string;
}

/**
 * Campo de texto de una línea.
 *
 * - `label` siempre asociada con `htmlFor`/`id`.
 * - `hint` y `error` se enlazan con `aria-describedby`; el error añade
 *   `aria-invalid`.
 * - `forwardRef` al `<input>` real para foco y validación del consumidor.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    type = 'text',
    leadingIcon,
    trailingAction,
    hideLabel = false,
    containerClassName,
    className,
    id,
    'aria-describedby': describedByProp,
    'aria-invalid': ariaInvalidProp,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      <FieldLabel htmlFor={inputId} hide={hideLabel}>
        {label}
      </FieldLabel>
      <div className="relative">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:size-4"
          >
            {leadingIcon}
          </span>
        )}
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type={type}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalidProp}
          className={cn(
            'h-11 w-full rounded-md border bg-surface text-body text-text',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted',
            '[-webkit-search-cancel-button]:appearance-none',
            leadingIcon ? 'pl-10' : 'pl-3',
            trailingAction ? 'pr-12' : 'pr-3',
            controlBorderClasses(Boolean(error)),
            className,
          )}
        />
        {trailingAction && (
          <div className="absolute inset-y-0 right-0 flex items-center">{trailingAction}</div>
        )}
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
