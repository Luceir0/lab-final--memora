import type { InstallState } from './use-install-prompt';

/**
 * Copias de la tarjeta de instalación (F14). Todas hablan de instalar, nunca
 * de funcionar sin conexión: Memora no promete offline.
 */
export const INSTALL_TITLE = 'Instala Memora';

export const INSTALL_COPY: Readonly<Record<InstallState, string>> = {
  available: 'Ábrela desde tu pantalla de inicio, como una app.',
  ios: 'Toca Compartir y elige “Añadir a pantalla de inicio”.',
  installed: 'Ya tienes Memora instalada.',
  unsupported: 'Abre Memora en Chrome o Safari para instalarla.',
};
