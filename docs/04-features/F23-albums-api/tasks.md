# Tasks — F23 Albums API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F17.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (G1, 2026-11-05).

## Implementación

- [x] Listar/crear/detalle/editar/borrar
- [x] Borrar owner o creador y solo si está vacío
- [x] Vaciar álbum owner o creador con confirmación
- [x] Pertenencia al círculo
- [x] Portada
- [x] Fecha
- [x] Permisos por flag
- [x] Tests

## Criterios de aceptación

- [x] AC-01: Álbum pertenece a un círculo.
- [x] AC-02: Solo miembros ven.
- [x] AC-03: Crear requiere permiso.
- [x] AC-04: Editar requiere owner o permiso; borrar owner o creador (vacío).
- [x] AC-05: Portada validada.
- [x] AC-06: No se filtra información.
- [x] AC-07: Borrar álbum con fotos devuelve `409 ALBUM_NOT_EMPTY`.
- [x] AC-08: Vaciar álbum elimina fotos y tags con confirmación. **Desviación de G1:** los objetos de almacenamiento se difieren a F25; el contrato devuelve `{ deletedCount }`.

## Verificación

- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test albums` → 24 tests, 1 archivo, todos pasan.
- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → 243 tests, 13 archivos, todos pasan.
- [x] `DATABASE_URL=…/memora_test pnpm test` → 8/8 tareas, 1086 tests (shared 145, api-client 39, ui 281, web 378, api 243).
- [x] `pnpm --filter @memora/api typecheck` → exit 0.
- [x] `pnpm lint` → 6/6.

## Cierre

- [x] Revisión independiente (nivel B): primera ronda **no apto** por B-01; segunda **apto**, sin bloqueantes nuevos.
- [x] Aceptación del usuario el 2026-11-05.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit ejecutado: `34c71cd` (`feat(api): add albums API with pagination, cover and safe delete (F23)`) y `6ad8226` (`docs: record F23 implementation, review and acceptance`).
- [x] PR [#36](https://github.com/Luceir0/lab-final--memora/pull/36) mergeada en `main` con el merge commit `dca7a60bf386bd898c55d6ae8cf82b70166b68dd`.
- [x] CI en verde: run `42018373439` en la PR y run `42018611662` en `main`, ambos `completed/success`.

## Cambio posterior (2026-11-05)

F23 se cerró con la regla de que vaciar y eliminar eran **solo del owner**. Durante la aceptación de F24, el usuario autorizó ampliarla: ahora los permite el **owner o el miembro que creó el álbum**, sin depender de `membersCanCreateAlbums`, para que el creador pueda deshacer lo que crea aunque el admin revoque después la flag. Eliminar sigue exigiendo que el álbum esté vacío (`409 ALBUM_NOT_EMPTY`); un creador con fotos recibe `409`, no `403`. Editar no cambia. Implementado en `packages/shared/src/permissions.ts` y cubierto por los **27 tests** de `apps/api/src/modules/albums/albums.test.ts`. El historial de cierre anterior se conserva tal cual.

