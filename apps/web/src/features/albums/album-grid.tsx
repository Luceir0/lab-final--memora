import { Button, EmptyState, InlineAlert, Skeleton } from '@memora/ui';
import { Images, Plus, UserPlus } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useCircleDetail } from '../circles/circle-detail-context';
import { useUnauthorizedRedirect } from '../circles/session';

import { AlbumCard } from './album-card';
import { getAlbumsErrorCopy } from './errors';
import { flattenAlbumPages, useAlbumListQuery } from './queries';

/**
 * Pestaña Álbumes: rejilla paginada con estados de carga, error y vacío.
 *
 * Una columna en móvil (AC-03) y hasta cuatro en escritorio (D8). El
 * encabezado oculto es estable y sirve de destino de foco cuando el botón que
 * abrió el diálogo de crear desaparece al llegar el primer álbum.
 */
export function AlbumGrid() {
  const { circle, canCreateAlbum, openCreateAlbum, openInvite, albumsHeadingRef } =
    useCircleDetail();
  const albumsQuery = useAlbumListQuery(circle.id);
  const albums = albumsQuery.isSuccess ? flattenAlbumPages(albumsQuery.data.pages) : [];
  const now = new Date();
  const previousAlbumCountRef = useRef<number | null>(null);
  const wasErrorRef = useRef(false);

  useUnauthorizedRedirect(albumsQuery.error);

  // El disparador del alta puede desaparecer después de que el diálogo se
  // cierre: el refetch sustituye el vacío por la rejilla y el foco cae en
  // `body`. Solo lo recuperamos si nadie ha movido el foco a otro control.
  useEffect(() => {
    if (!albumsQuery.isSuccess) {
      return;
    }

    const previousCount = previousAlbumCountRef.current;
    previousAlbumCountRef.current = albums.length;

    if (previousCount === 0 && albums.length > 0 && document.activeElement === document.body) {
      albumsHeadingRef.current?.focus();
    }
  }, [albums.length, albumsQuery.isSuccess, albumsHeadingRef]);

  useEffect(() => {
    if (albumsQuery.isError) {
      wasErrorRef.current = true;
      return;
    }

    if (albumsQuery.isSuccess && wasErrorRef.current) {
      wasErrorRef.current = false;

      if (document.activeElement === document.body) {
        albumsHeadingRef.current?.focus();
      }
    }
  }, [albumsQuery.isError, albumsQuery.isSuccess, albumsHeadingRef]);

  return (
    <section aria-labelledby="album-grid-heading" className="mt-2 lg:mt-4">
      <h2 id="album-grid-heading" ref={albumsHeadingRef} tabIndex={-1} className="sr-only">
        Álbumes del círculo
      </h2>

      {albumsQuery.isPending ? <AlbumGridLoading /> : null}

      {albumsQuery.isError ? (
        <AlbumGridError
          error={albumsQuery.error}
          onRetry={() => {
            void albumsQuery.refetch();
          }}
        />
      ) : null}

      {albumsQuery.isSuccess ? (
        <AlbumGridContent
          albums={albums}
          canCreateAlbum={canCreateAlbum}
          isOwner={circle.role === 'owner'}
          now={now}
          hasNextPage={albumsQuery.hasNextPage}
          loadingMore={albumsQuery.isFetchingNextPage}
          onLoadMore={() => {
            void albumsQuery.fetchNextPage();
          }}
          onCreateAlbum={openCreateAlbum}
          onInvite={openInvite}
        />
      ) : null}
    </section>
  );
}

function AlbumGridLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando álbumes…
      </p>
      <div
        aria-hidden="true"
        className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-surface">
            <Skeleton shape="rect" className="aspect-[4/3] h-auto! rounded-none" />
            <div className="p-4">
              <Skeleton shape="text" size="md" className="w-2/3" />
              <Skeleton shape="text" size="sm" className="mt-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AlbumGridErrorProps {
  readonly error: unknown;
  readonly onRetry: () => void;
}

function AlbumGridError({ error, onRetry }: AlbumGridErrorProps) {
  const copy = getAlbumsErrorCopy(error, 'list');

  return (
    <InlineAlert
      tone="danger"
      title={copy.title}
      description={copy.description}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  );
}

interface AlbumGridContentProps {
  readonly albums: ReturnType<typeof flattenAlbumPages>;
  readonly canCreateAlbum: boolean;
  readonly isOwner: boolean;
  readonly now: Date;
  readonly hasNextPage: boolean;
  readonly loadingMore: boolean;
  readonly onLoadMore: () => void;
  readonly onCreateAlbum: () => void;
  readonly onInvite: () => void;
}

function AlbumGridContent({
  albums,
  canCreateAlbum,
  isOwner,
  now,
  hasNextPage,
  loadingMore,
  onLoadMore,
  onCreateAlbum,
  onInvite,
}: AlbumGridContentProps) {
  if (albums.length === 0) {
    const canCreate = canCreateAlbum;

    return (
      <EmptyState
        icon={<Images />}
        iconShape="square"
        title="Todavía no hay álbumes"
        description={
          canCreate
            ? 'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.'
            : 'Pide a quien administra el círculo que cree el primero.'
        }
        headingLevel={2}
        className="rounded-xl border border-dashed border-border-strong px-5 py-10"
        action={
          <div className="flex flex-col items-center gap-2">
            {canCreate ? (
              <Button icon={<Plus />} onClick={onCreateAlbum}>
                Crear el primer álbum
              </Button>
            ) : null}
            {isOwner ? (
              <Button variant="secondary" icon={<UserPlus />} onClick={onInvite}>
                Invitar a alguien
              </Button>
            ) : null}
          </div>
        }
      />
    );
  }

  return (
    <>
      <ul className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} now={now} />
        ))}
      </ul>

      {hasNextPage ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" loading={loadingMore} onClick={onLoadMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      ) : null}
    </>
  );
}
