import { Breadcrumb, Button, InlineAlert } from '@memora/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useState } from 'react';

import { getErrorMessage } from '../../lib/error-message';
import { normalizeAuthRedirect } from '../auth/redirect';

import { DetailMobileBack } from './detail-mobile-back';
import { useLogoutMutation } from './queries';
import { isUnauthorizedError } from './session';

export interface CircleNoAccessProps {
  /** Email de `/me` para el cierre de sesión con otra cuenta. */
  readonly email?: string | undefined;
}

/**
 * «Sin acceso» de un 404.
 *
 * No recibe el círculo a propósito: el nombre, la descripción y las stats no
 * se pintan aunque haya datos cacheados de una visita anterior. El breadcrumb
 * usa «Círculo privado», no el nombre real.
 */
export function CircleNoAccess({ email }: CircleNoAccessProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const logout = useLogoutMutation();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const signOut = () => {
    queryClient.clear();

    const redirect = normalizeAuthRedirect(currentHref);

    void router.navigate({
      to: '/login',
      search: redirect === null ? {} : { redirect },
      replace: true,
    });
  };

  const handleSignOut = async () => {
    setLogoutError(null);

    try {
      await logout.mutateAsync();
      signOut();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        signOut();
        return;
      }

      setLogoutError(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl lg:px-8 lg:py-10">
      <div className="mb-6 hidden lg:block">
        <Breadcrumb
          items={[{ label: 'Mis círculos', href: '/circles' }, { label: 'Círculo privado' }]}
          label="Ruta del círculo"
        />
      </div>

      <DetailMobileBack />

      <div className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 shadow-sm lg:p-10">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-lg bg-surface-2 text-muted"
          >
            <Lock className="size-6" />
          </span>

          <h1 className="mt-4 text-h2 font-bold text-text">No tienes acceso a este círculo</h1>
          <p className="mt-2 max-w-prose text-body text-muted">
            Es un círculo privado y tu cuenta no forma parte de él. Pide a quien lo administra que
            te envíe una invitación.
          </p>

          <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              to="/circles"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-body-sm font-semibold text-on-primary transition-colors duration-(--memora-duration-fast) ease-standard hover:bg-primary-hover active:bg-primary-active sm:w-auto"
            >
              Ir a mis círculos
            </Link>
            <Button
              variant="soft"
              loading={logout.isPending}
              onClick={() => {
                void handleSignOut();
              }}
              className="w-full sm:w-auto"
            >
              {logout.isPending ? 'Saliendo…' : 'Entrar con otra cuenta'}
            </Button>
          </div>

          {email ? <p className="mt-4 text-caption text-muted">Has entrado como {email}</p> : null}

          {logoutError ? (
            <InlineAlert
              tone="danger"
              title="No hemos podido cerrar la sesión"
              description={logoutError}
              className="mt-4 w-full text-left"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
