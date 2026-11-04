import type { CircleDetailDto } from '@memora/shared';
import { Button, EmptyState, Tabs, VisuallyHidden, type TabItem } from '@memora/ui';
import { Layers, Plus, Settings, Users } from 'lucide-react';
import { useId, type CSSProperties } from 'react';

import { formatPlural } from './format';

export interface CircleDetailTabsProps {
  readonly circle: CircleDetailDto;
  readonly compact: boolean;
}

/**
 * Pestañas del detalle.
 *
 * Solo Álbumes se puede abrir: no hay endpoints de personas ni ajustes hasta
 * F22/F28. `Tabs` recibe los elementos deshabilitados tal cual; no se parchea
 * el componente del kit. En móvil la barra se pega bajo la cabecera compacta
 * para no perder la navegación al hacer scroll.
 */
export function CircleDetailTabs({ circle, compact }: CircleDetailTabsProps) {
  const albumsNoteId = useId();

  const items: readonly TabItem[] = [
    {
      value: 'albums',
      label: 'Álbumes',
      icon: Layers,
      count: circle.stats.albumsCount,
      content: <AlbumsPanel circle={circle} noteId={albumsNoteId} />,
    },
    {
      value: 'people',
      label: 'Personas',
      icon: Users,
      count: circle.stats.membersCount,
      content: null,
      disabled: true,
    },
    {
      value: 'settings',
      label: 'Ajustes',
      icon: Settings,
      content: null,
      disabled: true,
    },
  ];

  const stickyStyle: CSSProperties | undefined = compact
    ? { top: 'calc(env(safe-area-inset-top) + 4rem)' }
    : undefined;

  return (
    <div
      className={
        compact
          ? 'sticky z-nav mt-2 bg-bg px-5 pb-1 pt-2 lg:static lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0'
          : 'mt-2 px-5 lg:mt-8 lg:px-0'
      }
      style={stickyStyle}
    >
      <Tabs label="Secciones del círculo" defaultValue="albums" items={items} />
      <p className="mt-2 text-caption text-muted">
        Personas y Ajustes estarán disponibles próximamente.
      </p>
    </div>
  );
}

interface AlbumsPanelProps {
  readonly circle: CircleDetailDto;
  readonly noteId: string;
}

function AlbumsPanel({ circle, noteId }: AlbumsPanelProps) {
  const hasAlbums = circle.stats.albumsCount > 0;

  return (
    <EmptyState
      icon={<Layers />}
      iconShape="square"
      title={
        hasAlbums ? 'La lista de álbumes estará disponible próximamente' : 'Todavía no hay álbumes'
      }
      description={
        hasAlbums
          ? `Este círculo tiene ${formatPlural(
              circle.stats.albumsCount,
              'álbum',
              'álbumes',
            )}. La lista se mostrará aquí cuando esté disponible.`
          : 'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.'
      }
      headingLevel={2}
      action={
        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" disabled icon={<Plus />} aria-describedby={noteId}>
            {hasAlbums ? 'Crear álbum' : 'Crear el primer álbum'}
            <VisuallyHidden>Próximamente</VisuallyHidden>
          </Button>
          <p id={noteId} className="text-caption text-muted">
            La creación de álbumes estará disponible próximamente.
          </p>
        </div>
      }
      className="py-8"
    />
  );
}
