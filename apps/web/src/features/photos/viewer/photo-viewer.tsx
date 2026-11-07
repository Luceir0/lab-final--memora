import type { PhotoDto, Role } from '@memora/shared';
import { Button, IconButton, InlineAlert, Skeleton, Spinner } from '@memora/ui';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';

import { useAlbumDetailQuery } from '../../albums/queries';
import {
  isNotFoundError,
  isUnauthorizedError,
  useUnauthorizedRedirect,
} from '../../circles/session';
import { formatPhotoDescription } from '../format';
import { flattenPhotoPages, useAlbumPhotosQuery } from '../queries';

import { formatPhotoPosition } from './format';
import { findPhotoNeighbours } from './navigation';
import { PhotoDetailsPanel } from './photo-details-panel';
import { originalImageUrl, usePhotoQuery } from './queries';
import { clearActivePhotoSelection } from './selection-bridge';
import { useViewerFocusTrap } from './use-viewer-focus-trap';

export interface PhotoViewerProps {
  readonly circleId: string;
  readonly albumId: string;
  readonly photoId: string;
  /**
   * `original` exige `membersCanDownload` en el círculo. Si es `false`, el
   * `srcset` se queda en `display` y no se pide una variante prohibida.
   */
  readonly allowOriginal?: boolean;
  /** Rol de la cuenta en el círculo. Decide si se ofrece editar metadatos. */
  readonly circleRole?: Role;
  /** Cuenta autenticada; `null` mientras `/me` carga. */
  readonly currentUserId?: string | null;
}

/** Umbral de swipe. Es un gesto, no una medida de diseño. */
const SWIPE_THRESHOLD = 48;

type ImageState = 'loading' | 'loaded' | 'failed';

/**
 * Visor de foto (F30).
 *
 * Una sola estructura para móvil y escritorio: fullscreen por defecto y modal
 * centrado desde 768 px, decidido con CSS. El foco queda atrapado mientras el
 * visor está abierto; al cerrar vuelve a la miniatura de origen.
 *
 * La navegación usa la lista del álbum que ya está en caché. Si se entra por
 * enlace directo, se carga la primera página; si la foto no está en ella, solo
 * se ofrece «volver» (limitación anotada en el handoff).
 */
