# Tasks — F33 Descargas

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F29 y F30.
- [x] Comprobar Definition of Ready.
- [x] Autorización del usuario para instalar `archiver@8.0.0`.

## Implementación

- [x] `GET /photos/:photoId/download`
- [x] `POST /albums/:albumId/downloads`
- [x] `photoIds` con validación de álbum y círculo
- [x] Polling con `progress` derivado
- [x] Límites 500 fotos / 2 GB
- [x] Expiración a 24 h y limpieza
- [x] Worker con concurrencia 1 y `archiver`
- [x] Aviso móvil de >100 MB
- [x] Descarga de selección, de álbum e individual en la web
- [x] Tests de API y de UI

## Criterios de aceptación

- [x] AC-01: autorización y `membersCanDownload`.
- [x] AC-02: límites 500/2 GB.
- [x] AC-03: expiración 24 h.
- [x] AC-04: polling y descarga.
- [x] AC-05: selección solo del álbum.
- [x] AC-06: aviso en móvil.
- [x] AC-07: no se expone `objectKey`.

## Verificación

- [x] `pnpm --filter @memora/api test downloads` → 30 tests (incluye M-01 y M-04).
- [x] API completa → 409 passed + 2 skipped.
- [x] `pnpm --filter @memora/web test downloads` → 20 tests (incluye M-05).
- [x] Web completa → 103 archivos y 818 tests.
- [x] `typecheck` 9/9, `lint` 6/6, `format:check`, `build` 5/5, `docs:check`, `agents:check`.

## Cierre

- [x] Revisión independiente nivel A — apto con correcciones, sin bloqueantes.
- [x] Aceptación del usuario (2026-11-07).
- [x] `handoff.md` completo.
- [x] M-01, M-04 y M-05 corregidos; M-02/M-03 documentados como limitaciones.
