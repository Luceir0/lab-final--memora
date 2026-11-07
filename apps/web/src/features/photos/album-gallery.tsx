import type { AlbumDto, Role } from '@memora/shared';
import { Button, ConfirmDialog, EmptyState, InlineAlert } from '@memora/ui';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { fetchCsrfToken } from '../../lib/csrf';
import { isNotFoundError, useUnauthorizedRedirect } from '../circles/session';
import { flattenMemberPages, useMembersQuery } from '../members/queries';

import { getPhotoDeleteErrorCopy, type PhotoDeleteErrorCopy } from './delete/errors';
import { deletePhotosWithLimit } from './delete/batch';
import { invalidateAfterPhotoDelete } from './delete/queries';
import { formatDeletePhotosResult, formatWillDeleteSelected } from './format';
import { canDeletePhoto } from './permissions';
import { PersonFilter } from './person-filter';
import { PhotoGrid } from './photo-grid';
import { flattenPhotoPages, useAlbumPhotosQuery } from './queries';
import { SelectionBar } from './selection-bar';
import { selectionModifiers, usePhotoSelection } from './use-photo-selection';
import { useRestoredScroll } from './use-restored-scroll';
import { rememberViewerOrigin } from './viewer/origin';
import { registerPhotoSelectionClear } from './viewer/selection-bridge';

export interface AlbumGalleryProps {
  readonly album: AlbumDto;
  /** Rol de la cuenta en el círculo. Decide si se ofrece eliminar. */
  readonly circleRole?: Role | undefined;
  /** Cuenta autenticada; `null` mientras `/me` carga. */
  readonly meId?: string | null | undefined;
}

/**
 * Galería real de un álbum (F29).
 *
 * Une el filtro por persona del círculo, la rejilla con scroll infinito, la
 * selección múltiple y la restauración de scroll. El estado vacío del álbum sin
 * fotos lo sigue resolviendo el detalle; aquí solo se llega con fotos.
 *
 * «Eliminar» de la barra solo se activa cuando todas las fotos seleccionadas
 * son borrables (autor u owner). El borrado tolera fallos parciales: informa
 * cuántas se eliminaron y cuántas fallaron en una región viva.
 */