export function PhotoViewer({
  circleId,
  albumId,
  photoId,
  allowOriginal = false,
  circleRole = 'member',
  currentUserId = null,
}: PhotoViewerProps) {
  const navigate = useNavigate();
  const photoQuery = usePhotoQuery(photoId);
  const albumQuery = useAlbumDetailQuery(albumId);
  const albumPhotosQuery = useAlbumPhotosQuery(albumId, null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [imageState, setImageState] = useState<ImageState>('loading');

  useUnauthorizedRedirect(photoQuery.error);
  useUnauthorizedRedirect(albumQuery.error);
  useUnauthorizedRedirect(albumPhotosQuery.error);

  const photos =
    albumPhotosQuery.data === undefined ? [] : flattenPhotoPages(albumPhotosQuery.data.pages);
  const { index, previous, next } = findPhotoNeighbours(photos, photoId);
  const total = albumQuery.data?.photosCount ?? (albumQuery.isError ? photos.length : undefined);
  const position = formatPhotoPosition(index, total);
  const albumTitle = albumQuery.data?.title ?? null;
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    setImageState('loading');
  }, [photoId]);

  // Bloquea el scroll del documento mientras el visor está abierto. La
  // galería sigue montada detrás y conserva su posición; el panel de detalles
  // mantiene su propio scroll.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Al cambiar de foto, los botones de navegación pueden desaparecer mientras
  // llega el detalle. El foco pasa al cierre para no quedarse en un nodo
  // desmontado.
  useEffect(() => {
    if (!photoQuery.isPending) {
      hasLoadedOnceRef.current = true;
      return;
    }

    if (hasLoadedOnceRef.current) {
      closeButtonRef.current?.focus();
    }
  }, [photoQuery.isPending]);

  const close = useCallback(() => {
    void navigate({
      to: '/circles/$circleId/albums/$albumId',
      params: { circleId, albumId },
      replace: true,
    });
  }, [albumId, circleId, navigate]);

  const goTo = useCallback(
    (photo: PhotoDto) => {
      void navigate({
        to: '/circles/$circleId/albums/$albumId/photos/$photoId',
        params: { circleId, albumId, photoId: photo.id },
        replace: true,
      });
    },
    [albumId, circleId, navigate],
  );

  const goPrevious = useCallback(() => {
    if (previous !== null) {
      goTo(previous);
    }
  }, [goTo, previous]);

  const goNext = useCallback(() => {
    if (next !== null) {
      goTo(next);
    }
  }, [goTo, next]);

  const onEscape = useCallback(() => {
    if (clearActivePhotoSelection()) {
      return;
    }

    close();
  }, [close]);

  useViewerFocusTrap({
    containerRef,
    initialFocusRef: closeButtonRef,
    onEscape,
    onPrevious: previous === null ? undefined : goPrevious,
    onNext: next === null ? undefined : goNext,
  });

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];

    touchStartRef.current = null;

    if (start === null || touch === undefined) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goNext();
      return;
    }

    goPrevious();
  };

  if (typeof document === 'undefined') {
    return null;
  }

  if (isUnauthorizedError(photoQuery.error) || isUnauthorizedError(albumQuery.error)) {
    return null;
  }

  const photo = photoQuery.data;
  const notFound = isNotFoundError(photoQuery.error);
  const genericError = photoQuery.isError && !notFound;
  const originalUrl =
    photo === undefined || !allowOriginal ? null : originalImageUrl(photo.displayUrl);
  const srcSet =
    photo === undefined || originalUrl === null || photo.width <= 1600
      ? photo === undefined
        ? undefined
        : `${photo.displayUrl} 1600w`
      : `${photo.displayUrl} 1600w, ${originalUrl} ${photo.width}w`;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de foto"
      data-testid="photo-viewer"
      tabIndex={-1}
      className="fixed inset-0 z-modal flex flex-col overscroll-contain bg-viewer-bg md:bg-viewer-bg/95 md:backdrop-blur-sm"
    >
      <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 md:px-6 md:py-4">
        <IconButton
          ref={closeButtonRef}
          label="Cerrar el visor"
          icon={<X />}
          variant="onMedia"
          onClick={close}
        />
        <p
          aria-live="polite"
          className="min-w-0 truncate text-center text-body-sm font-semibold text-on-primary md:text-left"
        >
          {position}
          {albumTitle === null ? null : <span className="hidden md:inline"> · {albumTitle}</span>}
        </p>
        <div className="justify-self-end">
          <span className="hidden text-caption text-on-primary/70 md:block">Esc para cerrar</span>
          <span aria-hidden="true" className="block size-11 md:hidden" />
        </div>
      </header>

      {photoQuery.isPending ? (
        <ViewerLoading position={position} albumTitle={albumTitle} />
      ) : notFound ? (
        <UnavailableState next={next} onNext={goNext} onClose={close} />
      ) : genericError ? (
        <div className="mx-auto flex w-full max-w-xl flex-1 items-center px-5 pb-10">
          <InlineAlert
            tone="danger"
            title="No hemos podido cargar la foto"
            description="Comprueba la conexión y vuelve a intentarlo."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void photoQuery.refetch();
                }}
              >
                Reintentar
              </Button>
            }
            className="w-full"
          />
        </div>
      ) : photo === undefined ? (
        <ViewerLoading position={position} albumTitle={albumTitle} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:mx-auto md:mb-6 md:w-full md:max-w-6xl md:flex-row md:overflow-hidden md:rounded-2xl md:border md:border-border-strong">
          <div
            data-testid="photo-viewer-media"
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden bg-viewer-bg"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {imageState === 'failed' ? (
              <ImageUnavailable next={next} onNext={goNext} onClose={close} />
            ) : (
              <>
                <img
                  src={photo.displayUrl}
                  srcSet={srcSet}
                  sizes="(min-width: 768px) 70vw, 100vw"
                  alt={formatPhotoDescription(photo)}
                  width={photo.width}
                  height={photo.height}
                  draggable={false}
                  decoding="async"
                  onLoad={() => {
                    setImageState('loaded');
                  }}
                  onError={() => {
                    setImageState('failed');
                  }}
                  className={
                    imageState === 'loaded'
                      ? 'max-h-full max-w-full object-contain opacity-100 transition-opacity duration-(--memora-duration-fast)'
                      : 'max-h-full max-w-full object-contain opacity-0 transition-opacity duration-(--memora-duration-fast)'
                  }
                />

                {imageState === 'loading' ? (
                  <div
                    aria-busy="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-viewer-bg/40"
                  >
                    <Spinner size="lg" label="Cargando foto…" className="text-on-primary" />
                  </div>
                ) : null}

                <IconButton
                  label="Foto anterior"
                  icon={<ChevronLeft />}
                  variant="onMedia"
                  disabled={previous === null}
                  onClick={goPrevious}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 md:left-4"
                />
                <IconButton
                  label="Foto siguiente"
                  icon={<ChevronRight />}
                  variant="onMedia"
                  disabled={next === null}
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 md:right-4"
                />
              </>
            )}
          </div>

          <PhotoDetailsPanel
            photo={photo}
            circleId={circleId}
            albumId={albumId}
            circleRole={circleRole}
            meId={currentUserId}
            canDownload={allowOriginal}
            onDeleted={close}
            className="flex max-h-[55dvh] shrink-0 flex-col overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 md:h-auto md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-t-0 md:p-6"
          />
        </div>
      )}
    </div>,
    document.body,
  );
}

