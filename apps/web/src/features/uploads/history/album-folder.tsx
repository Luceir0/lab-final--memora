import type { MyUploadsAlbumGroup } from '@memora/shared';
import { Button, InlineAlert, Skeleton } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { formatCount } from '../../circles/format';
import { formatUploadDate, formatUploadPhotoCount } from './format';
import { AlbumPreviewMosaic, UploadPhotoThumbnail } from './photo-thumbnail';
import { flattenUploadPhotoPages, useUploadAlbumPhotosQuery } from './queries';

export interface AlbumFolderProps {
  readonly circleId: string;
  readonly group: MyUploadsAlbumGroup;
}

/**
 * Carpeta («álbum») desplegable.
 *
 * La cabecera es un único botón de divulgación: ni enlaces ni controles
 * anidados. El panel se mantiene en el DOM con `hidden` para que `aria-controls`
 * siempre apunte a un elemento real, pero las fotos no se piden hasta abrir.
 */
export function AlbumFolder({ circleId, group }: AlbumFolderProps) {
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const lastUpload = formatUploadDate(group.lastUploadAt);

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((current) => !current);
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-t-xl p-3 text-left transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-2 active:bg-surface-active sm:gap-4 sm:p-4"
        >
          <AlbumPreviewMosaic photos={group.preview} />

          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 break-words text-body font-semibold text-text sm:text-h3">
              {group.album.title}
            </span>
            <span className="mt-1 block text-body-sm text-muted">
              {formatUploadPhotoCount(group.photosCount)} · Última subida el{' '}
              <time dateTime={group.lastUploadAt}>{lastUpload}</time>
            </span>
          </span>

          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"
          >
            <ChevronDown
              className={`size-4 transition-transform duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none ${
                open ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-label={group.album.title}
        hidden={!open}
        className="border-t border-border p-3 sm:p-4"
      >
        <AlbumPhotosPanel
          albumId={group.album.id}
          albumTitle={group.album.title}
          circleId={circleId}
          enabled={open}
        />
      </div>
    </li>
  );
}

interface AlbumPhotosPanelProps {
  readonly albumId: string;
  readonly albumTitle: string;
  readonly circleId: string;
  readonly enabled: boolean;
}

function AlbumPhotosPanel({ albumId, albumTitle, circleId, enabled }: AlbumPhotosPanelProps) {
  const photosQuery = useUploadAlbumPhotosQuery(albumId, enabled);
  const photos =
    photosQuery.data === undefined ? [] : flattenUploadPhotoPages(photosQuery.data.pages);
  const loading = enabled && photosQuery.isPending;
  const failed = enabled && photosQuery.isError && photosQuery.data === undefined;
  const loadingMore = photosQuery.isFetchingNextPage;
  const failedMore = photosQuery.isFetchNextPageError && !loadingMore;
  const [announcement, setAnnouncement] = useState('');
  const [focusPhotoId, setFocusPhotoId] = useState<string | null>(null);
  const newPhotoRef = useRef<HTMLLIElement | null>(null);
  const moreRequestedRef = useRef<{
    readonly pages: number;
    readonly photoIds: ReadonlySet<string>;
  } | null>(null);

  const loadMore = () => {
    setAnnouncement('');
    setFocusPhotoId(null);
    moreRequestedRef.current = {
      pages: photosQuery.data?.pages.length ?? 0,
      photoIds: new Set(photos.map((photo) => photo.id)),
    };
    void photosQuery.fetchNextPage();
  };

  // Solo tras una carga real de «Ver más». Si desaparece el botón porque ya no
  // hay páginas, el foco pasa a la primera foto nueva, no al «Abrir álbum» que
  // queda antes del contenido recién añadido.
  useEffect(() => {
    const request = moreRequestedRef.current;

    if (request === null) {
      return;
    }

    const pagesNow = photosQuery.data?.pages.length ?? 0;

    if (pagesNow <= request.pages) {
      if (photosQuery.isFetchNextPageError) {
        moreRequestedRef.current = null;
      }

      return;
    }

    moreRequestedRef.current = null;

    // Si la carpeta se cerró mientras llegaba la página, no se anuncia ni se
    // mueve el foco dentro de un panel oculto.
    if (!enabled) {
      return;
    }

    const allPhotos = flattenUploadPhotoPages(photosQuery.data?.pages ?? []);
    const added = allPhotos.filter((photo) => !request.photoIds.has(photo.id));

    if (added.length === 0) {
      return;
    }

    setAnnouncement(
      added.length === 1
        ? 'Se ha añadido 1 foto'
        : `Se han añadido ${formatCount(added.length)} fotos`,
    );

    if (!photosQuery.hasNextPage) {
      setFocusPhotoId(added[0]?.id ?? null);
    }
  }, [enabled, photosQuery.data, photosQuery.hasNextPage, photosQuery.isFetchNextPageError]);

  useEffect(() => {
    if (focusPhotoId !== null) {
      newPhotoRef.current?.focus();
    }
  }, [focusPhotoId]);

  if (loading) {
    return <AlbumPhotosLoading />;
  }

  if (failed) {
    return (
      <InlineAlert
        tone="danger"
        title="No hemos podido cargar estas fotos"
        description="Tus fotos siguen a salvo. Vuelve a intentarlo en unos segundos."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void photosQuery.refetch();
            }}
          >
            Reintentar
          </Button>
        }
      />
    );
  }

  if (photosQuery.isSuccess && photos.length === 0) {
    return <p className="text-body-sm text-muted">Esta carpeta todavía no tiene fotos tuyas.</p>;
  }

  return (
    <div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <ul
        aria-busy={loadingMore ? true : undefined}
        className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5"
      >
        {photos.map((photo) => (
          <li
            key={photo.id}
            ref={photo.id === focusPhotoId ? newPhotoRef : undefined}
            tabIndex={photo.id === focusPhotoId ? -1 : undefined}
            className={photo.id === focusPhotoId ? 'rounded-md' : undefined}
          >
            <UploadPhotoThumbnail photo={photo} albumTitle={albumTitle} />
          </li>
        ))}
      </ul>

      {failedMore ? (
        <InlineAlert
          tone="danger"
          title="No hemos podido cargar más fotos"
          description="Las fotos que ya ves siguen aquí. Vuelve a intentarlo en unos segundos."
          className="mt-4"
          action={
            <Button variant="secondary" size="sm" onClick={loadMore}>
              Reintentar
            </Button>
          }
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/circles/$circleId/albums/$albumId"
          params={{ circleId, albumId }}
          className="inline-flex min-h-11 items-center rounded-md text-body-sm font-semibold text-primary-text hover:underline"
        >
          Abrir álbum
        </Link>

        {photosQuery.hasNextPage ? (
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Cargando…' : 'Ver más'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AlbumPhotosLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando fotos…
      </p>
      <div aria-hidden="true" className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} shape="rect" className="aspect-square h-auto! rounded-md" />
        ))}
      </div>
    </div>
  );
}
