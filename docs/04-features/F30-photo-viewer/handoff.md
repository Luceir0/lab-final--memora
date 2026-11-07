# Handoff — F30 Visor de foto

- **Estado:** `done` (aceptada por el usuario el 2026-11-07; PR #51, merge `1e667c1`)
- **Rama:** `feat/F30-photo-viewer` (worktree `f29-gallery`, commit local, sin push)
- **Fecha:** 2026-11-06
- **Nivel de auditoría:** B. **Sin `reviewer`** por la regla de entrega aprobada el 2026-11-06.

## Resultado

Visor de foto con ruta propia anidada bajo el álbum: fullscreen en móvil y modal atenuado en escritorio, navegación con flechas y swipe (con botones como alternativa), panel de detalles con autor, fecha y lugar, estados de carga, «no disponible» y foco gestionado con retorno a la miniatura de origen.

Se añadió el endpoint que faltaba, `GET /api/photos/:photoId`, con autorización por membresía y `404` para foto ajena o inexistente.

## Cambios (archivos)

### API

- `apps/api/src/modules/photos/service.ts`: `findPhotoForMember` reutilizando `PHOTO_INCLUDE`.
- `apps/api/src/modules/photos/routes.ts`: `GET /api/photos/:photoId` con `200/400/401/404/429`.
- `apps/api/src/modules/photos/photos.test.ts`: 4 tests (401, 404 de otro círculo, 404 inexistente, 200 sin claves de storage ni GPS).

### Web — nuevos

- `apps/web/src/features/photos/viewer/photo-viewer.tsx`, `photo-details-panel.tsx`, `queries.ts`, `format.ts`, `navigation.ts`, `origin.ts`, `selection-bridge.ts`, `use-viewer-focus-trap.ts` y sus tests.
- `apps/web/src/routes/_app.circles.$circleId.albums.$albumId.photos.$photoId.tsx`.

### Web — modificados

- `routes/_app.circles.$circleId.albums.$albumId.tsx`: `<Outlet/>` y álbum `inert`/`aria-hidden` con el visor abierto.
- `features/photos/{photo-tile,photo-grid,album-gallery,person-photos-page}.tsx`: abrir el visor, origen y puente de selección.
- `features/circles/circle-detail-layout.tsx`: el patrón de álbum cubre la ruta anidada del visor.
- Tests de F29 adaptados a «abrir vs seleccionar» y `routeTree.gen.ts` regenerado.

## Decisión de interacción

El diseño canónico usa checkbox para seleccionar y clic para abrir, así que **F30 cambia la interacción de F29**: clic abre el visor; la casilla (visible al hover/focus, siempre en móvil y en modo selección) selecciona; `Shift+clic` hace rango y `Ctrl/Cmd+clic` alterna sin abrir; el primer `Esc` limpia la selección y el segundo cierra. Se actualizaron los tests de F29 que asumían «clic = seleccionar».

## Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test viewer --maxWorkers=2` | **2 archivos, 13 tests: OK** |
| `pnpm --filter @memora/web test photos --maxWorkers=2` | **5 archivos, 34 tests: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **93 archivos, 760 tests: OK** |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test` | **22 archivos y 358 tests, 2 skipped: OK** |
| `pnpm typecheck` / `pnpm lint` / `pnpm format:check` | **9/9 · 6/6 · OK** |
| `pnpm build` | **5/5, 5 rutas prerenderizadas: OK** |

## Criterios de aceptación

- **AC-01: pasa.** Fullscreen por defecto; desde 768 px, fondo atenuado y panel centrado.
- **AC-02: pasa.** El álbum sigue montado detrás; cerrar conserva scroll y devuelve el foco a la miniatura de origen.
- **AC-03: pasa.** `ArrowLeft`/`ArrowRight` navegan; `Esc` cierra (o limpia selección primero).
- **AC-04: pasa.** Swipe con umbral y botones «Foto anterior»/«Foto siguiente» siempre presentes.
- **AC-05: pasa.** Foco inicial en cerrar, trampa de `Tab` y restauración al desmontar.
- **AC-06: pasa.** Autor, fecha de subida, `takenAt` y `placeName`; sin coordenadas.
- **AC-07: pasa.** Fallo del binario y `404` del detalle tienen estados propios.

## Pendiente

- **Aceptación del usuario (G4)** en navegador real: atrás con scroll, swipe táctil y foco.
- E2E de navegador → **F38**.
- `[Menor]` Vecinos solo desde páginas cacheadas: por enlace directo, si la foto no está en la primera página, solo se puede volver.
- `[Menor]` Al abrir desde «Fotos de esta persona», cerrar vuelve al álbum y no a la página de la persona.
- `[Nit]` El scroll del documento se bloquea con `overflow: hidden`; puede haber diferencias menores en iOS Safari.
- `[Nit]` Los elementos portaleados fuera de la ruta del álbum (toasts) no quedan `inert`; `aria-modal` y la trampa de foco cubren la interacción principal.

## Riesgos y limitaciones

- El visor depende de `membersCanDownload` para `original`; si el permiso cambia a mitad de sesión, se muestra «imagen no disponible».
- Las etiquetas llegan en el orden de la base; si F32 necesita orden estable, se añade allí.

## Documentación actualizada

- `docs/04-features/F30-photo-viewer/{tasks,handoff}.md` y `spec.md` (estado `review`).
- `docs/04-features/README.md`: F30 pasa a `review`.

## Siguiente paso propuesto

1. Aceptación del usuario en navegador.
2. Commit local y merge local a `main` (sin push hasta el final).
3. Continuar con **F31 (metadatos)** en el mismo worktree.
