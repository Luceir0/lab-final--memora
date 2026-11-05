import type { CircleDetailDto } from '@memora/shared';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface CircleDetailContextValue {
  readonly circle: CircleDetailDto;
  /** Abre el diálogo de invitación compartido por el layout. */
  readonly openInvite: () => void;
  /** Lleva el foco al título del héroe (alta y navegación por pestañas). */
  readonly focusTitle: () => void;
}

const CircleDetailContext = createContext<CircleDetailContextValue | null>(null);

export interface CircleDetailProviderProps {
  readonly circle: CircleDetailDto;
  readonly openInvite: () => void;
  readonly focusTitle: () => void;
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
  children,
}: CircleDetailProviderProps) {
  const value = useMemo<CircleDetailContextValue>(
    () => ({ circle, openInvite, focusTitle }),
    [circle, openInvite, focusTitle],
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
