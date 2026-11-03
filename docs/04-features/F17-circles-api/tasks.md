# Tasks — F17 Circles API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F08, F15.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

Decisiones del G1 (2026-11-03): listado por `updatedAt desc` con desempate `id desc` y cursor keyset `(updatedAt, id)`; `coverPhotoId` ajeno o inexistente → `404 NOT_FOUND`; borrado en cascada solo de filas, con limpieza de storage diferida.

## Implementación

- [x] GET/POST /circles
- [x] GET/PATCH/DELETE /circles/:circleId
- [x] Membership owner
- [x] Settings flags
- [x] Stats
- [x] Autorización
- [x] Tests de acceso cruzado

### Correcciones de la revisión A

- [x] Mayor: `PATCH` mapea `P2025`/`P2003` a `404`; `DELETE` usa `deleteMany` y `count === 0` → `404`; 4 tests nuevos de carrera.
- [x] CSRF documentado en OpenAPI.
- [x] `role` derivado de `ownerId`: un no-owner nunca se expone como `owner`.
- [x] Negativos de `Origin` en las tres mutaciones.
- [x] `format:check`.
- [x] Comando de verificación de la spec con `DATABASE_URL` (M-08).
- [x] Estado y documentación desactualizados: cerrados en este cierre.
- [x] Nits: `400` en OpenAPI para params de detalle y `DELETE`, tag `Circles`, mensaje genérico de `requirePrisma`, `select` en `findCirclePhoto`, aserciones de `cache-control`/`vary`.

## Criterios de aceptación

- [x] AC-01: Crear círculo añade owner membership.
- [x] AC-02: Solo miembros ven el círculo.
- [x] AC-03: Solo owner edita settings/borra.
- [x] AC-04: Un extraño recibe 404.
- [x] AC-05: settings valida flags.
- [x] AC-06: Stats no filtran otros círculos.
- [x] AC-07: Tests negativos.

## Verificación

- [x] `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test circles` → 28/28.
- [x] `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test` → 10 archivos, 155/155.
- [x] `pnpm --filter @memora/api typecheck` → limpio.
- [x] `pnpm --filter @memora/api lint` → limpio.
- [x] `pnpm format:check` → limpio.

## Cierre

- [x] Revisión independiente (nivel A, `reviewer`: una ronda, cambios requeridos; 1 Mayor, 6 Menores y 5 Nits, todos corregidos).
- [x] Aceptación del usuario (2026-11-03).
- [x] `handoff.md` completo.
- [x] Tablero actualizado (F17 en `done`).
- [x] Bitácora y cobertura actualizadas.
- [x] Commit ejecutado: `c9fdb67` (`feat(api): add circles API with membership and stats (F17)`) y `2cde01b` (`docs: record F17 implementation, review and acceptance`).
- [x] PR #24, CI en verde (run `41698807962`, job `126136355090`, `completed/success`) y merge `03d7250` en `main`, con CI sobre el merge en verde (run `41699199355`, job `126137711370`, `completed/success`).
