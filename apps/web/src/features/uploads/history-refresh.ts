import type { QueryClient } from '@tanstack/react-query';

import { uploadHistoryKeys } from './history/queries';

/**
 * Refresca «Mis subidas» tras completar una subida.
 *
 * Se invalida el prefijo `['me', 'uploads']` para que se recarguen tanto el
 * resumen como cualquier carpeta abierta. Se lanza desde el provider porque la
 * página puede no estar montada cuando termina la subida.
 */
export function invalidateUploadHistoryAfterUpload(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: uploadHistoryKeys.all });
}
