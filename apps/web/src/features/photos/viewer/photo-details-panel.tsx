import type { PhotoDto, Role } from '@memora/shared';
import { Avatar, Button } from '@memora/ui';
import { CalendarDays, MapPin, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { canEditPhotoMetadata } from '../metadata/permissions';
import { PhotoMetadataEditor } from '../metadata/photo-metadata-editor';

import { formatPhotoTakenAt, formatPhotoUploadedAt } from './format';

export interface PhotoDetailsPanelProps {
  readonly photo: PhotoDto;
  readonly className?: string | undefined;
  readonly circleId: string;
  readonly albumId: string;
  /** Rol de la cuenta en el círculo, ya resuelto por el contexto del círculo. */
  readonly circleRole: Role;
  /** Cuenta autenticada; `null` mientras `/me` carga. */
  readonly meId: string | null;
}

/**
 * Panel de detalles del visor (AC-06).
 *
 * Muestra autor, fecha de subida, fecha de la foto y lugar. No incluye
 * coordenadas: el contrato solo expone `placeName`. La descripción se usa tal
 * cual la escribió quien subió la foto; nunca se muestra el nombre del archivo.
 *
 * La edición (F31) se abre solo para el autor o el propietario del círculo y
 * sustituye los datos de lectura por el formulario. Cancelar descarta el estado
 * local del formulario, así que los valores originales quedan intactos.
 */
export function PhotoDetailsPanel({
  photo,
  className,
  circleId,
  albumId,
  circleRole,
  meId,
}: PhotoDetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const uploadedAt = formatPhotoUploadedAt(photo.createdAt);
  const takenAt = formatPhotoTakenAt(photo.takenAt);
  const place = photo.placeName?.trim() ?? '';
  const description = photo.description?.trim() ?? '';
  const canEdit = canEditPhotoMetadata({
    circleRole,
    uploaderId: photo.uploader.id,
    meId,
  });

  // Al navegar a otra foto, la edición abierta no debe sobrevivir con valores
  // de la foto anterior.
  useEffect(() => {
    setEditing(false);
    setStatus(null);
  }, [photo.id]);

  const closeEditing = (message?: string) => {
    setEditing(false);
    setStatus(message ?? null);

    // El botón «Editar» vuelve a montarse: el foco no debe caer en `body`.
    window.requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  return (
    <aside
      aria-label="Detalles de la foto"
      className={className}
      data-testid="photo-viewer-details"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
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

        {canEdit && !editing ? (
          <Button
            ref={editButtonRef}
            variant="secondary"
            size="sm"
            icon={<Pencil />}
            aria-label="Editar datos de la foto"
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
          >
            Editar
          </Button>
        ) : null}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status ?? ''}
      </div>

      {editing ? (
        <PhotoMetadataEditor
          photo={photo}
          circleId={circleId}
          albumId={albumId}
          onCancel={() => {
            closeEditing();
          }}
          onSaved={() => {
            closeEditing('Cambios guardados.');
          }}
        />
      ) : (
        <>
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
        </>
      )}
    </aside>
  );
}
