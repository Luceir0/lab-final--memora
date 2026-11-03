import type { ReactNode } from 'react';

import { AuthCollage, type CollagePhoto } from './auth-collage';

export interface AuthLayoutProps {
  /** El acceso muestra collage en móvil; el registro, barra superior. */
  readonly variant: 'login' | 'register';
  readonly title: string;
  /** Subtítulo. En registro es el enlace cruzado de escritorio. */
  readonly description?: ReactNode;
  readonly children: ReactNode;
  /** Enlace inferior (solo acceso). */
  readonly footer?: ReactNode;
  /** Contenido de la barra superior móvil (solo registro). */
  readonly mobileTopBar?: ReactNode;
  readonly photos: readonly CollagePhoto[];
  readonly quoteTitle: ReactNode;
  readonly quoteText: string;
}

/** Marca textual de Memora, sin navegación: en acceso y registro no es un enlace. */
function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-text">
      <span
        aria-hidden="true"
        className="relative flex size-5 items-center justify-center rounded-full border-2 border-primary bg-surface"
      >
        <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-accent-pink" />
      </span>
      <span className="text-h3 font-extrabold">memora</span>
    </span>
  );
}

/**
 * Marco compartido por `/login` y `/register`.
 *
 * Móvil primero. En acceso, collage fotográfico a sangre y lámina blanca
 * solapada. En registro, barra superior y formulario sobre superficie. Desde
 * `lg` el collage ocupa el 52,7 % y el formulario se centra a la derecha. Nada
 * de `window` ni del viewport en el render.
 */
export function AuthLayout({
  variant,
  title,
  description,
  children,
  footer,
  mobileTopBar,
  photos,
  quoteTitle,
  quoteText,
}: AuthLayoutProps) {
  const isLogin = variant === 'login';

  return (
    <main className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh w-full flex-col lg:flex-row">
        <aside
          aria-label="Sobre Memora"
          className="relative hidden overflow-hidden bg-bg lg:block lg:h-dvh lg:max-h-dvh lg:w-[52.7%]"
        >
          <AuthCollage variant={variant} surface="panel" photos={photos} />
          <div className="absolute inset-x-6 bottom-6 max-w-96 rounded-xl bg-surface p-6 shadow-lg xl:inset-x-10 xl:bottom-10">
            <p className="text-h2 font-extrabold text-text">{quoteTitle}</p>
            <p className="mt-2 text-body-sm text-muted">{quoteText}</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:justify-center lg:px-16">
          {isLogin ? (
            <div className="relative lg:hidden">
              <AuthCollage variant="login" surface="hero" photos={photos} />
              <div className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] rounded-full bg-surface/95 px-3 py-1.5 shadow-sm">
                <Brand />
              </div>
            </div>
          ) : (
            <header
              data-auth-topbar=""
              className="sticky top-0 z-20 flex min-h-[76px] items-center border-b border-border bg-surface px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden"
            >
              {mobileTopBar}
            </header>
          )}

          <div
            className={
              isLogin
                ? 'relative -mt-8 flex-1 rounded-t-2xl bg-surface px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 shadow-sm lg:mt-0 lg:flex-none lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none'
                : 'flex-1 bg-surface px-5 py-6 lg:flex-none lg:bg-transparent lg:py-0'
            }
          >
            <div className="mx-auto w-full max-w-[26.25rem]">
              <div className="hidden lg:mb-6 lg:block">
                <Brand />
              </div>

              <h1
                id="auth-title"
                className={
                  isLogin
                    ? 'text-h1 font-extrabold text-text'
                    : 'text-h1 font-extrabold text-text max-lg:sr-only'
                }
              >
                {title}
              </h1>

              {description && (
                <div
                  className={
                    isLogin
                      ? 'mt-2 text-body text-muted'
                      : 'hidden text-body text-muted lg:mt-2 lg:block'
                  }
                >
                  {description}
                </div>
              )}

              {/*
               * En móvil no hay tarjeta: el formulario va sobre la lámina o el
               * fondo. Desde `lg` recupera la superficie con borde y sombra.
               */}
              <div className="mt-6 lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-7 lg:shadow-sm">
                {children}
              </div>

              {footer && (
                <div
                  className={
                    isLogin
                      ? 'mt-6 text-center text-body-sm text-muted'
                      : 'mt-6 text-center text-body-sm text-muted lg:hidden'
                  }
                >
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
