# Handoff — F23 Albums API

- **Estado:** `done`
- **Rama:** `feat/F23-albums-api`, mergeada en `main`
- **PR:** [#36](https://github.com/Luceir0/lab-final--memora/pull/36)
- **Merge en `main`:** `dca7a60bf386bd898c55d6ae8cf82b70166b68dd`
- **CI:** PR run `42018373439` y `main` run `42018611662`, ambos `completed/success`
- **Fecha:** 2026-11-05
- **Nivel de auditoría:** B
- **Aceptación:** usuario, 2026-11-05. Feature de backend: no hay prueba en navegador.

## Resultado

CRUD completo de álbumes sobre la API real de Memora: seis endpoints con autorización por recurso y por flag, listado paginado con cursor keyset `(createdAt, id)`, portada validada contra fotos del propio álbum, alta transaccional con actividad `album.created` y borrado con bloqueo pesimista para que una foto recién insertada no se pierda por la cascada. **24 tests de integración reales** contra PostgreSQL, **243 tests de API** y **1086 tests** en el monorepo. Revisión independiente de nivel B en dos rondas: la primera fue **no apto** por B-01 y la segunda **apto**, sin bloqueantes nuevos. El usuario aceptó la feature el 2026-11-05 y el cierre operativo quedó completo con la PR #36, el merge `dca7a60` y CI en verde.

## Cambios

- `apps/api/src/modules/albums/cursor.ts`: cursor keyset opaco sobre `(createdAt, id)`, con desempate por `id` cuando `createdAt` coincide.
- `apps/api/src/modules/albums/dto.ts`: `AlbumDto` con `coverPhoto` como `PhotoSummary`, `photosCount` y creador público; sin claves de almacenamiento, coordenadas ni email.
- `apps/api/src/modules/albums/service.ts`: membresía como puerta de visibilidad; listado sin N+1; alta transaccional con `album.created`; actualización parcial; borrado con bloqueo pesimista (`SELECT … FOR UPDATE`); vaciado transaccional.
- `apps/api/src/modules/albums/routes.ts`: seis endpoints con esquemas compartidos, CSRF/`Origin` en mutaciones, `private, no-store` en lecturas, `404` para no miembros y `403` para miembros sin permiso.
- `apps/api/src/modules/albums/albums.test.ts`: **24 tests** de integración reales.
- `apps/api/src/app.ts`: registro del módulo de álbumes.
- Documentación: `docs/03-architecture/api-contract.md` (semántica de álbumes), `docs/04-features/F23-albums-api/{spec,tasks,handoff}.md`, `docs/04-features/README.md`, `docs/06-process/ai-log.md` y `docs/07-curriculum/coverage-map.md`.

## Verificación

Ejecutada contra PostgreSQL 17.11 local con `memora_test`:

```text
DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test albums
→ 24 tests, 1 archivo, todos pasan

DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test
→ 243 tests, 13 archivos, todos pasan

DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm test
→ 8/8 tareas, 1086 tests:
  @memora/shared 145, @memora/api-client 39, @memora/ui 281, @memora/web 378, @memora/api 243

pnpm --filter @memora/api typecheck → exit 0
pnpm lint → 6/6
```

Cierre documental, verificación de la documentación:

```text
pnpm docs:check  → ver «Documentación actualizada»
pnpm agents:check → ver «Documentación actualizada»
```

## Criterios de aceptación

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 Álbum pertenece a un círculo | Pasa | `circleId` persistido; listado filtrado; test de CRUD. |
| AC-02 Solo miembros ven | Pasa | Miembro ve; extraño `404`; sin sesión `401`. |
| AC-03 Crear requiere permiso | Pasa | Owner y miembro con flag crean; sin flag `403`. |
| AC-04 Editar owner o permiso; borrar solo owner | Pasa | Creador con flag edita; tercero `403`; borrar como miembro `403`. |
| AC-05 Portada validada | Pasa | Solo foto del mismo álbum; inexistente, otro álbum u otro círculo `404`; `null` limpia. |
| AC-06 No se filtra información | Pasa | DTO sin claves de almacenamiento, coordenadas ni email. |
| AC-07 Borrar con fotos → `409` | Pasa | `409 ALBUM_NOT_EMPTY`; vacío `204`; inexistente `404`; test de concurrencia de B-01. |
| AC-08 Vaciar elimina fotos y tags | Pasa con desviación de G1 | Fotos y tags borrados, actividad con `photoId = null`, `deletedCount` e idempotencia; objetos de almacenamiento diferidos a F25. |

## Revisión independiente (nivel B)

**Primera ronda: no apto.**

- **B-01:** `deleteAlbumIfEmpty` usaba `deleteMany` con `photos: { none: {} }`. Bajo `READ COMMITTED`, una foto insertada y confirmada entre el `NOT EXISTS` y el bloqueo podía borrarse por la cascada de la FK.
- **Corrección:** transacción interactiva con `SELECT "id" FROM "Album" WHERE "id" = … AND "circleId" = … FOR UPDATE`, después `tx.photo.count` y `tx.album.delete`. Test de concurrencia con una segunda conexión real: la versión anterior fallaba con `204` y foto perdida; la corregida responde `409` y conserva la foto.

**Segunda ronda: apto**, sin bloqueantes nuevos.

Cerrados también en la revisión:

- **m-01:** el vaciado no toca álbumes hermanos.
- **m-02:** desempate del keyset con `createdAt` idéntico.
- **m-03:** `403` decidido por `can()`; test con rol `owner` falsificado.

## Cierre operativo (2026-11-05)

- **Commits** en `feat/F23-albums-api`: `34c71cd` (`feat(api): add albums API with pagination, cover and safe delete (F23)`) y `6ad8226` (`docs: record F23 implementation, review and acceptance`).
- **PR:** [#36](https://github.com/Luceir0/lab-final--memora/pull/36), mergeada en `main`.
- **Merge commit:** `dca7a60bf386bd898c55d6ae8cf82b70166b68dd`.
- **CI:** run `42018373439` en la PR y run `42018611662` en `main` sobre el merge, ambos `completed/success`.
- **Aceptación:** usuario, 2026-11-05.
- No quedan commits, push ni PR pendientes por este cierre.

## Pendiente

- **F25:** eliminación de los objetos de almacenamiento al vaciar un álbum (decisión de G1; el adaptador real llega en F25).
- **F25:** índices `(circleId, createdAt, id)` en `Photo` y `(circleId, joinedAt)` en `Membership`. Requieren migración y permiso.
- **F25:** no actualizar `Album` en la misma transacción que inserta `Photo`, o mantener un orden de locks consistente, para evitar un ciclo de upgrade con el `FOR UPDATE` del borrado.
- **N-01:** `coverPhoto: true` carga la fila `Photo` completa en memoria (no se serializa).
- **m-04:** timeout de la transacción de borrado: `P2028`/500 si el lock dura más de 5 s.
- **N-02:** robustez del test de concurrencia con `Promise.race`.

## Riesgos y limitaciones

- El vaciado deja objetos huérfanos en el almacenamiento hasta F25. Es una desviación explícita de AC-08, registrada en la spec, el contrato y esta bitácora.
- El bloqueo pesimista del borrado puede agotar el timeout de 5 s de Prisma bajo locks largos y devolver `500` (`P2028`). No se ha corregido en F23 (m-04).
- `coverPhoto: true` trae más columnas de las necesarias al proceso; no se filtran porque el DTO solo copia el resumen público (N-01).
- El test de concurrencia usa una ventana de 300 ms y un `Promise.race` para comprobar que el `DELETE` queda bloqueado; si la conexión externa falla antes de `signalInserted`, `await inserted` podría quedarse esperando (N-02).
- Sin migración de índices en F23 (decisión de G1). El listado usa el índice existente `(circleId, createdAt)`; la galería paginada de F25 necesita los índices diferidos.

## Documentación actualizada

- [x] `docs/03-architecture/api-contract.md` — semántica cerrada de los seis endpoints de álbumes.
- [x] `docs/04-features/F23-albums-api/spec.md` — `status: done`, encabezado y sección de cierre.
- [x] `docs/04-features/F23-albums-api/tasks.md` — implementación, AC, verificación y cierre.
- [x] `docs/04-features/F23-albums-api/handoff.md` — este documento.
- [x] `docs/04-features/README.md` — fila de F23 y «Situación actual».
- [x] `docs/06-process/ai-log.md` — entrada del 2026-11-05.
- [x] `docs/07-curriculum/coverage-map.md` — filas de álbumes, autorización por recurso, keyset, concurrencia y revisión B, y cifras al día.
- [x] `README.md` — próximos pasos.
- [x] `docs/00-index.md` — bloque «Estado» actualizado a F01–F23 `done` y F24–F43 en `draft`; el detalle histórico sigue en `ai-log.md`.

## Siguiente paso propuesto

1. Abrir **F24 — Albums web** (nivel B), que consume estos endpoints.
2. Trasladar a **F25** las tres deudas registradas: objetos de storage, índices y orden de locks.
