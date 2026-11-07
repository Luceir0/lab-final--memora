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

- [x] `pnpm --filter @memora/api test downloads` → 27 tests.
- [x] API completa → 406 tests, 2 skipped.
- [x] `pnpm --filter @memora/web test downloads` → 13 tests.
- [x] Web completa → 807 tests.
- [x] `typecheck`, `lint`, `format:check`, `build`, `docs:check`.

## Cierre

- [ ] Revisión independiente nivel A.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
