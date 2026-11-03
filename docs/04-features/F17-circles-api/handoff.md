# Handoff — F17 Circles API

- **Estado:** done
- **Rama:** `feat/F17-circles-api` (sin commits todavía)
- **Fecha:** 2026-11-03
- **Implementado por:** implementador de F17; verificación completa del orquestador
- **Revisado por:** `reviewer` independiente (nivel A)
- **Aceptado por:** usuario, 2026-11-03

## Resultado

CRUD de círculos sobre PostgreSQL real, con membresía `owner` creada en la misma transacción que el círculo, settings validados por Zod, stats acotadas al círculo, paginación keyset opaca y autorización por recurso. Un extraño recibe siempre `404` (nunca `403`), el owner se decide por `Circle.ownerId` y las mutaciones exigen `Origin` permitido y CSRF. Los cinco endpoints están documentados en OpenAPI con el tag `Circles`.

## Cambios

- `apps/api/src/modules/circles/routes.ts`: registro de `GET/POST /api/circles` y `GET/PATCH/DELETE /api/circles/:circleId`; sesión, CSRF, `Origin`, comprobación de membresía, permisos con `can()` y mapeo de la carrera lectura→escritura a `404`.
- `apps/api/src/modules/circles/service.ts`: acceso a datos; creación transaccional del círculo y su membership `owner`, listado keyset, actualización, borrado con `deleteMany`, búsqueda de portada acotada al círculo y stats en una transacción de tres lecturas.
- `apps/api/src/modules/circles/cursor.ts`: cursor opaco base64url con `(updatedAt, id)`; payload inválido → `400 VALIDATION_ERROR` con detalle del campo `cursor`.
- `apps/api/src/modules/circles/dto.ts`: mapeo a los DTOs congelados de `@memora/shared`, settings parseados y `role` derivado de `ownerId`.
- `apps/api/src/modules/auth/guards.ts`: extracción de `requirePrisma`, `setPrivateNoStore` y `assertCsrfToken` desde el módulo de auth, reutilizables por otros módulos. La semántica de F15 no cambia.
- `apps/api/src/modules/auth/csrf-header.ts`: esquema Zod del header `X-CSRF-Token` para documentarlo en OpenAPI.
- `apps/api/src/modules/auth/routes.ts`: pasa a importar las guardas extraídas.
- `apps/api/src/app.ts`: registra las rutas de círculos.
- `apps/api/src/plugins/swagger.ts`: añade el tag `Circles`.
- `apps/api/src/test/circles.test.ts`: 28 tests de integración contra `memora_test` (AC-01…AC-07, carreras, paginación y OpenAPI).

## Verificación

Ejecutada el 2026-11-03 con PostgreSQL 17.11 local en Docker (`memora_test`, migración `20261031224916_init`), sin tests saltados:

- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test circles` → **28/28**.
- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test` → **10 archivos, 155/155**.
- `pnpm --filter @memora/api typecheck` → limpio.
- `pnpm --filter @memora/api lint` → limpio.
- `pnpm format:check` → limpio.

## Criterios de aceptación

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 | Pasa | Test que comprueba que `POST /circles` persiste el círculo y la membership `owner` del creador en una transacción; responde `201`. |
| AC-02 | Pasa | Owner y miembro reciben `200`; la lista solo devuelve círculos con membership del usuario. |
| AC-03 | Pasa | Un miembro recibe `403` en `PATCH`/`DELETE`; el owner edita y borra; un rol `owner` falsificado en la fila de membership no eleva permisos. |
| AC-04 | Pasa | `GET`, `PATCH` y `DELETE` de un no miembro devuelven `404` y nunca `403`; un id inexistente también devuelve `404`. |
| AC-05 | Pasa | Settings con flag desconocido, tipo incorrecto u objeto incompleto → `400`; el reemplazo es completo, sin merge. |
| AC-06 | Pasa | Las stats cuentan solo filas del círculo; `lastUploadAt` es el máximo `Photo.createdAt` y `null` sin fotos. |
| AC-07 | Pasa | Sin sesión todos los endpoints devuelven `401`; las mutaciones exigen `Origin` permitido y CSRF; `Origin` ausente o ajeno → `403` en las tres; validaciones de nombre, descripción, PATCH vacío, portada de otro círculo y paginación inválida. |

## Revisión independiente (una ronda)

Una ronda, nivel **A**, veredicto **cambios requeridos**:

- **1 Mayor:** carrera entre la lectura de la membership y `PATCH`/`DELETE` que devolvía `500` por `P2025`/`P2003`. Corregido: `PATCH` mapea ambos códigos a `404`; `DELETE` usa `deleteMany` y `count === 0` → `404`. Cuatro tests nuevos: P2025, P2003, `count 0` y doble `DELETE` secuencial.
- **6 Menores:** CSRF documentado en OpenAPI; `role` derivado de `ownerId`; negativos de `Origin` en las tres mutaciones; `format:check`; comando de verificación con `DATABASE_URL` (M-08); estado y documentación desactualizados. Todos corregidos.
- **5 Nits:** `400` documentado en OpenAPI para los params de detalle y `DELETE`; tag `Circles`; mensaje genérico de `requirePrisma`; `select` en `findCirclePhoto`; aserciones de `cache-control`/`vary`. Todos corregidos.

No hubo segunda ronda porque no quedaba ningún bloqueante; las correcciones se verificaron con la suite completa. El usuario aceptó la feature el **2026-11-03**.

## Pendiente

- Commit **propuesto, no ejecutado**: `feat(api): add circles API with membership and stats (F17)`.
- Limpieza de objetos de MinIO/S3 al borrar un círculo: diferida por la decisión 3.
- `coverPhoto.thumbUrl` apunta a `/api/photos/{id}/image?size=thumb`, endpoint que llega en **F29**.
- **F18 — Circles web** es la siguiente feature del tablero y **no se ha empezado**.

## Riesgos y limitaciones

- Objetos de storage huérfanos al borrar un círculo: solo se borran filas de base de datos por cascada.
- `coverPhoto.thumbUrl` todavía no se puede servir: el endpoint de imagen es de F29.
- El cursor es opaco pero no firmado: solo posiciona la página, no concede acceso.
- Las stats se leen en una transacción de tres consultas, sin snapshot único bajo escrituras concurrentes.
- `settings` corruptos en base de datos producen `500`: es deliberado no servir settings inválidos.
- Los tests de carrera simulan la pérdida de fila con un `Proxy` del cliente Prisma sobre el camino HTTP real; no son transacciones concurrentes reales.
- `PATCH` y `DELETE` no distinguen «círculo borrado» de «portada borrada»: ambos responden `404`, deliberadamente.
- F17 no incluye UI, invitaciones (F19) ni miembros (F21).

## Documentación actualizada

- [x] `docs/04-features/F17-circles-api/spec.md`
- [x] `docs/04-features/F17-circles-api/tasks.md`
- [x] `docs/04-features/F17-circles-api/handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/03-architecture/api-contract.md` (semántica de F17)
- [ ] README raíz: no cambia la estructura.

## Siguiente paso propuesto

La revisión independiente ya está hecha y la aceptación del usuario también. Falta proponer el commit `feat(api): add circles API with membership and stats (F17)` y decidir si se ejecuta. Después, F18 — Circles web, que aún no ha empezado.
