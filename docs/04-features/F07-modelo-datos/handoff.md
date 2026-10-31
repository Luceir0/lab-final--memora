# Handoff — F07 Modelo de datos, migraciones y seed

- **Estado:** `accepted` (aceptada por el usuario el 2026-11-01; `done` pendiente de commit, PR/CI y merge)
- **Rama:** `main`, sin commits de F07
- **Fecha:** 2026-11-01
- **Implementado por:** orquestador y subagentes de implementación de F07
- **Revisado por:** reviewer independiente — primera iteración no apto; segunda iteración apto con correcciones; correcciones cerradas y verificadas
- **Aceptado por:** usuario (2026-11-01)

## Resultado

`apps/api` tiene el modelo de datos completo: `prisma/schema.prisma` con 10 modelos y 5 enums, una migración inicial única (`20261031224916_init`) y un seed determinista e idempotente. La migración de spike y `SpikeNote` se eliminaron con permiso del usuario. Se añadieron helpers de test con guardas, factorías tipadas y una suite de integración contra PostgreSQL real.

La verificación está en verde: con `DATABASE_URL` apuntando a `memora_test`, 4 archivos y 36 tests sin skips; sin `DATABASE_URL`, 23 passed + 13 skipped; apuntando a la base de desarrollo `memora`, la guarda se niega a truncar. La revisión independiente necesitó dos iteraciones: la primera fue **no apto** por dos bloqueantes (seed no determinista y `resetDb` capaz de truncar cualquier base); la segunda fue **apto con correcciones**. F07 está **`accepted`**.

**Cierre:** el usuario aceptó F07 el 2026-11-01, después de la re-revisión «apto con correcciones» y con las correcciones cerradas. La aceptación no cierra la feature: quedan el commit en `feat/f07-modelo-datos`, la PR con CI (incluida la validación real del servicio PostgreSQL en el runner) y el paso a `done`. Todavía no existen hash de commit, número de PR ni run de CI de F07.

## Cambios (archivos)

### Modelo y migración

- `apps/api/prisma/schema.prisma`: 10 modelos (`User`, `Session`, `Circle`, `Membership`, `Invitation`, `Album`, `Photo`, `PhotoTag`, `DownloadJob`, `Activity`), 5 enums, `timestamptz(3)`, índices y unique constraints; sin coordenadas GPS.
- `apps/api/prisma/migrations/20261031224916_init/migration.sql`: migración inicial única con tablas, índices, FKs y cascadas.
- `apps/api/prisma/migrations/20261026153600_spike_init/migration.sql`: eliminada con permiso del usuario, junto con el modelo `SpikeNote`. El reset de la base local se autorizó explícitamente con `prisma migrate reset --force`.
- `apps/api/prisma7.config.ts`: configuración de Prisma 7 ajustada al esquema definitivo.

### Seed

- `apps/api/prisma/seed.ts`: seed determinista con `SEED_TIMESTAMP = 2025-01-15T09:00:00.000Z`, invitación con `expiresAt` 2030-01-01, círculo restrictivo con los cuatro flags `false`, 2 usuarios, 2 círculos, 4 memberships, 2 álbumes, 6 fotos, 2 tags, 1 invitación y 4 actividades con offsets +0/+1/+2/+3 h.
- Usa ids fijos y `upsert`; no hay `deleteMany` global. Dos ejecuciones producen digests idénticos.
- El `passwordHash` es un placeholder explícito que no autentica; F15 lo sustituirá por hashing real.

### Tests y CI

- `apps/api/src/test/db.ts`: cliente de test perezoso, `resetDb` y `withCleanDb`. Guarda: nombre acabado en `_test`, host local y entorno de test (`NODE_ENV=test` o `VITEST`). `ALLOW_REMOTE_TEST_DB=1` relaja **solo** el host.
- `apps/api/src/test/factories.ts`: factorías tipadas y deterministas con overrides parciales para usuarios, círculos, memberships, álbumes, fotos, tags y actividad.
- `apps/api/src/test/db.test.ts`: pruebas de la guarda (sufijo, host, entorno, URL inválida y `ALLOW_REMOTE_TEST_DB`).
- `apps/api/src/db.integration.test.ts`: reescrito para el modelo definitivo; cubre migración, `timestamptz(3)`, índices, constraints, cascadas, seed repetido, seed tras dos resets y `resetDb`.
- `apps/api/package.json`: scripts `db:migrate:deploy`, `db:seed` y test con `prisma generate`.
- `.github/workflows/ci.yml`: servicio `postgres:17.11-alpine` con healthcheck, `DATABASE_URL=postgresql://memora:memora@localhost:5432/memora_test`, paso `db:migrate:deploy` y `NODE_ENV=test` en el test. Configurado, aún no validado en el runner.

### Documentación

