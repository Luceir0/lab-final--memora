import type { AlbumDto, CircleDetailDto } from '@memora/shared';
import {
  Breadcrumb,
  Button,
  ConfirmDialog,
  EmptyState,
  InlineAlert,
  LinkButton,
  Menu,
  Skeleton,
  Toast,
  ToastViewport,
  type MenuItem,
} from '@memora/ui';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Download, Eraser, ImagePlus, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';

import { useCircleDetail } from '../circles/circle-detail-context';
import { circlePath } from '../circles/paths';
import { useMeQuery } from '../circles/queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from '../circles/session';
import { AlbumGallery } from '../photos/album-gallery';
import { DownloadJobToast } from '../photos/downloads/download-job-toast';
import { formatAlbumDownloadWarning, formatDownloadWarningTitle } from '../photos/downloads/format';
import { canDownloadPhotos } from '../photos/downloads/permissions';
import { useDownloadJobController } from '../photos/downloads/use-download-job';
import { UploadDropzone } from '../uploads/upload-dropzone';
import { UploadSourcePicker } from '../uploads/upload-source-picker';
import { useUploadQueue } from '../uploads/upload-queue-context';
import type { UploadSource } from '../uploads/types';

import { AlbumFormDialog } from './album-form-dialog';
import { getAlbumsErrorCopy, isAlbumNotEmptyError } from './errors';
import {
  formatAlbumMonth,
  formatAlbumPhotos,
  formatDeletedPhotos,
  formatWillDeletePhotos,
} from './format';
import { canEditAlbum, canManageAlbum, canUploadPhotos } from './permissions';
import { useAlbumDetailQuery, useDeleteAlbumMutation, useEmptyAlbumMutation } from './queries';

export interface AlbumDetailPageProps {
  readonly circleId: string;
  readonly albumId: string;
}

interface ToastState {
  readonly title: string;
  readonly description?: string | undefined;
}

/**
 * Detalle de un álbum.
 *
 * El layout del círculo detecta esta ruta y no pinta héroe, cabecera compacta
 * ni pestañas (D7); aquí vive la página completa con migas, cabecera y
 * contenido. La galería real (F29) se monta dentro de `AlbumContent`.
 */
