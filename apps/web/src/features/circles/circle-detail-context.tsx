import type { CircleDetailDto } from '@memora/shared';
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';

interface CircleDetailContextValue {
  readonly circle: CircleDetailDto;
  /** Abre el diálogo de invitación compartido por el layout. */
  readonly openInvite: () => void;
  /** Lleva el foco al título del héroe (alta y navegación por pestañas). */
  readonly focusTitle: () => void;
  /** Abre el diálogo de crear álbum compartido por el layout. */
  readonly openCreateAlbum: () => void;
  /** La cuenta puede crear álbumes en este círculo (permiso de UI). */
  readonly canCreateAlbum: boolean;
  /** Encabezado de la rejilla de álbumes, usado como destino de foco. */
  readonly albumsHeadingRef: RefObject<HTMLHeadingElement | null>;
}

const CircleDetailContext = createContext<CircleDetailContextValue | null>(null);

export interface CircleDetailProviderProps {
  readonly circle: CircleDetailDto;
  readonly openInvite: () => void;
  readonly focusTitle: () => void;
  readonly openCreateAlbum?: (() => void) | undefined;
  readonly canCreateAlbum?: boolean | undefined;
  readonly albumsHeadingRef?: RefObject<HTMLHeadingElement | null> | undefined;
  readonly children: ReactNode;
}

/**
 * Datos y acciones del círculo compartidos por las secciones.
 *
 * El layout los pide una sola vez y las páginas hijas (Álbumes, Personas) los
 * consumen con `useCircleDetail`, sin repetir la consulta ni el chrome.
 */
export function CircleDetailProvider({
  circle,
  openInvite,
  focusTitle,
  openCreateAlbum,
  canCreateAlbum = false,
  albumsHeadingRef,
  children,
}: CircleDetailProviderProps) {
  const fallbackAlbumsHeadingRef = useRef<HTMLHeadingElement>(null);
  const headingRef = albumsHeadingRef ?? fallbackAlbumsHeadingRef;

  const value = useMemo<CircleDetailContextValue>(
    () => ({
      circle,
      openInvite,
      focusTitle,
      openCreateAlbum: openCreateAlbum ?? (() => undefined),
      canCreateAlbum,
      albumsHeadingRef: headingRef,
    }),
    [circle, openInvite, focusTitle, openCreateAlbum, canCreateAlbum, headingRef],
  );

  return <CircleDetailContext.Provider value={value}>{children}</CircleDetailContext.Provider>;
}

export function useCircleDetail(): CircleDetailContextValue {
  const value = useContext(CircleDetailContext);

  if (value === null) {
    throw new Error('useCircleDetail debe usarse dentro de CircleDetailProvider');
  }

  return value;
}
