import type { CircleDto } from '@memora/shared';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { CircleCover } from './circle-cover';

export interface CircleCompactHeaderProps {
  readonly circle: CircleDto;
}

/**
 * Barra compacta del detalle en móvil/tablet.
 *
 * Es un overlay fijo, no reserva espacio ni cambia el flujo, así que no
 * provoca saltos de layout. El nombre no es un encabezado: el `<h1>` único es
 * el del héroe, que el layout mantiene montado al cambiar de pestaña. Las
 * pantallas de escritorio usan su propia cabecera.
 */
export function CircleCompactHeader({ circle }: CircleCompactHeaderProps) {
  return (
    <div
      data-circle-compact-header=""
      className="fixed inset-x-0 top-0 z-nav border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:hidden"
    >
      <div className="flex min-h-[var(--app-circle-compact-header-height)] items-center gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link
          to="/circles"
          aria-label="Volver a mis círculos"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-active"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>

        <CircleCover
          name={circle.name}
          photo={circle.coverPhoto}
          className="size-8 shrink-0 rounded-md"
          initialsClassName="text-caption"
        />

        <p className="min-w-0 truncate text-body-sm font-semibold text-text">{circle.name}</p>
      </div>
    </div>
  );
}
