# Tasks — F25 Upload pipeline API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F07, F08, F23.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (G1, 2026-11-05).

## Implementación

- [x] Multipart (`POST /api/albums/:albumId/photos`, un archivo).
- [x] Magic bytes (`file-type`; JPEG/PNG/WebP; SVG/GIF/HEIC/HEIF/AVIF → `415`).
- [x] Límites y cuota (25 MB, 50 MP, 2 GB/círculo; pre-chequeo y check autoritativo).
- [x] S3 adapter (`maxAttempts: 2`, timeout de 15 s).
- [x] sharp orientación/variantes (original a calidad 95, `display` 1600, `thumb` 400, desde el archivo crudo).
- [x] EXIF fecha/GPS transitorio (`takenAt` del formulario > `DateTimeOriginal` UTC > `null`).
- [x] Nominatim (caché a 3 decimales, 1 req/s, deadline total de 3 s, cota de cola 32).
- [x] Idempotencia (`(uploaderId, clientUploadId)`, cross-álbum `200`, `P2002`).
- [x] Activity (`photo_uploaded` con `metadata: { count: 1 }` en la misma transacción).
- [x] Tests (`photos`, `exif`, `objects`, `validation`, adaptadores y 2 integraciones guardadas).
- [x] Deudas de F23: borrado de objetos al vaciar, índices `(circleId, createdAt, id)` y `(circleId, joinedAt)`, y orden de locks.

## Criterios de aceptación

- [x] AC-01: JPEG/PNG/WebP aceptados; SVG/GIF/HEIC rechazados (`415`).
- [x] AC-02: 25 MB y 2 GB respetados (`413 FILE_TOO_LARGE` / `413 QUOTA_EXCEEDED`).
- [x] AC-03: Variantes correctas (claves, content types, 400 × 400 y ≤ 1600).
- [x] AC-04: Orientación aplicada (EXIF 6 en original y variantes).
- [x] AC-05: Sin GPS persistido (tampoco en los tres objetos ni en columnas).
- [x] AC-06: `placeName` si geocodifica; `null` y `201` si falla.
- [x] AC-07: Idempotencia secuencial, carrera, cross-álbum y `409` cross-círculo.
- [x] AC-08: Fallo no publica foto (limpieza de objetos y transacción).

## Verificación

- [x] `DATABASE_URL=… pnpm --filter @memora/api test photos` → **38 passed, 1 skipped**.
- [x] `DATABASE_URL=… pnpm --filter @memora/api test` → **322 passed, 2 skipped**.
- [x] Subir fixture real contra Silo (`SILO_INTEGRATION=1`) → **1 passed**, sin residuos.
- [x] `pnpm --filter @memora/api typecheck`, `pnpm lint` (6/6) y `pnpm format:check`.
- [x] `prisma migrate status` al día con los índices nuevos.

## Cierre

- [x] Revisión independiente de nivel A (1 Mayor, 10 Menores y 6 Nits; corregidos los aplicables).
- [x] Aceptación del usuario (2026-11-05).
- [x] `handoff.md` completo.
- [x] Tablero actualizado (fila en `done`).
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto y ejecutado (`1833dca`, `ebc57d3`).
- [x] PR #40 y merge en `main` (`44ac7a9`).
- [x] CI en verde en la PR (run `42109962179`) y en `main` (run `42110522832`).
