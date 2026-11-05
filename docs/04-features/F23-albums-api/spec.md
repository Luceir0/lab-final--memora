---
id: F23
title: "Albums API"
milestone: M3
size: M
status: done
spec: complete
depends_on:
  - "F17"
blocks:
  - "F24"
  - "F25"
  - "F35"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F23 — Albums API

> **Milestone:** M3 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F17 · **Bloquea:** F24, F25, F35

## Objetivo

Implementar CRUD de álbumes con permisos y paginación.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- Listar/crear/detalle/editar/borrar
- Borrar owner o creador y solo si está vacío (en el cierre de F23 era solo owner; ver cambio posterior)
- Vaciar álbum owner o creador con confirmación (en el cierre de F23 era solo owner; ver cambio posterior)
- Pertenencia al círculo
- Portada
- Fecha
- Permisos por flag
- Tests

### No incluye

- Fotos y subidas (F25)
- UI (F24)

## Decisiones de G1 (2026-11-05)

Confirmadas por el usuario antes de implementar:

1. **Orden de `GET /circles/:circleId/albums`.** `createdAt desc` con desempate `id desc`. Cursor keyset opaco sobre `(createdAt, id)`; `limit` 1–100 con defecto 24. Un cursor inválido devuelve `400 VALIDATION_ERROR`.
2. **Portada.** `coverPhotoId` debe ser una foto **de ese álbum**. Si no existe, pertenece a otro álbum o a otro círculo → `404 NOT_FOUND`; `null` limpia la portada. No se acepta una portada de otro círculo para no exponer su miniatura ni sus dimensiones.
3. **Vaciar álbum y objetos.** F23 borra en una transacción las fotos y sus `PhotoTag` y devuelve `200 { deletedCount }`. La eliminación de **objetos de almacenamiento se difiere a F25**, porque el adaptador real de storage llega en esa feature y hoy falla cerrado. Es una desviación explícita de AC-08, registrada en el handoff y en la bitácora. El vaciado de un álbum ya vacío es idempotente y devuelve `{ deletedCount: 0 }`.
4. **Actividad.** `POST /circles/:circleId/albums` escribe `album.created` en la **misma transacción** que el alta, con `actorId`, `circleId`, `albumId` y `metadata: { albumTitle }`, según [activity.md](../../03-architecture/activity.md). F35 solo lee.
5. **Sin migración en F23.** El índice existente `(circleId, createdAt)` cubre la lista de álbumes. La deuda de índices de `Photo` y `Membership` se resuelve en F25, donde la galería paginada la necesita.

Semántica de permisos, ya implementada en `can()`: listar y ver exige pertenencia al círculo (un no miembro recibe `404`, nunca `403`); crear exige owner o miembro con `membersCanCreateAlbums`; editar exige owner o su creador con esa flag; borrar exige owner o creador y que el álbum esté vacío; vaciar exige owner o creador (actualizado el 2026-11-05, ver nota).

> **Cambio posterior (2026-11-05).** Autorizado por el usuario durante F24: vaciar y eliminar un álbum dejan de ser solo del owner. F23 se cerró con la regla de **solo owner**; F24 la amplía. Ahora los permite el owner **o el miembro que creó el álbum**, sin depender de `membersCanCreateAlbums`, para que el creador pueda deshacer lo que crea aunque el admin revoque después la flag. Eliminar sigue exigiendo que el álbum esté vacío (`409 ALBUM_NOT_EMPTY`); un creador con fotos recibe `409`, no `403`. Editar no cambia. Implementado en `can()` y probado en `packages/shared/src/permissions.test.ts` y `apps/api/src/modules/albums/albums.test.ts`.

## Entregables

