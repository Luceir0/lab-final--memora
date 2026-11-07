import { Button, Card, InlineAlert, Skeleton } from '@memora/ui';
import { useEffect, useRef } from 'react';

import { PageContainer } from '../../components/layout/page-container';
import { ThemeToggle } from '../../components/theme-toggle';
import { useMeQuery } from '../circles/queries';

import { InstallAppRow } from './install-app-row';
import { LogoutCard } from './logout-card';
import { ProfileCard } from './profile-card';
import { ProfileQuickLinks } from './profile-quick-links';
import { getProfileLoadErrorCopy } from './profile-errors';

/**
 * `/profile` — Perfil y preferencias.
 *
 * Una sola columna en móvil. Desde `lg`, dos columnas: datos y apariencia a la
 * izquierda; instalación y cierre de sesión a la derecha. Los accesos a Ayuda
 * y Privacidad solo se pintan en móvil, donde el sidebar no está (F14).
 */
export function ProfilePage() {
  const meQuery = useMeQuery(true);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const user = meQuery.data?.user;
  const loading = meQuery.isPending;
  const failed = meQuery.isError && user === undefined;
  const loadError = failed ? getProfileLoadErrorCopy(meQuery.error) : null;

  // El guard de `_app` ya resolvió la sesión; al llegar aquí el foco se queda
  // en el destino de navegación y se mueve al título de la página.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <PageContainer className="pt-6 lg:py-10">
      <header className="mb-6 lg:mb-8">
        <h1 ref={titleRef} tabIndex={-1} className="text-h1 font-extrabold text-text">
          Perfil
        </h1>
      </header>

      {loading ? <ProfileLoading /> : null}

      {loadError === null ? null : (
        <div className="max-w-xl">
          <InlineAlert
            tone="danger"
            title={loadError.title}
            description={loadError.description}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void meQuery.refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        </div>
      )}

      {user === undefined ? null : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <ProfileCard user={user} />
            <AppearanceCard />
          </div>

          <aside aria-label="Instalación y sesión" className="flex min-w-0 flex-col gap-6">
            <InstallAppRow />
            <ProfileQuickLinks />
            <LogoutCard />
          </aside>
        </div>
      )}
    </PageContainer>
  );
}

function AppearanceCard() {
  return (
    <Card padding="lg">
      <ThemeToggle variant="section" />
    </Card>
  );
}

/**
 * Esqueleto del perfil. No pinta datos de la sesión: reserva la tarjeta y los
 * bloques de la columna mientras `GET /me` termina.
 */
function ProfileLoading() {
  return (
    <div aria-busy="true" className="grid gap-6 lg:grid-cols-2">
      <p role="status" className="sr-only">
        Cargando tu perfil…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <Card padding="lg">
          <div className="flex items-start gap-4">
            <Skeleton shape="circle" size="lg" />
            <div className="flex w-full flex-col gap-2">
              <Skeleton shape="text" size="lg" className="w-2/5" />
              <Skeleton shape="text" size="md" className="w-3/5" />
              <Skeleton shape="rect" size="sm" className="mt-2 w-24" />
            </div>
          </div>
        </Card>
        <Skeleton shape="rect" className="h-32 rounded-xl" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <Skeleton shape="rect" className="h-24 rounded-xl" />
        <Skeleton shape="rect" className="h-14 rounded-xl" />
      </div>
    </div>
  );
}
