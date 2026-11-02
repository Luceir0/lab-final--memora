import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from './utils';

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
}

export interface SegmentedControlProps {
  /** Nombre accesible del grupo. */
  readonly label: string;
  readonly options: readonly SegmentedOption[];
  readonly value: string;
  readonly onValueChange?: (value: string) => void;
  /** `name` del grupo de radios. Si se omite, se genera uno estable. */
  readonly name?: string;
  readonly className?: string;
}

/**
 * Grupo de opciones exclusivas con radios nativos.
 *
 * - `role="radiogroup"` horizontal con nombre accesible.
 * - Solo `ArrowLeft`/`ArrowRight` se gestionan explícitamente; `ArrowUp` y
 *   `ArrowDown` no se interceptan ni se bloquea el scroll. El navegador puede
 *   seguir moviendo la selección dentro del grupo de radios: es su
 *   comportamiento nativo y APG lo permite.
 * - El segmento activo se distingue por color, borde y peso (`bold`), no solo
 *   por color. El área táctil de cada opción es de 44 px con un `::after` de
 *   altura fija centrada, independiente del borde.
 * - Ocupa el ancho de su contenido (`w-fit`), no se estira como un bloque.
 */
export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  name,
  className,
}: SegmentedControlProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const move = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    const enabled = options
      .map((option, position) => ({ option, position }))
      .filter(({ option }) => !option.disabled);

    if (enabled.length < 2) {
      return;
    }

    event.preventDefault();

    const current = enabled.findIndex(({ position }) => position === index);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = enabled[(current + direction + enabled.length) % enabled.length];

    if (!next) {
      return;
    }

    onValueChange?.(next.option.value);
    inputRefs.current[next.position]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-orientation="horizontal"
      className={cn(
        'inline-flex w-fit max-w-full self-start rounded-md border border-border bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option, index) => (
        <label
          key={option.value}
          className={cn(
            'relative flex min-h-9 flex-none cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-transparent px-3',
            'text-body-sm font-semibold text-muted',
            'transition-[background-color,border-color,color] duration-(--memora-duration-fast) ease-standard',
            'has-[:enabled]:hover:text-text',
            'has-[:checked]:border-primary has-[:checked]:bg-elevated has-[:checked]:font-bold has-[:checked]:text-text',
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
            'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
            'after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 after:content-[""]',
          )}
        >
          <input
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            type="radio"
            name={groupName}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onValueChange?.(option.value)}
            onKeyDown={(event) => move(event, index)}
            className="sr-only"
          />
          {option.icon && (
            <span aria-hidden="true" className="inline-flex [&>svg]:size-4">
              {option.icon}
            </span>
          )}
          {option.label}
        </label>
      ))}
    </div>
  );
}
