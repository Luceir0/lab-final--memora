# Tasks — F26 Upload queue web

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F24 y F25, ambas `done`.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] useUploadQueue — `apps/web/src/features/uploads/upload-queue-context.ts` (desviación de ubicación respecto a `apps/web/src/hooks/useUploadQueue.ts`).
- [x] Reducer con unión discriminada — `types.ts` y `reducer.ts`; `reducer.test.ts` y `reducer-transitions.test.ts`.
- [x] Concurrencia 3 — `MAX_CONCURRENT_UPLOADS` en `validation.ts`, arranque por hueco en `upload-provider.tsx`.
- [x] Progreso XHR — `transport.ts` con `upload.onprogress`; `transport.test.ts` y `upload-xhr-msw.test.tsx`.
- [x] Retry/cancel — acciones de reducer, `AbortController`, `clientUploadId` estable en reintentos.
- [x] Dropzone — `upload-dropzone.tsx`; dropzone de ventana con cancelación del default.
- [x] Selector cámara/galería — `upload-source-picker.tsx` con `capture`.
- [x] Aviso al salir — `upload-exit-guard.tsx` con **solo `beforeunload` nativo** mientras hay subidas pendientes o en curso; la navegación interna no se bloquea. Tests: `upload-exit-guard.test.tsx` (evento sintético) y `album-upload-exit.test.tsx` (router real, sin diálogo).
- [x] Tests — 19 archivos y 141 tests en `apps/web/src/features/uploads/`, más `album-upload.test.tsx` y `album-upload-exit.test.tsx`.
- [x] Host global de la UI — `upload-queue-host.tsx` monta una sola barra y un solo panel, reserva espacio en escritorio y gestiona el foco barra ↔ panel.
- [x] Integración en el álbum — acciones en cabecera, estado vacío, FAB móvil y `canUploadPhotos()`; el álbum ya no monta la cola.
- [x] Anuncios accesibles — `upload-announcer.tsx` portaleado al overlay superior, sin porcentajes, renderizado por el provider.

## Delta de UI global

- [x] Eliminar el modal interno de salida: navegar no bloquea ni muestra diálogo.
- [x] Montar `UploadProvider`, `UploadExitGuard` y `UploadQueueHost` en `apps/web/src/routes/_app.tsx`, con el host **después** de `<AppShell>`.
- [x] Panel global titulado «Subidas», sin filtro por ruta ni por álbum; álbum por archivo solo si la cola mezcla más de un álbum.
- [x] Barra compacta global en todas las rutas privadas mientras haya items, con `data-upload-bar`.
- [x] Reserva global de espacio: padding inferior de `main` y `scroll-padding-bottom` con barra y con panel abierto (2.4.11).
- [x] Foco al cuerpo del panel/hoja (`role="group"`, «Subidas») tras reintentar, cancelar, descartar o limpiar.
- [x] Altura del panel con `--upload-queue-panel-height: min(32rem, calc(100dvh - 3rem))`.
- [x] Documentar la limitación: logout, `401` o salida de la zona privada desmontan el provider y abortan la cola.

## Criterios de aceptación

- [x] AC-01: Cada archivo tiene estado discriminado.
- [x] AC-02: Progreso por archivo y global.
- [x] AC-03: Reintento individual.
- [x] AC-04: Cancelación.
- [x] AC-05: Un error no pierde los demás.
- [x] AC-06: Drag & drop y selector.
- [x] AC-07: Navegar no bloquea ni muestra diálogo; recargar/cerrar con subidas activas usa el aviso nativo; sin subidas activas no avisa.

## Verificación

- [x] `pnpm --filter @memora/web typecheck` → OK.
- [x] `pnpm --filter @memora/web lint` → OK.
- [x] `pnpm --filter @memora/web test uploads` → **19 archivos, 141 tests**.
- [x] `pnpm --filter @memora/web test -- --maxWorkers=3` → **82 archivos, 649 tests**.
- [x] `pnpm format:check` → OK.
- [x] axe en `upload-queue-bar.test.tsx` y `upload-queue-risk.test.tsx` → pasan.
- [x] `pnpm --filter @memora/web build` → OK en la revisión previa; **no re-ejecutado tras el delta**.
- [ ] Barrido en navegador real (375/1440, claro/oscuro, zoom 200 %, layout con el panel abierto, arrastre real, `capture`, aviso nativo de `beforeunload`, lector de pantalla) → G4/F37/F38/F39.

## Cierre

- [x] Revisión independiente nivel B de la implementación base — **aprobada**, sin bloqueantes ni mayores.
- [x] Auditoría de accesibilidad de la base — **aprobada**; axe sin violaciones en hoja, panel y barra.
- [x] Auditoría de diseño — mayores resueltos; quedan nits.
- [ ] Revisión B de cierre del delta de UI global.
- [ ] Aceptación del usuario (G4).
- [x] `handoff.md` completo.
- [x] Tablero actualizado — F26 en `review`.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
