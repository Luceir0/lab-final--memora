import { createFileRoute } from '@tanstack/react-router';

import { RegisterRouteComponent } from '../features/auth/register-route';

/**
 * `/register` se renderiza en servidor (modo por defecto de Start). El
 * formulario se pinta en el HTML inicial y el `POST` se hace desde el navegador.
 *
 * El archivo exporta solo `Route`: el componente vive en `features/auth` para
 * conservar el code-splitting por ruta.
 */
export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) =>
    typeof search.redirect === 'string' ? { redirect: search.redirect } : {},
  head: () => ({
    meta: [{ title: 'Crear cuenta · Memora' }],
  }),
  component: RegisterRouteComponent,
});
