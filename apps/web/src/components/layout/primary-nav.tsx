import { Link } from '@tanstack/react-router';
import { Fragment, useEffect, useId, useRef, type ReactNode } from 'react';

import { cx } from './class-names';
import {
  isDestinationActive,
  NAV_DESTINATIONS,
  visibilityClassName,
  type NavDestination,
} from './navigation';

export interface PrimaryNavProps {
  /** Ruta actual, resuelta por el layout con el router. */
  readonly currentPath?: string | undefined;
  /**
   * Hueco para la lista de círculos del sidebar. F14 pasará los círculos
   * reales; sin contenido la sección no se renderiza (nada de datos falsos).
   */
  readonly circleList?: ReactNode | undefined;
  /**
   * Insignia de subidas activas. Se pinta solo en el destino `/uploads`, dentro
   * del enlace, para que su texto forme parte del nombre accesible.
   */
  readonly uploadsBadge?: ReactNode | undefined;
}

/**
 * Navegación principal: **un solo** `<nav>`.
 *
 * En móvil/tablet es la barra inferior fija (Círculos · Subidas · Perfil); en
 * escritorio, la lista vertical del sidebar (Mis círculos · Subidas · Círculos ·
 * Ayuda · Privacidad). Los mismos nodos cambian de forma con CSS: lo oculto con
 * `display: none` no se anuncia, así que no hay landmarks ni enlaces
 * duplicados por breakpoint.
 */
export function PrimaryNav({ currentPath = '', circleList, uploadsBadge }: PrimaryNavProps) {
  const circlesGroupId = useId();
  const navRef = useRef<HTMLElement>(null);

  /*
   * La barra crece con el texto (min-height, no altura fija). `<main>` no
   * puede saber cuánto ocupa una barra `fixed` solo con CSS, así que
   * publicamos su altura real en `--app-bottom-nav-height`. Así el zoom de
   * texto al 200 % no tapa el final del contenido. En escritorio la barra es
   * parte del sidebar y se retira la variable (`lg:pb-0` manda).
   */
  useEffect(() => {
    const nav = navRef.current;

    if (!nav || typeof ResizeObserver === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const syncHeight = () => {
      if (getComputedStyle(nav).position === 'fixed') {
        root.style.setProperty(
          '--app-bottom-nav-height',
          `${nav.getBoundingClientRect().height}px`,
        );
      } else {
        root.style.removeProperty('--app-bottom-nav-height');
      }
    };

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(nav);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--app-bottom-nav-height');
    };
  }, []);

  /*
   * La lista de círculos es un `<li>` más del mismo `<nav>`: en escritorio se
   * coloca entre «Subidas» y «Ayuda»; en móvil queda oculta y no rompe la
   * rejilla de tres destinos. Su etiqueta es un `<p>` (no un encabezado) para
   * no adelantar un `<h2>` al `<h1>` de la página.
   */
  const circlesGroupItem = circleList ? (
    <li className="hidden lg:block">
      <div role="group" aria-labelledby={circlesGroupId} className="mt-4">
        <p id={circlesGroupId} className="px-3 text-caption font-semibold uppercase text-muted">
          Círculos
        </p>
        <div className="mt-1">{circleList}</div>
      </div>
    </li>
  ) : null;

  return (
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      className={cx(
        // `min-height` en lugar de altura fija: con zoom de texto la barra
        // crece con las etiquetas y nada se recorta.
        'fixed inset-x-0 bottom-0 z-nav min-h-[calc(var(--app-bottom-nav-min-height)+env(safe-area-inset-bottom))] border-t border-border bg-surface',
        'pb-[env(safe-area-inset-bottom)] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]',
        'lg:static lg:inset-auto lg:z-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:border-0 lg:bg-transparent lg:pb-0 lg:pl-3 lg:pr-3',
      )}
    >
      <ul className="mx-auto grid w-full max-w-sm grid-cols-3 min-h-[calc(var(--app-bottom-nav-min-height)-var(--memora-border-width))] lg:min-h-0 lg:max-w-none lg:flex lg:flex-col lg:gap-1 lg:py-1">
        {NAV_DESTINATIONS.map((destination) => (
          <Fragment key={destination.id}>
            <li className={visibilityClassName(destination.visibility)}>
              <NavItem
                destination={destination}
                active={isDestinationActive(currentPath, destination.path)}
                badge={destination.id === 'uploads' ? uploadsBadge : undefined}
              />
            </li>
            {destination.id === 'uploads' ? circlesGroupItem : null}
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}

interface NavItemProps {
  readonly destination: NavDestination;
  readonly active: boolean;
  readonly badge?: ReactNode | undefined;
}

function NavItem({ destination, active, badge }: NavItemProps) {
  const Icon = destination.icon;

  return (
    <Link
      to={destination.path}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-caption font-medium transition-colors',
        'lg:h-auto lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2 lg:text-body-sm',
        active
          ? // En móvil la píldora va solo alrededor del icono; en escritorio,
            // toda la fila. El estado nunca se comunica solo con el color.
            'font-semibold text-primary-text lg:bg-primary-soft'
          : 'text-muted hover:bg-surface-2 hover:text-text active:bg-surface-active',
      )}
    >
      <span
        className={cx(
          'flex size-11 shrink-0 items-center justify-center rounded-full lg:size-6',
          active ? 'bg-primary-soft lg:bg-transparent' : undefined,
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 lg:flex-1 lg:justify-start">
        {destination.label.mobile === destination.label.desktop ? (
          destination.label.mobile
        ) : (
          <>
            <span className="lg:hidden">{destination.label.mobile}</span>
            <span className="hidden lg:inline">{destination.label.desktop}</span>
          </>
        )}
        {badge}
      </span>
    </Link>
  );
}