export function AlbumGallery({ album, circleRole = 'member', meId = null }: AlbumGalleryProps) {
  const [personId, setPersonId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<PhotoDeleteErrorCopy | null>(null);
  const [deleteAnnouncement, setDeleteAnnouncement] = useState('');
  const photosQuery = useAlbumPhotosQuery(album.id, personId);
  const membersQuery = useMembersQuery(album.circleId);
  const gridRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useUnauthorizedRedirect(photosQuery.error);
  useUnauthorizedRedirect(membersQuery.error);

  const photos = photosQuery.data === undefined ? [] : flattenPhotoPages(photosQuery.data.pages);
  const members =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const { selectedIds, selectedCount, toggle, selectAll, clear } = usePhotoSelection(photos);
  const selectedPhotos = photos.filter((photo) => selectedIds.has(photo.id));
  const canDeleteSelection =
    selectedPhotos.length > 0 &&
    selectedPhotos.every((photo) =>
      canDeletePhoto({ circleRole, uploaderId: photo.uploader.id, meId }),
    );

  useRestoredScroll(`album:${album.id}:${personId ?? 'all'}`, photos.length > 0);

  // Cambiar de filtro invalida la selección: los ids visibles son otros.
  useEffect(() => {
    clear();
  }, [personId, clear]);

  // El visor consulta este puente para que el primer `Esc` limpie la
  // selección y no cierre la foto que el usuario está viendo.
  useEffect(() => {
    if (selectedCount === 0) {
      return;
    }

    return registerPhotoSelectionClear(clear);
  }, [clear, selectedCount]);

  const selectedMember = members.find((member) => member.user.id === personId) ?? null;
  const notFound = isNotFoundError(photosQuery.error);

  const clearAndFocusGrid = () => {
    clear();
    window.requestAnimationFrame(() => gridRef.current?.focus());
  };

  const openDelete = () => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleting) {
      return;
    }

    const photoIds = selectedPhotos.map((photo) => photo.id);

    if (photoIds.length === 0) {
      setDeleteOpen(false);
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const csrfToken = await fetchCsrfToken(queryClient);
      const { deletedIds, failedIds } = await deletePhotosWithLimit(photoIds, csrfToken);

      if (deletedIds.length > 0) {
        invalidateAfterPhotoDelete(queryClient, {
          circleId: album.circleId,
          albumId: album.id,
          photoIds: deletedIds,
        });
      }

      setDeleteOpen(false);
      clear();
      setDeleteAnnouncement(formatDeletePhotosResult(deletedIds.length, failedIds.length));
    } catch (error) {
      setDeleteError(getPhotoDeleteErrorCopy(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-label="Galería del álbum" className="mt-6">
      {album.photosCount > 0 ? (
        <PersonFilter
          members={members}
          selectedId={personId}
          onSelect={setPersonId}
          loading={membersQuery.isPending}
          className="mb-4"
        />
      ) : null}

      {selectedCount > 0 ? (
        <SelectionBar
          selectedCount={selectedCount}
          loadedCount={photos.length}
          onClear={clearAndFocusGrid}
          onSelectAll={() => selectAll(photos)}
          canDelete={canDeleteSelection}
          onDelete={openDelete}
          deleting={deleting}
        />
      ) : null}

      <p role="status" className="sr-only">
        {selectedCount === 0 ? '' : `${selectedCount} fotos seleccionadas`}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {deleteAnnouncement}
      </p>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
        title={selectedCount === 1 ? 'Eliminar 1 foto' : `Eliminar ${selectedCount} fotos`}
        description={`${formatWillDeleteSelected(selectedCount)} de este álbum. Esta acción no se puede deshacer.`}
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
        danger
        dismissible={!deleting}
        loading={deleting}
      >
        {deleteError === null ? null : (
          <InlineAlert
            tone="danger"
            title={deleteError.title}
            description={deleteError.description}
          />
        )}
      </ConfirmDialog>

      <PhotoGrid
        label={
          selectedMember === null
            ? 'Fotos del álbum'
            : `Fotos de ${selectedMember.user.name} en el álbum`
        }
        photos={photos}
        selectedIds={selectedIds}
        onOpen={(photo) => {
          rememberViewerOrigin(photo.id);
          void navigate({
            to: '/circles/$circleId/albums/$albumId/photos/$photoId',
            params: { circleId: album.circleId, albumId: album.id, photoId: photo.id },
          });
        }}
        onToggle={(photo, event) => toggle(photo, selectionModifiers(event))}
        selectionActive={selectedCount > 0}
        total={personId === null ? album.photosCount : undefined}
        loading={photosQuery.isPending}
        error={notFound ? null : photosQuery.error}
        onRetry={() => {
          void photosQuery.refetch();
        }}
        hasNextPage={photosQuery.hasNextPage}
        loadingMore={photosQuery.isFetchingNextPage}
        onLoadMore={() => {
          void photosQuery.fetchNextPage();
        }}
        gridRef={gridRef}
        empty={
          notFound ? (
            <EmptyState
              icon={<Images />}
              iconShape="square"
              title="Este álbum no existe o ya no tienes acceso"
              description="Puede que lo hayan eliminado o que tu cuenta ya no forme parte del círculo."
              headingLevel={2}
              className="rounded-xl border border-dashed border-border-strong px-5 py-10"
              action={
                <Button variant="secondary" onClick={() => setPersonId(null)}>
                  Ver todas las fotos
                </Button>
              }
            />
          ) : personId === null ? (
            <EmptyState
              icon={<Images />}
              iconShape="square"
              title="Todavía no hay fotos que mostrar"
              description="Cuando se suba una foto aparecerá aquí."
              headingLevel={2}
              className="rounded-xl border border-dashed border-border-strong px-5 py-10"
            />
          ) : (
            <EmptyState
              icon={<Images />}
              iconShape="square"
              title={
                selectedMember === null
                  ? 'Esta persona no aparece en este álbum'
                  : `${selectedMember.user.name} no aparece en este álbum`
              }
              description="Prueba con otra persona o vuelve a ver todas las fotos del álbum."
              headingLevel={2}
              className="rounded-xl border border-dashed border-border-strong px-5 py-10"
              action={
                <Button variant="secondary" onClick={() => setPersonId(null)}>
                  Ver todas las fotos
                </Button>
              }
            />
          )
        }
      />
    </section>
  );
}
