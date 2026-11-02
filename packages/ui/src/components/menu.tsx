import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { IconButton } from './icon-button';
import { cn } from './utils';

export interface MenuItem {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

export interface MenuProps {
  /** Nombre accesible del disparador y del menú. */
  readonly label: string;
  readonly items: readonly MenuItem[];
  readonly align?: 'start' | 'end' | undefined;
  /** Icono del disparador. Por defecto, puntos suspensivos. */
  readonly trigger?: ReactNode | undefined;
  readonly className?: string | undefined;
}

/**
 * Menú de acciones con disparador real y navegación APG.
 *
 * - `menu`/`menuitem`, `aria-haspopup` y `aria-expanded` en el disparador.
 * - Roving tabindex: solo el elemento activo entra en el orden de tabulación.
 * - Flechas con retorno, `Home`/`End`, `Esc` con foco al disparador, cierre al
 *   hacer clic fuera, al elegir y con `Tab`.
 */
export function Menu({ label, items, align = 'start', trigger, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const first = items.findIndex((item) => !item.disabled);
    return first === -1 ? 0 : first;
  });
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const close = (returnFocus: boolean) => {
    setOpen(false);

    if (returnFocus) {
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const first = itemsRef.current.findIndex((item) => !item.disabled);
    setActiveIndex(first === -1 ? 0 : first);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.disabled)
    .map(({ index }) => index);

  const focusItem = (index: number) => {
    const item = items[index];

    if (!item || item.disabled) {
      return;
    }

    setActiveIndex(index);
    itemRefs.current[index]?.focus();
  };

  const move = (delta: number) => {
    if (enabledIndexes.length === 0) {
      return;
    }

    const current = enabledIndexes.indexOf(activeIndex);
    const next = enabledIndexes[(current + delta + enabledIndexes.length) % enabledIndexes.length];

    if (next !== undefined) {
      focusItem(next);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(enabledIndexes[0] ?? 0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(enabledIndexes[enabledIndexes.length - 1] ?? 0);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <IconButton
        ref={triggerRef}
        id={triggerId}
        label={label}
        icon={trigger ?? <MoreHorizontal />}
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      />
      {open && (
        <div
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={handleMenuKeyDown}
          onBlur={(event) => {
            if (
              event.relatedTarget instanceof Node &&
              rootRef.current?.contains(event.relatedTarget)
            ) {
              return;
            }

            setOpen(false);
          }}
          className={cn(
            'absolute top-full z-nav mt-2 min-w-48 rounded-md border border-border bg-surface p-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              disabled={item.disabled}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => {
                if (!item.disabled) {
                  setActiveIndex(index);
                }
              }}
              onClick={() => {
                if (item.disabled) {
                  return;
                }

                item.onSelect?.();
                close(true);
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-body-sm font-medium',
                'transition-colors duration-(--memora-duration-fast) ease-standard',
                'disabled:cursor-not-allowed disabled:text-muted',
                item.danger
                  ? 'text-danger-text enabled:hover:bg-danger-soft'
                  : 'text-text enabled:hover:bg-surface-2',
                'focus-visible:bg-surface-2',
              )}
            >
              {item.icon && (
                <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
