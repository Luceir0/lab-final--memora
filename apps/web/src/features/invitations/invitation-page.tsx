import { isApiError } from '@memora/api-client';
import { Button, InlineAlert, LinkButton, Spinner } from '@memora/ui';
import { useRouter } from '@tanstack/react-router';
import { CircleCheck, CircleSlash, Hourglass, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

import { InvitationCard } from './invitation-card';
import { InvitationLayout } from './invitation-layout';
import { InvitationStatusCard } from './invitation-status-card';
import type { InvitationPageData } from './page-data';
import { invitationLoginHref } from './page-data';
import { useAcceptInvitationMutation } from './queries';

export interface InvitationPageProps {
  readonly data: InvitationPageData;
  /** Navegación al círculo recién unido. La ruta pasa el router real. */
  readonly onAccepted: (circleId: string) => void;
}

type AcceptFailureAction = 'login' | 'reload' | 'retry';

interface AcceptFailure {
  readonly title: string;
  readonly description: string;
  readonly action: AcceptFailureAction;
}

/** Traduce el error del `POST` a un mensaje y a la salida más útil. */
export function describeAcceptFailure(error: unknown): AcceptFailure {
  if (isApiError(error)) {
    if (error.status === 401) {
      return {
        title: 'Tu sesión ha caducado',
        description: 'Entra de nuevo para aceptar la invitación; el enlace se conserva.',
        action: 'login',
      };
    }

    if (error.status === 409) {
      return {
        title: 'Esta invitación ya no está disponible',
        description: 'Puede haber caducado o haber sido retirada. Actualiza los detalles.',
        action: 'reload',
      };
    }
  }

  return {
    title: 'No hemos podido aceptar la invitación',
    description: 'Comprueba tu conexión y vuelve a intentarlo.',
    action: 'retry',
  };
}

/**
 * Estado de carga del `loader` en una navegación de cliente.
 *
 * El `pendingComponent` sustituye al componente de la ruta antes de que el
 * `head` tenga datos. Se conserva el título de la ruta y se pinta un `h1`
 * real; el único anuncio vivo lo hace `Spinner` (`role="status"`), sin texto
 * estático duplicado.
 */
export function InvitationPagePending() {
  useEffect(() => {
    document.title = 'Invitación · Memora';
  }, []);

  return (
    <InvitationLayout>
      <div
        aria-busy="true"
        className="flex w-full max-w-[32rem] flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-sm"
      >
        <h1 className="text-h2 font-extrabold text-text">Cargando invitación</h1>
        <Spinner size="lg" />
      </div>
    </InvitationLayout>
  );
}

/**
 * Página pública `/invite/$token`.
 *
 * El `loader` entrega preview + cuenta; aquí solo se pinta y se ejecuta
 * aceptar. Los estados no válidos nunca dejan al visitante sin salida y un
 * fallo de red se puede reintentar sin recargar la pestaña.
 */
export function InvitationPage({ data, onAccepted }: InvitationPageProps) {
  const router = useRouter();
  const acceptMutation = useAcceptInvitationMutation(data.token);
  const [retryingPreview, setRetryingPreview] = useState(false);

  const retryPreview = () => {
    setRetryingPreview(true);
    void router.invalidate().finally(() => {
      setRetryingPreview(false);
    });
  };

  if (data.kind === 'invalid') {
    return (
      <InvitationLayout>
        <InvitationStatusCard
          badge="Inválida"
          icon={<CircleSlash />}
          title="Este enlace no es válido"
          description="Puede que esté incompleto o que la invitación se haya retirado. Comprueba que has copiado el enlace entero."
          action={
            <LinkButton href="/circles" variant="secondary">
              Ir a mis círculos
            </LinkButton>
          }
        />
      </InvitationLayout>
    );
  }

  if (data.kind === 'error') {
    return (
      <InvitationLayout>
        <InvitationStatusCard
          badge="Error"
          tone="danger"
          icon={<TriangleAlert />}
          title="No hemos podido cargar la invitación"
          description="Puede que haya un problema de conexión. La invitación sigue siendo válida."
          busy={retryingPreview}
          action={
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button variant="secondary" loading={retryingPreview} onClick={retryPreview}>
                {retryingPreview ? 'Reintentando…' : 'Reintentar'}
              </Button>
              <LinkButton href="/circles" variant="ghost">
                Ir a mis círculos
              </LinkButton>
            </div>
          }
        />
      </InvitationLayout>
    );
  }

  const { preview, viewer } = data;
  const loginHref = invitationLoginHref(data);

  if (preview.state === 'expired') {
    return (
      <InvitationLayout viewerEmail={viewer?.email}>
        <InvitationStatusCard
          badge="Caducada"
          tone="warning"
          icon={<Hourglass />}
          title="Esta invitación ha caducado"
          description={`Las invitaciones duran 7 días. Pide a ${preview.inviterName} que te envíe una nueva desde ${preview.circleName}.`}
          action={
            <LinkButton href="/circles" variant="secondary">
              Ir a mis círculos
            </LinkButton>
          }
        />
      </InvitationLayout>
    );
  }

  if (preview.state === 'revoked') {
    return (
      <InvitationLayout viewerEmail={viewer?.email}>
        <InvitationStatusCard
          badge="Revocada"
          icon={<CircleSlash />}
          title="Esta invitación ya no está disponible"
          description={`Quien la creó la ha retirado. Pide una nueva a ${preview.inviterName} desde ${preview.circleName}.`}
          action={
            <LinkButton href="/circles" variant="secondary">
              Ir a mis círculos
            </LinkButton>
          }
        />
      </InvitationLayout>
    );
  }

  if (preview.state === 'already_member') {
    return (
      <InvitationLayout viewerEmail={viewer?.email}>
        <InvitationStatusCard
          badge="Ya eres miembro"
          tone="success"
          icon={<CircleCheck />}
          title={`Ya formas parte de ${preview.circleName}`}
          description="No tienes que hacer nada más: el círculo ya está en tu lista."
          action={
            <LinkButton href="/circles" variant="secondary">
              Ir a mis círculos
            </LinkButton>
          }
        />
      </InvitationLayout>
    );
  }

  const failure = acceptMutation.isError ? describeAcceptFailure(acceptMutation.error) : null;

  return (
    <InvitationLayout viewerEmail={viewer?.email} align="start">
      <div className="flex w-full flex-1 flex-col items-center lg:justify-center">
        <InvitationCard
          preview={preview}
          viewer={viewer}
          loginHref={loginHref}
          accepting={acceptMutation.isPending}
          error={
            failure === null ? null : (
              <InlineAlert
                tone="danger"
                className="max-w-full flex-col gap-2! p-3! [overflow-wrap:anywhere] [&>div]:w-full [&>svg]:shrink-0"
                title={failure.title}
                description={failure.description}
                action={
                  failure.action === 'login' ? (
                    <LinkButton href={loginHref} variant="secondary" className="max-w-full">
                      Entrar de nuevo
                    </LinkButton>
                  ) : (
                    <Button
                      variant="secondary"
                      loading={acceptMutation.isPending}
                      className="max-w-full"
                      onClick={() => {
                        if (failure.action === 'reload') {
                          void router.invalidate();
                          return;
                        }
                        acceptMutation.mutate(undefined, {
                          onSuccess: (response) => onAccepted(response.circle.id),
                        });
                      }}
                    >
                      {failure.action === 'reload' ? 'Actualizar' : 'Reintentar'}
                    </Button>
                  )
                }
              />
            )
          }
          onAccept={() => {
            acceptMutation.mutate(undefined, {
              onSuccess: (response) => onAccepted(response.circle.id),
            });
          }}
        />
      </div>
    </InvitationLayout>
  );
}
