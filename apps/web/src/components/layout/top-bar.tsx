import { ThemeToggle } from '../theme-toggle';

import { Logo } from './logo';

/**
 * Cabecera de móvil y tablet: logotipo y control de tema compacto.
 *
 * Sin avatar: los mockups lo sitúan en la cabecera de cada página (F14/F16) y
 * el acceso a Perfil ya está en la barra inferior. En escritorio no se pinta.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-nav flex min-h-[calc(var(--app-topbar-height)+env(safe-area-inset-top))] items-center justify-between gap-2 border-b border-border bg-bg pt-[env(safe-area-inset-top)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:hidden">
      <Logo />
      <ThemeToggle variant="compact" />
    </header>
  );
}
