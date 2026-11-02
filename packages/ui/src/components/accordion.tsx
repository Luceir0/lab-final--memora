import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from './utils';

export type AccordionType = 'single' | 'multiple';
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionItem {
  /** Identificador estable del elemento dentro del acordeón. */
  readonly id: string;
  readonly title: ReactNode;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

export interface AccordionProps {
  readonly items: readonly AccordionItem[];
  /** `single` deja una sección abierta; `multiple` permite varias. */
  readonly type?: AccordionType | undefined;
  /** Valores abiertos controlados. */
  readonly value?: readonly string[] | undefined;
  readonly defaultValue?: readonly string[] | undefined;
  readonly onValueChange?: ((values: readonly string[]) => void) | undefined;
  readonly headingLevel?: AccordionHeadingLevel | undefined;
  readonly className?: string | undefined;
}

/**
 * Acordeón con cabeceras reales.
 *
 * - Cada cabecera es un `<button>` con `aria-expanded` y `aria-controls` al
 *   panel, que se mantiene en el DOM con `hidden` cuando está cerrado.
 * - `Home`/`End` y flechas arriba/abajo mueven el foco entre cabeceras.
 * - `single` cierra la sección anterior al abrir otra; `multiple` alterna cada
 *   una de forma independiente.
 */
export function Accordion({
  items,
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const [internalValues, setInternalValues] = useState<readonly string[]>(defaultValue ?? []);
  const openValues = value ?? internalValues;
  const baseId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const isOpen = (id: string) => openValues.includes(id);

  const toggle = (id: string) => {
    const opened = isOpen(id);
    let next: readonly string[];

    if (opened) {
      next = openValues.filter((current) => current !== id);
    } else if (type === 'multiple') {
      next = [...openValues, id];
    } else {
      next = [id];
    }

    if (value === undefined) {
      setInternalValues(next);
    }

    onValueChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items
      .map((item, position) => ({ item, position }))
      .filter(({ item }) => !item.disabled);

    if (enabled.length === 0) {
      return;
    }

    const current = enabled.findIndex(({ position }) => position === index);
    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = enabled[Math.min(current + 1, enabled.length - 1)]?.position;
        break;
      case 'ArrowUp':
        nextIndex = enabled[Math.max(current - 1, 0)]?.position;
        break;
      case 'Home':
        nextIndex = enabled[0]?.position;
        break;
      case 'End':
        nextIndex = enabled[enabled.length - 1]?.position;
        break;
      default:
        return;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item, index) => {
        const opened = isOpen(item.id);
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div
            key={item.id}
            data-accordion-item=""
            className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
          >
            <Heading className="m-0">
              <button
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                id={buttonId}
                type="button"
                aria-expanded={opened}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-3 px-5 py-4 text-left text-body font-semibold text-text',
                  'transition-colors duration-(--memora-duration-fast) ease-standard',
                  'enabled:hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted',
                )}
              >
                <span>{item.title}</span>
                <span
                  data-accordion-chevron=""
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"
                >
                  <ChevronDown
                    className={cn(
                      'size-4 transition-transform duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none',
                      opened && 'rotate-180',
                    )}
                  />
                </span>
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              tabIndex={0}
              hidden={!opened}
              className="border-t border-border px-5 py-4 text-body text-text"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
