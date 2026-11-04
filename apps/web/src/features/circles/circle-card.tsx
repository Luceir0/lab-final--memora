import type { CircleDto, CircleStats } from '@memora/shared';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import { CircleCover } from './circle-cover';
import { formatCircleStats, formatCircleStatsShort, formatRelativeDate } from './format';

export interface CircleCardProps {
  readonly circle: CircleDto;
  readonly stats?: CircleStats | undefined;
  /** La consulta N+1 de stats falló; no dejamos un «cargando» eterno. */
  readonly statsFailed?: boolean | undefined;
  readonly now: Date;
}

/**
 * Tarjeta de círculo.
 *
 * Un solo árbol cambia de fila (móvil) a tarjeta (escritorio) con CSS. El
 * enlace es la tarjeta completa: no hay controles anidados.
 */
export function CircleCard({ circle, stats, statsFailed = false, now }: CircleCardProps) {
  const lastActivity = stats?.lastUploadAt ?? circle.updatedAt;
  const relative = formatRelativeDate(lastActivity, now);
  const relativeLower = relative.toLocaleLowerCase('es-ES');

  const mobileStats = stats
    ? formatCircleStatsShort(stats)
    : statsFailed
      ? 'No se pudieron cargar los detalles'
      : 'Cargando detalles…';
  const desktopStats = stats
    ? formatCircleStats(stats)
    : statsFailed
      ? 'No se pudieron cargar los detalles'
      : 'Cargando detalles…';

  return (
    <li>
      <Link
        to="/circles/$circleId"
        params={{ circleId: circle.id }}
        className="group flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm transition-shadow duration-(--memora-duration-fast) ease-standard hover:shadow-md lg:block lg:overflow-hidden lg:p-0"
      >
        <CircleCover
          name={circle.name}
          photo={circle.coverPhoto}
          className="size-16 shrink-0 rounded-lg lg:aspect-[4/3] lg:size-auto lg:rounded-none"
          initialsClassName="text-h2"
        />

        <div className="min-w-0 flex-1 lg:p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-body font-semibold text-text lg:text-h3">{circle.name}</h3>
            <span className="shrink-0 text-caption text-muted lg:hidden">{relative}</span>
          </div>

          <p className="mt-1 text-body-sm text-muted lg:hidden">{mobileStats}</p>
          <p className="mt-1 hidden text-body-sm text-muted lg:block">{desktopStats}</p>
          <p className="mt-1 hidden text-caption text-muted lg:block">
            Última subida: {relativeLower}
          </p>
        </div>

        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted lg:hidden" />
      </Link>
    </li>
  );
}
