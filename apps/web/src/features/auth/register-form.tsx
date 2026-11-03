import { zodResolver } from '@hookform/resolvers/zod';
import type { ApiClient } from '@memora/api-client';
import {
  loginRequestSchema,
  registerRequestSchema,
  registerResponseSchema,
  type RegisterRequest,
} from '@memora/shared';
import { Button, TextField } from '@memora/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { apiClient } from '../../lib/api-client';

import { mapAuthError, type AuthField } from './auth-errors';
import { AuthFormAlert } from './auth-form-alert';
import { resolveAuthRedirect } from './redirect';
import { authFieldScrollMargins } from './scroll-offsets';

/**
 * Reglas del contrato más el campo de confirmación, que solo existe en la UI.
 *
 * La contraseña se valida con `registerRequestSchema` (mínimo 8, máximo 128 y
 * los mismos mensajes). La repetición solo exige un valor (la política de
 * longitud ya la aplica el primer campo) y coincide con la primera. El mensaje
 * visible cuando está vacía se sustituye en `onInvalid` por «Repite la
 * contraseña.», así que no se reutiliza el texto de acceso. No añade `zod` a
 * `apps/web`.
 */
const registerFormSchema = registerRequestSchema
  .extend({
    confirmPassword: loginRequestSchema.shape.password,
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

type RegisterFormValues = RegisterRequest & { readonly confirmPassword: string };
type RegisterFormOutput = RegisterFormValues;

/** `exactOptionalPropertyTypes`: no se pasa `error: undefined` a `TextField`. */
function fieldError(message: string | undefined): { readonly error?: string } {
  return message === undefined ? {} : { error: message };
}

export interface RegisterFormProps {
  /** Valor crudo del parámetro `redirect`; se valida antes de usarlo. */
  readonly redirect?: unknown;
  /** Navegación posterior al registro correcto, con el destino ya resuelto. */
  readonly onSuccess: (destination: string) => void;
  /** Cliente inyectable en tests; en producción, el compartido del navegador. */
  readonly client?: ApiClient | undefined;
  /** Texto legal bajo el botón; la pantalla lo aporta con un `Link` real. */
  readonly legal?: ReactNode;
  /** Con texto ampliado, el legal pasa al contenido desplazable. */
  readonly legalInContent?: boolean;
}

/**
 * Formulario de registro.
 *
 * El alta ya fija la cookie de sesión (`201`), así que no pasa por `/login`.
 * La petición se hace desde el navegador, nunca desde el servidor. En móvil, el
 * CTA y el texto legal viven en una barra anclada abajo; el formulario reserva
 * espacio para que ningún campo quede debajo.
 */
export function RegisterForm({
  redirect,
  onSuccess,
  client = apiClient,
  legal,
  legalInContent = false,
}: RegisterFormProps) {
  const [pending, setPending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const destination = resolveAuthRedirect(redirect);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    getValues,
    formState: { errors, submitCount },
  } = useForm<RegisterFormValues, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema),
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

      const body: RegisterRequest = {
        name: values.name,
        email: values.email,
        password: values.password,
      };

      try {
        await client.post('/auth/register', body, { schema: registerResponseSchema });
        onSuccess(destination);
      } catch (error) {
        const mapping = mapAuthError(error, 'register');
        setFormMessage(mapping.formMessage);

        const fields = Object.entries(mapping.fieldErrors) as Array<[AuthField, string]>;
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
      setFormMessage(null);

      // La repetición vacía tiene su propio mensaje; no se reutiliza el de
      // login («Introduce tu contraseña.»).
      if (getValues('confirmPassword') === '') {
        setError('confirmPassword', { type: 'required', message: 'Repite la contraseña.' });
      }
    },
  );

  const errorCount = Object.keys(errors).length;

  /**
   * El resumen y los mensajes crecen por encima del campo enfocado después de
   * que RHF lo enfoque; sin este ajuste puede quedar debajo de las barras. Se
   * desplaza el contenedor completo (etiqueta + control + mensaje) con
   * márgenes calculados a partir de la altura real de la cabecera y la barra.
   */
  useEffect(() => {
    if (submitCount === 0 || errorCount === 0) {
      return;
    }

    const moveActiveField = () => {
      const active = document.activeElement;
      const field =
        active instanceof HTMLElement ? active.closest<HTMLElement>('[data-auth-field]') : null;

      if (field === null || formRef.current?.contains(field) !== true) {
        return;
      }

      const topbar = document.querySelector<HTMLElement>('[data-auth-topbar]');
      const margins = authFieldScrollMargins(
        topbar?.offsetHeight ?? 0,
        barRef.current?.offsetHeight ?? 0,
      );

      field.style.scrollMarginTop = `${margins.scrollMarginTop}px`;
      field.style.scrollMarginBottom = `${margins.scrollMarginBottom}px`;

      const rect = field.getBoundingClientRect();
      const topLimit = margins.scrollMarginTop;
      const bottomLimit = window.innerHeight - margins.scrollMarginBottom;

      // Si el bloque completo ya cabe entre las dos barras, no se mueve.
      if (rect.top >= topLimit && rect.bottom <= bottomLimit) {
        return;
      }

      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - topLimit),
        behavior: 'auto',
      });
    };

    moveActiveField();
    window.addEventListener('resize', moveActiveField);

    const topbar = document.querySelector<HTMLElement>('[data-auth-topbar]');
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(moveActiveField) : null;

    if (topbar) {
      observer?.observe(topbar);
    }
    if (barRef.current) {
      observer?.observe(barRef.current);
    }

    return () => {
      window.removeEventListener('resize', moveActiveField);
      observer?.disconnect();
    };
  }, [errorCount, submitCount]);

  return (
    <>
      {/*
       * Fuera del formulario: el botón marca `aria-busy` y esta región es el
       * único canal de anuncio del envío.
       */}
      <p role="status" className="sr-only">
        {pending ? 'Creando cuenta…' : ''}
      </p>

      <form
        ref={formRef}
        aria-label="Crear cuenta"
        action="/register"
        className="flex flex-col gap-4 pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:pb-0"
        method="post"
        noValidate
        onSubmit={onSubmit}
      >
        <AuthFormAlert
          message={formMessage}
          errorCount={submitCount > 0 ? errorCount : 0}
          description="Corrige los campos marcados para crear la cuenta."
        />

        <div data-auth-field="" className="scroll-mt-20 lg:scroll-mt-0">
          <TextField
            label="Nombre"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            aria-required="true"
            placeholder="Sofía Martín"
            {...fieldError(errors.name?.message)}
            {...register('name')}
          />
        </div>

        <div data-auth-field="" className="scroll-mt-20 lg:scroll-mt-0">
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

        <div className="grid gap-4 lg:grid-cols-2">
          <div data-auth-field="" className="scroll-mt-20 lg:scroll-mt-0">
            <TextField
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              aria-required="true"
              placeholder="Tu contraseña"
              hint="Al menos 8 caracteres"
              {...fieldError(errors.password?.message)}
              {...register('password')}
            />
          </div>

          <div data-auth-field="" className="scroll-mt-20 lg:scroll-mt-0">
            <TextField
              label="Repite la contraseña"
              type="password"
              autoComplete="new-password"
              enterKeyHint="done"
              aria-required="true"
              placeholder="Repite tu contraseña"
              {...fieldError(errors.confirmPassword?.message)}
              {...register('confirmPassword')}
            />
          </div>
        </div>

        {legalInContent && legal && <div className="text-caption text-muted">{legal}</div>}

        <div
          ref={barRef}
          className="fixed inset-x-0 bottom-0 z-10 mt-1 border-t border-border bg-surface px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0"
        >
          <Button type="submit" size="lg" fullWidth loading={pending}>
            {pending ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>

          {!legalInContent && legal && (
            <div className="mt-2 text-caption text-muted lg:mt-3">{legal}</div>
          )}
        </div>
      </form>
    </>
  );
}
