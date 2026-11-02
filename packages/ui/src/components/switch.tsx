import { forwardRef, useId, type ChangeEvent, type InputHTMLAttributes } from 'react';

import { cn } from './utils';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'role' | 'onChange'
> {
  readonly label: string;
  readonly description?: string;
  readonly onCheckedChange?: (checked: boolean) => void;
}

/**
 * Interruptor on/off sobre un checkbox nativo con `role="switch"`.
 *
 * El input es `sr-only` para conservar teclado, formulario y estado nativos;
 * el foco visible se pinta en la pista con `peer-focus-visible`. El label
 * envuelve toda la fila, así que el área táctil supera los 44 px.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    label,
    description,
    onCheckedChange,
    className,
    id,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const describedBy = [describedByProp, descriptionId].filter(Boolean).join(' ') || undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.currentTarget.checked);
  };

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
        className,
      )}
    >
      <span className="flex flex-col gap-0.5 text-body">
        <span id={labelId} className="text-text">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-body-sm text-muted">
            {description}
          </span>
        )}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onChange={handleChange}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 rounded-full border border-border-strong bg-surface-2',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'group-has-[:enabled]:group-hover:border-primary',
            'peer-checked:border-primary peer-checked:bg-primary',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0.5 top-0.5 size-5 rounded-full border border-control-knob-border bg-control-knob shadow-sm',
            'transition-transform duration-(--memora-duration-fast) ease-standard',
            'peer-checked:translate-x-5',
          )}
        />
      </span>
    </label>
  );
});
