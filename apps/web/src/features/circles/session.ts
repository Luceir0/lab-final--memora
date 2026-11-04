import { isApiError, isApiTransportError } from '@memora/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { normalizeAuthRedirect } from '../auth/redirect';

/** Rutas que exigen sesión. `/help` y `/privacy` son públicas por diseño. */
const PROTECTED_PATHS = ['/circles', '/uploads', '/profile'] as const;

export const LOGIN_PATH = '/login';

/** Indica si una ruta del layout `_app` necesita sesión. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  );
}

/**
 * Un `401` canónico o un transporte con estado 401 (proxy que devuelve HTML)
 * significan lo mismo para el cliente: la sesión ya no sirve.
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 401;
  }

  return isApiTransportError(error) && error.status === 401;
}

/**
 * Un `404` de detalle significa «sin acceso»: la API no revela si el círculo
 * existe o si simplemente la cuenta no es miembro.
 */
export function isNotFoundError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status === 404;
  }

  return isApiTransportError(error) && error.status === 404;
}

/**
 * Reacción única a un `401`: limpiar la caché y volver a `/login` conservando
 * la ruta actual en `redirect`.
 *
 * El `ref` evita navegaciones duplicadas cuando varias queries fallan a la vez
 * (la lista y sus N+1, por ejemplo). `/login` y `/register` nunca pasan por
 * este layout, pero se comprueba la ruta por si una navegación concurrente
 * deja el efecto vivo un render más.
 */
export function useUnauthorizedRedirect(error: unknown): void {
  const queryClient = useQueryClient();
  const router = useRouter();
  const href = useRouterState({ select: (state) => state.location.href });
  const redirecting = useRef(false);

  useEffect(() => {
    if (redirecting.current || !isUnauthorizedError(error)) {
      return;
    }

    const currentPath = router.state.location.pathname;

    if (currentPath === LOGIN_PATH || currentPath === '/register') {
      return;
    }

    redirecting.current = true;
    queryClient.clear();

    const redirect = normalizeAuthRedirect(href);

    void router.navigate({
      to: LOGIN_PATH,
      search: redirect === null ? {} : { redirect },
      replace: true,
    });
  }, [error, href, queryClient, router]);
}
