# Tasks — F15 Auth API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F07, F08.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

Decisiones del G1 (2026-11-03): `@node-rs/argon2` autorizado; email duplicado → `409 CONFLICT` con `details` de campo `email`; login fallido → mensaje «Email o contraseña incorrectos.» con código `UNAUTHENTICATED`; limpieza perezosa en F15 y purga programada a F42; tests de auth contra `memora_test`.

## Implementación

- [x] POST register/login/logout
- [x] GET csrf/me
- [x] PATCH me
- [x] Sesiones en BD
- [x] argon2id
- [x] Cookie
- [x] CSRF
- [x] Rate limit (5/min IP+email + 20/min IP agregado)
- [x] Tests escritos y ejecutados

> 2026-11-03: entorno desbloqueado con `@node-rs/argon2-wasm32-wasi@2.2.2` (devDependency autorizada). Se corrigió el orden de `setErrorHandler`/`setNotFoundHandler` (deben ir antes de registrar rutas) y se serializaron las suites de BD en `vitest.config.ts`.

### Correcciones de la revisión A

- [x] M-01: techo agregado de login 20/min por IP, además de 5/min por IP+email.
- [x] M-03: seed con hash Argon2id real y contraseña `memora-demo`.
- [x] M-04: test de rotación de sesión real (cookie antigua 401, nueva 200, una fila).
- [x] M-05: `Cache-Control: private, no-store` y `Vary: Cookie` en GET autenticados.
- [x] M-06: `APP_URL` debe ser HTTPS en producción.
- [x] M-07: CSRF obsoleto limpio en login/registro; sin token en la respuesta.
- [x] M-09: tag `Auth`, header `X-CSRF-Token` y `429` en OpenAPI.
- [x] N-03 opcional: prefijo `$argon2id$` y refresco de `lastUsedAt`.
- [x] M-02 y N-01: aceptados/documentados sin cambio de código.

## Criterios de aceptación

- [x] AC-01: Registro crea usuario y sesión.
- [x] AC-02: Login no revela si el email existe.
- [x] AC-03: Logout invalida la sesión.
- [x] AC-04: Cookie tiene flags correctos.
- [x] AC-05: CSRF se valida en mutaciones.
- [x] AC-06: Rate limit funciona.
- [x] AC-07: Sesión expirada devuelve 401.

## Verificación

- [x] `pnpm --filter @memora/api test auth` → 29/29.
- [x] `pnpm --filter @memora/api test` → 127/127.
- [x] `pnpm --filter @memora/api typecheck`, `lint`; `pnpm --filter @memora/shared test` (138); `pnpm typecheck`, `lint`, `format:check`.
- [x] Seed real + login `inject` con `lucia@memora.test` / `memora-demo` → 200.

## Cierre

- [x] Revisión independiente (nivel A, `reviewer`: apto con correcciones; 1 Mayor —M-01, techo agregado de login— y 8 Menores corregidos; N-01 aceptado).
- [x] Aceptación del usuario (2026-11-03).
- [x] `handoff.md` completo.
- [x] Tablero actualizado (F15 en `done`).
- [x] Bitácora y cobertura actualizadas.
- [x] Commit y PR (rama `feat/F15-auth-api`, commits `e4ed4f8` y `1e1e704`, PR #20, CI run `41640174983` y merge `af7d865` con CI run `41640515283`).
