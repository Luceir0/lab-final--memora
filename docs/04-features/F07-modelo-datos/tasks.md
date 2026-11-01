# Tasks — F07 Modelo de datos, migraciones y seed

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F06 `done`.
- [x] Comprobar Definition of Ready (feature abierta con permiso del usuario).
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Modelos User, Session, Circle, Membership, Invitation, Album, Photo, PhotoTag, DownloadJob y Activity — `apps/api/prisma/schema.prisma`.
- [x] Enums: `ThemePreference`, `Role`, `DownloadKind`, `DownloadStatus`, `ActivityType`.
- [x] Índices y unique constraints — `migration.sql` y tests de constraints.
- [x] Migración inicial única `20261031224916_init`; `spike_init` y `SpikeNote` eliminados con permiso del usuario.
- [x] Seed determinista — `apps/api/prisma/seed.ts`.
- [x] Base de datos de test y guardas — `apps/api/src/test/db.ts`.
- [x] Factorías tipadas — `apps/api/src/test/factories.ts`.

## Criterios de aceptación

- [x] AC-01: `prisma migrate dev` aplica sin errores. Evidencia: migración aplicada en `memora_test`; `db.integration.test.ts` verifica `_prisma_migrations`.
- [x] AC-02: relaciones y cascadas correctas. Evidencia: tests de borrado de círculo, álbum, foto, portadas, job e invitación.
- [x] AC-03: no existen `latitude`/`longitude` en `Photo`. Evidencia: `schema.prisma` y `migration.sql`.
- [x] AC-04: `Activity` tiene índices por círculo/fecha. Evidencia: `Activity_circleId_createdAt_idx` y `Activity_actorId_createdAt_idx` comprobados en `db.integration.test.ts`.
- [x] AC-05: el seed es idempotente. Evidencia: seed repetido y seed tras dos resets con snapshot idéntico.
- [x] AC-06: la BD de test se crea y limpia. Evidencia: 36 tests contra `memora_test`; `resetDb` y guardas en `apps/api/src/test/db.test.ts`.

## Verificación

- [x] `DATABASE_URL=.../memora_test pnpm --filter @memora/api test` → 4 archivos, 36 tests, 0 skips.
- [x] `pnpm --filter @memora/api test` sin `DATABASE_URL` → 23 passed + 13 skipped.
- [x] `DATABASE_URL=.../memora pnpm --filter @memora/api test` → se niega por el sufijo `_test`.
- [x] `typecheck`, `lint` y `build` de `@memora/api` → OK.
- [x] `pnpm exec turbo run typecheck --force` → 8/8 tareas.
- [x] `pnpm exec turbo run lint --force` → 6/6 tareas.
- [x] `corepack pnpm docs:check` → 191 archivos, 430 enlaces, 0 rotos.
- [x] `corepack pnpm agents:check` → OK.

## Revisión

- [x] Revisión independiente, primera iteración: **no apto** — 2 bloqueantes (seed no determinista y `resetDb` capaz de truncar cualquier base).
- [x] Correcciones de bloqueantes y hallazgos aplicadas.
- [x] Re-revisión: **apto con correcciones**, sin bloqueantes abiertos.
- [x] Correcciones cerradas y re-verificadas.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.

## Cierre

- [x] Aceptación del usuario (2026-11-01).
- [x] Commits `e94ba58` (`feat(api): add data model, initial migration and seed`), `15b26e1` (`ci: run api integration tests against postgres`) y `a936d7a` (`docs: close F07 documentation and record acceptance`) en `feat/F07-modelo-datos`.
- [x] Push de la rama y PR #3.
- [x] Merge en `main` como `bd2769c`.
- [x] CI de la PR (head `a936d7a`) `completed/success`; CI de `main` run `41254603622` `completed/success`, con PostgreSQL 17.11 y tests contra `memora_test` sin skips.
- [x] `done` (2026-11-01).

Notas: F07 cerrada. El cierre documental de esta entrada lo commiteará el orquestador; este agente no hace commit ni push.
