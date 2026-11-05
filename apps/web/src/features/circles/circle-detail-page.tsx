import { Toast, ToastViewport } from '@memora/ui';
import { useEffect } from 'react';

import { AlbumGrid } from '../albums/album-grid';

import { useCircleDetail } from './circle-detail-context';

export interface CircleDetailPageProps {
  /** Marca `?created=true` heredada del alta. */
  readonly created?: boolean | undefined;
  /** Limpia la marca de la URL con `replace` al cerrar el toast. */
  readonly onCreatedToastClose?: (() => void) | undefined;
  /** Marca `?albumDeleted=1` tras eliminar un álbum. */
  readonly albumDeleted?: boolean | undefined;
  /** Limpia la marca de álbum eliminado con `replace`. */
  readonly onAlbumDeletedToastClose?: (() => void) | undefined;
}

/**
 * Sección Álbumes.
 *
 * El chrome (migas, héroe, cabecera compacta y pestañas) vive en
 * `CircleDetailLayout`; aquí queda la rejilla real de álbumes y los toasts del
 * alta de círculo y del álbum eliminado.
 */
export function CircleDetailPage({
  created = false,
  onCreatedToastClose,
  albumDeleted = false,
  onAlbumDeletedToastClose,
}: CircleDetailPageProps) {
  const { focusTitle } = useCircleDetail();

  useEffect(() => {
    if (created || albumDeleted) {
      focusTitle();
    }
  }, [created, albumDeleted, focusTitle]);

  return (
    <>
      <AlbumGrid />

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

      {albumDeleted && onAlbumDeletedToastClose ? (
        <ToastViewport>
          <Toast
            tone="success"
            title="Álbum eliminado"
            description="El álbum se ha eliminado del círculo."
            duration={6000}
            onClose={onAlbumDeletedToastClose}
          />
        </ToastViewport>
      ) : null}
    </>
  );
}
