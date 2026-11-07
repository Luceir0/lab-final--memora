import type { AlbumDto, PhotoSummary } from '@memora/shared';
import { Button, EmptyState, InlineAlert, ResponsiveDialog, Skeleton } from '@memora/ui';
import { ArrowLeft, Images } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { formatAlbumPhotos } from '../albums/format';
import { flattenAlbumPages, useAlbumListQuery } from '../albums/queries';
import { CircleCover } from '../circles/circle-cover';
import { useUnauthorizedRedirect } from '../circles/session';
import { formatPhotoDescription } from '../photos/format';

import { toPhotoSummary } from './cover-photo';
import { CoverPhotoPicker } from './cover-photo-picker';
import { useCoverAlbumPhotos } from './use-cover-album-photos';

export interface CircleCoverPickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly circleId: string;
  /** Portada actual o elegida en el borrador, para marcarla al abrir. */
  readonly selectedPhoto: PhotoSummary | null;
  /** Texto de la selección inicial: «Portada actual», «Portada elegida»… */
  readonly selectedPhotoLabel?: string | undefined;
  readonly onSelect: (photo: PhotoSummary) => void;
}

/**
 * Selector de portada del círculo.
 *
 * No existe `GET /circles/:circleId/photos`: se navega primero por los álbumes
 * del círculo y después por las fotos del álbum elegido, reutilizando las
 * consultas de F24 y F29. La selección es local; solo se aplica al borrador de
 * Ajustes al confirmar, y se guarda con «Guardar cambios».
 */
