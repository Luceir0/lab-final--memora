# Handoff — F26 Upload queue web

- **Estado:** `done` — aceptada por el usuario (G4) el 2026-11-06 y cerrada en `main`
- **Rama:** `feat/f26-upload-queue-web`, mergeada con la PR #42; este cierre documental se prepara en `main` sin commit
- **Fecha:** 2026-11-06
- **Implementado por:** `ui-dev` en dos sesiones (cola, transporte y componentes; integración en el álbum y correcciones de auditoría), más un **delta de UI global** aprobado por el usuario
- **Revisado por:** `reviewer` independiente, nivel **B**: **aprobada**, incluida la revisión de cierre del delta de UI global
- **Contratos:** [uploads.md](../../03-architecture/uploads.md) · [ADR-0007](../../03-architecture/adr/ADR-0007-uploads.md)
- **Cierre operativo:** [PR #42](https://github.com/Luceir0/lab-final--memora/pull/42) · commits `9362d42` y `130be9d` · merge `86692300887bdd8d712073ba745ea87bc2674787` en `main` · CI en la PR run `42194933113` y en `main` run `42195282791`, ambos `completed/success`

## Resultado

La cola de subida web está implementada sobre el contrato de F25. El delta de UI global deja `UploadProvider`, `UploadExitGuard` y `UploadQueueHost` montados en `apps/web/src/routes/_app.tsx` —el host **después** de `<AppShell>`—, con el anunciador renderizado por el provider: una sola cola, una sola barra y un solo panel para toda la zona privada. La cola sobrevive a la navegación interna (no a la recarga), sube con concurrencia 3 por XHR con progreso real, reintenta con el mismo `clientUploadId`, cancela con `AbortController` y avisa **solo con `beforeunload` nativo** cuando hay subidas pendientes o en curso; la navegación interna no se bloquea ni muestra diálogo.

La UI es una hoja inferior modal en móvil/tablet y un panel flotante no modal desde 1024 px, titulado «Subidas», sin filtro por ruta ni por álbum; el álbum por archivo solo aparece si la cola mezcla más de un álbum. La barra compacta es global en todas las rutas privadas mientras haya items (`data-upload-bar`), con reserva de espacio en `main` y `scroll-padding-bottom`; el panel de escritorio usa `--upload-queue-panel-height: min(32rem, calc(100dvh - 3rem))` y también reserva espacio al abrirse (WCAG 2.2, 2.4.11). Tras cualquier acción de la cola, el foco vuelve al cuerpo del panel/hoja (`role="group"`, «Subidas»). El álbum conserva acciones reales en cabecera, estado vacío y FAB móvil, dropzone de ventana y selector cámara/galería con `capture`.

La verificación es automatizada. El usuario aceptó la feature el 2026-11-06 (G4): «Todo bien, cambios aprobados.» No se ha probado en navegador real ni con Playwright: el barrido 375/1440, claro/oscuro, el layout a 200 % con el panel abierto, arrastre real, `capture`, aviso nativo de recarga y lector de pantalla quedan como pendientes reales en F37/F38/F39.

## Cambios (archivos)

### Cola y transporte

- `apps/web/src/features/uploads/types.ts`: unión discriminada `pending | uploading | done | error | cancelled`, `UploadItem`, acciones y resumen.
- `apps/web/src/features/uploads/reducer.ts`: reducer puro (sin efectos ni `Date`), transiciones válidas por estado y `summarizeUploadQueue` con progreso global **ponderado por bytes**.
- `apps/web/src/features/uploads/upload-queue-context.ts`: contexto y hook `useUploadQueue`. **Desviación:** vive aquí y no en `apps/web/src/hooks/useUploadQueue.ts` (co-locación con el provider y patrón del repo).
- `apps/web/src/features/uploads/upload-provider.tsx`: provider global; arranque de pendientes con hueco libre (máximo 3), token CSRF por lote con refresco **único** ante fallo CSRF, invalidación del detalle del álbum al completar, limpieza de previews al desmontar y render del `UploadAnnouncer`.
- `apps/web/src/features/uploads/transport.ts`: transporte XHR con `upload.onprogress` (fetch no expone progreso de subida), `withCredentials`, `X-CSRF-Token`, `AbortController`, mapeo HTTP → código canónico y normalización de un 500 sin cuerpo contractual.
- `apps/web/src/features/uploads/ids.ts`: `clientUploadId` con `crypto.randomUUID()` y fallback; id de item independiente.
- `apps/web/src/features/uploads/validation.ts`: validación cliente orientativa (JPEG/PNG/WebP, 25 MB, 20 archivos por lote) y `MAX_CONCURRENT_UPLOADS = 3`. Los inválidos entran en `error` sin bloquear a los válidos.
- `apps/web/src/features/uploads/errors.ts`: copia de errores por código y clasificación de cancelación y CSRF.
- `apps/web/src/features/uploads/preview.ts`: creación y revocación de object URLs.
- `apps/web/src/features/uploads/album-refresh.ts`: invalidación de la clave del detalle del álbum.
- `apps/web/src/features/uploads/format.ts`: nombre visible y tamaño de archivo.

### UI

- `apps/web/src/features/uploads/upload-queue.tsx`: instancia única de la cola; hoja inferior modal en móvil/tablet y panel flotante no modal desde `lg` (≥1024 px), titulado «Subidas», sin filtro por ruta ni por álbum. Muestra el álbum por archivo solo cuando la cola mezcla más de un álbum. Tras reintentar, cancelar, descartar o limpiar, el foco vuelve al cuerpo (`role="group"`, «Subidas»). La altura del panel sale del token `--upload-queue-panel-height`.
- `apps/web/src/features/uploads/upload-queue-item.tsx`: fila con progreso, estado y acciones por archivo.
- `apps/web/src/features/uploads/upload-queue-bar.tsx`: barra compacta **global** en todas las rutas privadas mientras haya items; en móvil va sobre la bottom nav y en escritorio es una pill. Publica `data-upload-bar` en `<html>` para la reserva de espacio y se mantiene montada e `inert` con el panel abierto, para devolverle el foco.
- `apps/web/src/features/uploads/upload-queue-host.tsx`: host único de barra y panel. Publica `data-upload-panel` en escritorio con el panel abierto, abre desde la barra con foco en el panel y devuelve el foco a la barra al cerrar (o a `<main>` si la cola quedó vacía).
- `apps/web/src/features/uploads/upload-dropzone.tsx`: dropzone de ventana; cancela siempre el `default` con archivos (también dentro de la cola o deshabilitado) e ignora drops dentro de overlays.
- `apps/web/src/features/uploads/upload-source-picker.tsx`: selector cámara/galería con `capture`.
- `apps/web/src/features/uploads/upload-announcer.tsx`: región viva única, **portaleada** al overlay superior (`[data-memora-overlay-root]`) para no quedar dentro de `inert`; la renderiza el provider y anuncia añadida, completada, error con motivo y cancelada, nunca porcentajes.
- `apps/web/src/features/uploads/upload-exit-guard.tsx`: solo `beforeunload` nativo, registrado mientras `pending + active > 0`. La navegación interna **no** se bloquea y no hay diálogo propio; el navegador no permite personalizar ese aviso.
- `apps/web/src/features/uploads/use-media-query.ts`: consulta de media para el modo de presentación.
- `apps/web/src/features/uploads/index.ts`: superficie pública de la feature.

### Integración y estilos

- `apps/web/src/routes/_app.tsx`: monta `UploadProvider`, `UploadExitGuard` y `UploadQueueHost` en el layout pathless; el host va **después** de `<AppShell>`, de modo que barra y panel son globales para toda la zona privada. El anunciador lo renderiza el provider.
- `apps/web/src/features/albums/album-detail-page.tsx`: acciones reales en cabecera, estado vacío, FAB móvil (con offset sobre la barra global), dropzone y selector conectados a la cola; ya **no** monta la cola ni la barra.
- `apps/web/src/features/albums/permissions.ts`: `canUploadPhotos(circle)` como espejo de `owner`/`membersCanUpload`.
- `apps/web/src/styles/app.css`: `--upload-queue-bar-height: 5.5rem`, `--upload-queue-panel-height: min(32rem, calc(100dvh - 3rem))`, `html[data-upload-bar='visible']` y `html[data-upload-panel='open']` para `scroll-padding-bottom` y el padding inferior de `main`.

### Tests

- `apps/web/src/features/uploads/`: 19 archivos con **141 tests** — `reducer.test.ts`, `reducer-transitions.test.ts`, `use-upload-queue.test.tsx`, `use-upload-queue-risks.test.tsx`, `transport.test.ts`, `transport-contract.test.ts`, `upload-xhr-msw.test.tsx`, `validation.test.ts`, `errors.test.ts`, `format.test.ts`, `album-refresh.test.ts`, `upload-dropzone.test.tsx`, `upload-source-picker.test.tsx`, `upload-queue.test.tsx`, `upload-queue-risk.test.tsx`, `upload-queue-bar.test.tsx`, `upload-queue-host.test.tsx`, `upload-announcer.test.tsx` y `upload-exit-guard.test.tsx`.
- `apps/web/src/features/albums/album-upload.test.tsx` y `apps/web/src/features/albums/album-upload-exit.test.tsx`: integración en el álbum y **navegación real con el router de TanStack y el host global**: sin diálogo, la ruta cambia, la cola no se aborta y barra/panel siguen montados; sin subidas activas tampoco hay diálogo.

## Verificación

| Comando | Resultado real |
| --- | --- |
| `pnpm --filter @memora/web typecheck` | OK |
| `pnpm --filter @memora/web lint` | OK |
| `pnpm --filter @memora/web test uploads` | **19 archivos, 141 tests** |
| `pnpm --filter @memora/web test -- --maxWorkers=3` | **82 archivos, 649 tests** |
| `pnpm format:check` | OK |
| `pnpm --filter @memora/web build` | OK, **5 rutas prerenderizadas** |
| `pnpm docs:check` / `pnpm agents:check` | 191 archivos, **574 enlaces** tras este cierre documental (568 en la verificación previa), 0 rotos / 43 specs y 43 filas |
| axe en `upload-queue-bar.test.tsx` y `upload-queue-risk.test.tsx` | Pasan |

Notas sobre la verificación:

- `upload-xhr-msw.test.tsx` usa **MSW 3.0.3 sobre XHR real**: 500 → `error` y reintento 201 → `done` **con el mismo `clientUploadId`**. También cubre la normalización de un 500 sin cuerpo contractual.
- `album-upload-exit.test.tsx` cubre la navegación interna real: no aparece el diálogo eliminado, el pathname cambia, la petición no se aborta y la barra/panel siguen montados; con el panel cerrado, la barra sigue visible y usable en la nueva ruta. No se prueba el aviso nativo porque jsdom no muestra el diálogo del navegador.
- `upload-exit-guard.test.tsx` despacha un `beforeunload` sintético: se previene con subidas pendientes o en curso y no se previene con la cola vacía, en `done`, en `error` o en `cancelled`. El diálogo nativo del navegador no se puede verificar en jsdom.
- **No hay verificación en navegador real ni Playwright:** no se midieron 375/1440, claro/oscuro, zoom 200 %, el layout con el panel abierto, arrastre real, `capture` ni lector de pantalla. El `build` final se ejecutó antes del cierre con **5 rutas prerenderizadas**.

## Criterios de aceptación

| AC | Resultado | Nota |
| --- | --- | --- |
| AC-01: cada archivo tiene estado discriminado | Pasa | Unión `pending \| uploading \| done \| error \| cancelled` en `types.ts`, transiciones en `reducer.ts` y tests de reducer y de hook |
| AC-02: progreso por archivo y global | Pasa | `upload.onprogress` en el XHR, progreso por item en la fila y global ponderado por bytes en `summarizeUploadQueue` |
| AC-03: reintento individual | Pasa | Acción de reintento por archivo, «Descartar fallidas» para el lote y `clientUploadId` estable; test MSW 500 → reintento 201 → `done` |
| AC-04: cancelación | Pasa | `AbortController` por item, `cancel`/`cancelAll` y estado `cancelled`; cancelar no se anuncia como error |
| AC-05: un error no pierde los demás | Pasa | Los archivos inválidos entran en `error` sin frenar a los válidos; un fallo de red deja el item en `error` y la cola sigue |
| AC-06: drag & drop y selector | Pasa | Dropzone de ventana con cancelación del default y selector cámara/galería con `capture`; tests de drop y de selector. Arrastre real sin probar |
| AC-07: navegar no bloquea; recargar/cerrar con subidas activas avisa | Pasa | Navegar no bloquea ni muestra diálogo (`album-upload-exit.test.tsx` con router real y host global); `beforeunload` solo se registra con `pending + active > 0` (`upload-exit-guard.test.tsx`). El diálogo nativo del navegador no se prueba en jsdom. Salir de la zona privada, el logout o un `401` aborta la cola y **no** está cubierto |

## Revisión, auditorías y aceptación

- **Revisión independiente nivel B: aprobada**, incluida la revisión de cierre del delta, sin bloqueantes ni mayores.
- **Accesibilidad: aprobada** tras corregir la región viva dentro de `inert` y el foco; axe sin violaciones en la hoja móvil, el panel de escritorio y la barra, y también en las pruebas de barra y riesgo del delta.
- **Delta de UI global (2026-11-06):** aprobado; el foco tras cada acción vuelve al cuerpo del panel/hoja y el panel y la barra reservan espacio (2.4.11). Queda como pendiente la comprobación manual a 200 % y con el panel abierto.
- **Diseño: mayores resueltos** (reapertura en escritorio y copy veraz de la barra); quedan nits no bloqueantes.
- **G4 aceptada (2026-11-06):** el usuario revisó la feature y aprobó los cambios: «Todo bien, cambios aprobados.» **F26 queda en `done`.**

## Cierre operativo

- [PR #42](https://github.com/Luceir0/lab-final--memora/pull/42), commits `9362d42` (`feat(web): add upload queue with global cross-route card (F26)`) y `130be9d` (`docs: record F26 implementation and review`).
- Merge en `main`: `86692300887bdd8d712073ba745ea87bc2674787` (`Merge pull request #42 from Luceir0/feat/f26-upload-queue-web`).
- CI en la PR: run `42194933113`, `completed/success`. CI en `main` sobre el merge: run `42195282791`, `completed/success`.

## Corrección posterior (2026-11-07)

La barra «Subidas terminadas» se quedaba permanente. Ahora, cuando la cola queda inactiva
(sin `pending`/`uploading`) y **sin errores**, los items `done`/`cancelled` se limpian
solos a los **10 s**, se cierra el panel si estaba abierto y el foco vuelve a `#main-content`.
Si hay algún error, la barra permanece para reintentar o descartar. La barra añade una
**X** («Cerrar subidas terminadas») para limpiar los terminados al instante sin abrir el
panel. Verificación: `test upload-queue-host` **8**, `test upload-queue-bar` **7**,
`test uploads` **183**, suite web **105 archivos y 870 tests**, `typecheck` 9/9, `lint` 6/6
y `format:check` OK. Se añade `features/uploads/completed-dismiss.ts` con la constante.

## Pendiente

- **Verificación con lector de pantalla:** comprobar que el anunciador, portaleado fuera del diálogo, sigue anunciando con la hoja modal abierta.
- **Layout a 200 % de texto y con el panel abierto:** verificación manual en navegador real de la reserva de `main`, el `scroll-padding-bottom` y el foco no tapado por la barra ni por el panel.
- **`ProgressBar` determinado sin `motion-reduce` en `packages/ui`:** el componente no respeta la preferencia de movimiento reducido; se corrige en **F39**.
- **Posible pérdida de cola en logout o `401`:** esas navegaciones desmontan el provider y abortan las subidas; `beforeunload` no las cubre.
- **Reserva estática del panel:** la altura del panel se reserva con `--upload-queue-panel-height` y no se mide; con contenido largo o texto ampliado puede no coincidir con la altura real.
- **Posible salto de scroll al enfocar la cola tras una acción:** el foco al cuerpo del panel/hoja puede desplazar la vista; revisar en navegador real.
- **Sin navegador real ni Playwright:** falta barrido 375/1440, claro/oscuro, arrastre real, `capture`, aviso nativo de `beforeunload` y lector de pantalla. E2E queda para **F37/F38** y el lector de pantalla para **F39**.
- **Altura de la barra aproximada:** `5.5rem` está duplicado entre la variable CSS, el `scroll-padding-bottom` y las reglas de `main`; a 200 % podría solaparse. Recomendado medirla con `ResizeObserver`, como la barra inferior del shell.
- **Reconciliación al descartar un error de red:** si se perdió un 2xx, el álbum puede no reflejar la foto hasta el siguiente refetch; el reintento idempotente es el camino seguro.
- **Detección de CSRF por mensaje del 403**, no por un código propio de la API.
- **Invalidación del álbum por cada archivo completado:** revisar el coste en lotes grandes.
- **Sin test de `URL.revokeObjectURL`:** la revocación está implementada y cubierta por código, no por aserción.
- **Nits de diseño** abiertos y no bloqueantes, sin detalle individual en este documento.

## Riesgos y limitaciones

- **Contrato alineado (2026-11-06):** el reintento es **manual**, con el mismo `clientUploadId`, y no hay reintentos automáticos ni backoff. Se corrigió el contrato en [uploads.md](../../03-architecture/uploads.md), que todavía documentaba «2 con backoff».
- La cola sobrevive a la navegación interna pero **no a la recarga**; solo `beforeunload` avisa, y el navegador no permite personalizar el mensaje. No hay subidas en segundo plano (fuera de alcance).
- **Salir de la zona privada, el logout o un `401` desmontan el provider y abortan la cola.** `beforeunload` no cubre esa navegación SPA; es una limitación aceptada, no un bug pendiente.
- La validación de cliente es **orientativa**: la autoritativa es la de la API (magic bytes, píxeles, cuota).
- El límite de 20 archivos por lote es una decisión de producto, no del contrato de subida.
- El progreso global es ponderado por bytes, así que un archivo grande domina el porcentaje; es lo esperado, no un error.
- Sin rejilla con placeholders (F29), la foto aparece en el álbum al invalidar el detalle, no mientras sube.
- El panel es global y no filtra por ruta ni por álbum: muestra todo lo que haya en la cola. El álbum por archivo aparece solo si la cola mezcla más de un álbum.

### Desviaciones conscientes

- El hook vive en `apps/web/src/features/uploads/upload-queue-context.ts` en vez de `apps/web/src/hooks/useUploadQueue.ts` (co-locación y patrón del repo).
- Sin rejilla con placeholders de progreso: **F29**.
- Sin página global `/uploads` ni contador del sidebar: **F27**.
- Sin ETA («quedan unos 2 min»): no se promete una estimación que la red no sostiene.
- Velo de arrastre a pantalla completa en lugar del tratamiento del mockup.
- Copy «Se añadirán» frente a «Se añadirían» del PNG de diseño.

## Documentación actualizada

- [x] `docs/04-features/F26-upload-queue-web/spec.md` — decisiones base + delta de UI global, **AC-07 reescrito** y limitación de logout/`401`.
- [x] `docs/04-features/F26-upload-queue-web/tasks.md` — tareas y verificación reales del delta.
- [x] `docs/04-features/F26-upload-queue-web/handoff.md` — este documento.
- [x] `docs/04-features/README.md` — fila de F26 en `done`, situación **F01–F26 `done`** y F27 recomendada con alcance reducido.
- [x] `docs/04-features/F27-subidas-globales/spec.md` — dependencia de F26 `done` y alcance reducido a `/uploads`, recientes y contador.
- [x] `docs/05-quality/test-matrix.md` — sección F26 con 19/141, 82/649 y cierre.
- [x] `docs/06-process/ai-log.md` — entrada de la sesión del delta y entrada de cierre.
- [x] `docs/03-architecture/uploads.md` — aviso nativo y alcance de la supervivencia de la cola.
- [x] `docs/07-curriculum/coverage-map.md` — F26 en `done`, filas y cifras finales.
- [x] `docs/02-design/components.md` — nota de la cola alineada con el host global.
- [ ] `README.md` raíz — sin cambios: la estructura del repo no cambia.

## Siguiente paso propuesto

Abrir **F27 (Subidas globales)**: ruta `/uploads` real, subidas recientes y contador del sidebar, con el alcance ya reducido porque F26 dejó entregados el panel global, la cola transversal y la persistencia visual. F27 sigue en `draft`; antes de empezar hay que cumplir su Definition of Ready. Los pendientes visuales y de lector de pantalla de F26 pasan a **F37/F38/F39** y no bloquean el cierre.
