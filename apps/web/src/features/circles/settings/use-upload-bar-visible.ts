import { useSyncExternalStore } from 'react';

const UPLOAD_BAR_ATTRIBUTE = 'data-upload-bar';
const VISIBLE_VALUE = 'visible';

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined') {
    return () => undefined;
  }

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [UPLOAD_BAR_ATTRIBUTE],
  });

  return () => {
    observer.disconnect();
  };
}

function getSnapshot(): boolean {
  return document.documentElement.dataset.uploadBar === VISIBLE_VALUE;
}

/** En servidor no hay cola de subidas montada: móvil primero, sin barra. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Indica si la barra global de subidas de F26 está visible.
 *
 * F26 marca `html[data-upload-bar='visible']` mientras hay items en la cola.
 * La barra de guardado de Ajustes se apila encima en móvil y se recorta por la
 * derecha en escritorio para no tapar el botón primario (B2). Se observa el
 * atributo en lugar de leerlo una vez para reaccionar sin duplicar el estado
 * de la cola ni tocar F26.
 */
export function useUploadBarVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
