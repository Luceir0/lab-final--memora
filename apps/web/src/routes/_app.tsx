import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { AppShell } from '../components/layout/app-shell';
import { CircleSidebarNav } from '../features/circles/circle-sidebar-nav';
import { isCircleDetailPath } from '../features/circles/paths';
import { PrivateLoadingState, PrivateSessionError } from '../features/circles/private-states';
import { useMeQuery } from '../features/circles/queries';
import {
  isProtectedPath,
  isUnauthorizedError,
  useUnauthorizedRedirect,
} from '../features/circles/session';
import { getErrorMessage } from '../lib/error-message';

/**
 * Layout pathless de la zona privada: todo lo que cuelga de aquí se pinta
 * dentro del shell. `/`, `/login` y `/ui` quedan fuera.
 *
 * `/help` y `/privacy` siguen siendo públicas: no piden `/me`, no muestran
 * datos privados y mantienen su render en servidor. El guard solo actúa en
 * `/circles*`, `/uploads` y `/profile`.
 */
export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const protectedRoute = isProtectedPath(pathname);
  // El SSR no conoce la sesión del navegador: no se pide `/me` en servidor.
  const canQuerySession = protectedRoute && typeof window !== 'undefined';
  const meQuery = useMeQuery(canQuerySession);
  useUnauthorizedRedirect(meQuery.error);

  const user = meQuery.data?.user;
  const hasSession = user !== undefined;
  const sessionFailed = protectedRoute && meQuery.isError && !isUnauthorizedError(meQuery.error);
  const waitingForSession = protectedRoute && (meQuery.isPending || meQuery.isError);

  let content = <Outlet />;

  if (sessionFailed) {
    content = (
      <PrivateSessionError
        message={getErrorMessage(meQuery.error)}
        onRetry={() => {
          void meQuery.refetch();
        }}
      />
    );
  } else if (waitingForSession) {
    // Un 401 también entra aquí mientras el efecto navega a `/login`.
    content = <PrivateLoadingState />;
  }

  return (
    <AppShell
      currentPath={pathname}
      hideTopBar={isCircleDetailPath(pathname)}
      circleList={
        hasSession && protectedRoute ? <CircleSidebarNav currentPath={pathname} /> : undefined
      }
      user={
        user === undefined
          ? undefined
          : {
              name: user.name,
              ...(user.avatarUrl === null ? {} : { avatarUrl: user.avatarUrl }),
            }
      }
    >
      {content}
    </AppShell>
  );
}
