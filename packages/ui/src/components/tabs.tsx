import type { LucideIcon } from 'lucide-react';
import {
  createElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from './utils';

export type TabIcon = LucideIcon | ReactNode;

export interface TabItem {
  readonly value: string;
  readonly label: string;
  /** Icono decorativo: componente Lucide o nodo ya creado. */
  readonly icon?: TabIcon | undefined;
  /** Contador visible y anunciado dentro del nombre accesible. */
  readonly count?: number | undefined;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

export interface TabsProps {
  /** Nombre accesible del `tablist`. */
  readonly label: string;
  readonly items: readonly TabItem[];
  /** Valor controlado. Si se omite, el componente mantiene su propio estado. */
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly className?: string | undefined;
}

function renderIcon(icon: TabIcon | undefined): ReactNode {
  if (!icon) {
    return null;
  }

  return isValidElement(icon) ? icon : createElement(icon as ComponentType);
}

/**
 * Pestañas en formato píldora.
 *
 * - La activa usa `bg-primary-soft` y `text-on-primary-soft`; las inactivas no
 *   tienen fondo.
 * - Icono decorativo y contador forman parte del nombre accesible de la pestaña.
 * - `tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls` y
 *   `aria-labelledby` reales.
 * - Flechas izquierda/derecha con retorno, `Home`/`End`; las pestañas
 *   deshabilitadas se omiten y solo la activa es tabulable.
 */
export function Tabs({ label, items, value, defaultValue, onValueChange, className }: TabsProps) {
  const firstEnabled = items.find((item) => !item.disabled);
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabled?.value ?? '');
  const selectedValue = value ?? internalValue;
  const activeItem =
    items.find((item) => item.value === selectedValue && !item.disabled) ?? firstEnabled;
  const activeValue = activeItem?.value;
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (item: TabItem, moveFocus: boolean) => {
    if (item.disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(item.value);
    }

    onValueChange?.(item.value);

    if (moveFocus) {
      const index = items.findIndex((candidate) => candidate.value === item.value);
      const tab = tabRefs.current[index];
      tab?.focus();

      if (tab && typeof tab.scrollIntoView === 'function') {
        tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
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
      case 'ArrowRight':
        nextIndex = enabled[(current + 1) % enabled.length]?.position;
        break;
      case 'ArrowLeft':
        nextIndex = enabled[(current - 1 + enabled.length) % enabled.length]?.position;
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
    const next = items[nextIndex];

    if (next) {
      select(next, true);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        className="flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-border pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const selected = item.value === activeValue;
          const icon = renderIcon(item.icon);

          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${baseId}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item, true)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 text-body-sm',
                'transition-colors duration-(--memora-duration-fast) ease-standard',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'bg-primary-soft font-semibold text-on-primary-soft'
                  : 'font-medium text-text enabled:hover:bg-surface-2',
              )}
            >
              {icon && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex shrink-0 [&>svg]:size-4',
                    selected ? 'text-on-primary-soft' : 'text-muted',
                  )}
                >
                  {icon}
                </span>
              )}
              <span>{item.label}</span>{' '}
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-0.5 py-0.5 text-caption font-semibold sm:px-1.5',
                    selected
                      ? 'bg-primary-soft-active text-on-primary-soft'
                      : 'bg-surface-2 text-muted',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.value}
          id={`${baseId}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${index}`}
          tabIndex={0}
          hidden={item.value !== activeValue}
          className="text-body text-text"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
