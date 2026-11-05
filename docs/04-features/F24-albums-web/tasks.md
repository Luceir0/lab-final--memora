# Tasks — F24 Albums web

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F18, F23.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (G1, 2026-11-05).

## Implementación

- [x] AlbumForm (crear y editar)
- [x] AlbumHeader
- [x] AlbumGrid base, con cards de altura uniforme (`auto-rows-fr`, `h-full`, texto `flex-1`)
- [x] Estados vacío/carga/error
- [x] Guardando
- [x] Validación
- [x] Acción «Vaciar álbum» para owner o creador, con confirmación
- [x] Acción «Eliminar álbum» para owner o creador, con `ALBUM_NOT_EMPTY` y guía a vaciar
- [x] Ruta de detalle `/circles/:circleId/albums/:albumId`

## Cambios de aceptación (2026-11-05)

- [x] Altura uniforme de las cards en todas las filas y breakpoints.
- [x] `album.empty` y `album.delete` permiten owner o creador, sin depender de `membersCanCreateAlbums`; eliminar exige álbum vacío (`409`).
- [x] «Vaciar álbum» solo aparece en el menú si `photosCount > 0`; con 0 fotos no hay ítem ni modal.
- [x] Portada: F26 la sube como foto del álbum; F29 la elige y marca `coverPhotoId`. F24 solo registra la invariante.
- [x] El alta precarga el mes actual (`currentMonthInput`) y lo guarda si no se cambia; la edición conserva la fecha o la deja vacía.
- [x] Copia visible del 403 de vaciar/eliminar: «Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.».
- [x] Atajo «Vaciar» desde el `409` con refetch del detalle cuando el recuento cacheado está obsoleto.
- [x] Hint de fecha: «Se guardará como el primer día del mes.».

## Criterios de aceptación

- [x] AC-01: Crear álbum valida y guarda.
- [x] AC-02: Detalle muestra metadatos.
- [x] AC-03: Móvil una columna; escritorio rejilla.
- [x] AC-04: Estado vacío guía a subir.
- [x] AC-05: Errores comprensibles.
- [x] AC-06: Teclado y foco.
- [x] AC-07: Borrar álbum no vacío muestra `ALBUM_NOT_EMPTY` y guía a vaciarlo.
- [x] AC-08: «Vaciar álbum» pide confirmación y actualiza la galería.

## Verificación

- [x] `pnpm --filter @memora/web test albums` → 7 archivos, 113 tests, todos pasan.
- [x] `pnpm --filter @memora/web test` → 61 archivos, 491 tests, todos pasan.
- [x] `pnpm --filter @memora/shared test` → 150 tests, todos pasan.
- [x] `pnpm --filter @memora/api test albums` → 27 tests, todos pasan.
- [x] Suite completa con `DATABASE_URL=…/memora_test` → 8/8 tareas (shared 150, api-client 39, ui 281, web 491, api 246).
- [x] `pnpm typecheck` → 9/9.
- [x] `pnpm lint` → 6/6.
- [x] `pnpm format:check` → OK.
- [x] `pnpm --filter @memora/web build` → OK, 5 rutas prerenderizadas.
- [x] `pnpm docs:check` → OK (191 archivos, 538 enlaces, 0 rotos) y `pnpm agents:check` → OK (10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas).

## Cierre

- [x] Revisión independiente (nivel B): **aprobada** en la ronda de cambios, con Menores/Nits; corregidos los de código (403 y 409).
- [x] Auditoría de diseño del delta: **apta con correcciones menores**; alturas idénticas a 1440/1024/768/375 en claro y oscuro; menús correctos; hint corregido.
- [x] Auditoría de accesibilidad del delta: **apta**, 0 violaciones de axe, teclado y foco correctos.
- [x] Aceptación del usuario el 2026-11-05, tras los cinco cambios y con petición expresa de cierre.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Verificación final repetida el 2026-11-05: álbumes 7/113, web 491, shared 150, API 246, suite 8/8, typecheck 9/9, lint 6/6, format OK, build 5 rutas, docs 191/538/0 y agents 43/43.
- [x] Login comprobado tras reiniciar la API limpia (`health=200`, `login=200`, web `200`); el usuario debe recargar con `Ctrl+Shift+R` o en incógnito.
- [x] Álbumes de prueba borrados con autorización del usuario; quedan los dos de seed.
- [x] Commit local (`1a40ca3` feature, `b964e16` y `4ce5043` documentación).
- [x] Push y PR #38.
- [x] Merge y CI de la PR #38 (`8c04be8`; PR `42072093665`; `main` `42072660244`).
- [x] PR de documentación #39.
- [ ] Pendientes técnicos del handoff: lector de pantalla real, zoom solo-texto, portada F26/F29, subidas F26, descargas F33, doble anuncio de validación, cuerpo genérico del 403 en la API, Mateo creador con fotos, paginación >24 y cursor inválido.
