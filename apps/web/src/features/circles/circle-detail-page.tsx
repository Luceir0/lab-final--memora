import type { CircleDetailDto } from '@memora/shared';
import { Button, EmptyState, Toast, ToastViewport, VisuallyHidden } from '@memora/ui';
import { Layers, Plus } from 'lucide-react';
import { useEffect, useId } from 'react';

import { useCircleDetail } from './circle-detail-context';
import { formatPlural } from './format';

export interface CircleDetailPageProps {
  /** Marca `?created=true` heredada del alta. */
  readonly created?: boolean | undefined;
  /** Limpia la marca de la URL con `replace` al cerrar el toast. */
  readonly onCreatedToastClose?: (() => void) | undefined;
}

/**
 * Sección Álbumes.
 *
 * El chrome (migas, héroe, cabecera compacta y pestañas) vive en
 * `CircleDetailLayout`; aquí solo queda el panel de álbumes y el toast del alta.
 */
export function CircleDetailPage({ created = false, onCreatedToastClose }: CircleDetailPageProps) {
  const { circle, focusTitle } = useCircleDetail();

  useEffect(() => {
    if (created) {
      focusTitle();
    }
  }, [created, focusTitle]);

  return (
    <>
      <AlbumsPanel circle={circle} />

      {created && onCreatedToastClose ? (
        <ToastViewport>
          <Toast
            tone="success"
            title="Círculo creado"
            description="Ya puedes invitar a tu gente."
            duration={6000}
            onClose={onCreatedToastClose}
          />
        </ToastViewport>
      ) : null}
    </>
  );
}

interface AlbumsPanelProps {
  readonly circle: CircleDetailDto;
}

function AlbumsPanel({ circle }: AlbumsPanelProps) {
  const noteId = useId();
  const hasAlbums = circle.stats.albumsCount > 0;

  return (
    <div className="mt-2 lg:mt-4">
      <EmptyState
        icon={<Layers />}
        iconShape="square"
        title={
          hasAlbums
            ? 'La lista de álbumes estará disponible próximamente'
            : 'Todavía no hay álbumes'
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
    </div>
  );
}
