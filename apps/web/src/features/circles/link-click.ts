import type { MouseEvent } from 'react';

/**
 * Clic normal con el botón principal, sin modificadores.
 *
 * Solo esos clics se interceptan para navegar sin recargar; el resto (nueva
 * pestaña, descarga, atrás del navegador) conserva el comportamiento del
 * enlace nativo.
 */
export function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
