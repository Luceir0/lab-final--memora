import { Breadcrumb, Toast, ToastViewport } from '@memora/ui';
import { useEffect, useRef } from 'react';

import { CircleCompactHeader } from './circle-compact-header';
import { CircleDetailHero } from './circle-detail-hero';
import { CircleDetailError, CircleDetailLoading } from './circle-detail-states';
import { CircleDetailTabs } from './circle-detail-tabs';
import { CircleNoAccess } from './circle-no-access';
import { useCircleDetailQuery, useMeQuery } from './queries';
import { isNotFoundError, isUnauthorizedError, useUnauthorizedRedirect } from './session';
import { useCompactHeader } from './use-compact-header';

export interface CircleDetailPageProps {
  readonly circleId: string;
  /** Marca `?created=true` heredada del alta. */
  readonly created?: boolean | undefined;
  /** Limpia la marca de la URL con `replace` al cerrar el toast. */
  readonly onCreatedToastClose?: (() => void) | undefined;
}

/**
 * Página de detalle de un círculo.
 *
 * - `['circle', id]` comparte caché con el N+1 de la lista: abrir un círculo
 *   no repite la petición.
 * - Un 404 se resuelve como «sin acceso» y no pinta datos cacheados.
 * - Un 401 lo gestiona el helper común de sesión.
 * - En móvil oculta la `TopBar` del shell y muestra una cabecera compacta al
 *   salir el héroe.
 */
export function CircleDetailPage({
  circleId,
  created = false,
  onCreatedToastClose,
}: CircleDetailPageProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const detailQuery = useCircleDetailQuery(circleId);
  const notFound = isNotFoundError(detailQuery.error);
  const unauthorized = isUnauthorizedError(detailQuery.error);
  const meQuery = useMeQuery(notFound);

  useUnauthorizedRedirect(detailQuery.error);
  useUnauthorizedRedirect(meQuery.error);

  const { ref: heroRef, compact } = useCompactHeader<HTMLElement>();
  const hasData = detailQuery.data !== undefined;

  useEffect(() => {
    if (created && hasData) {
      titleRef.current?.focus();
    }
  }, [created, hasData]);

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

  return (
    <div className="mx-auto w-full max-w-7xl lg:px-8 lg:py-10">
      {compact ? <CircleCompactHeader circle={circle} /> : null}

      <div className="mb-6 hidden lg:block">
        <Breadcrumb
          items={[{ label: 'Mis círculos', href: '/circles' }, { label: circle.name }]}
          label="Ruta del círculo"
        />
      </div>

      <section className="lg:overflow-hidden lg:rounded-xl">
        <CircleDetailHero circle={circle} compact={compact} heroRef={heroRef} titleRef={titleRef} />
      </section>

      <div className="pb-10 lg:pb-0">
        <CircleDetailTabs circle={circle} compact={compact} />
      </div>

      {created && onCreatedToastClose ? (
        <ToastViewport>
          <Toast
            tone="success"
            title="Círculo creado"
            description="Ya puedes invitar a tu gente."
            duration={6000}
            onClose={onCreatedToastClose}
          />
        </ToastViewport>
      ) : null}
    </div>
  );
}
