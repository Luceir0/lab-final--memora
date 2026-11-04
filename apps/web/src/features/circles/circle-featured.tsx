import type { CircleDto, CircleStats } from '@memora/shared';
import { Link } from '@tanstack/react-router';
import { UsersRound } from 'lucide-react';

import { CircleCover } from './circle-cover';
import { formatCircleStats } from './format';

export interface CircleFeaturedProps {
  readonly circle: CircleDto;
  readonly stats?: CircleStats | undefined;
}

/**
 * Tarjeta destacada del listado.
 *
 * Es el primer círculo por `updatedAt desc` que tiene portada; si ninguno la
 * tiene, se usa el primero con el degradado de reserva. No pinta miembros
 * falsos ni el badge de actividad de F35.
 */
export function CircleFeatured({ circle, stats }: CircleFeaturedProps) {
  return (
    <Link
      to="/circles/$circleId"
      params={{ circleId: circle.id }}
      className="group relative mb-8 block overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
    >
      <CircleCover
        name={circle.name}
        photo={circle.coverPhoto}
        className="aspect-[16/10] w-full lg:aspect-[16/6]"
        initialsClassName="text-display"
      />

      {/*
       * `viewer-bg` es el scrim oscuro del visor: se usa aquí porque la foto
       * es arbitraria y el texto pequeño (stats, descripción) necesita un
       * contraste estable en claro y oscuro.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-viewer-bg via-viewer-bg/85 to-transparent"
      />

      <span className="absolute left-4 top-4 rounded-full bg-viewer-bg/90 px-3 py-1 text-caption font-semibold text-on-primary shadow-sm backdrop-blur-sm">
        Destacado
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4 lg:p-8">
        <h2 className="text-h2 font-extrabold text-on-primary lg:text-h1">{circle.name}</h2>
        {circle.description ? (
          <p className="mt-1 line-clamp-2 max-w-2xl text-body-sm text-on-primary lg:text-body">
            {circle.description}
          </p>
        ) : null}
        {stats ? (
          <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-primary">
            <UsersRound aria-hidden="true" className="size-4 shrink-0" />
            <span>{formatCircleStats(stats)}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
