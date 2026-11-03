import { Link } from '@tanstack/react-router';
import type { ApiClient } from '@memora/api-client';
import { ArrowLeft } from 'lucide-react';

import { AuthCrossLink } from './auth-cross-link';
import { REGISTER_COLLAGE_PHOTOS } from './auth-collage';
import { AuthLayout } from './auth-layout';
import { RegisterForm } from './register-form';
import { safeAuthRedirect } from './redirect';
import { useLargeRootFont } from './use-large-text';

export interface RegisterScreenProps {
  /** Valor crudo del parámetro `redirect`. */
  readonly redirect?: unknown;
  /** Navegación posterior al registro correcto. */
  readonly onSuccess: (destination: string) => void;
  /** Cliente inyectable en tests. */
  readonly client?: ApiClient | undefined;
}

/** Pantalla de `/register`: barra superior móvil, formulario y CTA anclado. */
export function RegisterScreen({ redirect, onSuccess, client }: RegisterScreenProps) {
  const redirectParam = safeAuthRedirect(redirect);
  const search = redirectParam === undefined ? {} : { redirect: redirectParam };
  const largeText = useLargeRootFont();

  return (
    <AuthLayout
      variant="register"
      title="Crea tu cuenta"
      photos={REGISTER_COLLAGE_PHOTOS}
      quoteTitle="Un lugar íntimo para quienes más quieres."
      quoteText="Solo entra gente a la que invitas. Nadie más ve vuestras fotos."
      description={
        <p>
          ¿Ya tienes una?{' '}
          <AuthCrossLink to="/login" redirect={redirectParam}>
            Inicia sesión
          </AuthCrossLink>
        </p>
      }
      mobileTopBar={
        <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex min-w-0 items-center gap-1">
            <Link
              to="/login"
              search={search}
              aria-label="Volver a iniciar sesión"
              className="grid size-[44px] shrink-0 place-items-center rounded-full text-text hover:bg-surface-2"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <span className="text-body font-semibold text-text">Crear cuenta</span>
          </div>

          {!largeText && (
            <AuthCrossLink to="/login" redirect={redirectParam}>
              Ya tengo cuenta
            </AuthCrossLink>
          )}
        </div>
      }
      footer={
        largeText ? (
          <p>
            ¿Ya tienes una?{' '}
            <AuthCrossLink to="/login" redirect={redirectParam}>
              Inicia sesión
            </AuthCrossLink>
          </p>
        ) : undefined
      }
    >
      <RegisterForm
        redirect={redirect}
        onSuccess={onSuccess}
        client={client}
        legalInContent={largeText}
        legal={
          <p>
            Al crear la cuenta aceptas la{' '}
            <Link
              to="/privacy"
              className="rounded-sm font-semibold text-primary-text hover:underline"
            >
              política de privacidad
            </Link>
            .
          </p>
        }
      />
    </AuthLayout>
  );
}
