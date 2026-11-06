import type { AlbumDto } from '@memora/shared';
import {
  Avatar,
  Breadcrumb,
  Button,
  Chip,
  EmptyState,
  IconButton,
  InlineAlert,
  LinkButton,
  Skeleton,
} from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Download, Images, Tag } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { flattenAlbumPages, useAlbumListQuery } from '../albums/queries';
import { useCircleDetail } from '../circles/circle-detail-context';
import { circlePath } from '../circles/paths';
import { isNotFoundError, useUnauthorizedRedirect } from '../circles/session';
import { flattenMemberPages, useMembersQuery } from '../members/queries';

import { formatPersonPhotosSummary } from './format';
import { PhotoGrid } from './photo-grid';
import { flattenPhotoPages, useAlbumPhotosQuery, usePersonPhotosQuery } from './queries';
import { useRestoredScroll } from './use-restored-scroll';

export interface PersonPhotosPageProps {
  readonly userId: string;
}

/**
 * «Fotos de esta persona».
 *
 * Lista solo fotos del círculo en las que aparece la persona (el endpoint de
 * F21 valida ambas pertenencias y devuelve 404 si alguna falla). La cabecera
 * muestra el total del contrato de miembros y el número de álbumes del círculo;
 * los chips permiten acotar por álbum reutilizando el endpoint de galería del
 * álbum con `personId`, de modo que el scroll infinito sigue siendo por cursor.
 */
