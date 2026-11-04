# Handoff — F18 Circles web

- **Estado:** `accepted` (aceptada por el usuario el 2026-11-04; `done` pendiente de commit, PR, merge y CI)
- **Rama:** `feat/F18-circles-web`
- **Fecha:** 2026-11-04
- **Implementado por:** `api-dev` (contrato/API) + `ui-dev` (web y tests)
- **Revisado por:** `reviewer` independiente (nivel B), dos pasadas; `design-auditor`. Corrección del 2026-11-04: revisión B + auditoría de diseño → **apto con correcciones, sin bloqueantes**; ajustes aplicados y fix del `fieldset` verificado como correcto; cierre con `max-w-md`.
- **Aceptado por:** el usuario, 2026-11-04 («todo aprobado»), tras la revisión visual y de teclado.

## Resultado

Mis círculos, alta y detalle funcionan contra la API real con sesión, CSRF y persistencia. La lista muestra el destacado, la rejilla/lista responsive, los estados vacío/carga/error/refetch y el N+1 de stats con caché compartida con el detalle. El alta vive en `/circles/new` con `ResponsiveDialog`, valida con los schemas compartidos, envía los cuatro permisos iniciales y, al guardar, abre el círculo nuevo con un toast de confirmación y el foco en el título. El detalle tiene portada con reserva, stats, pestañas (Álbumes activo; Personas y Ajustes explicadas y deshabilitadas), cabecera compacta móvil y un estado «sin acceso» que no filtra datos. El guard de sesión protege `/circles*`, `/uploads` y `/profile`; `/help` y `/privacy` siguen públicas. El sidebar muestra los círculos, la persona de `/me` y el subnav del círculo activo. **Corrección 2026-11-04:** el alta ya no muestra portada ni placeholder (la portada se edita en F28 y `POST /circles` no acepta `coverPhotoId`); nombre y descripción siguen en una columna, los permisos pasan a 2+2 con separador vertical desde `lg` y el atajo `Esc` se alinea abajo a la izquierda del pie. **El usuario aceptó la feature el 2026-11-04** tras la revisión visual y de teclado que estaba pendiente; el merge y el CI todavía no se han ejecutado.

## Cambios (archivos)

### Contrato y API

- `packages/shared/src/schemas/circles.ts`: `createCircleRequestSchema` acepta `settings` opcional; si viene, es el objeto completo.
- `packages/shared/src/schemas/contracts.test.ts`: 5 casos nuevos de creación con/sin settings, flag desconocida, tipo incorrecto y objeto incompleto.
- `apps/api/src/modules/circles/routes.ts`: `POST /circles` pasa `settings`.
- `apps/api/src/modules/circles/service.ts`: `NewCircleInput.settings?` y `input.settings ?? DEFAULT_CIRCLE_SETTINGS`.
- `apps/api/src/test/circles.test.ts`: 3 casos nuevos (defaults, settings propios, inválidos sin escribir).
- `docs/03-architecture/api-contract.md`: semántica de `settings` en creación.

### Web

- `apps/web/src/routes/_app.tsx`: guard de sesión en cliente, estados de sesión y datos del shell.
- `apps/web/src/routes/_app.circles.tsx`, `_app.circles.index.tsx`, `_app.circles.new.tsx`, `_app.circles.$circleId.tsx`: layout y rutas SPA (`ssr: false`), code-splitting por ruta.
- `apps/web/src/components/layout/app-shell.tsx`: prop `hideTopBar` para el detalle inmersivo.
- `apps/web/src/features/circles/**`: cliente de datos y queries (`['circles','list']`, `['circle', id]`, `['me']`, `['csrf']`), N+1 con `useQueries`, CSRF, logout, errores, formato, coberturas, lista, destacado, tarjetas, sidebar/subnav, alta, detalle, pestañas, cabecera compacta, skeletons y estados.
- `apps/web/src/test/circles-fixtures.ts`, `circles-harness.tsx`: fixtures y router de test.
- Tests de `apps/web/src/features/circles/**` y `apps/web/src/routes/_app.guard.test.tsx`, `_app.circles*.test.tsx`.

