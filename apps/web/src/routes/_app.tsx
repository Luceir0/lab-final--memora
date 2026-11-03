import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { AppShell } from '../components/layout/app-shell';

/**
 * Layout pathless de la zona privada: todo lo que cuelga de aquí se pinta
 * dentro del shell. `/`, `/login` y `/ui` quedan fuera.
 */
export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <AppShell currentPath={pathname}>
      <Outlet />
    </AppShell>
  );
}
