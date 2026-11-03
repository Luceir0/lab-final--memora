import type { ReactNode } from 'react';

import { PageContainer } from './page-container';

export interface SectionPlaceholderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  /**
   * Contenido entre la cabecera y el aviso provisional. El Perfil lo usa para
   * la instalación y los accesos de Ayuda y Privacidad (F14).
   */
  readonly children?: ReactNode;
}

/**
 * Pantalla provisional honesta: título real, explicación breve y ningún dato
 * inventado. F27, F34 y F36 la sustituirán por las páginas de producto.
 */
export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  children,
}: SectionPlaceholderProps) {
  return (
    <PageContainer>
      <header className="mb-8">
        <p className="text-caption font-semibold uppercase text-primary-text">{eyebrow}</p>
        <h1 className="mt-2 text-h1 font-extrabold text-text">{title}</h1>
        <p className="mt-2 max-w-prose text-body text-muted">{description}</p>
      </header>

      {children}

      <p className="rounded-xl border border-dashed border-border-strong bg-surface p-6 text-body-sm text-muted">
        Esta sección llegará en una entrega próxima. Mientras tanto, tus círculos siguen disponibles
        desde la navegación.
      </p>
    </PageContainer>
  );
}