### Corrección del alta (2026-11-04)

- `apps/web/src/features/circles/create-circle-dialog.tsx`: se elimina el bloque de portada (etiqueta, `CircleCover`, contenedor discontinuo y texto de imagen genérica), se quitan `lg:grid-cols-2` de los campos y se limpian `CircleCover`/`nameValue`; nombre y descripción quedan en una columna y el diálogo sigue en `size="lg"`.
- `apps/web/src/features/circles/create-circle-dialog.test.tsx`: test de regresión que comprueba que el alta no muestra «Portada», ni el texto de imagen genérica, ni botones de foto/cambiar, ni `input[type="file"]`; axe sin violaciones.

### Revisión y auditoría de diseño (2026-11-04)

- **Resultado de la ronda:** revisión independiente (nivel B) y auditoría de diseño → **apto con correcciones, sin bloqueantes**.
- `create-circle-dialog.tsx`: la divisoria del `fieldset` pasa a un `div` contenedor (`border-t border-border pt-5`) para que la línea se pinte a todo el ancho por encima del título; el `fieldset` conserva su semántica y queda sin borde.
- `create-circle-dialog.tsx`: la lista de permisos se limita con `max-w-md` en una sola columna por debajo de `lg` para acercar etiqueta e interruptor (recomendación cerrada de la auditoría de diseño).
- `create-circle-dialog.test.tsx`: el test de regresión se endurece con `dialog.querySelector('img')` nulo y `queryByText(/portada/i)` nulo; el layout se cubre con un test específico.
- `spec.md`: la decisión aclara que se anula el bloque de portada de las capturas de alta («Elegir una foto» en móvil, «Cambiar» en escritorio).

### Ajuste de layout del alta (2026-11-04, tras la auditoría)

- `create-circle-dialog.tsx`: los cuatro permisos mantienen una columna con `max-w-md` centrada con `mx-auto` por debajo de `lg` y, desde `lg`, pasan a una rejilla 2+2 (`lg:grid-cols-2 lg:max-w-none`) con dos columnas directas y separador vertical `lg:border-l lg:border-border` en la segunda. Orden DOM intacto: Crear álbumes, Subir fotos, Descargar fotos, Etiquetar personas.
- `create-circle-dialog.tsx`: el atajo `Esc` añade `md:self-end` y conserva `md:mr-auto`, para quedar abajo a la izquierda del pie sin hueco inferior. No se toca `overlayFooterClasses` ni `packages/ui`.
- `create-circle-dialog.tsx`: separación entre el párrafo de permisos y el bloque de switches `mt-2` → `mt-4` (16 px, +8 px). Sin cambios de layout adicionales.
- `create-circle-dialog.test.tsx`: nuevo test de layout: una sola rejilla `lg:grid-cols-2`, cuatro `switch` dentro, dos columnas directas con 2 cada una, `lg:border-l` en la segunda y `mx-auto`/`max-w-md`/`lg:max-w-none` en el contenedor; axe sin violaciones.
- `spec.md` / `AC-01`: recogen la columna de campos, los permisos 2+2 desde `lg`, la columna centrada por debajo de `lg` y el atajo alineado abajo.

### Documentación

- `docs/04-features/F18-circles-web/spec.md` (decisiones, alcance, DoR, verificación y estado `accepted`).
- `docs/04-features/F18-circles-web/tasks.md` (aceptación, verificación completa y cierre pendiente de commit/PR).
- `docs/04-features/README.md` (F18 en `accepted`).
- Este `handoff.md`.
- `docs/06-process/ai-log.md` (entrada del 2026-11-04).
- `docs/07-curriculum/coverage-map.md`.
- `README.md` raíz (estado y tablero).

