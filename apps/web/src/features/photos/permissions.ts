import type { Role } from '@memora/shared';

export interface PhotoDeletePermissionInput {
  /** Rol de la cuenta en el círculo, resuelto por `GET /circles/:id`. */
  readonly circleRole: Role;
  /** Autor de la foto según el `PhotoDto`. */
  readonly uploaderId: string;
  /** Cuenta autenticada; `null` mientras `/me` carga. */
  readonly meId: string | null;
}

/**
 * ¿Puede esta cuenta eliminar la foto?
 *
 * Espejo de la regla del servidor (`photo.delete`): autor de la foto o
 * propietario del círculo. Es solo la capa de UI; la API vuelve a comprobarlo
 * y responde `403` al resto de miembros.
 */
export function canDeletePhoto({
  circleRole,
  uploaderId,
  meId,
}: PhotoDeletePermissionInput): boolean {
  if (circleRole === 'owner') {
    return true;
  }

  return meId !== null && meId === uploaderId;
}
