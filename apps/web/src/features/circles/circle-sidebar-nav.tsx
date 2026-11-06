import { Skeleton } from '@memora/ui';
import { Link, useRouter } from '@tanstack/react-router';

import { cx } from '../../components/layout/class-names';
import { CircleCover } from './circle-cover';
import { isPlainLeftClick } from './link-click';
import { circleIdFromPath, circlePath, circlePeoplePath, circleSettingsPath } from './paths';
import { flattenCirclePages, useCircleListQuery } from './queries';
import { useUnauthorizedRedirect } from './session';
import { sectionNavigationState } from './use-section-focus';

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
 * - El subnav aparece bajo el círculo abierto. Álbumes, Personas y Ajustes son
 *   enlaces reales.
 * - El nombre del círculo se resalta en todas sus secciones (`bg-primary-soft`
 *   y `text-primary-text`); la sección actual va en negrita, sin píldora.
 * - `aria-current="page"` es único: en el overview lo lleva el enlace del
 *   círculo y en Personas/Ajustes el enlace de esa sección.
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
        const onOverview = currentPath === circlePath(circle.id);

        return (
          <li key={circle.id}>
            <Link
              to="/circles/$circleId"
              params={{ circleId: circle.id }}
              // Sin `exact`, el router considera activo el círculo también en
              // `/people` y añadiría un segundo `aria-current="page"`.
              activeOptions={{ exact: true }}
              aria-current={onOverview ? 'page' : undefined}
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
                onNavigate={(href) => {
                  // La marca de historial mueve el foco al H1 de la sección,
                  // igual que las pestañas (M-02/AC-10).
                  void router.navigate({ href, state: sectionNavigationState });
                }}
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
  readonly onNavigate: (href: string) => void;
}

function CircleSubnav({ circleId, currentPath, onNavigate }: CircleSubnavProps) {
  const overviewPath = circlePath(circleId);
  const peoplePath = circlePeoplePath(circleId);
  const settingsPath = circleSettingsPath(circleId);
  const albumsActive = currentPath === overviewPath;
  const peopleActive = currentPath === peoplePath;
  const settingsActive = currentPath === settingsPath;

  return (
    <ul className="mb-1 ml-7 mt-1 flex flex-col gap-0.5 pl-3">
      <li>
        {/*
         * Este enlace mantiene la navegación SPA sin `aria-current`: en el
         * overview ya lo lleva el enlace del círculo. Solo cambia la tipografía
         * cuando es la sección actual.
         */}
        <a
          href={overviewPath}
          onClick={(event) => {
            if (!isPlainLeftClick(event)) {
              return;
            }

            event.preventDefault();
            onNavigate(overviewPath);
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
        <a
          href={peoplePath}
          aria-current={peopleActive ? 'page' : undefined}
          onClick={(event) => {
            if (!isPlainLeftClick(event)) {
              return;
            }

            event.preventDefault();
            onNavigate(peoplePath);
          }}
          className={cx(
            'flex min-h-11 items-center rounded-md px-2 text-body-sm transition-colors',
            peopleActive
              ? 'font-semibold text-primary-text'
              : 'text-muted hover:bg-surface-2 hover:text-text active:bg-surface-active',
          )}
        >
          Personas
        </a>
      </li>
      <li>
        <a
          href={settingsPath}
          aria-current={settingsActive ? 'page' : undefined}
          onClick={(event) => {
            if (!isPlainLeftClick(event)) {
              return;
            }

            event.preventDefault();
            onNavigate(settingsPath);
          }}
          className={cx(
            'flex min-h-11 items-center rounded-md px-2 text-body-sm transition-colors',
            settingsActive
              ? 'font-semibold text-primary-text'
              : 'text-muted hover:bg-surface-2 hover:text-text active:bg-surface-active',
          )}
        >
          Ajustes
        </a>
      </li>
    </ul>
  );
}
