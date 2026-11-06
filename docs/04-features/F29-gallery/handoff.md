# Handoff — F29 Galería

- **Estado:** `review` (implementación terminada; pendiente aceptación del usuario)
- **Rama:** `feat/F29-gallery` (worktree `f29-gallery`, commit local, sin push)
- **Fecha:** 2026-11-06
- **Nivel de auditoría:** B. **Sin `reviewer`** por la regla de entrega aprobada por el usuario el 2026-11-06 (CI + `axe` jsdom + aceptación).

## Resultado

Galería del álbum y página «Fotos de esta persona»: rejilla adaptativa 3 columnas en móvil y 4–7 en escritorio, scroll infinito por cursor, selección múltiple con clic/Shift/Ctrl y `Esc`, barra de selección, filtro por persona acotado al círculo, `srcset`/`sizes` con `loading="lazy"` y sin salto de layout, restauración de scroll por álbum y filtro, y entrada «Ver sus fotos» en la lista de miembros.

Durante la implementación se detectó que **`GET /api/albums/:albumId/photos` no existía**: el contrato estaba congelado en `packages/shared` desde F24, pero la ruta nunca se implementó. Se añadió con autorización por membresía, keyset `(createdAt, id)` y filtro `personId`.

## Cambios (archivos)

### Web — nuevos

- `apps/web/src/features/photos/queries.ts`: claves y hooks infinitos de álbum y persona.
- `apps/web/src/features/photos/photo-tile.tsx`: tile accesible con imagen adaptada y fallback.
- `apps/web/src/features/photos/photo-grid.tsx`: rejilla, estados, centinela y botón de carga.
- `apps/web/src/features/photos/selection-bar.tsx`: contador y acciones.
- `apps/web/src/features/photos/person-filter.tsx`: chips «Todas» + miembros del círculo.
- `apps/web/src/features/photos/album-gallery.tsx`: galería conectada del álbum.
- `apps/web/src/features/photos/person-photos-page.tsx`: página de persona.
- `apps/web/src/features/photos/{format,paths}.ts`, `use-photo-selection.ts`, `use-infinite-scroll.ts`, `use-restored-scroll.ts`.
- `apps/web/src/routes/_app.circles.$circleId.people.$userId.photos.tsx`.
- Tests: `album-gallery.test.tsx`, `photo-grid.test.tsx`, `person-photos-page.test.tsx` y `apps/web/src/test/fixtures/photos-fixtures.ts`.

### Web — modificados

- `albums/album-detail-page.tsx`: la rejilla pasa a `AlbumGallery`.
- `albums/albums-detail.test.tsx`: handlers de miembros/fotos y test de galería real.
- `circles/circle-detail-layout.tsx`: la ruta de fotos de persona no pinta el chrome del círculo.
- `members/{member-list,people-page}.tsx` y su test: enlace «Ver sus fotos» en móvil y escritorio.
- `routes/_app.circles.$circleId.people.tsx`: delega en `<Outlet/>` cuando la ruta hija está activa.
- `test/circles-harness.tsx`: ruta de fotos de persona.
- `routeTree.gen.ts`: regenerado por el build.

### API

- `apps/api/src/modules/albums/service.ts`: `listAlbumPhotosPage` con keyset y `personId`.
- `apps/api/src/modules/albums/routes.ts`: `GET /api/albums/:albumId/photos` con `200/400/401/404/429`.
- `apps/api/src/modules/albums/albums.test.ts`: 7 tests nuevos (401, 404 de otro círculo, paginación en tres páginas sin solapes, filtro por persona, `personId` ajeno → 404, `limit` inválido → 400, álbum vacío, y ausencia de claves de storage/GPS).

## Verificación

Ejecutada en el worktree `f29-gallery` el 2026-11-06:

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test photos --maxWorkers=2` | **3 archivos, 20 tests: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **91 archivos, 746 tests: OK** |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test` | **22 archivos y 354 tests pasados, 2 skipped: OK** |
| `pnpm typecheck` | **9/9: OK** |
| `pnpm lint` | **6/6: OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5, 5 rutas prerenderizadas: OK** |

## Criterios de aceptación

- **AC-01: pasa.** `grid-cols-3`, `md:4`, `lg:5`, `xl:6`, `2xl:7`.
- **AC-02: pasa.** `useInfiniteQuery` con `nextCursor`, centinela y botón accesible de respaldo.
- **AC-03: pasa.** Filtro desde `GET /circles/:circleId/members` y `personId` en la petición; el API responde `404` si la persona no es del círculo.
- **AC-04: pasa.** Clic, Shift (rango) y Ctrl/Cmd (alternar) con `aria-pressed`; `Esc` limpia.
- **AC-05: pasa.** Posición por álbum y filtro en `sessionStorage`.
- **AC-06: pasa.** `srcset` thumb/display, `sizes`, `loading="lazy"`, `decoding="async"` y dimensiones.
- **AC-07: pasa.** Página con endpoint del círculo, cabecera con total y álbumes, migas y vuelta.
- **AC-08: pasa con interpretación de contrato.** Chips «Todos los álbumes» y uno por álbum con `AlbumDto.photosCount`.
- **AC-09: pasa.** Vacío propio cuando la persona no tiene fotos.
- **AC-10: pasa.** Tiles enfocables, «Cargar más fotos» y carga por cursor.
- **AC-11: pasa.** «Ver sus fotos» en fila móvil y tabla de escritorio.

## Pendiente

- **Aceptación del usuario (G4)** en navegador con datos reales: la galería ya consume el endpoint nuevo.
- El barrido de anchos 320–1440 y el lector de pantalla se centralizan en **F39**.
- `[Menor]` Los contadores por persona y álbum no existen en el contrato: el chip de persona usa `MemberDto.photosCount` (total del círculo) y el chip de álbum usa `AlbumDto.photosCount` (total del álbum), no las fotos de esa persona en ese álbum.
- `[Menor]` «Seleccionar las N» selecciona solo las fotos cargadas; la etiqueta refleja ese número.
- `[Menor]` Los chips de álbum de la página de persona listan solo la primera página de álbumes (24).
- `[Nit]` La restauración de scroll asume que el scroll es de `window`.

## Riesgos y limitaciones

- El cursor de fotos reutiliza `encodeAlbumCursor`/`decodeAlbumCursor` porque el payload `(createdAt, id)` es idéntico; no se duplica formato.
- El `GET` nuevo no tiene rate limit propio: sigue el comportamiento del resto de lecturas de álbum.
- No hay verificación en navegador real todavía; sí `axe` en jsdom en los tests de la feature.

## Documentación actualizada

- `docs/04-features/F29-gallery/tasks.md` y este `handoff.md`.
- `docs/04-features/README.md`: F29 pasa a `review` y la situación actual lo refleja.
- `docs/04-features/F29-gallery/spec.md`: estado `review`.

## Siguiente paso propuesto

1. Aceptación del usuario en navegador.
2. Commit local en `feat/F29-gallery` y merge local a `main` (sin push hasta el final, por decisión del usuario).
3. Continuar con **F30 (visor)** en el mismo worktree.
