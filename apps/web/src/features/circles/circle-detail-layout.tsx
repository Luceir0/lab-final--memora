import { Breadcrumb } from '@memora/ui';
import { useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { InviteDialog } from '../members/invite-form';
import { flattenInvitationPages, useInvitationsQuery } from '../members/queries';

import { CircleCompactHeader } from './circle-compact-header';
import { CircleDetailProvider } from './circle-detail-context';
import { CircleDetailHero } from './circle-detail-hero';
import { CircleDetailError, CircleDetailLoading } from './circle-detail-states';
import { CircleNoAccess } from './circle-no-access';
import { CircleSectionNav } from './circle-section-nav';
import { circlePath } from './paths';
import { useCircleDetailQuery, useMeQuery } from './queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from './session';
import { useCompactHeader } from './use-compact-header';
import { useSectionFocusRequest } from './use-section-focus';

export interface CircleDetailLayoutProps {
  readonly circleId: string;
  readonly children: ReactNode;
}

/**
 * Chrome compartido de un círculo.
 *
 * - Pide el detalle una sola vez y comparte el resultado por contexto.
 * - Resuelve los gates de 401, 404, error y carga antes de montar la sección.
 * - Pinta migas, héroe, cabecera compacta y pestañas para todas las secciones;
 *   el héroe y el diálogo de invitar viven aquí para no remontarse al cambiar
 *   de pestaña.
 *
 * `['circle', id]` comparte caché con el N+1 de la lista y las invitaciones
 * usan la misma clave que Personas, así que no se duplican peticiones.
 */
export function CircleDetailLayout({ circleId, children }: CircleDetailLayoutProps) {
  const detailQuery = useCircleDetailQuery(circleId);
  const notFound = isNotFoundError(detailQuery.error);
  const unauthorized = isUnauthorizedError(detailQuery.error);
  const meQuery = useMeQuery(notFound);
  const isOwner = detailQuery.data?.role === 'owner';
  const invitationsQuery = useInvitationsQuery(circleId, isOwner);

  const [inviteOpen, setInviteOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusRequest = useSectionFocusRequest();
  const { ref: heroRef, compact } = useCompactHeader<HTMLElement>();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useUnauthorizedRedirect(detailQuery.error);
  useUnauthorizedRedirect(meQuery.error);

  const focusTitle = useCallback(() => {
    titleRef.current?.focus();
  }, []);

  const openInvite = useCallback(() => {
    setInviteOpen(true);
  }, []);

  useEffect(() => {
    if (focusRequest !== null) {
      titleRef.current?.focus();
    }
  }, [focusRequest]);

  if (unauthorized) {
    return <CircleDetailLoading />;
  }

  if (notFound) {
    return <CircleNoAccess email={meQuery.data?.user.email} />;
  }

  if (detailQuery.isError) {
    return (
      <CircleDetailError
        error={detailQuery.error}
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    );
  }

  if (detailQuery.isPending || detailQuery.data === undefined) {
    return <CircleDetailLoading />;
  }

  const circle = detailQuery.data;
  const owner = circle.role === 'owner';
  const invitations =
    invitationsQuery.data === undefined ? [] : flattenInvitationPages(invitationsQuery.data.pages);
  const isPeople = pathname.endsWith('/people');
  const activeValue = isPeople ? 'people' : 'albums';
  const overviewPath = circlePath(circle.id);

  const breadcrumbItems = [
    { label: 'Mis círculos', href: '/circles' },
    { label: circle.name, href: overviewPath },
    // La miga de sección se pinta siempre: Álbumes o Personas.
    { label: isPeople ? 'Personas' : 'Álbumes' },
  ];

  return (
    <CircleDetailProvider circle={circle} openInvite={openInvite} focusTitle={focusTitle}>
      <div className="mx-auto w-full max-w-7xl lg:px-8 lg:py-10">
        {compact ? <CircleCompactHeader circle={circle} /> : null}

        <div className="mb-6 hidden lg:block">
          <Breadcrumb items={breadcrumbItems} label="Ruta del círculo" />
        </div>

        <section className="lg:overflow-hidden lg:rounded-xl">
          <CircleDetailHero
            circle={circle}
            compact={compact}
            heroRef={heroRef}
            titleRef={titleRef}
            onInvite={owner ? openInvite : undefined}
            pendingCount={owner && invitations.length > 0 ? invitations.length : undefined}
            pendingOverflow={owner && invitationsQuery.hasNextPage}
          />
        </section>

        {/* El wrapper de la nav contiene también la sección: en móvil el
            `sticky` necesita un ancestro más alto que la propia barra para no
            desaparecer con el scroll. */}
        <div className="pb-2 lg:pb-0">
          <CircleSectionNav circle={circle} activeValue={activeValue} compact={compact} />

          <div className="px-5 pt-2 lg:px-0 lg:pt-2">{children}</div>
        </div>

        {owner ? (
          <InviteDialog open={inviteOpen} circle={circle} onClose={() => setInviteOpen(false)} />
        ) : null}
      </div>
    </CircleDetailProvider>
  );
}
