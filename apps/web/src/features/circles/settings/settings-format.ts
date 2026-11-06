import type { CircleSettings } from '@memora/shared';

export type SettingsFlagKey = keyof CircleSettings;

export interface SettingsFlagMeta {
  readonly key: SettingsFlagKey;
  readonly label: string;
  readonly description: string;
  /** Etiqueta corta para el resumen de cambios. */
  readonly summary: string;
  readonly group: 'content' | 'people';
}

/**
 * Los cuatro flags de `Circle.settings` en el orden del diseño.
 *
 * El owner siempre puede hacerlo todo; estos permisos solo limitan a los
 * miembros. `summary` se usa en la barra de guardado («nombre y descarga de
 * originales»).
 */
export const SETTINGS_FLAGS: readonly SettingsFlagMeta[] = [
  {
    key: 'membersCanCreateAlbums',
    label: 'Crear álbumes',
    description: 'Organizar las fotos del círculo en álbumes nuevos',
    summary: 'crear álbumes',
    group: 'content',
  },
  {
    key: 'membersCanUpload',
    label: 'Subir fotos',
    description: 'Añadir fotos a cualquier álbum del círculo',
    summary: 'subir fotos',
    group: 'content',
  },
  {
    key: 'membersCanTag',
    label: 'Etiquetar personas',
    description: 'Marcar quién aparece en cada foto',
    summary: 'etiquetar personas',
    group: 'people',
  },
  {
    key: 'membersCanDownload',
    label: 'Descargar originales',
    description: 'Guardar fotos sueltas o álbumes en ZIP',
    summary: 'descarga de originales',
    group: 'people',
  },
];

/** Une etiquetas como una enumeración natural en español. */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0] ?? '';
  }

  const last = labels.at(-1) ?? '';
  const rest = labels.slice(0, -1);

  return `${rest.join(', ')} y ${last}`;
}

export interface ChangeSummaryInput {
  readonly count: number;
  readonly labels: readonly string[];
  readonly pending: boolean;
}

/**
 * Texto de la barra de guardado.
 *
 * En reposo dice cuántos cambios hay sin guardar; mientras el `PATCH` está en
 * vuelo usa «Guardando N cambios: …», como el diseño.
 */
export function formatChangeSummary({ count, labels, pending }: ChangeSummaryInput): string {
  const noun = count === 1 ? 'cambio' : 'cambios';
  const list = joinLabels(labels);

  if (pending) {
    return `Guardando ${count} ${noun}: ${list}…`;
  }

  return `${count} ${noun} sin guardar: ${list}`;
}