- apps/api/src/modules/albums/**

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Álbum pertenece a un círculo.
- **AC-02.** Solo miembros ven.
- **AC-03.** Crear requiere permiso.
- **AC-04.** Editar requiere owner o permiso; borrar owner o creador (vacío).
- **AC-05.** Portada validada.
- **AC-06.** No se filtra información.
- **AC-07.** Borrar álbum con fotos devuelve `409 ALBUM_NOT_EMPTY`.
- **AC-08.** Vaciar álbum elimina fotos y tags con confirmación. **En F23 los objetos de almacenamiento se difieren a F25** (decisión de G1); el contrato devuelve `{ deletedCount }`.

## Pruebas

- CRUD
- Permisos
- Acceso cruzado
- Portada inválida
- Álbum no vacío
- Vaciar álbum

## Archivos previstos

- `apps/api/src/modules/albums/**`

## Verificación

- `pnpm --filter @memora/api test albums`

## Definition of Ready

- [x] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [x] Decisiones resueltas: las cinco de G1 (2026-11-05).
- [x] Contratos congelados: `packages/shared/src/schemas/albums.ts` y semántica añadida a [api-contract.md](../../03-architecture/api-contract.md).
- [x] Diseño enlazado: no aplica (feature de backend).
- [x] Datos de prueba: semilla con dos álbumes y seis fotos; factorías de API.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Cierre (G5, 2026-11-05)

- **Estado:** `done`. Feature de backend: no hay prueba en navegador.
- **Aceptación:** el usuario aceptó F23 el **2026-11-05**, tras la revisión independiente de nivel **B** y las verificaciones.
- **Revisión independiente (nivel B), dos rondas:**
  - Primera ronda: **no apto** por **B-01**. `deleteAlbumIfEmpty` usaba `deleteMany` con `photos: { none: {} }` y, bajo `READ COMMITTED`, una foto insertada y confirmada entre el `NOT EXISTS` y el bloqueo podía borrarse por la cascada de la FK.
  - Corrección: transacción interactiva con `SELECT "id" FROM "Album" WHERE "id" = … AND "circleId" = … FOR UPDATE`, después `tx.photo.count` y `tx.album.delete`. Test de concurrencia con una segunda conexión real: la versión anterior fallaba con `204` y foto perdida; la corregida responde `409` y conserva la foto.
  - Segunda ronda: **apto**, sin bloqueantes nuevos.
  - Cerrados también **m-01** (el vaciado no toca álbumes hermanos), **m-02** (desempate del keyset con `createdAt` idéntico) y **m-03** (`403` decidido por `can()`; test con rol `owner` falsificado).
- **Verificación real:**
  - `DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test albums` → **24 tests, 1 archivo, todos pasan**.
  - `… pnpm --filter @memora/api test` → **243 tests, 13 archivos, todos pasan**.
  - `… pnpm test` → **8/8 tareas, 1086 tests**: `@memora/shared` 145, `@memora/api-client` 39, `@memora/ui` 281, `@memora/web` 378, `@memora/api` 243.
  - `pnpm --filter @memora/api typecheck` → exit 0; `pnpm lint` → 6/6.
- **Pendiente registrado:**
  - Objetos de almacenamiento al vaciar un álbum → **F25**.
  - Índices `(circleId, createdAt, id)` en `Photo` y `(circleId, joinedAt)` en `Membership` → **F25** (requieren migración y permiso).
  - **N-01** (`coverPhoto: true` carga la fila `Photo` completa), **m-04** (timeout de la transacción de borrado: `P2028`/500 si el lock dura más de 5 s) y **N-02** (robustez del test de concurrencia con `Promise.race`). Son menores/nits y no reabren la revisión.
  - Nota para F25: no actualizar `Album` en la misma transacción que inserta `Photo`, o mantener un orden de locks consistente, para evitar un ciclo de upgrade con el `FOR UPDATE` del borrado.
  - **Cierre operativo:** commits `34c71cd` (`feat(api): add albums API with pagination, cover and safe delete (F23)`) y `6ad8226` (`docs: record F23 implementation, review and acceptance`) en `feat/F23-albums-api`; [PR #36](https://github.com/Luceir0/lab-final--memora/pull/36) mergeada en `main` con el merge commit `dca7a60bf386bd898c55d6ae8cf82b70166b68dd`; CI run `42018373439` en la PR y run `42018611662` en `main`, ambos `completed/success`.

## Preguntas abiertas

Ninguna. El borrado con fotos devuelve `409 ALBUM_NOT_EMPTY` y el cliente ofrece vaciarlo; el vaciado elimina filas y etiquetas, y los objetos quedan para F25.
