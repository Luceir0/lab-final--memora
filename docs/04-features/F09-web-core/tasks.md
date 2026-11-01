# Tasks — F09 Web core

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F06.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Router por archivos
- [x] Root layout
- [x] QueryClientProvider
- [x] api-client tipado
- [x] Proxy /api
- [x] Error boundary
- [x] 404
- [x] Variables de entorno
- [x] Rutas de humo SSR/SPA/SSG

## Criterios de aceptación

- [x] AC-01: La app arranca en desarrollo.
- [x] AC-02: El proxy /api funciona.
- [x] AC-03: Una ruta SSR renderiza en servidor.
- [x] AC-04: Una ruta ssr:false no renderiza su componente en servidor.
- [x] AC-05: Una ruta prerenderizada genera HTML.
- [x] AC-06: No hay errores de hidratación en las rutas de humo. — **verificado en navegador por el usuario (Firefox, 2026-11-01)** sobre `/login`, `/circles`, `/help` y una ruta inexistente. Sin test automatizado de navegador: Playwright llega en F37/F38.

## Verificación

- [x] `corepack pnpm --filter @memora/web dev`
- [x] `corepack pnpm --filter @memora/web build` → client + SSR + prerender de `/help` (1 página)
- [x] `corepack pnpm --filter @memora/web test` → 52 passed (13 archivos)
- [x] `corepack pnpm --filter @memora/web typecheck` → OK
- [x] `corepack pnpm --filter @memora/web lint` → OK
- [x] `corepack pnpm --filter @memora/api-client test` → 39 passed (3 archivos)
- [x] `corepack pnpm -r typecheck` → 6 workspaces OK
- [x] `corepack pnpm -r lint` → 6 workspaces OK
- [x] `corepack pnpm --filter @memora/web test` → 52 passed tras mover `LoginPage` a `features/spike/login-page.tsx`
- [x] `corepack pnpm docs:check` → 191 archivos, 433 enlaces, 0 rotos
- [x] `corepack pnpm agents:check` → OK

## Cierre

- [x] Revisión independiente. Dos rondas: primera **no apto** (B-01 y M-01, con m-01…m-05 y S-01…S-04); segunda **apto con correcciones** (N-01, N-02, N-03), todas aplicadas.
- [x] Corrección posterior: code-splitting de `/login` (la ruta exportaba `LoginPage` además de `Route`); componente movido a `apps/web/src/features/spike/login-page.tsx`.
- [x] Aceptación del usuario (G4), 2026-11-01: Firefox real sobre `/login`, `/circles`, `/help` y ruta inexistente, sin errores de hidratación.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
- [ ] Push y PR.
- [ ] CI de la PR y de `main` en verde.
- [ ] Merge y paso a `done`.

## Deuda trasladada

- AC-06 con **prueba automatizada** de navegador: F37 (infraestructura de tests) y F38 (E2E). La verificación manual ya está hecha.
- Consumidor de producto del cliente de servidor y cabecera `cookie` en server functions autenticadas: F10/F22.
- Multipart y binario en el cliente: F25/F33.
- Enrutado de `/api` en producción: F42.
- `apps/web/scripts/no-tests.mjs` huérfano: falta permiso para borrarlo.
