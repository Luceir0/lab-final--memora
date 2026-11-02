import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';

import { controlBorderClasses, FieldLabel, FieldMessages } from './field';
import { cn } from './utils';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly leadingIcon?: ReactNode;
  /** Oculta el label visualmente, sin quitarlo del árbol de accesibilidad. */
  readonly hideLabel?: boolean;
  readonly containerClassName?: string;
}

/**
 * Campo de texto multilínea. Mismas garantías de asociación que `TextField`:
 * label, hint y error enlazados, error con `aria-invalid` y foco devuelto al
 * `<textarea>` real con `forwardRef`.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    hint,
    error,
    leadingIcon,
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
  const textAreaId = id ?? generatedId;
  const hintId = hint ? `${textAreaId}-hint` : undefined;
  const errorId = error ? `${textAreaId}-error` : undefined;
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      <FieldLabel htmlFor={textAreaId} hide={hideLabel}>
        {label}
      </FieldLabel>
      <div className="relative">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 flex text-muted [&>svg]:size-4"
          >
            {leadingIcon}
          </span>
        )}
        <textarea
          {...rest}
          ref={ref}
          id={textAreaId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalidProp}
          className={cn(
            'min-h-24 w-full rounded-md border bg-surface py-2.5 text-body text-text',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted',
            leadingIcon ? 'pl-10' : 'pl-3',
            'pr-3',
            controlBorderClasses(Boolean(error)),
            className,
          )}
        />
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