## Verificación (comandos y resultado real)

Verificación consolidada del **2026-11-04** (orquestador), con todos los paquetes:

| Comprobación | Resultado |
| --- | --- |
| `DATABASE_URL=…/memora_test pnpm test` | **8 tareas OK**: `shared` **143**, `ui` **270**, `api-client` **39**, `web` **276** en 43 archivos (circles: **64** en 10 archivos) y API **158** en 10 archivos (circles: **31**) |
| `pnpm --filter @memora/web test circles` | **10 archivos, 64 tests**, 0 fallos |
| `pnpm --filter @memora/web test` | **43 archivos, 276 tests**, 0 fallos (una ejecución anterior había registrado 275; el run final consolidado da 276) |
| `pnpm --filter @memora/shared test` | **5 archivos, 143 tests** |
| `pnpm --filter @memora/api test` (con `memora_test`) | **10 archivos, 158 tests**, 0 fallos; **31** de circles |
| `pnpm typecheck` | OK |
| `pnpm lint` | OK |
| `pnpm format:check` | OK |
| `pnpm docs:check` | OK (191 archivos, **470** enlaces tras esta pasada documental; 463 en la verificación previa, 0 rotos) |
| `pnpm agents:check` | OK (43 specs, 43 filas) |
| `pnpm build` | OK; chunks propios de lista, alta y detalle; **5 rutas prerenderizadas** |
| Test de regresión del alta | «no muestra portada ni ninguna acción de foto»: pasa; axe sin violaciones |
| Test de layout de permisos | 2+2 desde `lg`, dos columnas directas y `lg:border-l`: pasa; axe sin violaciones |
| axe | Cobertura jsdom con `expectNoAxeViolations` |
| 375/1440 y claro/oscuro | **Aceptado por el usuario el 2026-11-04** |
| Teclado | **Aceptado por el usuario el 2026-11-04** |

## Criterios de aceptación

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 | **Aceptado** | Lista y detalle: móvil una columna y escritorio rejilla. Alta: campos en una columna; permisos en una columna hasta `lg` y 2+2 con separador desde `lg`. Revisión visual 375/1440 aceptada por el usuario el 2026-11-04. |
| AC-02 | Pasa | Vacío con «Crear mi primer círculo» y test. |
| AC-03 | Pasa | RHF + `createCircleRequestSchema`, 200 en descripción, CSRF, cuatro permisos, 400/401/500, toast y foco. |
| AC-04 | Pasa | Detalle con nombre, descripción, miembros, álbumes, fotos y última subida; `membersCount` porque la lista de miembros es F21. |
| AC-05 | Pasa | `IntersectionObserver`, cabecera de 64 px, safe areas, orden DOM y un solo `<h1>`; revisión visual aceptada el 2026-11-04. |
| AC-06 | Pasa | 404 sin nombre/descripción/stats cacheados; email de `/me`; logout con CSRF. |
| AC-07 | **Aceptado** | Foco, `Esc`, trampa del diálogo, pestañas y enlaces testeados; revisión manual con teclado aceptada por el usuario el 2026-11-04. |

## Pendiente

- **Aceptación del usuario:** cumplida el 2026-11-04 («todo aprobado»). Cubre la revisión visual 375/1440 en claro y oscuro y la revisión de teclado.
- **Cierre operativo:** commit, PR, merge y CI **sin ejecutar**. El estado pasa a `done` en una segunda pasada tras el merge y el CI en verde. No se inventan PR, merge ni run.
- `[Menor]` M-03: la portada editable se delega a F28, pero la spec de F28 no la menciona. **No tocar F28 sin permiso**; queda constancia para la revisión de esa feature.
- `[Nit]` CTA por debajo del pliegue en ventanas de poca altura (1440×800) por la columna única; pendiente de decisión de kit (pie sticky) o de aceptación.
- `[Menor]` N-04: la salida del toast no está animada.
- `[Menor]` N-05: recargar `/circles/:id?created=true` reproduce el toast de éxito.
- `[Nit]` El código de error usa `HTTP-500`/`NET` en vez del `NET-503` del mockup (taxonomía distinta, sin pérdida de información).
- `[Nit]` La hoja móvil del alta llega al 90 % del viewport, no a pantalla completa (límite del `BottomSheet` del kit).
- `[Nit]` El subnav deshabilitado usa `role="link"` + `tabIndex=0` para que la explicación sea legible con teclado.
- `[Nit]` El `InlineAlert` «Revisa el formulario» del alta es una mejora de a11y que no aparece en el diseño.
- `[Nit]` La píldora del contador de `Tabs` inactiva es comportamiento del kit.

