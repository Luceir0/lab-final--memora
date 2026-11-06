import { useEffect } from 'react';

import { useUploadQueue } from './upload-queue-context';

/**
 * Aviso nativo al recargar o cerrar la pestaña con subidas activas.
 *
 * La navegación dentro de la app **no** se bloquea: la cola vive en el
 * provider global y sigue subiendo. Solo una recarga o un cierre pierde la
 * cola, y el navegador no permite personalizar ese aviso.
 *
 * El listener se registra únicamente mientras hay subidas pendientes o en
 * curso (`pending + active > 0`).
 */
export function UploadExitGuard() {
  const { hasActiveUploads } = useUploadQueue();

  useEffect(() => {
    if (!hasActiveUploads) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasActiveUploads]);

  return null;
}
