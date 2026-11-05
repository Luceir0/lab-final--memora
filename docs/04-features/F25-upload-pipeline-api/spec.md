---
id: F25
title: "Upload pipeline API"
milestone: M3
size: L
status: accepted
spec: complete
depends_on:
  - "F07"
  - "F08"
  - "F23"
blocks:
  - "F26"
  - "F35"
design_refs: []
contracts:
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F25 — Upload pipeline API

> **Milestone:** M3 · **Talla:** L · **Estado:** accepted · **Spec:** completa
> **Depende de:** F07, F08, F23 · **Bloquea:** F26, F35

> **Invariante de portada (F24, 2026-11-05).** La portada no es un objeto aparte. F26 sube la imagen como una foto más del álbum y F29 la elige entre las fotos del álbum y la marca como `coverPhotoId`. F25 debe permitir que esa foto se suba como cualquier otra; el contrato de F23 ya exige que `coverPhotoId` sea una foto del mismo álbum.

## Objetivo

Implementar el pipeline completo de subida y procesamiento de imágenes.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Alcance

### Incluye

- Multipart
- Magic bytes
- Límites y cuota
- S3 adapter
- sharp orientación/variantes
- EXIF fecha/GPS transitorio
- Nominatim
- Idempotencia
- Activity
- Tests

### No incluye

- UI de cola (F26)
- HEIC si el spike falla

## Entregables

