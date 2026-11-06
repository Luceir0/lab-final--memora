/**
 * Puente mínimo entre la selección de la galería y el visor.
 *
 * La selección vive en `AlbumGallery`, detrás del visor. Cuando el usuario
 * pulsa `Esc` con fotos seleccionadas, el primer `Esc` limpia la selección y
 * el segundo cierra el visor. El visor no puede leer el estado de React de la
 * galería, así que la galería registra aquí su función `clear` mientras hay
 * selección activa.
 */
let activeClear: (() => void) | null = null;

/** Registra la limpieza de la selección activa; devuelve la desuscripción. */
export function registerPhotoSelectionClear(clear: () => void): () => void {
  activeClear = clear;

  return () => {
    if (activeClear === clear) {
      activeClear = null;
    }
  };
}

/**
 * Limpia la selección si hay alguna activa.
 *
 * Devuelve `true` cuando ha consumido el `Esc` para limpiar la selección; el
 * visor debe entonces seguir abierto.
 */
export function clearActivePhotoSelection(): boolean {
  if (activeClear === null) {
    return false;
  }

  activeClear();

  return true;
}

/** Solo para tests: olvida cualquier registro pendiente entre montajes. */
export function resetPhotoSelectionBridge(): void {
  activeClear = null;
}
