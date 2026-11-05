# Handoff — F25 Upload pipeline API

- **Estado:** `done` (aceptada el 2026-11-05 y mergeada en `main` con la PR #40)
- **Rama:** `feat/F25-upload-pipeline-api` (mergeada)
- **Fecha:** 2026-11-05
- **Implementado por:** `api-dev` (dos sesiones: adaptadores y configuración; pipeline, deudas y tests)
- **Revisado por:** `reviewer` independiente, nivel **A**

## Resultado

La API ya sube y procesa imágenes de extremo a extremo: multipart de un archivo por petición con sesión, `Origin`, CSRF, membresía y `photo.upload`, validación por magic bytes, límites de tamaño y píxeles, cuota por círculo, generación de original/`display`/`thumb` con `sharp`, EXIF solo en memoria, geocodificación con deadline acotado, idempotencia por `(uploaderId, clientUploadId)` y `Activity` en la misma transacción. Se cierran además las tres deudas de F23: objetos al vaciar un álbum, índices de galería/miembros y orden de locks. Todo con persistencia real en Silo y PostgreSQL.

## Cambios (archivos)

- `apps/api/src/modules/photos/routes.ts`: `POST /api/albums/:albumId/photos`, multipart de un archivo, rate limit de 60/min por usuario y mapeo de errores.
- `apps/api/src/modules/photos/service.ts`: pipeline completo (validación, límites, cuota, procesado, geocodificación, transacción con `Photo` y `Activity`, limpieza).
- `apps/api/src/modules/photos/validation.ts`: magic bytes, formatos aceptados y rechazo de SVG/GIF/HEIC/HEIF/AVIF.
- `apps/api/src/modules/photos/upload-request.ts`: parseo de los campos de texto del multipart.
- `apps/api/src/modules/photos/exif.ts`: `takenAt`, orientación y GPS transitorio.
- `apps/api/src/modules/photos/objects.ts`: claves S3, pool de borrado y limpieza best-effort.
- `apps/api/src/services/storage-s3.ts`: adaptador S3 con `maxAttempts: 2` y timeout de 15 s por operación.
- `apps/api/src/services/geocoding-nominatim.ts`: caché a 3 decimales, 1 req/s, deadline total de 3 s incluida la cola y cota de cola de 32.
- `apps/api/src/modules/albums/service.ts` y `routes.ts`: el vaciado devuelve las claves y la ruta borra los objetos tras el commit con pool de 8, best-effort.
- `apps/api/prisma/migrations/20261105190000_f25_photo_membership_indexes/migration.sql`: `Photo(circleId, createdAt, id)`, `Membership(circleId, joinedAt)` y eliminación de `Photo_circleId_idx`.
- Tests: `apps/api/src/modules/photos/{photos,exif,objects,validation}.test.ts`, `apps/api/src/modules/photos/photos-silo.integration.test.ts`, `apps/api/src/services/{storage-s3,storage-s3.integration,geocoding-nominatim}.test.ts`.

## Verificación

| Comando | Resultado real |
| --- | --- |
| `DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test photos` | **38 passed, 1 skipped** |
| `DATABASE_URL=… pnpm --filter @memora/api test` | **322 passed, 2 skipped** |
| `pnpm --filter @memora/api typecheck` | OK |
| `pnpm lint` | **6/6** |
| `pnpm format:check` | OK |
| `DATABASE_URL=… pnpm test` | **8/8 tareas**; API 322 passed / 2 skipped; el resto de paquetes sin cambios |
| `pnpm build` | **5/5 tareas**, 5 rutas prerenderizadas |
| `pnpm docs:check` | 191 archivos, 545 enlaces, 0 rotos (553 tras el cierre documental) |
| `pnpm agents:check` | 43 specs y 43 filas |
| `prisma migrate status` | Al día; índices nuevos presentes y `Photo_circleId_idx` eliminado |
| `SILO_INTEGRATION=1 … photos-silo.integration.test.ts` | **1 passed**; 0 objetos y 0 filas de prueba después |
| `S3_INTEGRATION=1 … storage-s3.integration.test.ts` | **1 passed**; 0 objetos y 0 filas de prueba después |

Los 2 skips son las integraciones guardadas por variable de entorno (`SILO_INTEGRATION`, `S3_INTEGRATION`), no fallos.

## Criterios de aceptación

| AC | Resultado | Nota |
| --- | --- | --- |
| AC-01: JPEG/PNG/WebP `201`; SVG/GIF/HEIC `415` | Pasa | AVIF también `415`; archivo corrupto → `422 INVALID_IMAGE` |
| AC-02: 25 MB + 1 → `413 FILE_TOO_LARGE`; cuota → `413 QUOTA_EXCEEDED` | Pasa | Pre-chequeo con tamaño crudo y check autoritativo con tamaño procesado |
| AC-03: claves, content types, `thumb` 400 × 400, `display` ≤ 1600, original en su formato | Pasa | Original sin redimensionar; JPEG/WebP a calidad 95 |
| AC-04: orientación EXIF 6 aplicada a original y variantes | Pasa | `sharp().rotate()` y variantes sin EXIF |
| AC-05: GPS solo transitorio; sin EXIF/GPS en los tres objetos; sin columnas de coordenadas | Pasa | Solo se persiste `placeName`, truncado a 200 |
| AC-06: `placeName` si geocodifica; si falla, `null` y `201` | Pasa | Deadline total de 3 s incluida la cola |
| AC-07: idempotencia secuencial, carrera, cross-álbum `200` y cross-círculo inaccesible `409` | Pasa | `P2002` cubierto: una fila, sin huérfanos |
| AC-08: fallo de storage/sharp/DB no publica foto ni deja objetos huérfanos | Pasa | Claves registradas antes del `put` y limpieza posterior |

## Aceptación

El usuario aceptó F25 el **2026-11-05** tras revisar el resumen de verificación y la revisión A, y autorizó el commit y la PR. Al ser una feature de backend no hubo prueba en navegador; la subida real se verificó contra Silo con `app.inject`, comprobando la fila `Photo`, las tres claves y la limpieza posterior.

## Revisión independiente (nivel A)

Veredicto inicial: **cambios requeridos**, sin bloqueantes. **1 Mayor, 10 Menores y 6 Nits**.

- **Mayor corregido:** deadline total de geocodificación (incluida la cola), cota de cola y test con dos coordenadas y `fetch` colgado.
- **Menores corregidos:** log del fallo real de storage/DB, pre-chequeo barato de cuota, rate limit por usuario, limpieza de álbum con concurrencia acotada, test determinista de `P2002`, tests de más de 50 MP, AVIF, `Content-Type` mentido y nombre de archivo, y variantes desde el archivo crudo con calidad 95.
- **Nits corregidos:** clave antes del `put`, `FST_FILES_LIMIT` unificado a `400 VALIDATION_ERROR` y `display_name` truncado antes de cachear.

## Pendiente

- **[Menor]** No hay timeout real de `sharp`; la única defensa es el límite de 50 MP. Documentado como desviación en [uploads.md](../../03-architecture/uploads.md).
- **[Menor]** El test de fallo de `sharp` usa un JPEG truncado: determinista hoy, no por diseño.
- **[Nit]** `randomUUID` para `Photo.id` frente al `@default(cuid())` del esquema (aceptado).
- **[Nit]** No se destruye el `S3Client` al cerrar la aplicación.
- **[Nit]** `CREATE INDEX` no concurrente (F42).
- **No verificado:** R2/AWS S3 real (solo Silo), Nominatim real por red (`fetch` inyectado) y OpenAPI renderizado.
- **[Menor, preexistente] `pnpm audit`:** 2 vulnerabilidades moderadas en `@fastify/swagger-ui > @fastify/static > glob/minimatch`. No las introduce F25; requieren actualizar la cadena de Swagger UI y no se ha hecho sin permiso.

## Cierre operativo (2026-11-05)

- **PR de feature:** [#40](https://github.com/Luceir0/lab-final--memora/pull/40) `feat(api): Upload pipeline API (F25)`, mergeada en `main`.
- **Merge commit:** `44ac7a9ac8ee473d0239804b422fd1ae5bde45a3`.
- **Commits de la rama:** `1833dca` (`feat(api): add upload pipeline with S3, sharp and idempotency (F25)`) y `ebc57d3` (`docs: record F25 implementation, review and acceptance`).
- **CI:** run `42109962179` en la PR y run `42110522832` en `main` sobre el merge, ambos `completed/success`.
- **Verificación de cierre:** `pnpm test` **8/8 tareas**, `pnpm build` **5/5** con 5 rutas prerenderizadas, typecheck OK, `lint` 6/6, `format:check` OK, `docs:check` 191 archivos y 545 enlaces con 0 rotos (**553** tras el cierre documental), `agents:check` 43 specs y 43 filas, y las integraciones de Silo y S3 con 1 passed cada una y sin restos.
- **Cierre documental:** rama `docs/F25-done`; el commit y el push los hace el orquestador.

## Riesgos y limitaciones

- El límite de píxeles es la única protección frente a un `sharp` colgado; un archivo dentro del límite que lo bloquee no tiene corte por tiempo.
- La generación de variantes desde el archivo crudo duplica el coste de decodificación frente a reutilizar el original, a cambio de evitar doble compresión.
- El vaciado de álbum responde `200` aunque falle el storage: pueden quedar objetos huérfanos, notificados por aviso y sin job de barrido todavía.
- `CREATE INDEX` bloquea escrituras durante la migración; aceptable ahora, revisable en F42.
- La geocodificación no se ha probado contra Nominatim real por red; la caché y el rate limit sí están cubiertos con `fetch` inyectado.

## Documentación actualizada

- [x] `docs/04-features/F25-upload-pipeline-api/spec.md` — implementación, verificación, AC y revisión.
- [x] `docs/04-features/F25-upload-pipeline-api/tasks.md` — implementación, AC, verificación y revisión marcados.
- [x] `docs/04-features/F25-upload-pipeline-api/handoff.md` — este documento.
- [x] `docs/04-features/README.md` — «Situación actual» con F25 y su cierre operativo.
- [x] `docs/03-architecture/api-contract.md` — semántica de subidas y vaciado.
- [x] `docs/03-architecture/uploads.md` — variantes, EXIF, geocodificación, idempotencia y limpieza.
- [x] `docs/03-architecture/external-services.md` — S3 y Nominatim.
- [x] `docs/03-architecture/data-model.md` — índices y `Photo.size`.
- [x] `docs/06-process/ai-log.md` — entrada de F25.
- [x] `docs/07-curriculum/coverage-map.md` — filas de F25 y cifras.
- [x] `docs/00-index.md`, `README.md` y `docs/08-delivery/deployment.md`.

## Siguiente paso propuesto

Abrir **F26 — Upload queue web** desde `main`, que consume el contrato de subidas ya mergeado. Pendientes trasladados (menores y nits, no bloqueantes): timeout real de `sharp`, test de `sharp` sin depender de un JPEG truncado, `randomUUID` frente a `cuid()`, `destroy` del `S3Client` al cerrar y `CREATE INDEX` concurrente en F42.
