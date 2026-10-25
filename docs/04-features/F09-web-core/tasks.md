# Tasks — F09 Web core

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F06.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Router por archivos
- [ ] Root layout
- [ ] QueryClientProvider
- [ ] api-client tipado
- [ ] Proxy /api
- [ ] Error boundary
- [ ] 404
- [ ] Variables de entorno
- [ ] Rutas de humo SSR/SPA/SSG

## Criterios de aceptación

- [ ] AC-01: La app arranca en desarrollo.
- [ ] AC-02: El proxy /api funciona.
- [ ] AC-03: Una ruta SSR renderiza en servidor.
- [ ] AC-04: Una ruta ssr:false no renderiza su componente en servidor.
- [ ] AC-05: Una ruta prerenderizada genera HTML.
- [ ] AC-06: No hay errores de hidratación en las rutas de humo.

## Verificación

- [ ] `pnpm --filter @memora/web dev`
- [ ] `pnpm --filter @memora/web build`
- [ ] `pnpm --filter @memora/web test`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
