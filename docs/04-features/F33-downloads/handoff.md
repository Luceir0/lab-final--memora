# Handoff — F33 Descargas

- **Estado:** `review` (implementación terminada; pendiente revisión A y aceptación)
- **Rama:** `feat/F33-downloads` (worktree `f29-gallery`, commit local, sin push)
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
