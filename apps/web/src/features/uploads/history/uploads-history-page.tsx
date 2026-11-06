import type { MyUploadsCircleGroup } from '@memora/shared';
import { Button, EmptyState, InlineAlert, Skeleton } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { Images } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

import { PageContainer } from '../../../components/layout/page-container';
import { isUnauthorizedError, useUnauthorizedRedirect } from '../../circles/session';
import { UploadsInProgress } from '../uploads-in-progress';
import { AlbumFolder } from './album-folder';
import { formatUploadPhotoCount, formatUploadSummary } from './format';
import { UPLOADS_TITLE_ID } from './ids';
import { useUploadHistoryQuery } from './queries';

/**
 * `/uploads` — «Mis subidas».
 *
 * Solo pinta las fotos propias que devuelve el resumen, agrupadas por círculo y
 * carpeta. El guard de `_app` ya ha resuelto `/me`; esta página solo reacciona
 * a un `401` propio y a los estados de carga, vacío y error.
 */
export function UploadHistoryPage() {
  const summaryQuery = useUploadHistoryQuery();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useUnauthorizedRedirect(summaryQuery.error);

  // Al cambiar de ruta el foco se queda en el enlace de navegación. Se mueve al
  // título principal, que es el punto de partida del documento.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const unauthorized = isUnauthorizedError(summaryQuery.error);
  const loading = summaryQuery.isPending || unauthorized;
  const failed = summaryQuery.isError && !unauthorized && summaryQuery.data === undefined;
  const staleError = summaryQuery.isError && !unauthorized && summaryQuery.data !== undefined;
  const summary = summaryQuery.data;
  const hasPhotos = summary !== undefined && summary.circles.length > 0;
  const empty = summary !== undefined && summary.circles.length === 0;

  return (
    <PageContainer className="pb-32 pt-6 lg:py-10">
      <section aria-labelledby={UPLOADS_TITLE_ID}>
        <header className="mb-6 lg:mb-8">
          <p className="text-caption text-muted">Tus fotos</p>
          <h1
            ref={titleRef}
            id={UPLOADS_TITLE_ID}
            tabIndex={-1}
            className="mt-1 text-h1 font-extrabold text-text"
          >
            Subidas
          </h1>
          {loading ? (
            <div className="mt-2 h-6 w-40">
              <Skeleton shape="text" size="lg" />
            </div>
          ) : null}
          {summary !== undefined && summary.total > 0 ? (
            <p className="mt-2 break-words text-body text-muted [overflow-wrap:anywhere]">
              {formatUploadSummary(summary)}
            </p>
          ) : null}
        </header>

        <UploadsInProgress />

        {staleError ? (
          <InlineAlert
            tone="warning"
            title="No hemos podido actualizar tus subidas"
            description="Sigues viendo los datos de la última carga."
            className="mb-6"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void summaryQuery.refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        ) : null}

        {loading ? <UploadHistoryLoading /> : null}

        {failed ? (
          <InlineAlert
            tone="danger"
            title="No hemos podido cargar tus subidas"
            description="Tus fotos siguen a salvo. Parece un problema de conexión o del servidor: vuelve a intentarlo en unos segundos."
            className="mx-auto max-w-xl"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void summaryQuery.refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        ) : null}

        {empty && !loading && !failed ? <UploadHistoryEmpty /> : null}

        {hasPhotos && summary !== undefined ? (
          <div className="flex flex-col gap-8 lg:gap-10">
            {summary.circles.map((group) => (
              <CircleUploads key={group.circle.id} group={group} />
            ))}
          </div>
        ) : null}
      </section>
    </PageContainer>
  );
}

interface CircleUploadsProps {
  readonly group: MyUploadsCircleGroup;
}

function CircleUploads({ group }: CircleUploadsProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 id={headingId} className="break-words text-h2 font-bold text-text">
            {group.circle.name}
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            {formatUploadPhotoCount(group.photosCount)}
          </p>
        </div>

        <Link
          to="/circles/$circleId"
          params={{ circleId: group.circle.id }}
          className="inline-flex min-h-11 items-center rounded-md text-body-sm font-semibold text-primary-text hover:underline"
        >
          Ver círculo
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {group.albums.map((album) => (
          <AlbumFolder key={album.album.id} circleId={group.circle.id} group={album} />
        ))}
      </ul>
    </section>
  );
}

function UploadHistoryEmpty() {
  return (
    <section className="rounded-xl border border-dashed border-border-strong bg-surface p-6 shadow-sm lg:p-10">
      <EmptyState
        icon={<Images />}
        iconShape="square"
        title="Aún no has subido fotos"
        description="Cuando subas fotos desde un álbum, aparecerán aquí agrupadas por círculo y carpeta."
        action={
          <Link
            to="/circles"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-body-sm font-semibold text-on-primary transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-primary-hover active:bg-primary-active"
          >
            Mis círculos
          </Link>
        }
      />
    </section>
  );
}

function UploadHistoryLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando tus subidas…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-8">
        {[0, 1].map((section) => (
          <div key={section}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="w-40">
                  <Skeleton shape="text" size="lg" />
                </div>
                <div className="mt-2 w-24">
                  <Skeleton shape="text" size="sm" />
                </div>
              </div>
              <div className="w-20">
                <Skeleton shape="text" size="sm" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:gap-4 sm:p-4"
                >
                  <div className="size-16 shrink-0 sm:size-20">
                    <Skeleton shape="rect" className="size-full rounded-md" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="w-2/3">
                      <Skeleton shape="text" size="md" />
                    </div>
                    <div className="w-1/2">
                      <Skeleton shape="text" size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
