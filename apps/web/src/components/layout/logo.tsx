import { useRouter } from '@tanstack/react-router';
import type { MouseEventHandler } from 'react';

/**
 * Logotipo textual de Memora. Enlaza al inicio de la zona privada.
 *
 * Es un `<a>` nativo con `href` real: abrir en pestaña nueva, el menú
 * contextual y «copiar enlace» siguen funcionando. El `Link` del router no
 * sirve aquí porque inyecta `aria-current="page"` cuando está activo, y el
 * logotipo no es un destino de navegación; se mantiene `aria-current="false"`.
 *
 * La navegación SPA se resuelve en `onClick` con `router.navigate`, solo para
 * el clic primario sin modificadores. Con Ctrl/Cmd/Shift/Alt o con otro botón
 * no se intercepta y decide el navegador.
 *
 * El punto decorativo va `aria-hidden`: el nombre accesible es «memora». El
 * área táctil mantiene 44 px de alto.
 */
export function Logo() {
  const router = useRouter();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    void router.navigate({ to: '/circles' });
  };

  return (
    <a
      href="/circles"
      aria-current="false"
      onClick={handleClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-text"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
      <span className="text-h3 font-extrabold">memora</span>
    </a>
  );
}
