/** `/circles/new` abre el alta; no es el id de un círculo. */
export const NEW_CIRCLE_PATH = '/circles/new';

/** Ruta de un círculo con el id codificado. */
export function circlePath(circleId: string): string {
  return `/circles/${encodeURIComponent(circleId)}`;
}

/**
 * Indica si la ruta es el detalle exacto de un círculo (`/circles/:id`).
 *
 * Excluye `/circles` y `/circles/new`; las rutas hijas futuras (álbumes,
 * personas, ajustes) no son el detalle y no deben ocultar la cabecera móvil.
 */
export function isCircleDetailPath(pathname: string): boolean {
  const match = /^\/circles\/([^/]+)\/?$/.exec(pathname);

  return match !== null && match[1] !== 'new';
}

/**
 * Extrae el id activo de una ruta de círculo.
 *
 * `/circles`, `/circles/new` y cualquier otra ruta devuelven `null`. Un id mal
 * codificado no debe romper el sidebar: se conserva el segmento tal cual.
 */
export function circleIdFromPath(pathname: string): string | null {
  const match = /^\/circles\/([^/?#]+)/.exec(pathname);

  if (match === null) {
    return null;
  }

  const segment = match[1];

  if (segment === undefined || segment === 'new') {
    return null;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
