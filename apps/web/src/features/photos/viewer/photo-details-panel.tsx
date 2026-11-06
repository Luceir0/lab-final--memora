import type { PhotoDto } from '@memora/shared';
import { Avatar } from '@memora/ui';
import { CalendarDays, MapPin } from 'lucide-react';

import { formatPhotoTakenAt, formatPhotoUploadedAt } from './format';

export interface PhotoDetailsPanelProps {
  readonly photo: PhotoDto;
  readonly className?: string | undefined;
}

/**
 * Panel de detalles del visor (AC-06).
 *
 * Muestra autor, fecha de subida, fecha de la foto y lugar. No incluye
 * coordenadas: el contrato solo expone `placeName`. La descripción se usa tal
 * cual la escribió quien subió la foto; nunca se muestra el nombre del archivo.
 */
export function PhotoDetailsPanel({ photo, className }: PhotoDetailsPanelProps) {
  const uploadedAt = formatPhotoUploadedAt(photo.createdAt);
  const takenAt = formatPhotoTakenAt(photo.takenAt);
  const place = photo.placeName?.trim() ?? '';
  const description = photo.description?.trim() ?? '';

  return (
    <aside
      aria-label="Detalles de la foto"
      className={className}
      data-testid="photo-viewer-details"
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={photo.uploader.name}
          src={photo.uploader.avatarUrl ?? undefined}
          size={40}
          decorative
        />
        <div className="min-w-0">
          <p className="truncate text-body-sm font-semibold text-text">{photo.uploader.name}</p>
          {uploadedAt === null ? null : (
            <p className="text-caption text-muted">Subida el {uploadedAt}</p>
          )}
        </div>
      </div>

      {description === '' ? null : (
        <p className="mt-4 text-body text-text [overflow-wrap:anywhere]">{description}</p>
      )}

      {takenAt === null && place === '' ? null : (
        <dl className="mt-4 space-y-2 text-body-sm text-text">
          {takenAt === null ? null : (
            <div className="flex items-start gap-2">
              <dt className="flex items-center gap-2 text-muted">
                <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                <span className="sr-only">Fecha de la foto</span>
              </dt>
              <dd className="min-w-0 [overflow-wrap:anywhere]">{takenAt}</dd>
            </div>
          )}

          {place === '' ? null : (
            <div className="flex items-start gap-2">
              <dt className="flex items-center gap-2 text-muted">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span className="sr-only">Lugar</span>
              </dt>
              <dd className="min-w-0 [overflow-wrap:anywhere]">{place}</dd>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}
