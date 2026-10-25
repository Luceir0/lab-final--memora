# Tasks — F15 Auth API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F07, F08.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] POST register/login/logout
- [ ] GET csrf/me
- [ ] PATCH me
- [ ] Sesiones en BD
- [ ] argon2id
- [ ] Cookie
- [ ] CSRF
- [ ] Rate limit
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Registro crea usuario y sesión.
- [ ] AC-02: Login no revela si el email existe.
- [ ] AC-03: Logout invalida la sesión.
- [ ] AC-04: Cookie tiene flags correctos.
- [ ] AC-05: CSRF se valida en mutaciones.
- [ ] AC-06: Rate limit funciona.
- [ ] AC-07: Sesión expirada devuelve 401.

## Verificación

- [ ] `pnpm --filter @memora/api test auth`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
