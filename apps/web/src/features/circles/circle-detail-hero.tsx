import type { CircleDetailDto } from '@memora/shared';
import { Button, VisuallyHidden } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, FolderPlus, UserPlus, UsersRound } from 'lucide-react';
import { useId, useState, type Ref } from 'react';

import { cx } from '../../components/layout/class-names';
import { formatPendingLabel } from '../members/format';

import { CircleCover } from './circle-cover';
import { formatCircleStats, formatRelativeDate } from './format';

export interface CircleDetailHeroProps {
  readonly circle: CircleDetailDto;
  /** `false` cuando la cabecera compacta ya sustituye al héroe. */
  readonly compact: boolean;
  readonly heroRef: Ref<HTMLElement>;
  readonly titleRef?: Ref<HTMLHeadingElement> | undefined;
  /** Abre el diálogo de invitación. Solo el owner lo recibe. */
  readonly onInvite?: (() => void) | undefined;
  /** Invitaciones pendientes visibles para el owner. */
  readonly pendingCount?: number | undefined;
  /** Hay más de una página de pendientes: se anuncia «100+». */
  readonly pendingOverflow?: boolean | undefined;
}

/**
 * Héroe del detalle.
 *
 * Un solo bloque de título cambia de tarjeta solapada en móvil a contenido
 * sobre la portada en escritorio. `Invitar` está activo para el owner desde
 * F22; la creación de álbumes sigue deshabilitada hasta F24 y su nota solo
 * habla de álbumes.
 */
export function CircleDetailHero({
  circle,
  compact,
  heroRef,
  titleRef,
  onInvite,
  pendingCount,
  pendingOverflow = false,
}: CircleDetailHeroProps) {
  const titleId = useId();
  const albumNoteId = useId();
  // El scrim de escritorio solo tiene sentido sobre una foto. Si no hay
  // portada —o la imagen falla y se ve el degradado de reserva— se retira y
  // el texto pasa a los tonos normales para no quedar blanco sobre claro.
  const coverUrl = circle.coverPhoto?.thumbUrl ?? null;
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const showCoverScrim = coverUrl !== null && failedCoverUrl !== coverUrl;
  const desktopTitleTone = showCoverScrim ? 'lg:text-on-primary' : 'lg:text-text';
  const desktopMutedTone = showCoverScrim ? 'lg:text-on-primary' : 'lg:text-muted';
  const lastUpload = circle.stats.lastUploadAt;
  const isFreshWithoutUploads =
    circle.stats.membersCount === 1 &&
    circle.stats.photosCount === 0 &&
    circle.stats.albumsCount === 0;
  const createdLabel = formatRelativeDate(circle.createdAt).toLocaleLowerCase('es-ES');
  const lastUploadLabel =
    lastUpload === null ? '' : formatRelativeDate(lastUpload).toLocaleLowerCase('es-ES');
  const pendingLabel =
    pendingCount === undefined || pendingCount === 0
      ? null
      : formatPendingLabel(pendingCount, pendingOverflow);

  return (
    <section ref={heroRef} aria-labelledby={titleId} className="relative">
      <CircleCover
        name={circle.name}
        photo={circle.coverPhoto}
        className="aspect-[2/1] w-full lg:aspect-[16/5]"
        initialsClassName="text-display"
        onImageError={() => setFailedCoverUrl(coverUrl)}
      />

      {compact ? null : (
        <Link
          to="/circles"
          aria-label="Volver a mis círculos"
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+0.75rem)] flex size-11 items-center justify-center rounded-full bg-surface/90 text-text shadow-md backdrop-blur-sm transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-surface lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
      )}

      {/*
       * El scrim de escritorio usa `viewer-bg` (oscuro en ambos temas) para
       * que el texto pequeño sobre una foto clara mantenga contraste. Sin
       * foto se omite: encima del degradado de reserva las iniciales y el
       * texto necesitan sus tonos normales.
       */}
      {showCoverScrim ? (
        <div
          data-testid="hero-scrim"
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-t from-viewer-bg via-viewer-bg/85 to-transparent lg:block"
        />
      ) : null}

      <div className="relative z-10 mx-3 -mt-8 rounded-t-2xl bg-surface p-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-8">
        {/*
         * En escritorio, la rejilla coloca las acciones en la segunda columna
         * abarcando las dos filas (texto y nota) y las pega al borde inferior:
         * así quedan abajo a la derecha, a la altura de la nota, no del bloque
         * de texto. En móvil el orden del DOM sigue siendo texto, acciones y
         * nota.
         */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-6">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <h1
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className={cx('text-h1 font-extrabold text-text lg:text-display', desktopTitleTone)}
            >
              {circle.name}
            </h1>

            {circle.description ? (
              <p
                className={cx(
                  'mt-2 max-w-prose text-body text-muted lg:text-body',
                  desktopMutedTone,
                )}
              >
                {circle.description}
              </p>
            ) : null}

            {isFreshWithoutUploads ? (
              <p className={cx('mt-3 text-body-sm text-muted', desktopMutedTone)}>
                Solo tú, de momento · Creado {createdLabel}
              </p>
            ) : (
              <>
                <p
                  className={cx(
                    'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted',
                    desktopMutedTone,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound aria-hidden="true" className="size-4 shrink-0" />
                    {formatCircleStats(circle.stats)}
                  </span>
                </p>
                {lastUpload === null && pendingLabel === null ? null : (
                  <p className={cx('mt-1 text-caption text-muted', desktopMutedTone)}>
                    {lastUpload === null ? null : <>Última subida: {lastUploadLabel}</>}
                    {lastUpload !== null && pendingLabel !== null ? ' · ' : null}
                    {pendingLabel}
                  </p>
                )}
              </>
            )}

            {isFreshWithoutUploads && pendingLabel !== null ? (
              <p className={cx('mt-1 text-caption text-muted', desktopMutedTone)}>{pendingLabel}</p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:shrink-0 lg:self-end lg:justify-self-end">
            {onInvite === undefined ? null : (
              <Button variant="secondary" icon={<UserPlus />} onClick={onInvite}>
                Invitar
              </Button>
            )}
            <Button
              variant="secondary"
              disabled
              icon={<FolderPlus />}
              aria-describedby={albumNoteId}
            >
              Nuevo álbum
              <VisuallyHidden>Próximamente</VisuallyHidden>
            </Button>
          </div>

          <p
            id={albumNoteId}
            className={cx(
              'mt-3 text-caption text-muted lg:col-start-1 lg:row-start-2',
              desktopMutedTone,
            )}
          >
            La creación de álbumes estará disponible próximamente.
          </p>
        </div>
      </div>
    </section>
  );
}