## Riesgos y limitaciones

- **N+1:** una página de 24 círculos lanza hasta 24 peticiones de detalle. Es la decisión cerrada; comparten caché con el detalle. Si molesta, se añaden stats a `GET /circles` en una feature de API/rendimiento.
- **Portadas:** `coverPhoto.thumbUrl` apunta a un endpoint que llega en F29; hasta entonces se usa el degradado con iniciales. El velo de portada usa `viewer-bg` para no depender de la foto.
- **Miembros y actividad:** no hay endpoint de miembros (F21) ni de actividad (F35). Se muestra `membersCount` y no se pinta el panel «Actividad reciente» ni el badge semanal.
- **Portada editable:** el alta no muestra portada ni placeholder porque `POST /circles` no acepta `coverPhotoId`; se elige/edita en F28.
- **Caché y permisos:** si se revoca el acceso, el detalle puede mostrar datos cacheados hasta 30 s; en cuanto llega el 404 no se pinta ningún dato.
- **Sidebar:** solo resuelve el círculo activo si sus páginas ya están cargadas en la caché del listado.
- **Navegador real:** contraste, CLS, safe areas iOS, entrada/salida de overlays y axe de navegador se revisaron visualmente en la aceptación del 2026-11-04; no hay medición automatizada en el repositorio (F37/F38).
- **Divisoria del `fieldset`:** corregida con el borde en un `div` contenedor y **verificada como correcta por la auditoría de diseño**; vista en la aceptación del 2026-11-04.
- **Separador 2+2, centrado y `Esc`:** `lg:border-l`, `mx-auto` y `md:self-end` están cubiertos por el test de estructura y las clases, y vistos en la aceptación del 2026-11-04; la medición automática del alto exacto del separador queda para F37.
- **Test concurrente:** ejecutar dos suites de Vitest a la vez en el mismo workspace produjo un fallo transitorio en `_app.circles.$circleId.test.tsx` (estado de carga sin resolver por contención); en ejecuciones seriales pasa. No es un fallo del alta.
- **Discrepancia de conteo:** el handoff anterior registraba **275** tests de web y **155** de API; el run consolidado del 2026-11-04 da **276** y **158** (los 3 nuevos tests de creación con `settings` explican la subida de API). Se usa el run final; no se ha rastreado el test adicional de web que separa 275 de 276.

## Documentación actualizada

- [x] `docs/04-features/F18-circles-web/spec.md`
- [x] `docs/04-features/F18-circles-web/tasks.md`
- [x] `docs/04-features/F18-circles-web/handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/03-architecture/api-contract.md`
- [x] `docs/06-process/ai-log.md` (entrada del 2026-11-04)
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `README.md` raíz: estado del proyecto y tablero alineados con `accepted`.

## Siguiente paso propuesto

1. Proponer el commit de la rama `feat/F18-circles-web` (sin ejecutarlo todavía): implementación, correcciones del alta y documentación.
2. Abrir la PR, esperar el CI en verde y hacer el merge a `main`.
3. Segunda pasada documental tras el merge: registrar commit, PR, merge y run reales, y pasar F18 de `accepted` a `done` en la spec, `tasks.md`, este handoff, el tablero, la bitácora y el README.
