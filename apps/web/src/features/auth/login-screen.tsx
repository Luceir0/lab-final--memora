import type { ApiClient } from '@memora/api-client';

import { AuthCrossLink } from './auth-cross-link';
import { LOGIN_COLLAGE_PHOTOS } from './auth-collage';
import { AuthLayout } from './auth-layout';
import { LoginForm } from './login-form';
import { safeAuthRedirect } from './redirect';

export interface LoginScreenProps {
  /** Valor crudo del parámetro `redirect`. */
  readonly redirect?: unknown;
  /** Navegación posterior al acceso correcto. */
  readonly onSuccess: (destination: string) => void;
  /** Cliente inyectable en tests. */
  readonly client?: ApiClient | undefined;
}

/** Pantalla de `/login`: collage, formulario y enlace a registro. */
export function LoginScreen({ redirect, onSuccess, client }: LoginScreenProps) {
  return (
    <AuthLayout
      variant="login"
      title="Hola de nuevo"
      description="Entra para ver los recuerdos de tus círculos."
      photos={LOGIN_COLLAGE_PHOTOS}
      quoteTitle={
        <>
          Todos vuestros recuerdos, <span className="text-primary-text">por fin</span>, en el mismo
          lugar.
        </>
      }
      quoteText="Sin algoritmos, sin muros públicos y con calidad original."
      footer={
        <p>
          ¿Aún no tienes cuenta?{' '}
          <AuthCrossLink to="/register" redirect={safeAuthRedirect(redirect)}>
            Crea una
          </AuthCrossLink>
        </p>
      }
    >
      <LoginForm redirect={redirect} onSuccess={onSuccess} client={client} />
    </AuthLayout>
  );
}
