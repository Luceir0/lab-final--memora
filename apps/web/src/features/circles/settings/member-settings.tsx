import type { CircleDetailDto } from '@memora/shared';
import { Button, Card, ConfirmDialog, InlineAlert } from '@memora/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { CircleCheck, CircleX, Lock, LogOut } from 'lucide-react';
import { useState } from 'react';

import { flattenMemberPages, useLeaveCircleMutation, useMembersQuery } from '../../members/queries';
import { CircleCover } from '../circle-cover';
import { getCirclesErrorCopy, type CirclesErrorCopy } from '../errors';
import { circleKeys } from '../queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from '../session';

import { SETTINGS_FLAGS } from './settings-format';
import { SETTINGS_FLAG_ICONS } from './settings-icons';

export interface MemberSettingsProps {
  readonly circle: CircleDetailDto;
}

/**
 * Vista de solo lectura para un miembro.
 *
 * No pinta el formulario editable ni la zona de peligro. Muestra los permisos
 * efectivos y permite salir del círculo con confirmación.
 */
export function MemberSettings({ circle }: MemberSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const membersQuery = useMembersQuery(circle.id);
  const leaveMutation = useLeaveCircleMutation(circle.id);

  useUnauthorizedRedirect(membersQuery.error);
  useUnauthorizedRedirect(leaveMutation.error);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveError, setLeaveError] = useState<CirclesErrorCopy | null>(null);

  const members =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const owner = members.find((member) => member.role === 'owner');

  const confirmLeave = async () => {
    setLeaveError(null);

    try {
      await leaveMutation.mutateAsync();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      if (isNotFoundError(error)) {
        void router.navigate({ href: '/circles' });
        return;
      }

      setLeaveError(getCirclesErrorCopy(error, 'leave'));
      return;
    }

    // Navegar primero y limpiar después evita recrear el detalle y pedirlo
    // cuando ya no existe o ya no se tiene acceso (m-03).
    await router.navigate({ href: '/circles?left=true' });
    queryClient.removeQueries({ queryKey: circleKeys.detail(circle.id) });
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-4">
      <Card padding="md" className="lg:p-6">
        <div className="flex items-center gap-3 md:block">
          <p className="shrink-0 text-body-sm font-semibold text-text">Portada</p>
          <CircleCover
            name={circle.name}
            photo={circle.coverPhoto}
            className="min-w-0 aspect-[3/2] w-24 rounded-lg md:aspect-[12/5] md:max-h-56 md:w-full md:mt-2"
            initialsClassName="text-body-sm md:text-h1"
          />
        </div>
      </Card>

      <div className="flex flex-col items-center px-2 text-center">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted"
        >
          <Lock className="size-6" />
        </span>
        <h2 className="mt-4 text-h3 font-bold text-text lg:text-h2">
          Solo las personas administradoras pueden cambiar los ajustes
        </h2>
        <p className="mt-2 max-w-prose text-body text-muted">
          {owner === undefined
            ? 'Pídeselo a la persona administradora del círculo.'
            : `Si quieres cambiar algo, pídeselo a ${owner.user.name}.`}
        </p>
      </div>

      <Card padding="md" className="lg:p-6">
        <h2 className="text-h3 font-bold text-text lg:text-h2">Lo que puedes hacer aquí</h2>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {SETTINGS_FLAGS.map((flag) => {
            const Icon = SETTINGS_FLAG_ICONS[flag.key];
            const allowed = circle.settings[flag.key];

            return (
              <li key={flag.key} className="flex items-center justify-between gap-2 py-3">
                <span className="flex min-w-0 items-center gap-2 text-body text-text">
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0">{flag.label}</span>
                </span>
                <span
                  className={
                    allowed
                      ? 'flex shrink-0 items-center gap-1 text-body-sm font-semibold text-success-text'
                      : 'flex shrink-0 items-center gap-1 text-body-sm font-semibold text-muted'
                  }
                >
                  {allowed ? (
                    <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
                  ) : (
                    <CircleX aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  {allowed ? 'Permitido' : 'No permitido'}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Button
        variant="secondary"
        fullWidth
        icon={<LogOut />}
        onClick={() => {
          leaveMutation.reset();
          setLeaveError(null);
          setConfirmOpen(true);
        }}
      >
        Salir del círculo
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (leaveMutation.isPending) {
            return;
          }

          setConfirmOpen(false);
          setLeaveError(null);
        }}
        onConfirm={() => {
          void confirmLeave();
        }}
        title={`Salir de ${circle.name}`}
        description="Dejarás de ver las fotos del círculo y volverás a Mis círculos."
        confirmLabel="Salir del círculo"
        loading={leaveMutation.isPending}
        dismissible={!leaveMutation.isPending}
      >
        {leaveError === null ? null : (
          <InlineAlert
            tone="danger"
            title={leaveError.title}
            description={leaveError.description}
          />
        )}
      </ConfirmDialog>
    </div>
  );
}
