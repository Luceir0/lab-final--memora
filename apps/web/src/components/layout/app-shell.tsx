import type { ReactNode } from 'react';

import { MAIN_CONTENT_ID, SkipLink } from './skip-link';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import type { ShellUser } from './types';

export interface AppShellProps {
  readonly children: ReactNode;
  /** Ruta actual; la aporta el layout con el router. */
  readonly currentPath?: string | undefined;
  /** Hueco de la lista de círculos del sidebar (F14). */
  readonly circleList?: ReactNode | undefined;
  /** Persona autenticada, cuando F34 la conecte. */
  readonly user?: ShellUser | undefined;
}

/**
 * Esqueleto de la aplicación.
 *
 * - Barra inferior fija en móvil/tablet y sidebar en escritorio, con una sola
 *   navegación (`PrimaryNav`).
 * - `<main>` único, enfocable, destino del skip link.
 * - Safe areas del notch y de la barra de gestos con `env(safe-area-inset-*)`
 *   y alturas en `dvh`.
 * - Mobile-first: el primer render es el de móvil porque el SSR no conoce el
 *   viewport; `lg` cambia la disposición con CSS.
 * - La cabecera va antes que la barra en el DOM para que el orden de tabulación
 *   en móvil sea cabecera → navegación → contenido. En escritorio la cabecera
 *   se oculta con `lg:hidden` y no ocupa celda de rejilla.
 */
export function AppShell({ children, currentPath, circleList, user }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-text lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <SkipLink />

      <TopBar />

      <Sidebar currentPath={currentPath} circleList={circleList} user={user} />

      <div className="flex min-w-0 flex-col">
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="min-w-0 flex-1 pb-[var(--app-bottom-nav-height)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:pb-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
