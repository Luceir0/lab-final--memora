# ADR-0001: TanStack Start como metaframework

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Memora necesita una sola aplicación React con rutas SPA, SSR y SSG, tipado de rutas y una curva de aprendizaje compatible con el curso. Next.js es la alternativa más conocida.

## Decisión

Usar **TanStack Start 1.169** sobre Vite, con TanStack Router y TanStack Query.

## Alternativas

- **Next.js App Router:** más conocido, pero cambia el modelo mental con Server Components, no usa Vite y mezcla más conceptos.
- **SPA pura con React Router:** más simple, pero deja fuera SSR, SSG y metaframework.
- **Remix/React Router framework:** buena opción, pero el curso y los apuntes giran alrededor de TanStack.

## Consecuencias

- Una sola app cubre los tres modos de render.
- Riesgo de APIs recientes y menos ejemplos; se mitiga con spike F05 y documentación oficial.
- Plan de salida: si bloquea, las rutas privadas pasan a SPA pura sin rehacer componentes, hooks ni API.
- Se documenta Next.js como alternativa estudiada.

## Referencias

- `docs/03-architecture/render-modes.md`
- `docs/04-features/F05-spike-tecnico/spec.md`
