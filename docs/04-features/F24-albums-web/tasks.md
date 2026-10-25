# Tasks — F24 Albums web

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F18, F23.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] AlbumForm
- [ ] AlbumHeader
- [ ] AlbumGrid base
- [ ] Estados vacío/carga/error
- [ ] Guardando
- [ ] Validación
- [ ] Acción “Vaciar álbum” para owner, con confirmación

## Criterios de aceptación

- [ ] AC-01: Crear álbum valida y guarda.
- [ ] AC-02: Detalle muestra metadatos.
- [ ] AC-03: Móvil una columna; escritorio rejilla.
- [ ] AC-04: Estado vacío guía a subir.
- [ ] AC-05: Errores comprensibles.
- [ ] AC-06: Teclado y foco.
- [ ] AC-07: Borrar álbum no vacío muestra `ALBUM_NOT_EMPTY` y guía a vaciarlo.
- [ ] AC-08: “Vaciar álbum” pide confirmación y actualiza la galería.

## Verificación

- [ ] `pnpm --filter @memora/web test albums`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
