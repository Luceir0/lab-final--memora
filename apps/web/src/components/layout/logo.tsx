/**
 * Logotipo textual de Memora. Enlaza al inicio de la zona privada.
 *
 * Es un `<a>` nativo, no un `Link` del router: TanStack inyecta
 * `aria-current="page"` en los enlaces activos y el logotipo no es un destino
 * de navegación, así que se neutraliza con `aria-current="false"`.
 *
 * El punto decorativo va `aria-hidden`: el nombre accesible es «memora». El
 * área táctil mantiene 44 px de alto.
 */
export function Logo() {
  return (
    <a
      href="/circles"
      aria-current="false"
      className="inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-text"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
      <span className="text-h3 font-extrabold">memora</span>
    </a>
  );
}
