import { useRouter, useSearch } from '@tanstack/react-router';

import { LoginScreen } from './login-screen';

/**
 * Componente de `/login`.
 *
 * Vive en `features/` para que el archivo de ruta siga exportando solo `Route`
 * y TanStack Router pueda separar `/login` en su propio chunk (decisión C-01
 * de F09).
 */
export function LoginRouteComponent() {
  const { redirect } = useSearch({ from: '/login' });
  const router = useRouter();

  return (
    <LoginScreen
      redirect={redirect}
      onSuccess={(destination) => {
        // `replace` evita que el botón Atrás vuelva al formulario de acceso.
        router.history.replace(destination);
      }}
    />
  );
}
