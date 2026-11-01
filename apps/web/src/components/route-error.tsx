import { useEffect, useRef } from 'react';

export interface RouteErrorProps {
  /** Título del bloque. Por defecto, el de la ruta raíz. */
  readonly title?: string;
  /** Mensaje seguro en español. */
  readonly message: string;
  /** Acción de reintento real: invalida la caché y vuelve a ejecutar la ruta. */
  readonly onRetry: () => void;
}

/**
 * Bloque de error de ruta.
 *
 * - `role="alert"` para que el lector de pantalla anuncie el fallo al aparecer.
 * - El foco se mueve al título (con `tabIndex={-1}`) tras montar.
 * - Ofrece reintento y un enlace de escape a la portada; nunca deja al usuario
 *   atrapado en la pantalla de error.
 */
export function RouteError({
  title = 'No hemos podido cargar esta página',
  message,
  onRetry,
}: RouteErrorProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <section
        role="alert"
        aria-labelledby="route-error-title"
        className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 shadow-md sm:p-8"
      >
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
          Error
        </p>
        <h1
          id="route-error-title"
          ref={titleRef}
          tabIndex={-1}
          className="mt-2 text-h1 font-extrabold text-text"
        >
          {title}
        </h1>
        <p className="mt-2 text-body text-muted">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-2 text-body font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-md px-1 py-2 text-body font-semibold text-primary-text underline underline-offset-4"
          >
            Volver al inicio
          </a>
        </div>
      </section>
    </main>
  );
}
