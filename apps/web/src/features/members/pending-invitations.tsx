import type { InvitationDto } from '@memora/shared';
import {
  Badge,
  Button,
  ConfirmDialog,
  InlineAlert,
  Menu,
  Skeleton,
  VisuallyHidden,
} from '@memora/ui';
import { Clock, Link2, Mail, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';

import { getErrorMessage } from '../../lib/error-message';
import { isUnauthorizedError, useUnauthorizedRedirect } from '../circles/session';

import { formatInvitationTiming, formatPendingCount, invitationExpiryDays } from './format';
import { useRevokeInvitationMutation } from './queries';

export type PendingInvitationsVariant = 'section' | 'card';

export interface PendingInvitationsProps {
  readonly circleId: string;
  readonly invitations: readonly InvitationDto[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
  /** Se llama tras retirar una invitación para mostrar el aviso. */
  readonly onRemoved: () => void;
  readonly variant: PendingInvitationsVariant;
  /** Permite devolver el foco al heading de esta instancia tras retirar. */
  readonly headingRef?: RefObject<HTMLHeadingElement | null> | undefined;
  /** Superviviente al que devolver el foco si la sección va a desaparecer. */
  readonly fallbackRef?: RefObject<HTMLElement | null> | undefined;
}

function PendingSkeleton() {
  return (
    <div aria-busy="true" className="mt-3">
      <VisuallyHidden>Cargando invitaciones pendientes</VisuallyHidden>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
        >
          <Skeleton shape="circle" size="md" />
          <div className="flex-1">
            <Skeleton shape="text" size="md" className="w-1/2" />
            <Skeleton shape="text" size="sm" className="mt-1.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface InvitationRowProps {
  readonly invitation: InvitationDto;
  readonly isCard: boolean;
  readonly onRevoke: (invitation: InvitationDto) => void;
}

function InvitationRow({ invitation, isCard, onRevoke }: InvitationRowProps) {
  const expiryDays = invitationExpiryDays(invitation.expiresAt);
  const expiringSoon = expiryDays !== null && expiryDays <= 1;
  const label = invitation.invitedEmail ?? 'enlace sin correo';
  const Icon = expiringSoon ? Clock : invitation.invitedEmail === null ? Link2 : Mail;

  return (
    <li className="flex items-start gap-3 py-3">
      {isCard ? null : (
        <span
          aria-hidden="true"
          className={
            expiringSoon
              ? 'mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-text [&>svg]:size-4'
              : 'mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted [&>svg]:size-4'
          }
        >
          <Icon />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-semibold text-text">
          {invitation.invitedEmail ?? 'Enlace sin correo'}
        </p>
        <p className="text-caption text-muted">{formatInvitationTiming(invitation)}</p>
      </div>

      {isCard ? (
        <Button variant="secondary" size="sm" onClick={() => onRevoke(invitation)}>
          Retirar <VisuallyHidden>{`la invitación de ${label}`}</VisuallyHidden>
        </Button>
      ) : (
        <Menu
          label={`Acciones de la invitación de ${label}`}
          align="end"
          className="shrink-0"
          items={[
            {
              label: 'Retirar',
              icon: <X />,
              onSelect: () => onRevoke(invitation),
            },
          ]}
        />
      )}
    </li>
  );
}

/**
 * Invitaciones pendientes del owner.
 *
 * El contador es `items.length`; si hay más páginas se anuncia «100+» porque el
 * contrato no expone un total. No hay «Reenviar»: el endpoint no existe.
 */
export function PendingInvitations({
  circleId,
  invitations,
  hasMore,
  loading,
  error,
  onRetry,
  onRemoved,
  variant,
  headingRef,
  fallbackRef,
}: PendingInvitationsProps) {
  const titleId = useId();
  const internalHeadingRef = useRef<HTMLHeadingElement>(null);
  const resolvedHeadingRef = headingRef ?? internalHeadingRef;
  const shouldFocusHeading = useRef(false);
  const willDisappear = useRef(false);
  const [confirmTarget, setConfirmTarget] = useState<InvitationDto | null>(null);
  const revokeMutation = useRevokeInvitationMutation(circleId);

  useUnauthorizedRedirect(revokeMutation.error);

  useEffect(() => {
    if (confirmTarget !== null || !shouldFocusHeading.current) {
      return;
    }

    // Tras cerrar el diálogo, el overlay devuelve el foco al disparador: si la
    // sección desaparece no hay heading al que volver, así que se enfoca un
    // superviviente (por ejemplo, «Miembros»). El ref evita cancelar el foco
    // si un refetch intermedio cambia la longitud.
    const frame = window.requestAnimationFrame(() => {
      shouldFocusHeading.current = false;
      const target = willDisappear.current ? fallbackRef?.current : resolvedHeadingRef.current;

      target?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [confirmTarget, fallbackRef, resolvedHeadingRef]);

  const isCard = variant === 'card';
  const isEmpty = !loading && !error && invitations.length === 0;

  // En móvil la sección desaparece cuando no hay pendientes. La card de
  // escritorio, en cambio, se queda con su estado vacío para que el owner vea
  // siempre la columna derecha.
  if (!isCard && isEmpty) {
    return null;
  }

  const title = isCard ? 'Pendientes' : 'Invitaciones pendientes';

  const revoke = (invitation: InvitationDto) => {
    revokeMutation.reset();
    setConfirmTarget(invitation);
  };

  const confirm = async () => {
    if (confirmTarget === null) {
      return;
    }

    try {
      await revokeMutation.mutateAsync(confirmTarget.id);
      // La longitud se captura antes de que el refetch actualice la prop. La
      // card de escritorio no desaparece: se queda con el estado vacío, así
      // que el foco puede volver a su propio heading.
      willDisappear.current = !isCard && invitations.length <= 1;
      shouldFocusHeading.current = true;
      setConfirmTarget(null);
      onRemoved();
    } catch (mutationError) {
      if (isUnauthorizedError(mutationError)) {
        return;
      }

      // El error se muestra en el propio bloque; el diálogo se cierra para no
      // tapar el mensaje y el foco vuelve al disparador, no al heading.
      setConfirmTarget(null);
    }
  };

  const content = error ? (
    <InlineAlert
      tone="danger"
      title="No hemos podido cargar las invitaciones"
      description={getErrorMessage(error)}
      className="mt-3"
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  ) : loading ? (
    <PendingSkeleton />
  ) : isEmpty ? (
    <p className="mt-2 text-body-sm text-muted">No hay invitaciones pendientes</p>
  ) : (
    <ul className="mt-2 divide-y divide-border">
      {invitations.map((invitation) => (
        <InvitationRow
          key={invitation.id}
          invitation={invitation}
          isCard={isCard}
          onRevoke={revoke}
        />
      ))}
    </ul>
  );

  return (
    <>
      <section
        aria-labelledby={titleId}
        data-testid={isCard ? 'pending-invitations-card' : 'pending-invitations-section'}
        className={
          isCard
            ? isEmpty
              ? // Estado vacío: fondo y borde suaves, texto atenuado y badge
                // neutra. Sigue siendo una card (sin borde discontinuo).
                'hidden rounded-xl border border-border bg-surface-2 p-4 lg:block'
              : 'hidden rounded-xl border border-border bg-surface p-4 lg:block'
            : 'mt-6 lg:hidden'
        }
      >
        <div className="flex items-center gap-2">
          <h2
            ref={resolvedHeadingRef}
            id={titleId}
            tabIndex={-1}
            className={
              isCard
                ? isEmpty
                  ? 'text-h3 font-bold text-muted'
                  : 'text-h3 font-bold text-text'
                : 'text-caption font-semibold uppercase text-muted'
            }
          >
            {title}
            <VisuallyHidden>{` ${formatPendingCount(invitations.length, hasMore)}`}</VisuallyHidden>
          </h2>
          <span aria-hidden="true">
            <Badge variant={isEmpty ? 'neutral' : 'primary'}>
              {formatPendingCount(invitations.length, hasMore)}
            </Badge>
          </span>
        </div>

        <div className={isCard ? '' : 'mt-2 rounded-xl border border-border bg-surface px-4'}>
          {content}
        </div>

        {revokeMutation.isError ? (
          <InlineAlert
            tone="danger"
            title="No hemos podido retirar la invitación"
            description={getErrorMessage(revokeMutation.error)}
            className="mt-3"
          />
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          void confirm();
        }}
        title="Retirar invitación"
        description={
          confirmTarget === null
            ? undefined
            : `${confirmTarget.invitedEmail ?? 'Este enlace'} ya no servirá para entrar en el círculo.`
        }
        confirmLabel="Retirar invitación"
        danger
        loading={revokeMutation.isPending}
      />
    </>
  );
}
