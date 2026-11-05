/**
 * Enlace de salto: primer elemento enfocable del shell.
 *
 * Fuera de foco queda fuera de pantalla (no `display: none`, para que siga
 * siendo enfocable); al recibir foco se coloca arriba a la izquierda. Lleva a
 * `<main id="main-content" tabIndex={-1}>`, que así recibe el foco.
 *
 * El foco fuerza `translate: none` en lugar de `translate-y-0`: con el zoom de
 * texto el desplazamiento negativo seguía aplicándose y el enlace quedaba por
 * encima del viewport, alcanzable con teclado pero invisible.
 */
export const MAIN_CONTENT_ID = 'main-content';

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="fixed left-[max(1rem,env(safe-area-inset-left))] top-0 z-toast -translate-y-[calc(100%+1rem)] rounded-md border border-border-strong bg-surface px-4 py-3 text-body-sm font-semibold text-text shadow-md transition-transform focus:top-[calc(1rem+env(safe-area-inset-top))] focus:[translate:none]"
    >
      Saltar al contenido
    </a>
  );
}
