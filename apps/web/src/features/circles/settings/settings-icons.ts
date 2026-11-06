import { Download, FolderPlus, Tag, Upload, type LucideIcon } from 'lucide-react';

import type { SettingsFlagKey } from './settings-format';

/**
 * Icono decorativo de cada permiso.
 *
 * Se comparte entre la vista del owner (filas con `Switch`) y la del member
 * (lista de solo lectura) para no duplicar el mapa (D2).
 */
export const SETTINGS_FLAG_ICONS: Record<SettingsFlagKey, LucideIcon> = {
  membersCanCreateAlbums: FolderPlus,
  membersCanUpload: Upload,
  membersCanTag: Tag,
  membersCanDownload: Download,
};
