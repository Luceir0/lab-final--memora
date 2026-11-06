import { VisuallyHidden } from '@memora/ui';

import { useUploadQueue } from './upload-queue-context';

/** Tope de la píldora y del nombre accesible: «99+». */
const MAX_VISIBLE_COUNT = 99;

/**
 * Insignia de subidas activas de la navegación.
 *
 * Cuenta pendientes + subiendo (los errores viven en el panel y no son
 * «activos»). El número visible queda `aria-hidden` y el nombre accesible del
 * enlace lo aporta el texto oculto, con la misma forma que la píldora para que
 * el texto visible quede contenido en el nombre accesible.
 */
export function UploadNavBadge() {
  const { summary } = useUploadQueue();
  const count = summary.pending + summary.active;

  if (count === 0) {
    return null;
  }

  const visibleCount = count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : String(count);

  return (
    <>
      <span
        aria-hidden="true"
        className="inline-flex min-w-4 items-center justify-center rounded-full bg-surface-2 px-1 py-0 text-caption font-semibold leading-4 text-muted tabular-nums lg:ml-auto"
      >
        {visibleCount}
      </span>
      <VisuallyHidden>, {visibleCount} en curso</VisuallyHidden>
    </>
  );
}
