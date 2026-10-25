# ADR-0002: SSR + SPA selectiva + SSG por ruta

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Cada ruta tiene una necesidad distinta: la invitación necesita Open Graph, la zona privada es interactiva y la ayuda es editorial.

## Decisión

Usar **selective SSR** de TanStack Start:

- SSR en `/`, `/login`, `/register`, `/invite/:token` y 404.
- `ssr: false` en el layout privado `_app` y sus hijas.
- `prerender` para `/help` y `/privacy`.

No se usa el modo SPA global.

## Alternativas

- SPA pura: simple, pero sin Open Graph ni SSG.
- SSR en todo: más coste y problemas de hidratación en una zona privada muy interactiva.
- MPA: no encaja con la navegación y el estado compartido.

## Consecuencias

- El despliegue requiere Node; no es un hosting estático puro.
- La API sigue autorizando; `ssr: false` no es una medida de seguridad.
- El HTML inicial de rutas privadas es una shell; hay que cuidar el fallback y el foco.
- Se documenta la diferencia entre “SPA selectiva” y “modo SPA global”.

## Referencias

- `docs/03-architecture/render-modes.md`
- `docs/04-features/F09-web-core/spec.md`
