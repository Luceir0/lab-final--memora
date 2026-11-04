import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

/**
 * Volver a la lista en las pantallas de estado del detalle.
 *
 * La ruta oculta la `TopBar` del shell; este control respeta la safe area
 * superior y solo aparece en móvil/tablet, donde no hay sidebar.
 */
export function DetailMobileBack() {
  return (
    <div className="flex min-h-14 items-center px-4 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link
        to="/circles"
        aria-label="Volver a mis círculos"
        className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-text transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-active"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
    </div>
  );
}
