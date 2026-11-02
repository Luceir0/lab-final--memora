import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from './utils';

export interface ChipProps {
  readonly children: ReactNode;
  /** Estado de filtro activo. Se expone con `aria-pressed` solo si hay `onClick`. */
  readonly selected?: boolean;
  /** Borde discontinuo para chips de «añadir» o etiquetas sin asignar. */
  readonly dashed?: boolean;
  /** Avatar u otro contenido decorativo a la izquierda. */
  readonly avatar?: ReactNode;
  /** Si se pasa, el cuerpo es un botón de filtro con `aria-pressed`. */
  readonly onClick?: () => void;
  /** Si se pasa, añade un botón de quitar con etiqueta propia. */
  readonly onRemove?: () => void;
  /** Etiqueta del botón de quitar cuando el contenido no es texto plano. */
  readonly removeLabel?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Chip de filtro o etiqueta.
 *
 * - Con `onClick`, el cuerpo es un `<button>` con `aria-pressed`; nunca un `div`
 *   clicable. Sin `onClick`, es un `<span>` sin semántica de botón.
 * - El área táctil del cuerpo y del botón de quitar es de 44 px con un
 *   `::after` de altura fija centrada: no depende del borde ni del padding box.
 * - El quitar se separa 8 px y su hit de 44 px empieza 2 px después del cuerpo;
 *   así el borde derecho del cuerpo alterna el chip y no lo elimina.
 * - Seleccionado añade tres señales además del color: icono de check, peso
 *   `bold` y borde primario. Se distingue en escala de grises.
 */
export function Chip({
  children,
  selected = false,
  dashed = false,
  avatar,
  onClick,
  onRemove,
  removeLabel,
  disabled = false,
  className,
}: ChipProps) {
  const text = typeof children === 'string' ? children : 'etiqueta';
  const removeAccessibleName = removeLabel ?? `Quitar ${text}`;
  const interactive = typeof onClick === 'function';

  const body = (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {avatar && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {avatar}
        </span>
      )}
      {selected && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
      <span className="inline-flex min-w-0 items-center gap-1 truncate [&>svg]:shrink-0">
        {children}
      </span>
    </span>
  );

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full border',
        selected
          ? 'border-primary bg-primary-soft font-bold text-on-primary-soft'
          : 'border-border-strong bg-surface font-semibold text-text',
        dashed && 'border-dashed',
        disabled && 'opacity-50',
        className,
      )}
    >
      {interactive ? (
        <button
          type="button"
          aria-pressed={selected}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'relative inline-flex min-h-9 min-w-0 items-center rounded-full px-3 text-body-sm',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 after:content-[""]',
            selected
              ? 'enabled:hover:bg-primary-soft-hover enabled:active:bg-primary-soft-active'
              : 'enabled:hover:bg-surface-2 enabled:active:bg-surface-active',
            'disabled:cursor-not-allowed',
            onRemove && 'pr-0',
          )}
        >
          {body}
        </button>
      ) : (
        <span
          className={cn(
            'inline-flex min-h-9 min-w-0 items-center rounded-full px-3 text-body-sm',
            onRemove && 'pr-0',
          )}
        >
          {body}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={removeAccessibleName}
          onClick={onRemove}
          disabled={disabled}
          className={cn(
            'relative ml-2 mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
            'transition-colors duration-(--memora-duration-fast) ease-standard',
            'after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[""]',
            'text-current disabled:cursor-not-allowed',
            selected
              ? 'enabled:hover:bg-primary-soft-hover enabled:active:bg-primary-soft-active'
              : 'enabled:hover:bg-surface-2 enabled:active:bg-surface-active',
          )}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </span>
  );
}
