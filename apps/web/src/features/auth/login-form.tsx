import { zodResolver } from '@hookform/resolvers/zod';
import type { ApiClient } from '@memora/api-client';
import { loginRequestSchema, loginResponseSchema, type LoginRequest } from '@memora/shared';
import { Button, TextField } from '@memora/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { apiClient } from '../../lib/api-client';

import { mapAuthError, type AuthField } from './auth-errors';
import { AuthFormAlert } from './auth-form-alert';
import { resolveAuthRedirect } from './redirect';

/** Entrada y salida del formulario son el mismo contrato (todo son cadenas). */
type LoginFormValues = LoginRequest;
type LoginFormOutput = LoginRequest;

type LoginField = 'email' | 'password';

/** `exactOptionalPropertyTypes`: no se pasa `error: undefined` a `TextField`. */
function fieldError(message: string | undefined): { readonly error?: string } {
  return message === undefined ? {} : { error: message };
}

export interface LoginFormProps {
  /** Valor crudo del parámetro `redirect`; se valida antes de usarlo. */
  readonly redirect?: unknown;
  /** Navegación posterior al acceso correcto, con el destino ya resuelto. */
  readonly onSuccess: (destination: string) => void;
  /** Cliente inyectable en tests; en producción, el compartido del navegador. */
  readonly client?: ApiClient | undefined;
}

/**
 * Formulario de acceso.
 *
 * - Validación de cliente con `loginRequestSchema` de `@memora/shared`.
 * - El `POST` sale del navegador: `auth.md` prohíbe mutar servidor-a-servidor
 *   sin un `Origin` de confianza.
 * - `method="post"` evita que un envío nativo sin JavaScript acabe en un `GET`
 *   con la contraseña en la URL.
 * - Los mensajes por campo y el resumen usan los textos canónicos de la API.
 */
export function LoginForm({ redirect, onSuccess, client = apiClient }: LoginFormProps) {
  const [pending, setPending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const destination = resolveAuthRedirect(redirect);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, submitCount },
  } = useForm<LoginFormValues, unknown, LoginFormOutput>({
    resolver: zodResolver(loginRequestSchema),
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(
    async (values) => {
      // Guardia síncrona: dos envíos en el mismo tick no deben duplicar el POST.
      if (submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setPending(true);
      setFormMessage(null);
      clearErrors();

      try {
        await client.post('/auth/login', values, {
          schema: loginResponseSchema,
        });
        onSuccess(destination);
      } catch (error) {
        const mapping = mapAuthError(error, 'login');
        setFormMessage(mapping.formMessage);

        const fields = (Object.entries(mapping.fieldErrors) as Array<[AuthField, string]>).filter(
          (entry): entry is [LoginField, string] => entry[0] === 'email' || entry[0] === 'password',
        );

        for (const [field, message] of fields) {
          setError(field, { type: 'server', message });
        }

        const firstField = fields[0]?.[0];
        if (firstField !== undefined) {
          setFocus(firstField);
        }
      } finally {
        submittingRef.current = false;
        setPending(false);
      }
    },
    () => {
      // Un fallo de validación invalida el error general anterior; el resumen
      // de campos lo pinta `AuthFormAlert`. RHF enfoca el primer campo inválido.
      setFormMessage(null);
    },
  );

  const errorCount = Object.keys(errors).length;

  /**
   * El mensaje crece debajo del campo después de que RHF lo enfoque. Se
   * desplaza el bloque completo para que también se vea el mensaje de error.
   */
  useEffect(() => {
    if (submitCount === 0 || errorCount === 0) {
      return;
    }

    const active = document.activeElement;
    const field =
      active instanceof HTMLElement ? active.closest<HTMLElement>('[data-auth-field]') : null;

    if (field !== null && typeof field.scrollIntoView === 'function') {
      field.scrollIntoView({ block: 'nearest' });
    }
  }, [errorCount, submitCount]);

  return (
    <>
      {/*
       * Fuera del formulario: el botón marca `aria-busy` y esta región es el
       * único canal de anuncio del envío.
       */}
      <p role="status" className="sr-only">
        {pending ? 'Entrando…' : ''}
      </p>

      <form
        aria-label="Acceso"
        action="/login"
        className="flex flex-col gap-4"
        method="post"
        noValidate
        onSubmit={onSubmit}
      >
        <AuthFormAlert
          message={formMessage}
          errorCount={submitCount > 0 ? errorCount : 0}
          description="Corrige los campos marcados para continuar."
        />

        <div data-auth-field="" className="scroll-mb-6 scroll-mt-6">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-required="true"
            placeholder="tu@correo.com"
            {...fieldError(errors.email?.message)}
            {...register('email')}
          />
        </div>

        <div data-auth-field="" className="scroll-mb-6 scroll-mt-6">
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            enterKeyHint="done"
            aria-required="true"
            placeholder="Tu contraseña"
            {...fieldError(errors.password?.message)}
            {...register('password')}
          />
        </div>

        <Button type="submit" size="lg" fullWidth loading={pending} className="mt-1">
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>

        <p className="hidden items-center gap-2 text-caption text-muted lg:flex">
          <kbd className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-caption text-text">
            Intro
          </kbd>
          <span>para entrar desde cualquier campo</span>
        </p>
      </form>
    </>
  );
}
