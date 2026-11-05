import type { AlbumDto } from '@memora/shared';
import { Link } from '@tanstack/react-router';
import { Images } from 'lucide-react';

import { CircleCover } from '../circles/circle-cover';

import { formatAlbumDateLabel, formatAlbumMeta, formatAlbumPhotos } from './format';

export interface AlbumCardProps {
  readonly album: AlbumDto;
  readonly now: Date;
}

/**
 * Tarjeta de álbum.
 *
 * El enlace es la tarjeta completa: no hay controles anidados. La portada
 * reutiliza `CircleCover`, que cae al degradado con iniciales si la imagen no
 * carga (las URLs reales llegan en F29).
 *
 * En móvil el dato de fotos y fecha va en la línea inferior; en escritorio la
 * píldora de fotos ocupa la esquina inferior izquierda y la línea inferior
 * muestra la fecha y la actualización.
 */
export function AlbumCard({ album, now }: AlbumCardProps) {
  const dateLabel = formatAlbumDateLabel(album.date);
  const desktopMeta = formatAlbumMeta(album, now);
  const desktopMetaLabel = `${desktopMeta.charAt(0).toLocaleUpperCase('es-ES')}${desktopMeta.slice(1)}`;

  return (
    <li className="h-full">
      <Link
        to="/circles/$circleId/albums/$albumId"
        params={{ circleId: album.circleId, albumId: album.id }}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-(--memora-duration-fast) ease-standard hover:shadow-md"
      >
        <div className="relative">
          <CircleCover
            name={album.title}
            photo={album.coverPhoto}
            className="aspect-[4/3] w-full"
            initialsClassName="text-h1"
          />
          <span className="absolute bottom-3 left-3 hidden items-center gap-1 rounded-full bg-inverse/90 px-2.5 py-1 text-caption font-semibold text-on-inverse shadow-sm backdrop-blur-sm lg:inline-flex">
            <Images aria-hidden="true" className="size-3.5" />
            {formatAlbumPhotos(album.photosCount)}
          </span>
        </div>

        <div className="flex-1 p-4">
          <h3 className="truncate text-body font-semibold text-text lg:text-h3">{album.title}</h3>
          <p className="mt-1 text-body-sm text-muted lg:hidden">
            {formatAlbumPhotos(album.photosCount)} · {dateLabel}
          </p>
          <p className="mt-1 hidden text-body-sm text-muted lg:block">{desktopMetaLabel}</p>
        </div>
      </Link>
    </li>
  );
}