export function PersonPhotosPage({ userId }: PersonPhotosPageProps) {
  const { circle } = useCircleDetail();
  const membersQuery = useMembersQuery(circle.id);
  const albumsQuery = useAlbumListQuery(circle.id);
  const [albumId, setAlbumId] = useState<string | null>(null);

  const allPhotosQuery = usePersonPhotosQuery(circle.id, userId, albumId === null);
  const albumPhotosQuery = useAlbumPhotosQuery(albumId, userId, albumId !== null);
  const activeQuery = albumId === null ? allPhotosQuery : albumPhotosQuery;

  const headingRef = useRef<HTMLHeadingElement>(null);
  const downloadNoteId = useId();

  useUnauthorizedRedirect(membersQuery.error);
  useUnauthorizedRedirect(albumsQuery.error);
  useUnauthorizedRedirect(activeQuery.error);

  const members =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const albums = albumsQuery.data === undefined ? [] : flattenAlbumPages(albumsQuery.data.pages);
  const photos = activeQuery.data === undefined ? [] : flattenPhotoPages(activeQuery.data.pages);

  const member = members.find((item) => item.user.id === userId) ?? null;
  const photoWithPerson = photos.find((photo) => photo.tags.some((tag) => tag.id === userId));
  const name =
    member?.user.name ??
    photoWithPerson?.tags.find((tag) => tag.id === userId)?.name ??
    'Esta persona';
  const avatarUrl = member?.user.avatarUrl ?? null;
  const photosCount = member?.photosCount ?? photos.length;
  const albumsCount = circle.stats.albumsCount;
  const selectedAlbum: AlbumDto | null = albums.find((album) => album.id === albumId) ?? null;
  const noAccess = isNotFoundError(activeQuery.error);

  useRestoredScroll(`person:${circle.id}:${userId}:${albumId ?? 'all'}`, photos.length > 0);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const personEmpty = photosCount === 0 && albumId === null;
  const emptyForAlbum = albumId !== null;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-4 lg:px-8 lg:py-10">
      <div className="hidden lg:block">
        <Breadcrumb
          label="Ruta de las fotos de la persona"
          items={[
            { label: 'Mis círculos', href: '/circles' },
            { label: circle.name, href: circlePath(circle.id) },
            { label: 'Personas', href: `${circlePath(circle.id)}/people` },
            { label: name },
          ]}
        />
      </div>

      <Link
        to="/circles/$circleId/people"
        params={{ circleId: circle.id }}
        aria-label="Volver a Personas"
        className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-text transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-active lg:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>

      <header className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 lg:mt-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Avatar name={name} src={avatarUrl ?? undefined} size={56} decorative />

        <div className="min-w-0">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-h1 font-extrabold text-text lg:text-display"
          >
            {name}
          </h1>
          <p className="mt-1 text-body-sm text-muted">
            {photosCount === 0
              ? 'Todavía no aparece en ninguna foto'
              : formatPersonPhotosSummary(photosCount, albumsCount)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="secondary"
              disabled
              icon={<Download />}
              aria-describedby={downloadNoteId}
            >
              Descargar estas fotos
            </Button>
            <Link
              to="/circles/$circleId/people"
              params={{ circleId: circle.id }}
              className="text-body-sm font-semibold text-primary-text hover:underline"
            >
              Cambiar de persona
            </Link>
          </div>
          <span className="lg:hidden">
            <IconButton
              label="Descargar estas fotos"
              icon={<Download />}
              disabled
              aria-describedby={downloadNoteId}
            />
          </span>
        </div>

        <p id={downloadNoteId} className="sr-only">
          La descarga de estas fotos llegará en una próxima entrega.
        </p>
      </header>

      {photosCount > 0 ? (
        <div
          role="group"
          aria-label="Filtrar las fotos por álbum"
          className="mt-5 flex gap-2 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip selected={albumId === null} onClick={() => setAlbumId(null)}>
            Todos los álbumes
            <span className="tabular-nums text-muted">{photosCount}</span>
          </Chip>
          {albums.map((album) => (
            <Chip
              key={album.id}
              selected={albumId === album.id}
              onClick={() => setAlbumId(album.id)}
            >
              <span className="max-w-40 truncate">{album.title}</span>
              <span className="tabular-nums text-muted">{album.photosCount}</span>
            </Chip>
          ))}
        </div>
      ) : null}

      {noAccess ? (
        <div className="mt-8">
          <EmptyState
            icon={<Images />}
            iconShape="square"
            title="Estas fotos no están disponibles"
            description="Puede que la persona ya no forme parte del círculo o que hayas perdido el acceso."
            headingLevel={2}
            className="rounded-xl border border-dashed border-border-strong px-5 py-10"
            action={
              <LinkButton href={`${circlePath(circle.id)}/people`} variant="secondary">
                Volver a Personas
              </LinkButton>
            }
          />
        </div>
      ) : membersQuery.isPending && member === null && activeQuery.isPending ? (
        <div className="mt-6" aria-busy="true">
          <p role="status" className="sr-only">
            Cargando las fotos de esta persona…
          </p>
          <div
            aria-hidden="true"
            className="grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} shape="rect" className="aspect-square w-full rounded-md" />
            ))}
          </div>
        </div>
      ) : (
        <PhotoGrid
          label={
            selectedAlbum === null
              ? `Fotos de ${name}`
              : `Fotos de ${name} en ${selectedAlbum.title}`
          }
          photos={photos}
          total={albumId === null ? photosCount : undefined}
          loading={activeQuery.isPending}
          error={activeQuery.error}
          onRetry={() => {
            void activeQuery.refetch();
          }}
          hasNextPage={activeQuery.hasNextPage}
          loadingMore={activeQuery.isFetchingNextPage}
          onLoadMore={() => {
            void activeQuery.fetchNextPage();
          }}
          className="mt-4"
          empty={
            personEmpty ? (
              <EmptyState
                icon={<Tag />}
                iconShape="square"
                title={`Aún no hay fotos de ${name}`}
                description="Cuando alguien del círculo le etiquete en una foto, aparecerá aquí. Puedes hacerlo tú desde cualquier foto con «Etiquetar»."
                headingLevel={2}
                className="rounded-xl border border-dashed border-border-strong px-5 py-10"
                action={
                  <LinkButton href={circlePath(circle.id)} variant="secondary">
                    Ver los álbumes
                  </LinkButton>
                }
              />
            ) : emptyForAlbum ? (
              <EmptyState
                icon={<Images />}
                iconShape="square"
                title={`${name} no aparece en este álbum`}
                description="Prueba con otro álbum o vuelve a ver todas sus fotos."
                headingLevel={2}
                className="rounded-xl border border-dashed border-border-strong px-5 py-10"
                action={
                  <Button variant="secondary" onClick={() => setAlbumId(null)}>
                    Ver todas las fotos
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Images />}
                iconShape="square"
                title={`Aún no hay fotos de ${name}`}
                description="Cuando alguien del círculo le etiquete en una foto, aparecerá aquí."
                headingLevel={2}
                className="rounded-xl border border-dashed border-border-strong px-5 py-10"
                action={
                  <LinkButton href={circlePath(circle.id)} variant="secondary">
                    Ver los álbumes
                  </LinkButton>
                }
              />
            )
          }
        />
      )}

      {membersQuery.isError && !isNotFoundError(membersQuery.error) ? (
        <InlineAlert
          tone="warning"
          title="No hemos podido cargar todos los datos de la persona"
          description="Las fotos pueden seguir disponibles; vuelve a intentarlo en unos segundos."
          className="mt-6"
        />
      ) : null}
    </div>
  );
}
