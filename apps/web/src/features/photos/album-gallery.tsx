import type { AlbumDto } from '@memora/shared';
import { Button, EmptyState } from '@memora/ui';
import { Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { isNotFoundError, useUnauthorizedRedirect } from '../circles/session';
import { flattenMemberPages, useMembersQuery } from '../members/queries';

import { PersonFilter } from './person-filter';
import { PhotoGrid } from './photo-grid';
import { flattenPhotoPages, useAlbumPhotosQuery } from './queries';
import { SelectionBar } from './selection-bar';
import { selectionModifiers, usePhotoSelection } from './use-photo-selection';
import { useRestoredScroll } from './use-restored-scroll';

export interface AlbumGalleryProps {
  readonly album: AlbumDto;
}

/**
 * Galería real de un álbum (F29).
 *
 * Une el filtro por persona del círculo, la rejilla con scroll infinito, la
 * selección múltiple y la restauración de scroll. El estado vacío del álbum sin
 * fotos lo sigue resolviendo el detalle; aquí solo se llega con fotos.
 */
export function AlbumGallery({ album }: AlbumGalleryProps) {
  const [personId, setPersonId] = useState<string | null>(null);
  const photosQuery = useAlbumPhotosQuery(album.id, personId);
  const membersQuery = useMembersQuery(album.circleId);
  const gridRef = useRef<HTMLUListElement>(null);

  useUnauthorizedRedirect(photosQuery.error);
  useUnauthorizedRedirect(membersQuery.error);

  const photos = photosQuery.data === undefined ? [] : flattenPhotoPages(photosQuery.data.pages);
  const members =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const { selectedIds, selectedCount, toggle, selectAll, clear } = usePhotoSelection(photos);

  useRestoredScroll(`album:${album.id}:${personId ?? 'all'}`, photos.length > 0);

  // Cambiar de filtro invalida la selección: los ids visibles son otros.
  useEffect(() => {
    clear();
  }, [personId, clear]);

  const selectedMember = members.find((member) => member.user.id === personId) ?? null;
  const notFound = isNotFoundError(photosQuery.error);

  const clearAndFocusGrid = () => {
    clear();
    window.requestAnimationFrame(() => gridRef.current?.focus());
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
        />
      ) : null}

      <p role="status" className="sr-only">
        {selectedCount === 0 ? '' : `${selectedCount} fotos seleccionadas`}
      </p>

      <PhotoGrid
        label={
          selectedMember === null
            ? 'Fotos del álbum'
            : `Fotos de ${selectedMember.user.name} en el álbum`
        }
        photos={photos}
        selectedIds={selectedIds}
        onToggle={(photo, event) => toggle(photo, selectionModifiers(event))}
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
