import type { MemberDto } from '@memora/shared';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  InlineAlert,
  LinkButton,
  Toast,
  ToastViewport,
} from '@memora/ui';
import { ShieldOff, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '../../lib/error-message';
import { useCircleDetail } from '../circles/circle-detail-context';
import { useMeQuery } from '../circles/queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from '../circles/session';

import { MemberList } from './member-list';
import { PendingInvitations } from './pending-invitations';
import {
  flattenInvitationPages,
  flattenMemberPages,
  useInvitationsQuery,
  useMembersQuery,
  useRemoveMemberMutation,
} from './queries';
import { UntaggedCard } from './untagged-card';

interface ToastState {
  readonly tone: 'success' | 'danger';
  readonly title: string;
  readonly description?: string | undefined;
}

/**
 * Personas: lista de miembros, invitaciones pendientes y acciones de owner.
 *
 * El chrome (migas, héroe, cabecera compacta y pestañas) lo pinta el layout;
 * aquí solo vive el contenido de la sección. El diálogo de invitar también es
 * del layout y se abre desde el contexto.
 */
export function PeoplePage() {
  const { circle, openInvite } = useCircleDetail();
  const isOwner = circle.role === 'owner';
  const meQuery = useMeQuery();
  const meId = meQuery.data?.user.id ?? null;

  const membersQuery = useMembersQuery(circle.id);
  const invitationsQuery = useInvitationsQuery(circle.id, isOwner);
  const removeMutation = useRemoveMemberMutation(circle.id);

  useUnauthorizedRedirect(meQuery.error);
  useUnauthorizedRedirect(membersQuery.error);
  useUnauthorizedRedirect(invitationsQuery.error);
  useUnauthorizedRedirect(removeMutation.error);

  const [removeTarget, setRemoveTarget] = useState<MemberDto | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const membersHeadingRef = useRef<HTMLHeadingElement>(null);
  const mobilePendingHeadingRef = useRef<HTMLHeadingElement>(null);
  const desktopPendingHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusMembers = useRef(false);

  useEffect(() => {
    if (removeTarget !== null || !shouldFocusMembers.current) {
      return;
    }

    shouldFocusMembers.current = false;

    // El diálogo devuelve el foco al disparador al cerrarse, pero ese
    // disparador puede haber desaparecido con la fila. El frame siguiente
    // deja el foco en la sección de miembros.
    const frame = window.requestAnimationFrame(() => membersHeadingRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, [removeTarget]);

  const members =
    membersQuery.data === undefined ? [] : flattenMemberPages(membersQuery.data.pages);
  const invitations =
    invitationsQuery.data === undefined ? [] : flattenInvitationPages(invitationsQuery.data.pages);
  const invitationsHasMore = invitationsQuery.hasNextPage;

  const allUntagged =
    !membersQuery.isPending &&
    !membersQuery.isError &&
    members.length > 0 &&
    !membersQuery.hasNextPage &&
    members.every((member) => member.photosCount === 0);

  const showRemovedToast = () => {
    setToast({
      tone: 'success',
      title: 'Invitación retirada',
      description: 'Ese enlace ya no sirve para entrar en el círculo.',
    });
  };

  const focusSurvivorAfterPendingRemoval = () => {
    // La sección móvil de pendientes se desmonta al retirar la última
    // invitación; el heading de miembros sigue existiendo y evita que el foco
    // caiga en body. La card de escritorio no desaparece: se queda vacía y
    // conserva su propio heading.
    window.requestAnimationFrame(() => membersHeadingRef.current?.focus());
  };

  const confirmRemove = async () => {
    if (removeTarget === null) {
      return;
    }

    const name = removeTarget.user.name;

    try {
      await removeMutation.mutateAsync(removeTarget.user.id);
      shouldFocusMembers.current = true;
      setRemoveTarget(null);
      setRemoveError(null);
      setToast({
        tone: 'success',
        title: 'Miembro quitado',
        description: `${name} ya no forma parte del círculo.`,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      setRemoveError(getErrorMessage(error));
    }
  };

  const noAccess = isNotFoundError(membersQuery.error);

  return (
    <>
      {noAccess ? (
        <EmptyState
          icon={<ShieldOff />}
          title="No tienes acceso a estas personas"
          description="El círculo puede haber cambiado o tu cuenta ya no forma parte de él."
          headingLevel={2}
          className="rounded-xl border border-dashed border-border-strong px-5 py-10"
          action={
            <LinkButton href="/circles" variant="secondary">
              Volver a Mis círculos
            </LinkButton>
          }
        />
      ) : (
        <div
          className={
            isOwner
              ? // El owner siempre tiene columna derecha: la card de
                // pendientes se queda vacía cuando no hay invitaciones. Un
                // member usa todo el ancho.
                'lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8'
              : undefined
          }
        >
          <div className="min-w-0">
            {isOwner ? (
              <Button fullWidth icon={<UserPlus />} onClick={openInvite} className="lg:hidden">
                Invitar a alguien
              </Button>
            ) : null}

            {isOwner ? (
              <PendingInvitations
                circleId={circle.id}
                invitations={invitations}
                hasMore={invitationsHasMore}
                loading={invitationsQuery.isPending}
                error={invitationsQuery.error}
                onRetry={() => {
                  void invitationsQuery.refetch();
                }}
                onRemoved={() => {
                  showRemovedToast();

                  if (invitations.length <= 1) {
                    focusSurvivorAfterPendingRemoval();
                  }
                }}
                variant="section"
                headingRef={mobilePendingHeadingRef}
                fallbackRef={membersHeadingRef}
              />
            ) : null}

            {allUntagged ? <UntaggedCard /> : null}

            <MemberList
              members={members}
              meId={meId}
              isOwner={isOwner}
              totalCount={circle.stats.membersCount}
              loading={membersQuery.isPending}
              error={membersQuery.error}
              onRetry={() => {
                void membersQuery.refetch();
              }}
              hasMore={membersQuery.hasNextPage}
              loadingMore={membersQuery.isFetchingNextPage}
              onLoadMore={() => {
                void membersQuery.fetchNextPage();
              }}
              onRemove={(member) => {
                removeMutation.reset();
                setRemoveError(null);
                setRemoveTarget(member);
              }}
              headingRef={membersHeadingRef}
            />
          </div>

          {isOwner ? (
            <aside
              className={
                // La card superior de la izquierda es la de etiquetas cuando
                // está visible (`mt-6`) y la tabla cuando no (`lg:mt-2`). El
                // aside replica ese margen para que ambos bordes coincidan.
                allUntagged
                  ? 'mt-8 hidden flex-col gap-4 lg:mt-6 lg:flex'
                  : 'mt-8 hidden flex-col gap-4 lg:mt-2 lg:flex'
              }
            >
              <PendingInvitations
                circleId={circle.id}
                invitations={invitations}
                hasMore={invitationsHasMore}
                loading={invitationsQuery.isPending}
                error={invitationsQuery.error}
                onRetry={() => {
                  void invitationsQuery.refetch();
                }}
                onRemoved={() => {
                  showRemovedToast();
                }}
                variant="card"
                headingRef={desktopPendingHeadingRef}
                fallbackRef={membersHeadingRef}
              />
            </aside>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => {
          setRemoveTarget(null);
          setRemoveError(null);
        }}
        onConfirm={() => {
          void confirmRemove();
        }}
        title="Quitar del círculo"
        description={
          removeTarget === null
            ? undefined
            : `${removeTarget.user.name} dejará de ver el círculo. Sus fotos se conservan, pero se quitarán sus etiquetas en las fotos del círculo.`
        }
        confirmLabel="Quitar del círculo"
        danger
        loading={removeMutation.isPending}
      >
        {removeError === null ? null : (
          <InlineAlert
            tone="danger"
            title="No hemos podido quitar a esta persona"
            description={removeError}
          />
        )}
      </ConfirmDialog>

      {toast === null ? null : (
        <ToastViewport>
          <Toast
            tone={toast.tone}
            title={toast.title}
            description={toast.description}
            duration={6000}
            onClose={() => setToast(null)}
          />
        </ToastViewport>
      )}
    </>
  );
}
