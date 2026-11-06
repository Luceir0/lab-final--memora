import type { AlbumDto, CircleDetailDto } from '@memora/shared';

/** Datos mínimos del círculo para decidir permisos de álbum en la UI. */
export type AlbumCircle = Pick<CircleDetailDto, 'role' | 'settings'>;

/**
 * Crear: owner o miembro mientras `membersCanCreateAlbums` siga activo.
 *
 * Es solo la capa de UI; el servidor vuelve a comprobarlo en cada petición.
 */
export function canCreateAlbum(circle: AlbumCircle): boolean {
  return circle.role === 'owner' || circle.settings.membersCanCreateAlbums;
}

/**
 * Subir fotos: owner o miembro mientras `membersCanUpload` siga activo.
 *
 * Espejo de la regla del servidor (`photo.upload`), solo para decidir si se
 * muestra la acción. La API vuelve a comprobarlo.
 */
export function canUploadPhotos(circle: AlbumCircle): boolean {
  return circle.role === 'owner' || circle.settings.membersCanUpload;
}

/** Vaciar y eliminar: owner o creador del álbum, sin depender de la flag. */
export function canManageAlbum(
  circle: Pick<CircleDetailDto, 'role'>,
  album: Pick<AlbumDto, 'createdBy'>,
  meId: string | null,
): boolean {
  return circle.role === 'owner' || (meId !== null && album.createdBy.id === meId);
}

/**
 * Editar: owner, o el creador del álbum mientras la flag siga activa.
 *
 * `meId` puede ser `null` mientras `/me` carga; en ese caso se deniega.
 */
export function canEditAlbum(
  circle: AlbumCircle,
  album: Pick<AlbumDto, 'createdBy'>,
  meId: string | null,
): boolean {
  if (circle.role === 'owner') {
    return true;
  }

  if (meId === null) {
    return false;
  }

  return circle.settings.membersCanCreateAlbums && album.createdBy.id === meId;
}
