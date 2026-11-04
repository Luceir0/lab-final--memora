# Tasks — F21 Members API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F17.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación. Plan G1 aprobado el 2026-11-04.

## Implementación

- [x] Contrato: `MemberDto` con `photosCount`.
- [x] GET members con paginación, orden y contador.
- [x] DELETE member
- [x] POST leave
- [x] Fotos de esta persona (`GET /circles/:circleId/members/:userId/photos`)
- [x] Reglas de owner
- [x] Tests
- [x] Invitaciones pendientes: cubiertas por F19 (`GET /circles/:circleId/invitations`, owner-only).

## Criterios de aceptación

- [x] AC-01: Miembros solo del círculo.
- [x] AC-02: Owner puede expulsar; member no.
- [x] AC-03: Member puede salir; owner no sin borrar.
- [x] AC-04: Fotos permanecen; tags del expulsado se eliminan.
- [x] AC-05: Contadores correctos.
- [x] AC-06: No se filtra información.
- [x] AC-07: Fotos de esta persona solo del círculo.

## Verificación

- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test members` → 18/18
- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → 218/218
- [x] `pnpm --filter @memora/shared test` → 145/145
- [x] `pnpm typecheck` → OK
- [x] `pnpm lint` → OK
- [x] `pnpm format:check` → OK
- [x] `pnpm docs:check` → OK
- [x] `pnpm agents:check` → OK

## Cierre

- [x] Revisión independiente: **apto con correcciones**, sin bloqueantes ni mayores.
- [x] Aceptación del usuario el **2026-11-04**.
- [x] `handoff.md` completo, con la tabla AC-01…AC-07 y la evidencia real.
- [x] Tablero actualizado: F21 en `done`.
- [x] Bitácora y cobertura actualizadas.
- [x] Commits `b69cbb6` (feature) y `39e33f6` (documentación); [PR #32](https://github.com/Luceir0/lab-final--memora/pull/32), merge `1b3215d` y CI en verde en la PR (run `41879532946`) y en `main` (run `41881097031`).

Los **Menores** m-01…m-06 y los **Nits** n-01…n-05 no se corrigen en esta feature: quedan
en `Pendiente` del [handoff](handoff.md) con su identificador y **no reabren la revisión**.
La carrera de milisegundos entre etiquetar y expulsar (m-06) queda como residual para **F32**.
