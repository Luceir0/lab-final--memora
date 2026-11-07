# Handoff — F33 Descargas

- **Estado:** `done` (revisión A cerrada y aceptada por el usuario el 2026-11-07; PR #52)
- **Rama:** `feat/F33-F36-cierre` (CI de la PR #52)
- **Fecha:** 2026-11-07
- **Nivel de auditoría:** A. Una pasada del `reviewer` sobre el diff, según la regla de entrega del 2026-11-06.

## Resultado

Descarga completa: original individual, selección y álbum en ZIP con job en base de datos y worker en proceso (concurrencia 1). La API añade los cuatro endpoints del contrato, con autorización por recurso, límites de 500 fotos / 2 GB, rate limit de 10/min, expiración de 24 h, limpieza de objetos y recuperación de jobs huérfanos. La web activa «Descargar» en la barra de selección, añade «Descargar álbum» al menú del álbum, descarga individual desde el visor, polling cada 2 s, aviso de >100 MB y estados de generando, listo, error y expirado.

## Cambios (archivos)

### API

- `apps/api/src/modules/downloads/routes.ts`: los cuatro endpoints, CSRF/Origin en el POST, rate limit 10/min, barrido de expirados y recuperación de huérfanos.
- `apps/api/src/modules/downloads/service.ts`: membresía y autorización (solicitante u owner), límites, creación de job y expiración.
- `apps/api/src/modules/downloads/worker.ts`: cola en memoria con concurrencia 1, ZIP con `archiver`, `README.txt`, progreso y transiciones.
- `apps/api/src/modules/downloads/{filename,dto}.ts`.
- `apps/api/src/modules/downloads/downloads.test.ts`: 27 tests.
- `apps/api/src/app.ts`: registro del módulo (único cambio en el bootstrap).
- `apps/api/package.json` y lockfile: `archiver@8.0.0` y `@types/archiver@8.0.0` (autorizado por el usuario).

### Web

- `apps/web/src/features/photos/downloads/`: `queries.ts` (POST con CSRF y polling 2 s), `use-download-job.ts`, `errors.ts`, `format.ts`, `paths.ts`, `permissions.ts`, `download-job-toast.tsx` y 4 archivos de test.
- `selection-bar.tsx`: «Descargar» activo con permiso y bloqueo mientras genera.
- `album-gallery.tsx` y `albums/album-detail-page.tsx`: descarga de selección y de álbum, con aviso de >100 MB.
- `viewer/photo-details-panel.tsx` y `photo-viewer.tsx`: descarga individual del original.

## Verificación

| Comando | Resultado |
| --- | --- |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test downloads` | **27 tests: OK** |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test` | **25 archivos y 406 tests, 2 skipped: OK** |
| `pnpm --filter @memora/web test downloads --maxWorkers=2` | **4 archivos, 13 tests: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **102 archivos, 807 tests: OK** |
| `pnpm typecheck` / `pnpm lint` / `pnpm format:check` | **9/9 · 6/6 · OK** |
| `pnpm build` | **5/5, 5 rutas prerenderizadas: OK** |
| `pnpm docs:check` | **192 archivos, 0 rotos: OK** |

## Criterios de aceptación

- **AC-01: pasa.** Individual y job exigen sesión, membresía (`404`) y `membersCanDownload` (`403`); el estado y el ZIP solo los ve el solicitante o un owner.
- **AC-02: pasa.** 500 fotos → `422 UNPROCESSABLE_ENTITY`; 2 GB → `413 FILE_TOO_LARGE`; una lista explícita de más de 500 la corta el schema con `400`.
- **AC-03: pasa.** `expiresAt` a 24 h; al leer o crear se barren expirados y se borra el objeto.
- **AC-04: pasa.** Polling cada 2 s y descarga automática al quedar `ready`.
- **AC-05: pasa.** La selección se valida contra álbum y círculo; foto ajena → `404`.
- **AC-06: pasa.** Aviso de >100 MB con explicación de espera y ubicación del archivo en iOS/Android.
- **AC-07: pasa.** `objectKey` no sale en DTO, logs ni mensajes.

## Pendiente

- **Revisión A** sobre el diff y **aceptación del usuario (G4)** en móvil y escritorio, claro y oscuro.
- `[Menor]` El ZIP se ensambla en memoria con tope de 2 GB porque `StorageService.put` acepta `Buffer`; producción necesitaría streaming.
- `[Menor]` Si el proceso muere entre el `put` y el `ready`, el objeto puede quedar huérfano.
- `[Menor]` El `progress` vive en memoria del worker: con varias instancias habría que persistirlo.
- `[Nit]` El job no se reanuda tras recargar; no está en el alcance.
- `[Nit]` Sin prevalidación de cliente de 500 fotos / 2 GB; se informa del error del servidor.
- `[Nit]` La UI oculta la descarga al owner si `membersCanDownload` está apagada, aunque el servidor se la permita; es la lectura literal del permiso.

## Riesgos y limitaciones

- Algunos navegadores pueden bloquear la descarga automática sin gesto de usuario; se cubre con «Volver a descargar».
- Una foto borrada entre la creación y el worker se omite del ZIP y el README cuenta solo las incluidas.
- Si falla el storage al generar, el job queda en `error` con mensaje genérico y sin claves.

## Documentación actualizada

- `docs/04-features/F33-downloads/{tasks,handoff}.md` y `spec.md` (estado `review`).
- `docs/04-features/README.md`: F33 pasa a `review`.
- `docs/07-curriculum/coverage-map.md`: sección de F33.

## Siguiente paso propuesto

1. Revisión A del diff y aceptación del usuario.
2. Commit local y merge local a `main` (sin push hasta el final).
3. Continuar con **F32 (etiquetado)**, la última del nivel bajo del plan.

## Incidencia de arranque (2026-11-07)

La API no arrancaba en desarrollo tras mergear F33. Dos causas, ambas corregidas:

1. **Parameter property incompatible con strip-only.** `DownloadJobFailure` usaba `constructor(readonly userMessage: string)`. `node --watch src/index.ts` ejecuta TypeScript en modo strip-only y lo rechaza con `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`; `tsc` y vitest lo aceptan, por eso los tests no lo vieron. Se sustituyó por una propiedad declarada y asignada (commit `e2e281b`).
2. **`archiver` no instalado en el árbol principal.** La dependencia se añadió en el worktree; el repo principal necesitaba `pnpm install --frozen-lockfile`.

**Prevención para F37:** añadir al CI un arranque real de la API (`node src/index.ts` con timeout) además de `tsc`. Ni el build ni los tests detectan la sintaxis que el runtime de desarrollo rechaza.

## Correcciones de la revisión A (2026-11-07)

La revisión independiente de F33 fue **apto con correcciones, sin bloqueantes**. El usuario
decidió corregir ahora **M-01** y **M-04**. **M-02** y **M-03** quedan como limitaciones del MVP
según el informe de la revisión; **M-05** (descarga en la web) lo resolverá otro agente en
`apps/web/**`.

### M-01 — Jobs `pending` perdidos al reiniciar

`markOrphanedJobs` recuperaba solo `processing`. Como la cola del worker vive en memoria y la
concurrencia es 1, un proceso que muere deja `pending` los jobs aún no reclamados y esos jobs
nunca terminaban. Ahora la recuperación marca `pending` **y** `processing` como `error` con el
mismo `ORPHANED_JOB_MESSAGE` (no se re-encola: el contrato no cambia y el usuario crea otro job).

La inclusión de `pending` es segura porque en `routes.ts` la recuperación se espera **antes** de
crear y encolar: el POST hace `ensureOrphanRecovery → createDownloadJob → worker.enqueue`. Un
job de esta instancia no existe hasta que la recuperación (memoizada, una vez por instancia) ha
terminado, así que no puede barrerse a sí mismo. Los GET de job/fichero también la esperan antes
de leer. **Asunción documentada:** una sola instancia de API por base de datos; con varias, la
recuperación de una marcaría como `error` los jobs vivos de otra. Limitación del MVP hasta que
la cola se persista.

Tests añadidos (PostgreSQL real):

- un job `pending` sembrado pasa a `error` con `errorMessage` de reinicio al primer `GET /api/downloads/:jobId`;
- un job `pending` sembrado antes de un `POST /api/albums/:albumId/downloads` queda recuperado,
  el job nuevo responde `202 pending`, no se marca `error` y termina `ready`.

El test existente de `409` con job `pending` ahora prepara la recuperación antes de sembrar para
seguir midiendo el estado `pending` real.

### M-04 — Rate limit en la descarga individual

El limitador de 10/min existía para el POST pero no para `GET /api/photos/:photoId/download`.
Ahora se aplica justo después de `resolveSession`, con la misma clave por `userId` (no por IP) y
el mismo `RATE_LIMITED` → `429`. La autorización no cambia: sin sesión `401`, foto ajena o de
otro círculo `404`, `membersCanDownload` apagado `403`. Al compartir el limitador, el cupo de
10/min es por usuario entre descarga individual y creación de jobs.

Test añadido: 10 descargas individuales devuelven `200` y la 11.ª `429 RATE_LIMITED`.

### Verificación de las correcciones

| Comando | Resultado |
| --- | --- |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test downloads` | **30/30 en 1 archivo: OK** (antes 27) |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test` | **409 passed, 2 skipped en 25 archivos: OK** (antes 406) |
| `pnpm --filter @memora/api typecheck` | **OK** |
| `pnpm --filter @memora/api lint` | **OK** |
| `pnpm exec prettier --check` sobre los 4 archivos tocados | **OK** |

### Pendiente de la revisión A (no abordado en esta pasada)

- **M-02** y **M-03**: limitaciones del MVP, según el informe de la revisión A. **M-05**
  (descarga en la web) lo resolverá otro agente en `apps/web/**`.
- Siguen abiertos los `[Menor]`/`[Nit]` previos de `Pendiente`: ZIP en memoria, objeto huérfano
  entre `put` y `ready`, `progress` en memoria, sin reanudar job, sin prevalidación de cliente y
  lectura literal de `membersCanDownload` en la UI.

No se ha hecho commit ni push de estos cambios.

### M-05 — Aviso antes de descargar el álbum completo

La revisión detectó que el aviso de >100 MB y la explicación de dónde queda el archivo en
iOS/Android existían para la **selección** de fotos, pero no para la **descarga del álbum
completo**. `AlbumDto` no expone el tamaño total y el usuario decidió corregirlo **sin cambiar
el contrato**: una confirmación previa, con copy honesto sobre el umbral y la ubicación.

- `album-detail-page.tsx`: «Descargar álbum» (botón de escritorio y acción del menú móvil) abre
  un `ConfirmDialog` antes de crear el job. Confirmar cierra el aviso y llama a `download.start()`
  una sola vez; cancelar, `Esc` o el fondo no crean ningún job. El controlador ya bloqueaba
  dobles clics de forma síncrona con `activeRef`.
- `format.ts`: `formatAlbumDownloadWarning(photoCount)` explica que se generará un ZIP con las N
  fotos, que si supera 100 MB puede tardar, que se puede seguir usando Memora y que en iPhone y
  Android queda en Archivos o en Descargas. Reutiliza `formatDownloadWarningTitle` para el
  título y el mismo `ConfirmDialog` que la selección, sin duplicarlo.
- Tests: botón de escritorio y acción del menú abren el aviso sin crear el job, cancelar o
  `Esc` no llaman a `start`, el foco inicial va a «Cancelar», confirmar (dos clics) crea un
  único job, el copy incluye 100 MB e iOS/Android y axe no reporta violaciones sobre el
  diálogo. El test previo del menú ahora confirma el aviso antes de esperar el `POST`.

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test downloads` | **4 archivos, 20 tests: OK** (antes 13) |
| `pnpm --filter @memora/web test albums` | **9 archivos, 129 tests: OK** |
| `pnpm --filter @memora/web typecheck` | **OK** |
| `pnpm --filter @memora/web lint` | **OK** |
| `pnpm exec prettier --check` sobre los 4 archivos tocados | **OK** |

No se ha cambiado el contrato ni la API. No se ha hecho commit ni push. F33 sigue en `review`:
la aceptación (G4) es del usuario.
