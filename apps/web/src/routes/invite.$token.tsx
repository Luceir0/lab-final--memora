import { createFileRoute, useRouter } from '@tanstack/react-router';

import { InvitationPage, InvitationPagePending } from '../features/invitations/invitation-page';
import { buildInvitationHead } from '../features/invitations/page-data';
import { loadInvitationPage } from '../features/invitations/server';

/**
 * `/invite/$token` — página pública de invitación.
 *
 * SSR por defecto (contrato de `render-modes.md`): el `loader` corre en
 * servidor, reenvía la cookie de sesión y entrega la preview mínima para que
 * `head()` genere Open Graph antes de hidratar. No vive bajo `_app`: no hay
 * shell privado ni comprobación de sesión en cliente.
 */
export const Route = createFileRoute('/invite/$token')({
  /**
   * El documento pinta datos de la cuenta (`viewer.email`) y el estado
   * `already_member` depende de la cookie. Debe ser privado para cada
   * petición: `private, no-store` impide compartirlo desde cachés
   * intermedias y `Vary: Cookie` evita que una caché intermedia reutilice la
   * variante de otro usuario. `headers` afecta a la respuesta SSR del
   * documento, no solo a la RPC del loader.
   */
  headers: () => ({
    'Cache-Control': 'private, no-store',
    Vary: 'Cookie',
  }),
  loader: ({ params }) => loadInvitationPage({ data: { token: params.token } }),
  head: ({ loaderData }) => buildInvitationHead(loaderData),
  pendingComponent: InvitationPagePending,
  component: InvitationRoute,
});

function InvitationRoute() {
  const data = Route.useLoaderData();
  const router = useRouter();

  if (data === undefined) {
    return <InvitationPagePending />;
  }

  return (
    <InvitationPage
      data={data}
      onAccepted={(circleId) => {
        void router.navigate({
          to: '/circles/$circleId',
          params: { circleId },
          replace: true,
        });
      }}
    />
  );
}
