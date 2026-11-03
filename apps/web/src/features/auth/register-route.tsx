import { useRouter, useSearch } from '@tanstack/react-router';

import { RegisterScreen } from './register-screen';

/**
 * Componente de `/register`.
 *
 * Vive en `features/` para que el archivo de ruta siga exportando solo `Route`
 * y TanStack Router pueda separar `/register` en su propio chunk.
 */
export function RegisterRouteComponent() {
  const { redirect } = useSearch({ from: '/register' });
  const router = useRouter();

  return (
    <RegisterScreen
      redirect={redirect}
      onSuccess={(destination) => {
        // Tras el 201 la cookie de sesión ya está fijada; no se pasa por /login.
        router.history.replace(destination);
      }}
    />
  );
}
