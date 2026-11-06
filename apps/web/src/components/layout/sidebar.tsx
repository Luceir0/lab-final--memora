import { Avatar, VisuallyHidden } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import { ThemeToggle } from '../theme-toggle';

import { cx } from './class-names';
import { Logo } from './logo';
import { isDestinationActive } from './navigation';
import { PrimaryNav } from './primary-nav';
import type { ShellUser } from './types';

export interface SidebarProps {
  readonly currentPath?: string | undefined;
  readonly circleList?: ReactNode | undefined;
  readonly user?: ShellUser | undefined;
  /** Insignia de subidas activas del destino `/uploads`. */
  readonly uploadsBadge?: ReactNode | undefined;
}

/**
 * Columna de cuenta y navegación.
 *
 * Es el sidebar en escritorio y, con CSS, el contenedor de la barra inferior
 * en móvil/tablet: el `<nav>` de `PrimaryNav` se fija abajo y el logotipo, la
 * lista de círculos y el pie se ocultan porque solo tienen sentido con espacio
 * lateral. Un único árbol, sin duplicados.
 *
 * El landmark se llama «Navegación» porque en móvil solo contiene la
 * navegación. En escritorio el pie de cuenta y apariencia va dentro de
 * `<section aria-label="Cuenta y apariencia">`, que se oculta con CSS en móvil;
 * así cada nombre describe lo que de verdad hay en el árbol de accesibilidad.
 */
export function Sidebar({ currentPath = '', circleList, user, uploadsBadge }: SidebarProps) {
  const profileActive = isDestinationActive(currentPath, '/profile');

  return (
    <aside
      aria-label="Navegación"
      className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-border lg:bg-surface"
    >
      <div className="hidden px-5 pb-4 pt-6 lg:block">
        <Logo />
      </div>

      <PrimaryNav currentPath={currentPath} circleList={circleList} uploadsBadge={uploadsBadge} />

      {/* `hidden lg:block`: la sección de cuenta no existe en móvil. */}
      <section
        aria-label="Cuenta y apariencia"
        className="mt-auto hidden border-t border-border px-3 py-3 lg:block"
      >
        {/*
         * El control de tema vive en el pie del sidebar para que todas las
         * páginas lo tengan en escritorio sin inventar cabeceras. Comparte
         * lógica con el toggle de la cabecera móvil (misma variante compacta).
         */}
        <div className="mb-1 flex items-center justify-between gap-2 px-2">
          <span className="text-caption font-semibold uppercase text-muted">Apariencia</span>
          <ThemeToggle variant="compact" />
        </div>

        <Link
          to="/profile"
          className={cx(
            'flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors',
            profileActive
              ? 'bg-primary-soft text-primary-text'
              : 'text-text hover:bg-surface-2 active:bg-surface-active',
          )}
        >
          {user ? (
            <Avatar
              name={user.name}
              size={40}
              decorative
              {...(user.avatarUrl ? { src: user.avatarUrl } : {})}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"
            >
              <UserRound className="size-5" />
            </span>
          )}
          <span className="min-w-0">
            {user ? (
              <span className="block truncate text-body-sm font-semibold">{user.name}</span>
            ) : null}
            <span
              className={cx(
                'block truncate text-caption',
                profileActive ? 'text-primary-text' : 'text-muted',
              )}
            >
              Perfil y preferencias
            </span>
          </span>
          {/*
           * Perfil no es un destino del `<nav>` en escritorio: el acceso es
           * este bloque de cuenta, como en el mockup. El router añade
           * `aria-current`; el texto oculto lo refuerza y la píldora lo hace
           * visible.
           */}
          {profileActive ? <VisuallyHidden>Página actual</VisuallyHidden> : null}
        </Link>
      </section>
    </aside>
  );
}