- apps/api/src/modules/photos/**
- services/storage
- services/geocoding
- tests

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** JPEG/PNG/WebP aceptados; SVG/GIF rechazados.
- **AC-02.** 25 MB y 2 GB respetados.
- **AC-03.** Variantes correctas.
- **AC-04.** Orientación aplicada.
- **AC-05.** Sin GPS persistido.
- **AC-06.** placeName si geocodifica.
- **AC-07.** Idempotencia.
- **AC-08.** Fallo no publica foto.

## Pruebas

- Formatos
- Tamaño
- Cuota
- Píxeles
- Variantes
- EXIF
- Idempotencia
- Fallo S3

## Archivos previstos

- `apps/api/src/modules/photos/**`
- `apps/api/src/services/storage/**`
- `apps/api/src/services/geocoding/**`

## Verificación

- `pnpm --filter @memora/api test photos`
- `Subir fixture real`

## Definition of Ready

- [ ] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Si HEIC no es fiable, rechazo 415 claro. Documentar.

## Decisiones de G1 (2026-11-05)

El usuario aprobó el plan y estas decisiones antes de empezar:

1. **Dependencias:** `file-type@22.3.0`, `@aws-sdk/client-s3@3.1162.0` y `exifr@7.1.3` en `apps/api`; `piexifjs@1.0.6` solo como devDependency para generar la fixture con GPS. Versiones exactas.
2. **Alcance:** F25 incluye las tres deudas de F23/F24: borrar los objetos de storage al vaciar un álbum, los índices `Photo(circleId, createdAt, id)` y `Membership(circleId, joinedAt)` con migración, y el orden de locks (la subida no actualiza `Album` en la misma transacción que inserta `Photo`).
3. **Fecha:** si el formulario envía `takenAt`, manda; si no, se usa `DateTimeOriginal` de EXIF; si no hay ninguna, `null`.
4. **Idempotencia entre álbumes:** el mismo `(uploaderId, clientUploadId)` en otro álbum devuelve la foto existente con `200`, literal al contrato. Se documenta y se prueba.
5. **Verificación real:** Silo local con `memora_test` y bucket `memora-test`; se crea el bucket si falta y se borran la foto y los objetos de prueba al terminar. Sin escribir `.env`.
6. **Fixtures:** generados y deterministas con `sharp` y `piexifjs` (JPEG/PNG/WebP, SVG, GIF, HEIC simulado y un JPEG con GPS).
7. **Proceso:** dos sesiones de `api-dev`: adaptadores y configuración primero; pipeline, deudas y tests después. Revisión independiente nivel **A** y aceptación del usuario antes de cerrar.

## Implementación (2026-11-05)

Rama `feat/F25-upload-pipeline-api`. Sin commit ni push al cerrar esta documentación.

### Pipeline

- Ruta `POST /api/albums/:albumId/photos` multipart con **un archivo** por petición. Exige sesión, `Origin`, CSRF, membresía (`404`) y `photo.upload` (`403`); rate limit de **60/min por usuario**.
- Validación por **magic bytes** con `file-type`: JPEG, PNG y WebP aceptados; SVG, GIF, HEIC, HEIF y AVIF → `415 UNSUPPORTED_MEDIA_TYPE`. Archivo corrupto → `422 INVALID_IMAGE`; más de 25 MB → `413 FILE_TOO_LARGE`; más de 50 MP → `422`; cuota del círculo (2 GB) → `413 QUOTA_EXCEEDED`.
- `sharp`: original **sin redimensionar** con orientación aplicada y sin metadatos; JPEG y WebP del original a **calidad 95**; `display` de 1600 px máximos en WebP; `thumb` de 400 × 400 en WebP. Las variantes se generan desde el **archivo crudo**, no desde el original reencodeado, para evitar doble compresión.
- EXIF: `takenAt` del formulario manda; si no llega, `DateTimeOriginal` interpretado como UTC; si no hay, `null`. El GPS vive solo en memoria para resolver `placeName`, nunca se persiste ni se loguea; `placeName` se trunca a 200 caracteres.
- Idempotencia `(uploaderId, clientUploadId)`: la repetición devuelve `200` con la foto existente. Cross-álbum accesible → `200`; si el usuario ya no pertenece al círculo de la foto existente → `409 CONFLICT`. La carrera `P2002` está cubierta: queda una sola fila y no hay huérfanos.
- `Activity` `photo_uploaded` con `metadata: { count: 1 }` en la **misma transacción** que la foto.
- Cuota: pre-chequeo barato con el tamaño crudo y comprobación autoritativa con el tamaño procesado bajo `SELECT … FOR UPDATE` de `Circle`. La subida **no actualiza `Album`**, para no cruzar el orden de locks del borrado de F23.
- Limpieza de objetos ante fallo posterior al `put`; las claves se registran **antes** del `put` para poder borrarlas.
- Vaciado de álbum: `emptyAlbum` devuelve las claves, la ruta borra los objetos tras el commit con un pool de 8 y responde `200` aunque falle el storage (best-effort con aviso). Cierra la deuda de F23.
- Migración `20261105190000_f25_photo_membership_indexes`: añade `Photo(circleId, createdAt, id)` y `Membership(circleId, joinedAt)` y elimina `Photo_circleId_idx`, porque el compuesto cubre el prefijo. `CREATE INDEX` no concurrente (deuda de F42).
- Adaptadores: S3 con `maxAttempts: 2` y timeout de 15 s por operación; Nominatim con caché a 3 decimales, 1 req/s, deadline total de 3 s **incluida la cola** y cota de cola de 32.

### Archivos

- `apps/api/src/modules/photos/{routes,service,validation,upload-request,exif,objects}.ts` y sus tests.
- `apps/api/src/modules/photos/photos-silo.integration.test.ts` (Silo real).
- `apps/api/src/services/{storage-s3,geocoding-nominatim}.ts` y sus tests, más `storage-s3.integration.test.ts`.
- `apps/api/prisma/migrations/20261105190000_f25_photo_membership_indexes/`.

## Verificación (2026-11-05)

| Comando | Resultado real |
| --- | --- |
| `DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test photos` | **38 passed, 1 skipped** |
| `DATABASE_URL=… pnpm --filter @memora/api test` | **322 passed, 2 skipped** |
| `pnpm --filter @memora/api typecheck` | OK |
| `pnpm lint` | **6/6** |
| `pnpm format:check` | OK |
| `prisma migrate status` | Al día; `Photo_circleId_createdAt_id_idx` y `Membership_circleId_joinedAt_idx` presentes y `Photo_circleId_idx` eliminado |
| `SILO_INTEGRATION=1 … photos-silo.integration.test.ts` | **1 passed**; después 0 objetos y 0 filas de prueba |
| `S3_INTEGRATION=1 … storage-s3.integration.test.ts` | **1 passed**; después 0 objetos y 0 filas de prueba |

Los 2 skips son las integraciones guardadas por variable (`SILO_INTEGRATION`, `S3_INTEGRATION`).

## Criterios de aceptación — estado

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01: JPEG/PNG/WebP `201`; SVG/GIF/HEIC `415` | Pasa | `photos.test.ts`; AVIF también `415` |
| AC-02: 25 MB + 1 → `413 FILE_TOO_LARGE`; cuota → `413 QUOTA_EXCEEDED` | Pasa | `photos.test.ts`, con pre-chequeo y check autoritativo |
| AC-03: claves, content types, `thumb` 400 × 400, `display` ≤ 1600, original en su formato | Pasa | `objects.test.ts`, `photos.test.ts` |
| AC-04: orientación EXIF 6 aplicada a original y variantes | Pasa | `exif.test.ts`, `photos.test.ts` |
| AC-05: GPS solo transitorio; sin EXIF ni GPS en los tres objetos; sin columnas de coordenadas | Pasa | `exif.test.ts`, `photos.test.ts` |
| AC-06: `placeName` si geocodifica; si falla, `null` y `201` | Pasa | `photos.test.ts`, `geocoding-nominatim.test.ts` |
| AC-07: idempotencia secuencial, carrera, cross-álbum `200` y cross-círculo inaccesible `409` | Pasa | `photos.test.ts` |
| AC-08: fallo de storage, sharp o DB no publica foto ni deja objetos huérfanos | Pasa | `photos.test.ts` |

## Revisión independiente de nivel A (2026-11-05)

Veredicto inicial: **cambios requeridos**, sin bloqueantes. **1 Mayor, 10 Menores y 6 Nits**.

- **Mayor corregido:** deadline total de geocodificación, incluida la cola, cota de cola y test con dos coordenadas y `fetch` colgado.
- **Menores corregidos:** log del fallo real de storage/DB; pre-chequeo barato de cuota; rate limit por usuario; limpieza de álbum con concurrencia acotada; test determinista de `P2002`; tests de más de 50 MP, AVIF, `Content-Type` mentido y nombre de archivo; variantes desde el archivo crudo y calidad 95.
- **Nits corregidos:** clave registrada antes del `put`; `FST_FILES_LIMIT` unificado a `400 VALIDATION_ERROR`; `display_name` truncado antes de cachear.
- **Pendiente tras la revisión:** ver [Pendiente](#pendiente-tras-la-revisión).

## Pendiente tras la revisión

- **[Menor]** No hay timeout real de `sharp`: la única defensa es el límite de 50 MP. Desviación documentada en [uploads.md](../../03-architecture/uploads.md).
- **[Menor]** El test de fallo de `sharp` sigue usando un JPEG truncado; es determinista en las ejecuciones actuales, no por diseño.
- **[Nit]** `randomUUID` para `Photo.id` frente al `@default(cuid())` del esquema. Aceptado.
- **[Nit]** No se destruye el `S3Client` al cerrar la aplicación.
- **[Nit]** `CREATE INDEX` no concurrente (F42).
- **No verificado:** R2/AWS S3 real (solo Silo), Nominatim real por red (`fetch` inyectado), OpenAPI renderizado, `pnpm build` y `pnpm audit`.
