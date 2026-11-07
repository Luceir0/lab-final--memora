import { joinUrl } from '@memora/api-client';

import { apiClient } from '../../../lib/api-client';

/** URL del original de una foto; exige `photo.download` en el servidor. */
export function photoDownloadUrl(photoId: string): string {
  return joinUrl(apiClient.basePath, `/photos/${encodeURIComponent(photoId)}/download`);
}

/** URL del ZIP de un job listo. */
export function downloadJobFileUrl(jobId: string): string {
  return joinUrl(apiClient.basePath, `/downloads/${encodeURIComponent(jobId)}/file`);
}

/**
 * Dispara la descarga con un `<a download>` real.
 *
 * La navegación la decide el navegador; el servidor envía
 * `Content-Disposition: attachment`. Se usa también para «Volver a descargar»
 * porque un `fetch` + blob duplicaría el archivo en memoria.
 */
export function triggerBrowserDownload(url: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = '';
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