interface ViewerLoadingProps {
  readonly position: string;
  readonly albumTitle: string | null;
}

function ViewerLoading({ position, albumTitle }: ViewerLoadingProps) {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col md:mx-auto md:mb-6 md:w-full md:max-w-6xl md:flex-row"
    >
      <p role="status" className="sr-only">
        Cargando {position.toLowerCase()}
        {albumTitle === null ? '' : ` de ${albumTitle}`}…
      </p>
      <div
        aria-hidden="true"
        className="flex min-h-0 flex-1 items-center justify-center bg-viewer-bg"
      >
        <Skeleton shape="rect" className="h-2/3 w-2/3 rounded-xl opacity-20" />
      </div>
      <div
        aria-hidden="true"
        className="max-h-[55dvh] shrink-0 space-y-4 overflow-hidden rounded-t-2xl border-t border-border bg-surface p-5 md:h-auto md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-t-0 md:p-6"
      >
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton shape="text" size="sm" className="w-32" />
            <Skeleton shape="text" size="sm" className="w-24" />
          </div>
        </div>
        <Skeleton shape="text" size="sm" className="w-full" />
        <Skeleton shape="text" size="sm" className="w-4/5" />
        <Skeleton shape="text" size="sm" className="w-2/3" />
      </div>
    </div>
  );
}

interface UnavailableStateProps {
  readonly next: PhotoDto | null;
  readonly onNext: () => void;
  readonly onClose: () => void;
}

function UnavailableState({ next, onNext, onClose }: UnavailableStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-6 py-10 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <span
          aria-hidden="true"
          className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-muted"
        >
          <ImageOff className="size-7" />
        </span>
        <h2 className="mt-5 text-h2 font-extrabold text-on-primary">
          Esta foto ya no está disponible
        </h2>
        <p className="mt-2 max-w-sm text-body-sm text-on-primary/80">
          Puede que quien la subió la haya borrado o que el enlace sea de un círculo al que ya no
          perteneces.
        </p>
      </div>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2 md:flex-row md:justify-center">
        {next === null ? null : (
          <Button onClick={onNext} icon={<ChevronRight />} fullWidth className="md:w-auto">
            Ver la siguiente
          </Button>
        )}
        <Button variant="secondary" onClick={onClose} fullWidth className="md:w-auto">
          Volver al álbum
        </Button>
      </div>
    </div>
  );
}

interface ImageUnavailableProps {
  readonly next: PhotoDto | null;
  readonly onNext: () => void;
  readonly onClose: () => void;
}

function ImageUnavailable({ next, onNext, onClose }: ImageUnavailableProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-muted"
      >
        <ImageOff className="size-6" />
      </span>
      <p className="text-h2 font-extrabold text-on-primary">Esta imagen no está disponible</p>
      <p className="max-w-sm text-body-sm text-on-primary/80">
        Puede que el archivo se haya movido o que no tengas permiso para verlo. Los datos de la foto
        siguen disponibles.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {next === null ? null : (
          <Button onClick={onNext} icon={<ChevronRight />}>
            Ver la siguiente
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Volver al álbum
        </Button>
      </div>
    </div>
  );
}
