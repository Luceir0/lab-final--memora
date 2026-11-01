import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

/**
 * Página 404 de la ruta raíz.
 *
 * Explica qué ha pasado y ofrece una salida clara a la portada. Usa `Link`
 * para que la navegación sea SPA, sin recargar el documento. Al montar, mueve
 * el foco al título para que una navegación SPA a una ruta inexistente se
 * anuncie igual que una carga completa.
 */
export function NotFound() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
      <p className="text-caption font-semibold uppercase tracking-wide text-primary-text">
        Error 404
      </p>
      <h1 ref={titleRef} tabIndex={-1} className="mt-2 text-h1 font-extrabold text-text">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-prose text-body text-muted">
        El enlace puede estar mal escrito o la página ya no existe. Tus recuerdos siguen a salvo.
      </p>
      <p className="mt-6">
        <Link
          to="/"
          className="text-body font-semibold text-primary-text underline underline-offset-4"
        >
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
