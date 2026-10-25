---
name: TanStack Start
description: Patrones de TanStack Start 1.x, selective SSR, prerender, loaders e hidratación.
---

# TanStack Start 1.x en Memora

## Conceptos

- Rutas por archivos; `$param` para parámetros.
- Layouts anidados con `<Outlet />`.
- `beforeLoad` para sesión y redirección.
- `loader` para datos previos al render.
- `ssr: false` por ruta/layout para SPA selectiva.
- `prerender` para SSG.
- Server functions solo para lo que necesita el servidor web (cookie en SSR, Open Graph).

## Reglas

- No uses el modo SPA global: rompería SSR/SSG.
- El servidor Node sigue existiendo.
- No sustituyas la API REST con server functions.
- En SSR no hay `window`; renderiza primero móvil.
- Cuida fechas, aleatoriedad y `localStorage` para evitar hidratación distinta.
- Tema sin destello: cookie leída en servidor.

## Riesgo

La IA puede proponer APIs antiguas o mezclar Next.js. Consulta documentación oficial y verifica en el spike F05.

## Referencias

- `docs/03-architecture/render-modes.md`
- `docs/03-architecture/adr/ADR-0002-render-modes.md`
- `docs/03-architecture/adr/ADR-0001-metaframework.md`
