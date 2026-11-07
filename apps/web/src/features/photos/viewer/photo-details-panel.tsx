import type { PhotoDto, Role } from '@memora/shared';
import { Avatar, Button, ConfirmDialog, InlineAlert, LinkButton } from '@memora/ui';
import { CalendarDays, Download, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { isUnauthorizedError, useUnauthorizedRedirect } from '../../circles/session';
import { getPhotoDeleteErrorCopy, type PhotoDeleteErrorCopy } from '../delete/errors';
import { useDeletePhotoMutation } from '../delete/queries';
import { photoDownloadUrl } from '../downloads/paths';
import { canEditPhotoMetadata } from '../metadata/permissions';
import { PhotoMetadataEditor } from '../metadata/photo-metadata-editor';
import { canDeletePhoto } from '../permissions';

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
  /** La cuenta puede descargar el original (`membersCanDownload`). */
  readonly canDownload?: boolean | undefined;
  /** Se llama tras borrar la foto: el visor se cierra y vuelve al álbum. */
  readonly onDeleted: () => void;
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
 *
 * «Descargar» (F33) es un enlace real al original con `download`, no un job:
 * el servidor exige `membersCanDownload` y responde con el archivo adjunto.
 *
 * «Eliminar foto» sigue la misma regla de permisos que el `PATCH`. Si falla, el
 * visor se queda abierto con el error; si funciona, el padre navega al álbum.
 */
export function PhotoDetailsPanel({
  photo,
  className,
  circleId,
  albumId,
  circleRole,
  meId,
  canDownload = false,
  onDeleted,
}: PhotoDetailsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<PhotoDeleteErrorCopy | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteMutation = useDeletePhotoMutation({ circleId, albumId });

  useUnauthorizedRedirect(deleteMutation.error);

  const uploadedAt = formatPhotoUploadedAt(photo.createdAt);
  const takenAt = formatPhotoTakenAt(photo.takenAt);
  const place = photo.placeName?.trim() ?? '';
  const description = photo.description?.trim() ?? '';
  const canEdit = canEditPhotoMetadata({
    circleRole,
    uploaderId: photo.uploader.id,
    meId,
  });
  const canDelete = canDeletePhoto({
    circleRole,
    uploaderId: photo.uploader.id,
    meId,
  });

  // Al navegar a otra foto, la edición abierta no debe sobrevivir con valores
  // de la foto anterior. El diálogo de borrado tampoco.
  useEffect(() => {
    setEditing(false);
    setStatus(null);
    setDeleteOpen(false);
    setDeleteError(null);
  }, [photo.id]);

  const closeEditing = (message?: string) => {
    setEditing(false);
    setStatus(message ?? null);

    // El botón «Editar» vuelve a montarse: el foco no debe caer en `body`.
    window.requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const confirmDelete = async () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(photo.id);
      setDeleteOpen(false);
      onDeleted();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      setDeleteError(getPhotoDeleteErrorCopy(error));
    }
  };

  return (
    <aside
      aria-label="Detalles de la foto"
      className={className}
      data-testid="photo-viewer-details"
    >
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
          <div className="mt-4 flex-1 space-y-4 pb-4" data-testid="photo-details-content">
            {description === '' ? null : (
              <p className="text-body text-text [overflow-wrap:anywhere]">{description}</p>
            )}

            {takenAt === null && place === '' ? null : (
              <dl className="space-y-2 text-body-sm text-text">
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
          </div>

          {canEdit || canDelete || canDownload ? (
            <div
              data-testid="photo-details-actions"
              className="mt-auto flex shrink-0 flex-wrap gap-2 border-t border-border pt-4"
            >
              {canDownload ? (
                <LinkButton
                  href={photoDownloadUrl(photo.id)}
                  download
                  variant="secondary"
                  size="sm"
                  icon={<Download />}
                  aria-label="Descargar foto original"
                >
                  Descargar
                </LinkButton>
              ) : null}

              {canEdit ? (
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

              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 />}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }}
                  className="text-danger-text!"
                >
                  Eliminar foto
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
        title="Eliminar foto"
        description="La foto se eliminará para siempre. Esta acción no se puede deshacer."
        confirmLabel={deleteMutation.isPending ? 'Eliminando…' : 'Eliminar foto'}
        danger
        dismissible={!deleteMutation.isPending}
        loading={deleteMutation.isPending}
      >
        {deleteError === null ? null : (
          <InlineAlert
            tone="danger"
            title={deleteError.title}
            description={deleteError.description}
          />
        )}
      </ConfirmDialog>
    </aside>
  );
}
