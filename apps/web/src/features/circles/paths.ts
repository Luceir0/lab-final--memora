/** `/circles/new` abre el alta; no es el id de un círculo. */
export const NEW_CIRCLE_PATH = '/circles/new';

/** Ruta de un círculo con el id codificado. */
export function circlePath(circleId: string): string {
  return `/circles/${encodeURIComponent(circleId)}`;
}

/** Ruta de Personas de un círculo con el id codificado. */
export function circlePeoplePath(circleId: string): string {
  return `${circlePath(circleId)}/people`;
}

/** Ruta de Ajustes de un círculo con el id codificado. */
export function circleSettingsPath(circleId: string): string {
  return `${circlePath(circleId)}/settings`;
}

/**
 * Indica si la ruta pertenece a un círculo (`/circles/:id` y sus subrutas).
 *
 * Excluye `/circles` y `/circles/new`. Las secciones (`/people`, `/albums`,
 * `/settings`…) también cuentan: todas ocultan la cabecera móvil del shell
 * porque el círculo compone su propio chrome.
 */
export function isCircleSectionPath(pathname: string): boolean {
  const match = /^\/circles\/([^/]+)(?:\/.*)?$/.exec(pathname);

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
