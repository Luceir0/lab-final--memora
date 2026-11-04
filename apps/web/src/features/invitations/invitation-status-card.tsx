import { Badge, type BadgeVariant } from '@memora/ui';
import type { ReactNode } from 'react';

export type InvitationStatusTone = 'neutral' | 'warning' | 'success' | 'danger';

const badgeVariants: Record<InvitationStatusTone, BadgeVariant> = {
  neutral: 'neutral',
  warning: 'warning',
  success: 'success',
  danger: 'danger',
};

const iconTones: Record<InvitationStatusTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  warning: 'bg-warning-soft text-warning-text',
  success: 'bg-success-soft text-success-text',
  danger: 'bg-danger-soft text-danger-text',
};

export interface InvitationStatusCardProps {
  /** Etiqueta corta del estado: «Caducada», «Revocada», «Inválida»… */
  readonly badge: string;
  readonly tone?: InvitationStatusTone;
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: ReactNode;
  /** Botón o enlace de salida. */
  readonly action?: ReactNode;
  /** Incluye `aria-busy` mientras se reintenta una acción. */
  readonly busy?: boolean;
}

/**
 * Tarjeta de estado no aceptable de una invitación.
 *
 * Un único `<h1>` por página, texto siempre acompañando al color y salida
 * explícita para no dejar al visitante en un callejón sin salida.
 */
export function InvitationStatusCard({
  badge,
  tone = 'neutral',
  icon,
  title,
  description,
  action,
  busy = false,
}: InvitationStatusCardProps) {
  return (
    <article
      aria-busy={busy || undefined}
      className="w-full max-w-[24rem] rounded-xl border border-border bg-surface p-6 text-center shadow-sm lg:max-w-[26rem] lg:p-8"
    >
      <Badge variant={badgeVariants[tone]}>{badge}</Badge>

      <span
        aria-hidden="true"
        className={`mx-auto mt-6 flex size-14 items-center justify-center rounded-full [&>svg]:size-6 ${iconTones[tone]}`}
      >
        {icon}
      </span>

      <h1 className="mt-4 text-h3 font-extrabold text-text lg:text-h2">{title}</h1>
      <div className="mt-2 text-body-sm text-muted lg:text-body">{description}</div>

      {action ? <div className="mt-6">{action}</div> : null}
    </article>
  );
}
