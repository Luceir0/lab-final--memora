import { Check, Minus } from 'lucide-react';
import { forwardRef, useEffect, useId, useRef, type InputHTMLAttributes } from 'react';

import { assignRef, cn } from './utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label: string;
  readonly description?: string;
  /** Estado mezclado: se aplica al nodo nativo, no solo a la pintura. */
  readonly indeterminate?: boolean;
}

/**
 * Checkbox con control nativo.
 *
 * - El `input` real conserva el estado y el nombre accesible (label que lo
 *   envuelve).
 * - `indeterminate` se escribe en el nodo tras montar y en cada cambio; el
 *   estado mezclado lo anuncia el lector desde el propio control.
 * - `forwardRef` al `<input>`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    indeterminate = false,
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
  const localRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (localRef.current) {
      localRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group flex min-h-11 cursor-pointer items-start gap-3 py-2.5',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted',
        className,
      )}
    >
      {/*
       * El nodo visual es el propio input (`appearance-none`); el check y el
       * guion son decorativos y se muestran con `peer-checked` /
       * `peer-[:indeterminate]`.
       */}
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input
          {...rest}
          ref={(node) => {
            localRef.current = node;
            assignRef(ref, node);
          }}
          id={inputId}
          type="checkbox"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          className={cn(
            'peer size-5 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'enabled:hover:border-primary',
            'checked:border-primary checked:bg-primary',
            '[&:indeterminate]:border-primary [&:indeterminate]:bg-primary',
            // El relleno deshabilitado usa `border-strong` (≥3,6:1 contra la
            // superficie habilitada); `surface-2` solo daba 1,1:1 en oscuro.
            'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-border-strong',
          )}
        />
        <Check
          aria-hidden="true"
          className="pointer-events-none absolute size-3.5 text-on-primary opacity-0 peer-checked:opacity-100"
        />
        <Minus
          aria-hidden="true"
          className="pointer-events-none absolute size-3.5 text-on-primary opacity-0 peer-[:indeterminate]:opacity-100"
        />
      </span>
      <span className="flex flex-col gap-0.5 text-body">
        <span id={labelId} className="text-text group-has-[:disabled]:text-muted">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-body-sm text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
});
