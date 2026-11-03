# Tasks — F16 Auth web

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F13, F15 (`done`).
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] LoginForm
- [x] RegisterForm
- [x] AuthLayout
- [x] RHF + Zod
- [x] Errores
- [x] Autocomplete
- [x] Redirect
- [x] Rutas SSR

## Criterios de aceptación

- [x] AC-01: Formularios etiquetados y accesibles.
- [x] AC-02: Validación cliente y servidor con el mismo schema.
- [x] AC-03: Errores comprensibles y no filtran existencia.
- [x] AC-04: Autocomplete correcto.
- [x] AC-05: Teclado móvil no tapa botón/errores.
- [x] AC-06: Tras login vuelve a redirect o /circles.
- [x] AC-07: SSR funciona.

## Verificación

- [x] `pnpm --filter @memora/web test auth` → **8 archivos, 58 tests**.
- [x] `pnpm --filter @memora/web test` → **33 archivos, 207 tests**.
- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → **127 tests, 0 skipped**.
- [x] `pnpm --filter @memora/web typecheck`, `lint` y `format:check` sin errores.
- [x] `pnpm --filter @memora/web build` con chunks `login-ZbFqBaLo.js` (3,38 kB) y `register-DMCLpfSA.js` (6,76 kB).
- [x] SSR: `GET /login` y `GET /register` → 200 con `<h1>` y `<form method="post" action=…>`.
- [x] Flujo HTTP real: login 200, 401 idéntico, `/api/me` 200, registro 201 y 409 con `details[0].field = "email"`.
- [x] axe en página completa: 0 violaciones (390×844, 320×640, 1440×900, claro y oscuro).
- [x] Medición a 390×844, 390×500 con teclado simulado y 1440×900 con texto al 200 %: campo y error por encima de la barra, sin scroll horizontal.
- [x] `pnpm docs:check`.

## Cierre

- [x] Revisión independiente (tres rondas; sin bloqueantes ni mayores abiertos).
- [x] Aceptación del usuario (2026-11-03; login, registro, 401, 409, redirect y 429 en navegador real).
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar). **La PR no existe todavía**: no hay commit, PR ni run que registrar.
