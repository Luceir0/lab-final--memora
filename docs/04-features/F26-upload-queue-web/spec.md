---
id: F26
title: "Upload queue web"
milestone: M3
size: L
status: review
spec: complete
depends_on:
  - "F24"
  - "F25"
blocks:
  - "F27"
  - "F29"
design_refs:
  - "assets/design/screens/album-movil-subiendo.png"
  - "assets/design/screens/cola-de-subida-movil.png"
  - "assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png"
contracts:
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F26 — Upload queue web

> **Milestone:** M3 · **Talla:** L · **Estado:** review · **Spec:** completa
> **Depende de:** F24, F25 · **Bloquea:** F27, F29

> **Invariante de portada (F24, 2026-11-05).** F26 sube la imagen de portada **como una foto más del álbum**, con el mismo pipeline y los mismos límites; no crea un objeto de portada aparte ni un endpoint distinto. La elección entre las fotos del álbum y la marca `coverPhotoId` son de F29.

## Objetivo

Implementar la cola de subida con progreso, reintento, cancelación y drag & drop.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-subiendo.png](../../../assets/design/screens/album-movil-subiendo.png)
- [assets/design/screens/cola-de-subida-movil.png](../../../assets/design/screens/cola-de-subida-movil.png)
- [assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png](../../../assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png)

### Contratos

- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Decisiones cerradas y desviaciones (2026-11-06)

Registradas al pasar la feature a `review`. El delta de UI global del mismo día (abajo) reescribe **AC-07** para reflejar el comportamiento aprobado.

- **Provider global:** `UploadProvider` se monta en `apps/web/src/routes/_app.tsx`, así la cola sobrevive a la navegación dentro de la app y **no** a la recarga. Sin subidas en segundo plano.
- **Transporte:** XHR con `upload.onprogress`, porque `fetch` no expone el progreso de subida. `withCredentials`, `X-CSRF-Token` y `AbortController` por archivo.
- **CSRF:** un token por lote, con **un único** refresco si el primer envío falla por CSRF. La detección es por el mensaje del `403`, no por un código propio.
- **Idempotencia:** un `clientUploadId` por archivo con `crypto.randomUUID()` y fallback; el mismo id se reutiliza en los reintentos.
- **Límites de cliente (orientativos):** JPEG/PNG/WebP, 25 MB y 20 archivos por lote; la validación autoritativa sigue siendo la de la API. Concurrencia 3.
- **Presentación:** hoja inferior en móvil/tablet y panel flotante **no modal** desde 1024 px; barra compacta de reapertura en ambos; progreso por archivo y global ponderado por bytes.
- **Aviso al salir:** solo `beforeunload` nativo mientras haya subidas pendientes o en curso; la navegación interna **no** se bloquea y no hay diálogo propio (el navegador no permite personalizarlo).
- **Anuncios:** una única región viva portaleada al overlay superior para no quedar dentro de `inert`; anuncia añadida, completada, error con motivo y cancelada, nunca porcentajes.
- **Desviaciones conscientes:** el hook vive en `apps/web/src/features/uploads/upload-queue-context.ts` en vez de `apps/web/src/hooks/useUploadQueue.ts` (co-locación y patrón del repo); sin rejilla con placeholders (F29); sin página global `/uploads` ni contador del sidebar (F27); sin ETA; velo de arrastre a pantalla completa; «Se añadirán» frente a «Se añadirían» del PNG.

### Delta de UI global (2026-11-06)

Aprobado por el usuario sobre la implementación en `review`. Sustituye el modal de salida y mueve la UI de la cola al layout privado.

- **Host único y global:** `UploadProvider`, `UploadExitGuard` y `UploadQueueHost` se montan en `apps/web/src/routes/_app.tsx`; el host va **después** de `<AppShell>` y el provider renderiza `UploadAnnouncer`. Hay una sola barra y un solo panel para toda la zona privada.
- **Navegación interna sin bloqueo:** se elimina el modal interno (`useBlocker` + `ConfirmDialog`). Cambiar de ruta no interrumpe la cola; la barra y el panel siguen montados.
- **Panel global:** muestra todos los items, sin filtro por ruta ni por álbum. El título es «Subidas» y el álbum por archivo solo aparece cuando la cola mezcla más de un álbum.
- **Barra global:** visible en todas las rutas privadas mientras haya items, con `data-upload-bar` en `<html>` y reserva global de espacio (padding inferior de `main` y `scroll-padding-bottom`).
- **Móvil y escritorio:** la hoja inferior sigue siendo modal; la card persistente es la barra. La autoapertura al añadir mueve el foco dentro de la hoja por ser modal; en escritorio el autoabrir **no** mueve el foco, solo al abrir desde la barra.
- **Foco tras acciones:** después de reintentar, cancelar, descartar fallidas o limpiar terminadas, el foco vuelve al cuerpo del panel/hoja (`role="group"`, «Subidas»), que siempre existe.
- **Altura y reserva del panel:** `--upload-queue-panel-height: min(32rem, calc(100dvh - 3rem))`; con el panel abierto se reserva espacio en `main` y `scroll-padding-bottom` (WCAG 2.2, 2.4.11).
- **F27 reducida:** ruta `/uploads` real, subidas recientes y contador del sidebar; el panel y la cola global ya no son suyos.
- **Limitación aceptada:** salir de la zona privada, el logout o un `401` desmonta el provider y aborta la cola; `beforeunload` no cubre esa navegación SPA.

## Alcance

### Incluye

- useUploadQueue
- Reducer con unión discriminada
- Concurrencia 3
- Progreso XHR
- Retry/cancel
- Dropzone
- Selector cámara/galería
- Aviso nativo al recargar/cerrar
- Tests

### No incluye

- Página global (F27)
- Subidas en segundo plano

## Entregables

- apps/web/src/features/uploads/** (el hook vive en `upload-queue-context.ts`)
- tests

## UX y estados

- en cola
- subiendo
- completada
- error
- cancelada
- reintento

## Criterios de aceptación

- **AC-01.** Cada archivo tiene estado discriminado.
- **AC-02.** Progreso por archivo y global.
- **AC-03.** Reintento individual.
- **AC-04.** Cancelación.
- **AC-05.** Un error no pierde los demás.
- **AC-06.** Drag & drop y selector.
- **AC-07.** Navegar dentro de la app no bloquea ni muestra diálogo; recargar o cerrar con subidas activas (`pending + active > 0`) usa el aviso nativo del navegador; sin subidas activas no avisa. Salir de la zona privada (logout o `401`) no está cubierto por ese aviso.

## Pruebas

- Reducer
- Hook
- Componente
- MSW fallo/reintento
- Navegación real sin bloqueo y host global, con router de TanStack
- `beforeunload` nativo con subidas activas y sin ellas

## Archivos previstos

- `apps/web/src/features/uploads/**`
- `apps/web/src/features/uploads/upload-queue-context.ts` (hook real; desviación registrada)

## Verificación

- `pnpm --filter @memora/web test uploads`
- `pnpm --filter @memora/web test -- --maxWorkers=3`
- `pnpm --filter @memora/web typecheck`
- `pnpm --filter @memora/web lint`
- `pnpm format:check`

## Definition of Ready

- [ ] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

La cola no sobrevive a recarga; solo se avisa con `beforeunload`. La salida de la zona privada, el logout y el `401` desmontan el provider y abortan la cola: no hay aviso para esa navegación SPA.
