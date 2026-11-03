import type { ReactNode } from 'react';

import { cx } from './class-names';

export interface PageContainerProps {
  readonly children: ReactNode;
  /** Clases extra para la pantalla concreta (márgenes internos, etc.). */
  readonly className?: string;
}

/**
 * Contenedor de contenido de escritorio (F14, AC-07).
 *
 * `max-w-7xl` son exactamente 80rem y los gutters son 24 px en móvil y 32 px
 * desde `lg`. Es el único sitio donde se declaran: las pantallas no repiten
 * `mx-auto`/`max-w-*`/`px-*`. Las safe areas horizontales las aporta el
 * `<main>` del shell, así que aquí no se duplican.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cx('mx-auto w-full max-w-7xl px-6 py-10 lg:px-8', className)}>{children}</div>
  );
}