export function AlbumDetailPage({ circleId, albumId }: AlbumDetailPageProps) {
  const { circle } = useCircleDetail();
  const detailQuery = useAlbumDetailQuery(albumId);
  const meQuery = useMeQuery();
  const router = useRouter();
  const emptyMutation = useEmptyAlbumMutation(albumId, circle.id);
  const deleteMutation = useDeleteAlbumMutation(albumId, circle.id);
  const { enqueue, items: uploadItems, isPanelOpen } = useUploadQueue();
  const download = useDownloadJobController({ albumId });
  const canDownload = canDownloadPhotos(circle);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const focusEmptyRef = useRef(false);
  const wasErrorRef = useRef(false);
  const previousPhotosCountRef = useRef<number | null>(null);

  const [editing, setEditing] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useUnauthorizedRedirect(detailQuery.error);
  useUnauthorizedRedirect(meQuery.error);
  useUnauthorizedRedirect(emptyMutation.error);
  useUnauthorizedRedirect(deleteMutation.error);

  const album = detailQuery.data;
  const meId = meQuery.data?.user.id ?? null;
  const canUpload = canUploadPhotos(circle);
  const canEdit = album === undefined ? false : canEditAlbum(circle, album, meId);

  const handleUploadFiles = (files: readonly File[], source: UploadSource): void => {
    if (!canUpload || album === undefined || files.length === 0) {
      return;
    }

    enqueue(files, { albumId, albumTitle: album.title, source });
  };

  useEffect(() => {
    if (album === undefined || (album.circleId === circleId && album.circleId === circle.id)) {
      return;
    }

    void router.navigate({
      to: '/circles/$circleId/albums/$albumId',
      params: { circleId: album.circleId, albumId: album.id },
      replace: true,
    });
  }, [album, circle.id, circleId, router]);

  // Si el usuario reintenta tras un error y el foco se ha quedado en `body`
  // porque el botón de reintento desapareció, lo devolvemos al título.
  useEffect(() => {
    if (detailQuery.isError) {
      wasErrorRef.current = true;
      return;
    }

    if (detailQuery.isSuccess && wasErrorRef.current) {
      wasErrorRef.current = false;

      if (document.activeElement === document.body) {
        titleRef.current?.focus();
      }
    }
  }, [detailQuery.isError, detailQuery.isSuccess, titleRef]);

  useEffect(() => {
    if (!focusEmptyRef.current || album?.photosCount !== 0) {
      return;
    }

    focusEmptyRef.current = false;
    const frame = window.requestAnimationFrame(() => emptyRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, [album?.photosCount]);

  // Si el álbum se queda sin fotos por otra vía mientras el diálogo está
  // abierto, no lo dejamos abierto. No se aplica al 409 con caché obsoleta:
  // allí el recuento anterior ya era 0 y el diálogo debe abrirse igualmente.
  useEffect(() => {
    const previous = previousPhotosCountRef.current;
    previousPhotosCountRef.current = album?.photosCount ?? null;

    if (emptyOpen && previous !== null && previous > 0 && album?.photosCount === 0) {
      setEmptyOpen(false);
    }
  }, [album?.photosCount, emptyOpen]);

  const confirmEmpty = async () => {
    if (emptyMutation.isPending) {
      return;
    }

    try {
      const { deletedCount } = await emptyMutation.mutateAsync();

      setEmptyOpen(false);
      focusEmptyRef.current = true;
      // Si el álbum ya estaba vacío, `photosCount` no cambia y el efecto de
      // abajo no se dispara: el frame siguiente enfoca el estado vacío.
      window.requestAnimationFrame(() => emptyRef.current?.focus());
      setToast({
        title: 'Álbum vaciado',
        description:
          deletedCount === 0 ? 'El álbum ya estaba vacío.' : formatDeletedPhotos(deletedCount),
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteMutation.isPending) {
      return;
    }

    try {
      await deleteMutation.mutateAsync();
      setDeleteOpen(false);

      void router.navigate({
        to: '/circles/$circleId',
        params: { circleId: circle.id },
        search: { albumDeleted: true },
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }
    }
  };

  const confirmAlbumDownload = () => {
    // El controlador bloquea el doble job de forma síncrona; aquí solo
    // cerramos el aviso antes de arrancar para no dejar dos diálogos vivos.
    setDownloadOpen(false);
    download.start();
  };

  const openEmptyAfterNotEmpty = async () => {
    try {
      // El 409 puede llegar con un recuento cacheado obsoleto: refrescamos
      // antes de abrir la confirmación. Si falla, el servidor decidirá.
      await detailQuery.refetch();
    } finally {
      setDeleteOpen(false);
      deleteMutation.reset();
      emptyMutation.reset();
      setEmptyOpen(true);
    }
  };

  if (isUnauthorizedError(detailQuery.error)) {
    return <AlbumDetailLoading />;
  }

  if (isNotFoundError(detailQuery.error)) {
    return <AlbumNoAccess />;
  }

  if (detailQuery.isError) {
    return (
      <AlbumDetailError
        error={detailQuery.error}
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    );
  }

  if (detailQuery.isPending || album === undefined) {
    return <AlbumDetailLoading />;
  }

  if (album.circleId !== circleId || album.circleId !== circle.id) {
    return <AlbumDetailLoading />;
  }

  const deleteError = deleteMutation.isError ? deleteMutation.error : null;
  const deleteNotEmpty = deleteError !== null && isAlbumNotEmptyError(deleteError);
  const emptyErrorCopy =
    emptyMutation.isError && !isUnauthorizedError(emptyMutation.error)
      ? getAlbumsErrorCopy(emptyMutation.error, 'empty')
      : null;
  const deleteErrorCopy =
    deleteError !== null && !isUnauthorizedError(deleteError)
      ? getAlbumsErrorCopy(deleteError, 'delete')
      : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-6 pt-6 lg:px-8 lg:pb-10 lg:pt-10">
      <UploadDropzone
        albumTitle={album.title}
        enabled={canUpload}
        onFiles={(files) => {
          handleUploadFiles(files, 'desktop');
        }}
      />

      <AlbumHeader
        album={album}
        circle={circle}
        meId={meId}
        titleRef={titleRef}
        canUpload={canUpload}
        canDownload={canDownload}
        downloading={download.isGenerating}
        onDownloadAlbum={() => {
          setDownloadOpen(true);
        }}
        onFiles={handleUploadFiles}
        onEdit={() => {
          setEditing(true);
        }}
        onEmpty={() => {
          emptyMutation.reset();
          setEmptyOpen(true);
        }}
        onDelete={() => {
          deleteMutation.reset();
          setDeleteOpen(true);
        }}
      />

      <AlbumContent
        album={album}
        circleRole={circle.role}
        meId={meId}
        emptyRef={emptyRef}
        canUpload={canUpload}
        canDownload={canDownload}
        downloading={download.isGenerating}
        onDownloadSelection={(photoIds) => {
          download.start({ photoIds });
        }}
        onFiles={handleUploadFiles}
      />

      {canUpload && album.photosCount > 0 ? (
        <div className="lg:hidden" data-upload-fab="">
          <UploadSourcePicker
            albumTitle={album.title}
            onFiles={handleUploadFiles}
            icon={<Plus />}
            className={`fixed right-[max(1.5rem,env(safe-area-inset-right))] z-nav rounded-full! shadow-lg ${
              uploadItems.length > 0 && !isPanelOpen
                ? 'bottom-[calc(var(--app-bottom-nav-height)+var(--upload-queue-bar-height)+0.75rem)]'
                : 'bottom-[calc(var(--app-bottom-nav-height)+1rem)]'
            }`}
          >
            Subir fotos
          </UploadSourcePicker>
        </div>
      ) : null}

      <AlbumFormDialog
        open={editing}
        mode="edit"
        circle={circle}
        album={album}
        onClose={() => {
          setEditing(false);
        }}
        canEditCover={canEdit}
        onSaved={(saved) => {
          setEditing(false);
          setToast({
            title: 'Álbum actualizado',
            description: `Los cambios de «${saved.title}» ya están guardados.`,
          });
        }}
        fallbackFocusRef={titleRef}
      />

      <ConfirmDialog
        open={emptyOpen}
        onClose={() => {
          if (!emptyMutation.isPending) {
            setEmptyOpen(false);
          }
        }}
        onConfirm={() => {
          void confirmEmpty();
        }}
        title="Vaciar álbum"
        description={
          album.photosCount === 0
            ? 'El álbum ya está vacío. No se eliminará ninguna foto.'
            : `${formatWillDeletePhotos(album.photosCount)} de «${album.title}» y sus etiquetas. Esta acción no se puede deshacer.`
        }
        confirmLabel="Vaciar álbum"
        danger
        dismissible={!emptyMutation.isPending}
        loading={emptyMutation.isPending}
      >
        {emptyErrorCopy === null ? null : (
          <InlineAlert
            tone="danger"
            title={emptyErrorCopy.title}
            description={emptyErrorCopy.description}
          />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
        title="Eliminar álbum"
        description={`El álbum «${album.title}» se eliminará para siempre.`}
        confirmLabel="Eliminar álbum"
        danger
        dismissible={!deleteMutation.isPending}
        loading={deleteMutation.isPending}
      >
        {deleteErrorCopy === null ? null : (
          <InlineAlert
            tone="danger"
            title={deleteErrorCopy.title}
            description={deleteErrorCopy.description}
            action={
              deleteNotEmpty ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void openEmptyAfterNotEmpty();
                  }}
                >
                  Vaciar álbum
                </Button>
              ) : undefined
            }
          />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={downloadOpen}
        onClose={() => {
          setDownloadOpen(false);
        }}
        onConfirm={confirmAlbumDownload}
        title={formatDownloadWarningTitle(album.photosCount)}
        description={formatAlbumDownloadWarning(album.photosCount)}
        confirmLabel="Generar ZIP"
      />

      {toast === null && download.status === 'idle' ? null : (
        <ToastViewport>
          {toast === null ? null : (
            <Toast
              tone="success"
              title={toast.title}
              description={toast.description}
              duration={6000}
              onClose={() => {
                setToast(null);
              }}
            />
          )}
          <DownloadJobToast controller={download} />
        </ToastViewport>
      )}
    </div>
  );
}

interface AlbumHeaderProps {
  readonly album: AlbumDto;
  readonly circle: CircleDetailDto;
  readonly meId: string | null;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  readonly canUpload: boolean;
  readonly canDownload: boolean;
  readonly downloading: boolean;
  readonly onDownloadAlbum: () => void;
  readonly onFiles: (files: readonly File[], source: UploadSource) => void;
  readonly onEdit: () => void;
  readonly onEmpty: () => void;
  readonly onDelete: () => void;
}

function AlbumHeader({
  album,
  circle,
  meId,
  titleRef,
  canUpload,
  canDownload,
  downloading,
  onDownloadAlbum,
  onFiles,
  onEdit,
  onEmpty,
  onDelete,
}: AlbumHeaderProps) {
  const actionsNoteId = useId();
  const canEdit = canEditAlbum(circle, album, meId);
  const canManage = canManageAlbum(circle, album, meId);

  const items: MenuItem[] = [];

  if (canDownload && album.photosCount > 0) {
    items.push({
      label: 'Descargar álbum',
      icon: <Download />,
      disabled: downloading,
      onSelect: onDownloadAlbum,
    });
  }

  if (canEdit) {
    items.push({ label: 'Editar álbum', icon: <Pencil />, onSelect: onEdit });
  }

  if (canManage) {
    if (album.photosCount > 0) {
      items.push({ label: 'Vaciar álbum', icon: <Eraser />, onSelect: onEmpty });
    }

    items.push({
      label: 'Eliminar álbum',
      icon: <Trash2 />,
      danger: true,
      onSelect: onDelete,
    });
  }

  const downloadDisabledReason = !canDownload
    ? 'La descarga está desactivada en este círculo.'
    : album.photosCount === 0
      ? 'Este álbum todavía no tiene fotos que descargar.'
      : undefined;

  return (
    <header>
      <div className="hidden lg:block">
        <Breadcrumb
          label="Ruta del álbum"
          items={[
            { label: 'Mis círculos', href: '/circles' },
            { label: circle.name, href: circlePath(circle.id) },
            { label: album.title },
          ]}
        />
      </div>

      <Link
        to="/circles/$circleId"
        params={{ circleId: circle.id }}
        aria-label="Volver a los álbumes del círculo"
        className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-text transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface-active lg:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 lg:mt-6">
        <div className="min-w-0">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-h1 font-extrabold text-text lg:text-display"
          >
            {album.title}
          </h1>

          {album.description ? (
            <p className="mt-2 max-w-prose text-body text-muted">{album.description}</p>
          ) : null}

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-muted">
            <span>{circle.name}</span>
            <span aria-hidden="true">·</span>
            <span>{formatAlbumMonth(album.date) ?? 'Sin fecha'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatAlbumPhotos(album.photosCount)}</span>
          </p>

          <p className="mt-1 text-caption text-muted">Creado por {album.createdBy.name}</p>
        </div>

        <div className="flex items-start gap-2">
          <div className="hidden flex-wrap gap-2 lg:flex">
            <Button
              variant="secondary"
              disabled={downloadDisabledReason !== undefined}
              loading={downloading}
              icon={<Download />}
              aria-describedby={downloadDisabledReason === undefined ? undefined : actionsNoteId}
              onClick={onDownloadAlbum}
            >
              Descargar álbum
            </Button>
            {canUpload ? <UploadSourcePicker albumTitle={album.title} onFiles={onFiles} /> : null}
          </div>
          {items.length === 0 ? null : (
            <Menu label="Acciones del álbum" items={items} align="end" />
          )}
        </div>

        {downloadDisabledReason === undefined ? null : (
          <p id={actionsNoteId} className="text-caption text-muted lg:col-span-2">
            {downloadDisabledReason}
          </p>
        )}
      </div>
    </header>
  );
}

interface AlbumContentProps {
  readonly album: AlbumDto;
  readonly circleRole: CircleDetailDto['role'];
  readonly meId: string | null;
  readonly emptyRef: RefObject<HTMLDivElement | null>;
  readonly canUpload: boolean;
  readonly canDownload: boolean;
  readonly downloading: boolean;
  readonly onDownloadSelection: (photoIds: readonly string[]) => void;
  readonly onFiles: (files: readonly File[], source: UploadSource) => void;
}

function AlbumContent({
  album,
  circleRole,
  meId,
  emptyRef,
  canUpload,
  canDownload,
  downloading,
  onDownloadSelection,
  onFiles,
}: AlbumContentProps) {
  if (album.photosCount === 0) {
    return (
      <div ref={emptyRef} tabIndex={-1} role="region" aria-label="Álbum vacío" className="mt-8">
        <EmptyState
          icon={<ImagePlus />}
          iconShape="square"
          title="Este álbum todavía no tiene fotos"
          description={
            canUpload
              ? 'Sube las primeras desde la galería o la cámara. Las verá todo el círculo.'
              : 'Las subidas están desactivadas en este círculo. Pídele a quien lo creó que las active.'
          }
          headingLevel={2}
          className="rounded-xl border border-dashed border-border-strong px-5 py-10"
          action={
            canUpload ? (
              <UploadSourcePicker albumTitle={album.title} onFiles={onFiles} />
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <AlbumGallery
      album={album}
      circleRole={circleRole}
      meId={meId}
      canDownload={canDownload}
      downloading={downloading}
      onDownload={onDownloadSelection}
    />
  );
}

function AlbumNoAccess() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Álbum no disponible
      </h1>
      <EmptyState
        icon={<Images />}
        iconShape="square"
        title="Este álbum no existe o ya no tienes acceso"
        description="Puede que lo hayan eliminado o que tu cuenta ya no forme parte del círculo."
        headingLevel={2}
        className="rounded-xl border border-dashed border-border-strong px-5 py-10"
        action={
          <LinkButton href="/circles" variant="secondary">
            Volver a Mis círculos
          </LinkButton>
        }
      />
    </div>
  );
}

interface AlbumDetailErrorProps {
  readonly error: unknown;
  readonly onRetry: () => void;
}

function AlbumDetailError({ error, onRetry }: AlbumDetailErrorProps) {
  const copy = getAlbumsErrorCopy(error, 'detail');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        No hemos podido cargar el álbum
      </h1>
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
    </div>
  );
}

function AlbumDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-10">
      <div aria-busy="true">
        <h1 className="sr-only">Cargando el álbum</h1>
        <p role="status" className="sr-only">
          Cargando el álbum…
        </p>
        <div aria-hidden="true">
          <Skeleton shape="text" size="sm" className="w-48" />
          <Skeleton shape="text" size="lg" className="mt-6 w-2/3" />
          <Skeleton shape="text" size="sm" className="mt-3 w-1/2" />
          <div className="mt-6 flex gap-2">
            <Skeleton shape="rect" className="h-11 w-36 rounded-md" />
            <Skeleton shape="rect" className="h-11 w-28 rounded-md" />
          </div>
          <Skeleton shape="rect" className="mt-8 h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
