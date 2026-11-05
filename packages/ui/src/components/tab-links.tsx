import {
  createElement,
  isValidElement,
  useId,
  type ComponentType,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cn } from './utils';
import type { TabIcon } from './tabs';
import { VisuallyHidden } from './visually-hidden';

export interface TabLinkItem {
  readonly value: string;
  readonly label: string;
  readonly href: string;
  /** Icono decorativo: componente Lucide o nodo ya creado. */
  readonly icon?: TabIcon | undefined;
  /** Contador visible y anunciado dentro del nombre accesible. */
  readonly count?: number | undefined;
  readonly disabled?: boolean | undefined;
  /** Razón accesible del elemento deshabilitado. */
  readonly disabledReason?: string | undefined;
}

export interface TabLinksProps {
  /** Nombre accesible del `nav`. */
  readonly label: string;
  readonly items: readonly TabLinkItem[];
  /** Valor del elemento activo, que recibe `aria-current="page"`. */
  readonly activeValue: string;
  /**
   * Intercepta el clic normal para navegar sin recargar. El componente no
   * conoce el router: si se omite, el `<a>` navega por su cuenta.
   */
  readonly onNavigate?:
    ((item: TabLinkItem, event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
  readonly className?: string | undefined;
}

function renderIcon(icon: TabIcon | undefined): ReactNode {
  if (!icon) {
    return null;
  }

  return isValidElement(icon) ? icon : createElement(icon as ComponentType);
}

/**
 * Pestañas que navegan entre secciones con URL real.
 *
 * - Se ven como las píldoras de `Tabs`, pero son navegación: `nav` + lista +
 *   enlaces. Sin `tablist`/`tab` ni gestión de foco con flechas.
 * - El elemento activo usa `aria-current="page"`.
 * - Un elemento deshabilitado se anuncia como enlace deshabilitado, no tiene
 *   `href` y sigue siendo enfocable para leer su razón con `aria-describedby`.
 *   La razón vive fuera del scroller: siendo `sr-only` (posición absoluta),
 *   dentro del `overflow-x-auto` escapaba del recorte y añadía ancho
 *   desplazable en móvil (H-01). El `nav` es su containing block.
 * - Icono decorativo fuera del nombre accesible; contador dentro, como en `Tabs`.
 * - Desviación mínima de AC-08: el contador mantiene alto fijo de 20 px
 *   (`h-5`) y forma de píldora con `min-w-5`, no un círculo cerrado de 20×20.
 *   Con 3+ cifras (`100+`, `1.240`) o al 200 % de zoom el contenido no cabe en
 *   20 px de ancho y el texto se recortaba; así crece solo en horizontal.
 * - En móvil el padding y el hueco entre icono/texto/contador se reducen para
 *   que Álbumes, Personas y Ajustes quepan enteros a 375 px. En `sm` vuelven
 *   al tamaño de escritorio. A 320 px el scroller sigue existiendo y
 *   `revealOnFocus` deja visible la pestaña enfocada.
 */
export function TabLinks({ label, items, activeValue, onNavigate, className }: TabLinksProps) {
  const baseId = useId();

  const handleClick = (item: TabLinkItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) {
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(item, event);
  };

  /**
   * Mantiene visible la pestaña enfocada dentro del scroller.
   *
   * Chrome no siempre desplaza hasta dejar entero el elemento enfocado (el
   * último quedaba 33 px fuera con `scrollLeft: 0`), así que solo cuando su
   * rect se sale del área visible se pide el desplazamiento mínimo. `block:
   * 'nearest'` no mueve la página en vertical; `inline: 'nearest'` respeta
   * `scroll-px-1`/`scroll-mx-1`, que dejan holgura para el anillo de foco.
   */
  const revealOnFocus = (event: FocusEvent<HTMLUListElement>) => {
    const scroller = event.currentTarget;
    const target = event.target;

    if (!(target instanceof HTMLElement) || target === scroller) {
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();

    if (scrollerRect.width === 0) {
      return;
    }

    // 2 px de `outline` + 2 px de `outline-offset`: el anillo también debe caber.
    const ringSlack = 4;
    const visible =
      targetRect.left >= scrollerRect.left + ringSlack &&
      targetRect.right <= scrollerRect.right - ringSlack;

    if (visible || typeof target.scrollIntoView !== 'function') {
      return;
    }

    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <nav aria-label={label} className={cn('relative min-w-0', className)}>
      {/*
        `pt-1`/`px-1` dan los 4 px que el anillo de foco (2 px + offset 2 px)
        necesita para no recortarse arriba ni en los extremos (H-05).
        `scroll-px-1` hace que el navegador reserve esa misma holgura al
        desplazar una pestaña enfocada hasta el borde del scroller.
      */}
      <ul
        onFocus={revealOnFocus}
        className="flex flex-nowrap items-center gap-0.5 scroll-px-1 overflow-x-auto border-b border-border px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const active = item.value === activeValue;
          const icon = renderIcon(item.icon);
          const reasonId = `${baseId}-reason-${index}`;

          if (item.disabled) {
            return (
              <li key={item.value} className="shrink-0">
                <span
                  role="link"
                  aria-disabled="true"
                  aria-describedby={item.disabledReason ? reasonId : undefined}
                  tabIndex={0}
                  className={cn(
                    'inline-flex min-h-[2.625rem] shrink-0 scroll-mx-1 cursor-not-allowed items-center gap-1 whitespace-nowrap rounded-full px-2 text-body-sm sm:gap-1.5 sm:px-3',
                    'font-medium text-muted opacity-60',
                    // Chrome no marca `:focus-visible` en este pseudo-enlace; un
                    // elemento deshabilitado enfocable debe mostrar el foco (2.4.7).
                    'focus:opacity-100 focus:outline-2 focus:outline-offset-2 focus:outline-focus',
                  )}
                >
                  {icon && (
                    <span
                      aria-hidden="true"
                      className="inline-flex shrink-0 text-muted [&>svg]:size-4"
                    >
                      {icon}
                    </span>
                  )}
                  <span>{item.label}</span>{' '}
                  {typeof item.count === 'number' && (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 px-1 text-caption font-semibold tabular-nums text-muted">
                      {item.count}
                    </span>
                  )}
                </span>
              </li>
            );
          }

          return (
            <li key={item.value} className="shrink-0">
              <a
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => handleClick(item, event)}
                className={cn(
                  'inline-flex min-h-[2.625rem] shrink-0 scroll-mx-1 items-center gap-1 whitespace-nowrap rounded-full px-2 text-body-sm sm:gap-1.5 sm:px-3',
                  'transition-colors duration-(--memora-duration-fast) ease-standard',
                  active
                    ? 'bg-primary-soft font-semibold text-on-primary-soft'
                    : 'font-medium text-text hover:bg-surface-2',
                )}
              >
                {icon && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-flex shrink-0 [&>svg]:size-4',
                      active ? 'text-on-primary-soft' : 'text-muted',
                    )}
                  >
                    {icon}
                  </span>
                )}
                <span>{item.label}</span>{' '}
                {typeof item.count === 'number' && (
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-caption font-semibold tabular-nums',
                      active
                        ? 'bg-primary-soft-active text-on-primary-soft'
                        : 'bg-surface-2 text-muted',
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
      {items.map((item, index) =>
        item.disabled && item.disabledReason ? (
          <VisuallyHidden key={`${item.value}-reason`} id={`${baseId}-reason-${index}`}>
            {item.disabledReason}
          </VisuallyHidden>
        ) : null,
      )}
    </nav>
  );
}
