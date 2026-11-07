import type { Role } from '@memora/shared';

export interface PhotoTagPermissionInput {
  /** Rol de la cuenta en el círculo, resuelto por `GET /circles/:id`. */
  readonly circleRole: Role;
  /** `circle.settings.membersCanTag`, ya resuelto por el contexto del círculo. */
  readonly membersCanTag: boolean;
}

/**
 * ¿Puede esta cuenta etiquetar personas en las fotos del círculo?
 *
 * Espejo de la regla del servidor (`photo.tag`): el propietario siempre puede
 * y un miembro necesita `membersCanTag`. Es solo la capa de UI; la API vuelve
 * a comprobarlo y responde `403` al resto.
 */
export function canTagPhoto({ circleRole, membersCanTag }: PhotoTagPermissionInput): boolean {
  return circleRole === 'owner' || membersCanTag;
}
