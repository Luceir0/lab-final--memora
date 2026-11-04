import type { ReactNode } from 'react';

import { MemoraBrand } from '../../components/memora-brand';

export interface InvitationLayoutProps {
  readonly viewerEmail?: string | undefined;
  /** `start` deja la tarjeta arriba en móvil y centrada en escritorio. */
  readonly align?: 'center' | 'start' | undefined;
  readonly children: ReactNode;
}

/**
 * Marco público de la invitación.
 *
 * Móvil primero: cabecera centrada y contenido a ancho completo. Desde `lg`
 * la marca va a la izquierda, la cuenta a la derecha y la tarjeta se centra en
 * la página. Sin barra de navegación ni enlaces al shell privado.
 */
export function InvitationLayout({
  viewerEmail,
  align = 'center',
  children,
}: InvitationLayoutProps) {
  return (
    <main className="min-h-dvh bg-bg">
      <div
        className={[
          'mx-auto flex min-h-dvh w-full max-w-[80rem] flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pt-8',
          align === 'start'
            ? 'pb-0 lg:pb-10'
            : 'pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pb-10',
        ].join(' ')}
      >
        <header className="flex min-h-11 items-center justify-center lg:justify-between">
          <MemoraBrand />
          {viewerEmail === undefined ? null : (
            <p className="hidden text-body-sm text-muted lg:block">
              Has entrado como <span className="font-semibold text-text">{viewerEmail}</span>
            </p>
          )}
        </header>

        <div
          className={[
            'flex flex-1 flex-col items-center lg:py-10',
            align === 'start'
              ? 'justify-start pt-8 lg:justify-center lg:pt-10'
              : 'justify-center py-6',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
