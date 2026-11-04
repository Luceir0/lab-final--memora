import type { CircleDetailDto } from '@memora/shared';
import { Button, VisuallyHidden } from '@memora/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, FolderPlus, UserPlus, UsersRound } from 'lucide-react';
import { useId, type Ref } from 'react';

import { CircleCover } from './circle-cover';
import { formatCircleStats, formatRelativeDate } from './format';

export interface CircleDetailHeroProps {
  readonly circle: CircleDetailDto;
  /** `false` cuando la cabecera compacta ya sustituye al héroe. */
  readonly compact: boolean;
  readonly heroRef: Ref<HTMLElement>;
  readonly titleRef?: Ref<HTMLHeadingElement> | undefined;
}

/**
 * Héroe del detalle.
 *
 * Un solo bloque de título cambia de tarjeta solapada en móvil a contenido
 * sobre la portada en escritorio. Las acciones de F19/F24 no existen todavía:
 * se muestran deshabilitadas y enlazadas a una nota visible, sin botones
 * muertos.
 */
export function CircleDetailHero({ circle, compact, heroRef, titleRef }: CircleDetailHeroProps) {
  const titleId = useId();
  const actionsNoteId = useId();
  const lastUpload = circle.stats.lastUploadAt;
  const isFreshWithoutUploads =
    circle.stats.membersCount === 1 &&
    circle.stats.photosCount === 0 &&
    circle.stats.albumsCount === 0;
  const createdLabel = formatRelativeDate(circle.createdAt).toLocaleLowerCase('es-ES');
  const lastUploadLabel =
    lastUpload === null ? '' : formatRelativeDate(lastUpload).toLocaleLowerCase('es-ES');

  return (
    <section ref={heroRef} aria-labelledby={titleId} className="relative">
      <CircleCover
        name={circle.name}
        photo={circle.coverPhoto}
        className="aspect-[2/1] w-full lg:aspect-[16/5]"
        initialsClassName="text-display"
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
       * que el texto pequeño sobre una foto clara mantenga contraste.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-gradient-to-t from-viewer-bg via-viewer-bg/85 to-transparent lg:block"
      />

      <div className="relative z-10 mx-3 -mt-8 rounded-t-2xl bg-surface p-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-8">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <h1
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className="text-h1 font-extrabold text-text lg:text-display lg:text-on-primary"
            >
              {circle.name}
            </h1>

            {circle.description ? (
              <p className="mt-2 max-w-prose text-body text-muted lg:text-body lg:text-on-primary">
                {circle.description}
              </p>
            ) : null}

            {isFreshWithoutUploads ? (
              <p className="mt-3 text-body-sm text-muted lg:text-on-primary">
                Solo tú, de momento · Creado {createdLabel}
              </p>
            ) : (
              <>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted lg:text-on-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound aria-hidden="true" className="size-4 shrink-0" />
                    {formatCircleStats(circle.stats)}
                  </span>
                </p>
                {lastUpload === null ? null : (
                  <p className="mt-1 text-caption text-muted lg:text-on-primary">
                    Última subida: {lastUploadLabel}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0">
            <Button
              variant="secondary"
              disabled
              icon={<UserPlus />}
              aria-describedby={actionsNoteId}
            >
              Invitar
              <VisuallyHidden>Próximamente</VisuallyHidden>
            </Button>
            <Button
              variant="secondary"
              disabled
              icon={<FolderPlus />}
              aria-describedby={actionsNoteId}
            >
              Nuevo álbum
              <VisuallyHidden>Próximamente</VisuallyHidden>
            </Button>
          </div>
        </div>

        <p id={actionsNoteId} className="mt-3 text-caption text-muted lg:text-on-primary">
          Invitar y crear álbumes llegarán en próximas versiones.
        </p>
      </div>
    </section>
  );
}
