import { Button, Card, ConfirmDialog, InlineAlert } from '@memora/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

import { isUnauthorizedError } from '../circles/session';
import { useLogoutMutation } from '../circles/queries';

import { getLogoutErrorCopy, type ProfileErrorCopy } from './profile-errors';

/**
 * Cierre de sesión del perfil.
 *
 * La confirmación no es destructiva: cerrar sesión no borra nada y se puede
 * deshacer volviendo a entrar. Al terminar se vacía la caché (datos privados
 * de la sesión anterior) y se navega a `/login`.
 */
export function LogoutCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<ProfileErrorCopy | null>(null);

  const signOut = () => {
    queryClient.clear();
    void router.navigate({ to: '/login', replace: true });
  };

  const confirmLogout = async () => {
    setError(null);

    try {
      await logout.mutateAsync();
      signOut();
    } catch (caught) {
      // Si la sesión ya no existía, el objetivo del cierre está cumplido.
      if (isUnauthorizedError(caught)) {
        signOut();
        return;
      }

      setError(getLogoutErrorCopy(caught));
    }
  };

  const close = () => {
    if (logout.isPending) {
      return;
    }

    setOpen(false);
    setError(null);
  };

  return (
    <Card padding="lg">
      <Button
        variant="secondary"
        fullWidth
        icon={<LogOut />}
        onClick={() => {
          logout.reset();
          setError(null);
          setOpen(true);
        }}
      >
        Cerrar sesión
      </Button>

      <ConfirmDialog
        open={open}
        onClose={close}
        onConfirm={() => {
          void confirmLogout();
        }}
        title="¿Cerrar sesión?"
        description="Podrás volver a entrar cuando quieras. No se borra ningún recuerdo."
        confirmLabel="Cerrar sesión"
        loading={logout.isPending}
        dismissible={!logout.isPending}
      >
        {error === null ? null : (
          <InlineAlert tone="danger" title={error.title} description={error.description} />
        )}
      </ConfirmDialog>
    </Card>
  );
}
