import { CircleQuestionMark, House, Lock, Upload, UserRound, type LucideIcon } from 'lucide-react';

/**
 * Configuración única de navegación de la aplicación.
 *
 * La barra inferior (móvil) y el sidebar (escritorio) leen de esta misma
 * lista: no hay dos árboles ni destinos duplicados. El breakpoint se resuelve
 * con CSS (`lg`), no con JavaScript, porque el SSR no conoce el viewport.
 */

export type NavDestinationId = 'circles' | 'uploads' | 'profile' | 'help' | 'privacy';

/** Rutas reales registradas en `routes/_app.*`. */
export type NavPath = '/circles' | '/uploads' | '/profile' | '/help' | '/privacy';

export type NavVisibility = 'all' | 'mobile' | 'desktop';

export interface NavLabel {
  /** Etiqueta de la barra inferior. */
  readonly mobile: string;
  /** Etiqueta del sidebar. */
  readonly desktop: string;
}

export interface NavDestination {
  readonly id: NavDestinationId;
  readonly path: NavPath;
  readonly icon: LucideIcon;
  readonly label: NavLabel;
  readonly visibility: NavVisibility;
  /**
   * Palabra extra que solo se anuncia en móvil, dentro de la etiqueta visible
   * correspondiente. Sirve para desambiguar acciones («Subir» → «Subir fotos»)
   * sin cambiar el texto visible ni duplicar enlaces.
   */
  readonly mobileAccessibleSuffix?: string;
  /**
   * Acción principal de la barra inferior: icono grande y centrado, al alcance
   * del pulgar. Sigue siendo un enlace normal, no un botón flotante aparte.
   */
  readonly primary?: boolean;
}

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  {
    id: 'circles',
    path: '/circles',
    icon: House,
    label: { mobile: 'Círculos', desktop: 'Mis círculos' },
    visibility: 'all',
  },
  {
    id: 'uploads',
    path: '/uploads',
    icon: Upload,
    label: { mobile: 'Subir', desktop: 'Subidas' },
    visibility: 'all',
    primary: true,
    // «Subir» a secas es ambiguo fuera de contexto. El sufijo forma
    // «Subir fotos» en el nombre accesible móvil y no toca el texto visible.
    mobileAccessibleSuffix: 'fotos',
  },
  {
    id: 'profile',
    path: '/profile',
    icon: UserRound,
    label: { mobile: 'Perfil', desktop: 'Perfil' },
    visibility: 'mobile',
  },
  {
    id: 'help',
    path: '/help',
    icon: CircleQuestionMark,
    label: { mobile: 'Ayuda', desktop: 'Ayuda' },
    visibility: 'desktop',
  },
  {
    id: 'privacy',
    path: '/privacy',
    icon: Lock,
    label: { mobile: 'Privacidad', desktop: 'Privacidad' },
    visibility: 'desktop',
  },
];

/**
 * Un destino está activo en su propia ruta y en sus descendientes
 * (`/circles/abc`), nunca en rutas que solo comparten prefijo textual.
 */
export function isDestinationActive(currentPath: string, destination: NavPath): boolean {
  if (currentPath === destination) {
    return true;
  }

  return currentPath.startsWith(`${destination}/`);
}

/** Clases de visibilidad por breakpoint. `lg` (1024 px) es el corte del sidebar. */
export function visibilityClassName(visibility: NavVisibility): string {
  switch (visibility) {
    case 'mobile':
      return 'lg:hidden';
    case 'desktop':
      return 'hidden lg:block';
    case 'all':
      return '';
  }
}
