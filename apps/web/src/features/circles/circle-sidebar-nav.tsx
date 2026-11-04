import { Skeleton, VisuallyHidden } from '@memora/ui';
import { Link, useRouter } from '@tanstack/react-router';
import { useId } from 'react';

import { cx } from '../../components/layout/class-names';
import { CircleCover } from './circle-cover';
import { circleIdFromPath, circlePath } from './paths';
import { flattenCirclePages, useCircleListQuery } from './queries';
import { useUnauthorizedRedirect } from './session';

export interface CircleSidebarNavProps {
  /** Ruta actual, aportada por el layout `_app`. */
  readonly currentPath: string;
}

/**
 * Lista de círculos del sidebar y subnav del círculo activo.
 *
 * - Solo existe en escritorio: el `PrimaryNav` lo oculta en móvil.
 * - La lista reutiliza la clave `['circles','list']` de la página, así que no
 *   duplica peticiones.
 * - El subnav aparece bajo el círculo abierto. Álbumes es un enlace real;
 *   Personas y Ajustes se anuncian como deshabilitados hasta F22/F28, sin
 *   `href` que pueda acabar en un 404.
 */
export function CircleSidebarNav({ currentPath }: CircleSidebarNavProps) {
  const router = useRouter();
  const listQuery = useCircleListQuery();
  useUnauthorizedRedirect(listQuery.error);

  const activeCircleId = circleIdFromPath(currentPath);
  const { circles } = flattenCirclePages(listQuery.data?.pages ?? []);

  if (listQuery.isPending) {
    return (
      <div className="px-2 py-1">
        <p role="status" className="sr-only">
          Cargando tus círculos…
        </p>
        <div aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton shape="text" size="sm" />
          <Skeleton shape="text" size="sm" className="w-4/5" />
          <Skeleton shape="text" size="sm" className="w-3/5" />
        </div>
      </div>
    );
  }

  if (circles.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {circles.map((circle) => {
        const active = circle.id === activeCircleId;

        return (
          <li key={circle.id}>
            <Link
              to="/circles/$circleId"
              params={{ circleId: circle.id }}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm transition-colors',
                active
                  ? 'bg-primary-soft font-semibold text-primary-text'
                  : 'text-text hover:bg-surface-2 active:bg-surface-active',
              )}
            >
              <CircleCover
                name={circle.name}
                photo={circle.coverPhoto}
                className="size-6 shrink-0 rounded-sm"
                initialsClassName="text-caption"
              />
              <span className="min-w-0 truncate">{circle.name}</span>
            </Link>

            {active ? (
              <CircleSubnav
                circleId={circle.id}
                currentPath={currentPath}
                onNavigate={(circleId) =>
                  router.navigate({
                    to: '/circles/$circleId',
                    params: { circleId },
                  })
                }
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

interface CircleSubnavProps {
  readonly circleId: string;
  readonly currentPath: string;
  readonly onNavigate: (circleId: string) => Promise<void>;
}

function CircleSubnav({ circleId, currentPath, onNavigate }: CircleSubnavProps) {
  const overviewPath = circlePath(circleId);
  const albumsActive = currentPath === overviewPath;

  return (
    <ul className="mb-1 ml-7 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
      <li>
        {/*
         * `Link` añade `aria-current` automáticamente y el círculo activo ya lo
         * tiene. Este enlace mantiene la navegación SPA sin duplicarlo.
         */}
        <a
          href={overviewPath}
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }

            event.preventDefault();
            void onNavigate(circleId);
          }}
          className={cx(
            'flex min-h-11 items-center rounded-md px-2 text-body-sm transition-colors',
            albumsActive
              ? 'font-semibold text-primary-text'
              : 'text-muted hover:bg-surface-2 hover:text-text active:bg-surface-active',
          )}
        >
          Álbumes
        </a>
      </li>
      <li>
        <DisabledSubnavItem
          label="Personas"
          explanation="Disponible cuando llegue la gestión de personas del círculo."
        />
      </li>
      <li>
        <DisabledSubnavItem
          label="Ajustes"
          explanation="Disponible cuando lleguen los ajustes del círculo."
        />
      </li>
    </ul>
  );
}

interface DisabledSubnavItemProps {
  readonly label: string;
  readonly explanation: string;
}

/**
 * Elemento de navegación que todavía no lleva a ninguna parte.
 *
 * Se anuncia como enlace deshabilitado y es enfocable para que la explicación
 * `aria-describedby` se pueda leer con teclado y lector de pantalla.
 */
function DisabledSubnavItem({ label, explanation }: DisabledSubnavItemProps) {
  const explanationId = useId();

  return (
    <span
      role="link"
      aria-disabled="true"
      aria-describedby={explanationId}
      tabIndex={0}
      className="flex min-h-11 cursor-not-allowed items-center rounded-md px-2 text-body-sm text-muted opacity-60"
    >
      {label}
      <VisuallyHidden>Próximamente</VisuallyHidden>
      <VisuallyHidden id={explanationId}>{explanation}</VisuallyHidden>
    </span>
  );
}