- `docs/03-architecture/data-model.md`: índice `PhotoTag (taggedUserId, photoId)`, `timestamptz(3)`, notas de `Photo.circleId`/`Album.circleId` y de los tags al expulsar.
- `docs/03-architecture/monorepo.md`: base `memora_test`, comando de creación y guardas.
- `docs/05-quality/test-matrix.md`: fila de base de datos e integración real en CI.
- `docs/04-features/F07-modelo-datos/spec.md`, `tasks.md` y este `handoff.md`.
- `docs/04-features/README.md`, `docs/00-index.md`, `README.md`, `docs/06-process/ai-log.md` y `docs/07-curriculum/coverage-map.md`.

`apps/api/README.md` sigue desactualizado: el intento de actualizarlo fue rechazado por los permisos del rol documental.

## Verificación

| Comando | Resultado real |
| --- | --- |
| `DATABASE_URL=.../memora_test pnpm --filter @memora/api test` | 4 archivos, 36 tests, 0 skips |
| `pnpm --filter @memora/api test` sin `DATABASE_URL` | 23 passed + 13 skipped |
| `DATABASE_URL=.../memora pnpm --filter @memora/api test` | Se niega: `Refusing to truncate database "memora" because its name does not end in "_test"` |
| `typecheck`, `lint` y `build` de `@memora/api` | OK |
| `pnpm exec turbo run typecheck --force` | 8/8 tareas |
| `pnpm exec turbo run lint --force` | 6/6 tareas |
| `corepack pnpm docs:check` | 191 archivos, 430 enlaces, 0 rotos |
| `corepack pnpm agents:check` | OK |

El CI con PostgreSQL está configurado, pero **no se ha validado en el runner**: no hay PR de F07 todavía.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01: `prisma migrate dev` aplica sin errores | Pasa | Migración `20261031224916_init` aplicada en `memora_test`; `db.integration.test.ts` comprueba `_prisma_migrations` y que no queda ninguna migración de spike |
| AC-02: relaciones y cascadas correctas | Pasa | Tests de borrado de círculo, álbum, foto, portadas, `DownloadJob.albumId` e `Invitation.acceptedBy` |
| AC-03: no existen `latitude`/`longitude` en `Photo` | Pasa | `schema.prisma` y `migration.sql`; solo `placeName` |
| AC-04: `Activity` tiene índices por círculo/fecha | Pasa | `Activity_circleId_createdAt_idx` y `Activity_actorId_createdAt_idx`, verificados en `db.integration.test.ts` |
| AC-05: el seed es idempotente | Pasa | Seed dos veces con resumen y snapshot idénticos; seed tras dos resets con el mismo resultado |
| AC-06: la BD de test se crea y limpia | Pasa | Suite completa contra `memora_test`; `resetDb` trunca todas las tablas y las guardas rechazan otras bases |

## Pendiente

- Commit en `feat/f07-modelo-datos` y push; después PR, CI y merge. Hoy no existen hash, PR ni run de CI de F07.
- Validar el CI con PostgreSQL en el runner (servicio, healthcheck, `db:migrate:deploy` y `NODE_ENV=test`).
- Pasar F07 a `done` después del merge y del CI en verde.
- Deuda trasladada:
  - **F21:** borrar los `PhotoTag` del miembro expulsado o que sale en la misma transacción; no hay FK que lo haga.
  - **F23/F25:** garantizar en servicio que `Photo.circleId === Album.circleId`; la BD no tiene FK compuesta.
  - **F08/F15:** mapear `ActivityType` (`photo_uploaded`…) al contrato (`photo.uploaded`…).
  - Actualizar `apps/api/README.md` cuando los permisos lo permitan.

## Riesgos y limitaciones

- El seed usa un hash placeholder que no autentica; es deliberado hasta F15.
- `resetDb` trunca tablas: la guarda por nombre/host/entorno es la última defensa. `ALLOW_REMOTE_TEST_DB=1` no debe usarse contra bases compartidas.
- La invariante `Photo.circleId`/`Album.circleId` no está en la BD; un bug de servicio puede crear una foto incoherente.
- El CI con PostgreSQL no se ha ejecutado todavía; puede requerir ajustes de healthcheck o credenciales.
- La aceptación no cierra F07: antes de `done` hacen falta commit, PR, CI en verde y merge.

## Documentación actualizada

- [x] `docs/03-architecture/data-model.md`, `monorepo.md`
- [x] `docs/05-quality/test-matrix.md`
- [x] `docs/04-features/F07-modelo-datos/spec.md`, `tasks.md`, `handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/00-index.md` y `README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [ ] `apps/api/README.md` (bloqueado por permisos del rol documental)

## Siguiente paso propuesto

1. Crear `feat/f07-modelo-datos`, commit y push con permiso.
2. Abrir la PR y validar el CI con PostgreSQL en el runner.
3. Tras merge y CI en verde, cerrar F07 como `done`.
4. Abrir F08 solo con permiso del usuario.
