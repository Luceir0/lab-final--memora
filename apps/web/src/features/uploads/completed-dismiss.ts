/**
 * Tiempo que la cola terminada permanece visible antes de limpiarse sola.
 *
 * Solo aplica cuando no quedan subidas `pending`/`uploading` ni errores: la
 * barra «Subidas terminadas» no debe quedarse para siempre, pero tampoco debe
 * desaparecer mientras haya algo que reintentar o descartar.
 */
export const COMPLETED_DISMISS_DELAY_MS = 10_000;