export function CircleCoverPickerDialog({
  open,
  onClose,
  circleId,
  selectedPhoto,
  selectedPhotoLabel,
  onSelect,
}: CircleCoverPickerDialogProps) {
  const albumsHeadingId = useId();
  const albumsHeadingRef = useRef<HTMLHeadingElement>(null);
  const photosHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef<'albums' | 'photos'>('albums');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [selection, setSelection] = useState<PhotoSummary | null>(selectedPhoto);
  const [selectionLabel, setSelectionLabel] = useState<string>(
    selectedPhoto === null ? '' : (selectedPhotoLabel ?? 'Foto seleccionada'),
  );

  const albumsQuery = useAlbumListQuery(circleId, open && albumId === null);
  const { query: photosQuery, photos } = useCoverAlbumPhotos(albumId, open && albumId !== null);

  useUnauthorizedRedirect(albumsQuery.error);
  useUnauthorizedRedirect(photosQuery.error);

  useEffect(() => {
    if (!open) {
      previousStepRef.current = 'albums';
      return;
    }

    setAlbumId(null);
    setSelection(selectedPhoto);
    setSelectionLabel(selectedPhoto === null ? '' : (selectedPhotoLabel ?? 'Foto seleccionada'));
  }, [open, selectedPhoto, selectedPhotoLabel]);

  /*
   * El paso cambia dentro del mismo diálogo: al entrar en un álbum el foco va
   * al encabezado de fotos y al volver al de álbumes. En la apertura inicial no
   * se mueve, para no robarle el foco al título del diálogo.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (albumId === null) {
        if (previousStepRef.current === 'photos') {
          albumsHeadingRef.current?.focus();
        }
      } else {
        photosHeadingRef.current?.focus();
      }

      previousStepRef.current = albumId === null ? 'albums' : 'photos';
    });

    return () => window.cancelAnimationFrame(frame);
  }, [albumId, open]);

  const albums = albumsQuery.isSuccess ? flattenAlbumPages(albumsQuery.data.pages) : [];
  const albumsWithPhotos = albums.some((album) => album.photosCount > 0);
  const selectedAlbum =
    albumId === null ? null : (albums.find((album) => album.id === albumId) ?? null);

  const confirm = () => {
    if (selection === null) {
      return;
    }

    onSelect(selection);
    onClose();
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="Elegir portada del círculo"
      description="Elige una foto de los álbumes del círculo. Se guardará con «Guardar cambios»."
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-3">
          {selection === null ? (
            <p className="text-caption text-muted">Elige una foto para usarla como portada.</p>
          ) : (
            <div className="flex items-center gap-3" data-testid="cover-selection">
              <img
                src={selection.thumbUrl}
                alt=""
                width={selection.width}
                height={selection.height}
                className="size-11 shrink-0 rounded-md object-cover"
              />
              <p aria-live="polite" className="min-w-0 text-body-sm text-text">
                {selectionLabel}
              </p>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={selection === null}>
              Usar esta foto
            </Button>
          </div>
        </div>
      }
    >
      {albumId === null ? (
        <section aria-labelledby={albumsHeadingId}>
          <h2
            id={albumsHeadingId}
            ref={albumsHeadingRef}
            tabIndex={-1}
            className="text-h3 font-bold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Álbumes del círculo
          </h2>

          {albumsQuery.isPending ? <AlbumsLoading /> : null}

          {albumsQuery.isError ? (
            <InlineAlert
              tone="danger"
              title="No hemos podido cargar los álbumes"
              description="Comprueba la conexión y vuelve a intentarlo."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    void albumsQuery.refetch();
                  }}
                >
                  Reintentar
                </Button>
              }
            />
          ) : null}

          {albumsQuery.isSuccess && albums.length === 0 ? (
            <EmptyState
              icon={<Images />}
              iconShape="square"
              title="Todavía no hay álbumes"
              description="Crea un álbum y sube fotos para poder elegir una portada."
              headingLevel={2}
              className="rounded-xl border border-dashed border-border-strong px-5 py-10"
            />
          ) : null}

          {albumsQuery.isSuccess &&
          albums.length > 0 &&
          !albumsWithPhotos &&
          !albumsQuery.hasNextPage ? (
            <p className="mt-2 text-body-sm text-muted">
              Ningún álbum tiene fotos todavía. Sube fotos a uno para poder elegir una portada.
            </p>
          ) : null}

          {albumsQuery.isSuccess && albums.length > 0 ? (
            <>
              <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                {albums.map((album) => (
                  <li key={album.id}>
                    <AlbumOption album={album} onOpen={() => setAlbumId(album.id)} />
                  </li>
                ))}
              </ul>

              {albumsQuery.hasNextPage ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    loading={albumsQuery.isFetchingNextPage}
                    onClick={() => {
                      void albumsQuery.fetchNextPage().then(
                        (result) => {
                          if (!result.hasNextPage) {
                            window.requestAnimationFrame(() => {
                              albumsHeadingRef.current?.focus();
                            });
                          }
                        },
                        () => undefined,
                      );
                    }}
                  >
                    Cargar más álbumes
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : (
        <section aria-label="Fotos del álbum elegido">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Button variant="ghost" size="sm" icon={<ArrowLeft />} onClick={() => setAlbumId(null)}>
              Volver a los álbumes
            </Button>
            <div className="min-w-0 text-right">
              <h2
                ref={photosHeadingRef}
                tabIndex={-1}
                className="text-h3 font-bold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Fotos del álbum
              </h2>
              <p className="text-body-sm text-muted">{selectedAlbum?.title ?? ''}</p>
            </div>
          </div>

          <CoverPhotoPicker
            label="Fotos del álbum para la portada"
            photos={photos}
            selectedId={selection?.id ?? null}
            loading={photosQuery.isPending}
            error={photosQuery.isError ? photosQuery.error : null}
            onRetry={() => {
              void photosQuery.refetch();
            }}
            hasNextPage={photosQuery.hasNextPage}
            loadingMore={photosQuery.isFetchingNextPage}
            onLoadMore={() => {
              void photosQuery.fetchNextPage();
            }}
            total={selectedAlbum?.photosCount}
            onSelect={(photo) => {
              setSelection(toPhotoSummary(photo));
              setSelectionLabel(formatPhotoDescription(photo));
            }}
            onClear={() => {
              setSelection(null);
              setSelectionLabel('');
            }}
            empty={
              <EmptyState
                icon={<Images />}
                iconShape="square"
                title="Este álbum no tiene fotos"
                description="Elige otro álbum del círculo."
                headingLevel={2}
                className="rounded-xl border border-dashed border-border-strong px-5 py-10"
              />
            }
            className="mt-4"
          />
        </section>
      )}
    </ResponsiveDialog>
  );
}

interface AlbumOptionProps {
  readonly album: AlbumDto;
  readonly onOpen: () => void;
}

function AlbumOption({ album, onOpen }: AlbumOptionProps) {
  const empty = album.photosCount === 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={empty}
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors duration-(--memora-duration-fast) ease-standard not-disabled:hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CircleCover
        name={album.title}
        photo={album.coverPhoto}
        className="aspect-[4/3] w-full"
        initialsClassName="text-h2"
      />
      <span className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-body-sm font-semibold text-text">{album.title}</span>
        <span className="text-caption text-muted">
          {empty ? 'Sin fotos' : formatAlbumPhotos(album.photosCount)}
        </span>
      </span>
    </button>
  );
}

function AlbumsLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando álbumes…
      </p>
      <ul aria-hidden="true" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="overflow-hidden rounded-lg border border-border">
            <Skeleton shape="rect" className="aspect-[4/3] w-full rounded-none" />
            <div className="p-3">
              <Skeleton shape="text" size="sm" className="w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
