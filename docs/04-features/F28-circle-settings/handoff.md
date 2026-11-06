# Handoff — F28 Ajustes del círculo

## Resultado

UI completa de Ajustes del círculo contra la API existente: ruta SPA, chrome
compartido con Ajustes como enlace real, formulario del owner con guardado
explícito por lote, permisos con los cuatro flags, zona de peligro con
`ELIMINAR`, vista de solo lectura del member con nombre real del owner y salida
del círculo. Incluye avisos en Mis círculos y tests RTL/MSW con axe.

No se han tocado `apps/api/**` ni `packages/shared/**`. En `packages/ui` solo se
aplicó la corrección autorizada m-08/m4: «Cancelar» de `ConfirmDialog` queda
deshabilitado mientras `loading`.

## Cambios (archivos)

### Nuevos

- `apps/web/src/routes/_app.circles.$circleId.settings.tsx`: ruta SPA con
  `head` «Ajustes · Memora».
- `apps/web/src/features/circles/settings/circle-settings-page.tsx`: elige
  owner/member según `circle.role`.
- `apps/web/src/features/circles/settings/owner-settings.tsx`: formulario,
  permisos, barra de guardado por lote, zona de peligro y diálogo `ELIMINAR`.
- `apps/web/src/features/circles/settings/member-settings.tsx`: solo lectura,
  permisos efectivos, nombre del owner y salida con confirmación.
- `apps/web/src/features/circles/settings/settings-format.ts`: metadatos de los
  flags y resumen de cambios.
- `apps/web/src/features/circles/settings/use-upload-bar-visible.ts`: observa
  `data-upload-bar` para recolocar la barra de guardado (B2).
- `apps/web/src/features/circles/search-flags.ts`: `parseSearchFlag` compartido
  (n-03).
- `apps/web/src/routes/_app.circles.$circleId.settings.test.tsx` y
  `apps/web/src/features/circles/settings/settings-notices.test.tsx`: 36 tests
  RTL, MSW y axe.

### Modificados

- `apps/web/src/features/circles/paths.ts`: `circleSettingsPath`.
- `apps/web/src/features/circles/circle-section-nav.tsx`: Ajustes pasa a enlace
  real; `CircleSectionValue` incluye `'settings'`; se elimina el texto de
  «Disponible cuando lleguen…».
- `apps/web/src/features/circles/circle-sidebar-nav.tsx`: Ajustes en el subnav
  como enlace real con `aria-current` único; se elimina el ítem deshabilitado.
- `apps/web/src/features/circles/circle-detail-layout.tsx`: detecta `/settings`,
  no pinta héroe, miga «Ajustes», H1 «Ajustes de X» con `ref`/`tabIndex`,
  cabecera compacta y nav sticky en móvil, foco de sección al H1.
- `apps/web/src/features/circles/queries.ts`: `useUpdateCircleMutation`
  (`PATCH`, CSRF, merge de caché conservando `stats`, invalida lista) y
  `useDeleteCircleMutation` (`DELETE`, limpia `['circle', id]`, invalida lista).
- `apps/web/src/features/members/queries.ts`: `useLeaveCircleMutation`
  (`POST /leave`, CSRF, limpia detalle, invalida lista).
- `apps/web/src/features/circles/errors.ts`: contextos `update`/`delete`/`leave`,
  copias 403/404/429/red y `mapUpdateCircleError` con error de `settings`.
- `apps/web/src/routes/_app.circles.index.tsx`: `validateSearch` mínimo
  `deleted`/`left` y limpieza con `replace`.
- `apps/web/src/features/circles/circle-list-page.tsx`: toasts «Círculo
  eliminado» y «Has salido del círculo».
- `apps/web/src/features/circles/circle-sidebar-nav.test.tsx` y
  `apps/web/src/routes/_app.circles.$circleId.people.test.tsx`: actualizados a
  Ajustes como enlace real.
- `apps/web/src/features/uploads/upload-queue-bar.tsx` y su test: miden la
  altura real de la barra para B2.
- `apps/web/src/styles/app.css`: `--settings-save-bar-height`, posición de la
  barra con subidas/panel y `scroll-padding-bottom` combinado (B1/B2/M1).
- `apps/web/src/routes/_app.circles.$circleId.tsx` y
  `apps/web/src/routes/_app.circles.test.tsx`: `parseSearchFlag` compartido
  (n-03).
- `packages/ui/src/components/confirm-dialog.tsx` y
  `packages/ui/src/components/overlays.test.tsx`: Cancelar deshabilitado con
  `loading` (m-08/m4).
- `apps/web/src/test/circles-harness.tsx`: añadida la ruta de settings al router
  de test (infraestructura de tests, no producción).
- `apps/web/src/routeTree.gen.ts`: regenerado por el plugin de TanStack Start.

> Nota: `docs/04-features/F28-circle-settings/spec.md`, `tasks.md`,
> `docs/04-features/F29-gallery/spec.md` y `docs/04-features/README.md` ya
> tenían cambios en el árbol de trabajo antes de empezar (decisiones de G1 y
> anotación de F29). No los he editado en esta sesión.

## Verificación del cierre anterior (antes de la revisión)

> Los resultados vigentes tras aplicar las correcciones están en
> [«Correcciones de la revisión»](#correcciones-de-la-revisión-2026-11-06).

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **13 tests, 1 archivo: OK** |
| `pnpm --filter @memora/web test -- --maxWorkers=2` | **Falla por la forma del comando**: pnpm reenvía un `--` literal (`vitest run "--" "--maxWorkers=2"`), Vitest no aplica el límite de workers y 52 tests de 21 archivos agotan el timeout de 5 s. No es un fallo de la feature. |
| `pnpm --filter @memora/web test --maxWorkers=2` | **87 archivos / 699 tests: OK** en la tercera ejecución. Las dos primeras tuvieron un fallo intermitente en un archivo ajeno (`album-upload` y `upload-exit-guard`), que pasan en solitario. Una ejecución final posterior ejecutó 86/87 archivos y 695/699 tests sin fallos, pero Vitest no pudo arrancar un worker para `_app.provisional.test.tsx` (timeout de infraestructura); ese archivo pasa en solitario (5 tests). |
| `pnpm typecheck` | **9 tareas correctas** |
| `pnpm lint` | **6 tareas correctas** |
| `pnpm format:check` | **Todos los archivos formateados** |
| `pnpm build` | **5 tareas correctas**; incluye `routeTree.gen.ts` regenerado |
| `pnpm docs:check` | **OK** (191 archivos, 592 enlaces, 0 rotos) |

Evidencia adicional: `album-upload` y `upload-exit-guard` pasan en solitario
(`pnpm --filter @memora/web test album-upload` → 11 tests OK).

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01. Solo el owner edita y borra; el member accede en lectura. | **pasa** | Tests `owner ve el formulario…` y `member ve solo lectura…`; el member no tiene `Nombre` editable ni «Eliminar círculo…». |
| AC-02. Guardar settings afecta a permisos reales. | **pasa** | Test de lote: el `PATCH` envía `settings` completo con `membersCanDownload: false` y la caché `['circle', id]` conserva `stats`. |
| AC-03. Borrar exige escribir `ELIMINAR`. | **pasa** | Test de borrado: la CTA está deshabilitada hasta escribir la frase exacta. |
| AC-04. Confirmación responsive y no accidental. | **pasa** | `ConfirmDialog` (hoja/diálogo del kit) + frase obligatoria + foco inicial en Cancelar; test de foco devuelto al disparador. La presentación responsive no se mide en jsdom. |
| AC-05. El member ve estado, permisos efectivos y nombre del owner. | **pasa** | Test de member: «Solo las personas administradoras…», «Pídeselo a Sofía Martín», 3 «Permitido» y 1 «No permitido». |
| AC-06. Teclado y foco. | **pasa** | `fieldset`/`legend`, switches etiquetados, barra con `aria-live`, foco devuelto al cerrar el diálogo y foco de sección al H1; axe sin violaciones. |
| AC-07. Guardado explícito por lote y descarte. | **pasa** | Tests de resumen «2 cambios sin guardar…», `PATCH` único y «Descartar» restaurando valores. No hay autoguardado. |
| AC-08. El member puede salir; el owner no ve la acción. | **pasa** | Test de salida con confirmación, CSRF y navegación; el owner no tiene «Salir del círculo». |
| AC-09. Portada solo lectura, sin acción muerta. | **pasa** | Test que verifica ausencia de botón/enlace «Cambiar portada»; solo se pinta `CircleCover`. |
| AC-10. Ajustes como enlace real con `aria-current` único y foco en el título. | **pasa** | Test de pestaña (`href` y `aria-current="page"`), test del sidebar y test de foco de sección al H1. |

## Correcciones de la revisión (2026-11-06)

### B1 — Foco oculto bajo la barra de guardado

- `owner-settings.tsx` mide la altura real de la barra con `ResizeObserver`,
  publica `--settings-save-bar-height` en `document.documentElement` y marca
  `data-save-bar="visible"` mientras hay cambios. El espaciador usa esa altura
  medida (`calc(var(--settings-save-bar-height) + 0.5rem)`) y `app.css` suma la
  altura a `scroll-padding-bottom` en móvil y escritorio, combinándola con las
  reglas de `data-upload-bar` y `data-upload-panel`.
- Test: `reserva la altura real de la barra y la limpia al descartar (B1/M1)`
  con `ResizeObserver` stubbeado; comprueba `data-save-bar`, la variable, el
  espaciador y la limpieza al descartar.

### B2 — La barra/píldora de subidas tapa los botones

- `upload-queue-bar.tsx` mide su altura real con `ResizeObserver` y actualiza
  `--upload-queue-bar-height`, limpiándola al desmontar (sin cambiar su
  comportamiento visual ni sus textos).
- En móvil, la barra de guardado sube a
  `calc(var(--app-bottom-nav-height) + var(--upload-queue-bar-height) + 0.75rem)`
  cuando `html[data-upload-bar='visible']`.
- En escritorio se recorta por la derecha: `25rem` con la píldora y `28rem` con
  el panel (`26rem` + margen); el contenido pasa a columna para que los botones
  sigan siendo visibles y clicables a 1024 px.
- Tests: `desplaza la barra de guardado cuando la cola de subidas está visible
  (B2)` y `publica la altura real de la barra en el documento mientras hay
  items`.

### M-02 — El sidebar no movía el foco al H1

- `circle-sidebar-nav.tsx` pasa `state: sectionNavigationState` en los tres
  enlaces del subnav (Álbumes, Personas y Ajustes), igual que las pestañas.
- Test: `el enlace Ajustes del sidebar marca la navegación para mover el foco
  al h1 (M-02)`.

### M1 — Zoom al 200 %

- Se elimina el espaciador fijo (`h-28 lg:h-24`); espaciador y
  `scroll-padding-bottom` usan `--settings-save-bar-height`. Cubierto por el
  test de B1 con una altura de 505 px.

### M2 — Error de guardado fuera de pantalla en móvil

- El error del `PATCH` se pinta dentro de la barra fija, que siempre está
  visible, con `role="alert"` una sola vez; el detalle de `settings` queda junto
  a los permisos sin una segunda región viva.
- Test: `muestra el error de guardado dentro de la barra visible y lo anuncia
  una sola vez (M2)` + axe.

### Menores y nits aplicados

- **m-03:** la limpieza de `['circle', id]` ocurre después de
  `await router.navigate(...)` en borrado y salida; tests de no-refetch para
  ambos.
- **m-04:** nombre, descripción, switches y botón de borrado se deshabilitan
  mientras el `PATCH` está en vuelo; el formulario expone `aria-busy`. Test con
  `PATCH` diferido (`releasePatch`) que comprueba «Guardando…», campos
  deshabilitados y axe.
- **m-08 / m4:** «Cancelar» de `ConfirmDialog` queda `disabled={loading}`; test
  en `packages/ui/src/components/overlays.test.tsx`.
- **m1 (a11y):** el resumen de la barra usa `aria-live="polite"`; se elimina el
  `sr-only` duplicado de «Guardando cambios…».
- **m2 (a11y):** «Permisos de los miembros» es un `<h2>` visible y el
  `fieldset` usa un `<legend class="sr-only">`; test de heading.
- **m5 (a11y):** el contador `N/200` se enlaza con `aria-describedby` y
  `aria-live="polite"`; test de asociación.
- **n1:** «1 invitación pendiente **dejará** de funcionar»; también se corrige
  «Se borrará/borrarán» y se quita el posesivo «sus» de la zona de peligro.
  Test de singular.
- **n-02:** un único `ToastViewport` en `circle-list-page.tsx`; test de viewport
  compartido.
- **n-03:** `parseSearchFlag` compartido en
  `features/circles/search-flags.ts`; test de `validateSearch` de `/circles`.
- **m-01 / m-02 / m-09:** tests de toasts de borrado/salida y cierre
  (`settings-notices.test.tsx`), de 401/404/429/red en guardar, borrar y salir,
  de carga y «Guardando…», y axe de ambos diálogos, del error de guardado y del
  estado de guardado.

### Verificación de las correcciones

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **2 archivos / 36 tests: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos / 724 tests: OK** |
| `pnpm --filter @memora/ui test` | **14 archivos / 282 tests: OK** |
| `pnpm --filter @memora/ui typecheck` | **OK** |
| `pnpm --filter @memora/ui lint` | **OK** |
| `pnpm typecheck` | **9/9 tareas OK** |
| `pnpm lint` | **6/6 tareas OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 tareas OK** |

## Segunda ronda (2026-11-06)

| ID | Cambio |
| --- | --- |
| **B1-r** | La barra de guardado ya no crece con 2+ cambios: resumen `max-sm:sr-only` (visible desde `sm` con `line-clamp-2`) y `sr-only` en todos los tamaños con la cola visible; botones siempre en `flex-row` (`flex-1` en móvil, auto desde `sm`); error compacto `<p role="alert">` de 2 líneas en vez de `InlineAlert`; altura medida intacta. |
| **D1** | Portada de solo lectura: `w-24 aspect-[3/2]` en móvil y `md:w-full md:aspect-[12/5] md:max-h-56` desde tablet/escritorio. Sin «Cambiar portada». |
| **D2** | Iconos decorativos por permiso en el owner (`FolderPlus`, `Upload`, `Tag`, `Download`) en tarjeta `size-8 lg:size-10` con `bg-surface-2 text-muted`; `Switch` en fila `flex items-center gap-3` + `min-w-0 flex-1`. Mapa compartido en `settings-icons.ts`. |
| **D3** | La barra móvil queda compacta: resumen oculto y botones en fila (B1-r). |
| **D4** | «Permisos de los miembros», «Lo que puedes hacer aquí» y el título principal de member pasan a `text-h3 lg:text-h2`; «General» sigue en `text-h2`. |
| **D5** | Tarjeta de member con `padding="md"` + `lg:p-6`, estado con `gap-1` y etiqueta `min-w-0`; «Descargar originales» no se trunca. |
| **D7** | Con la cola visible el resumen es `sr-only` en todos los tamaños y los botones siguen en fila; a 1024 la barra recortada mantiene ambos botones visibles. |
| **D8** | El error compacto reduce la altura de la barra con error, mantiene un único `role="alert"` y el texto completo en el DOM. |
| **NT-1** | `legend` `sr-only` con «Permisos»; el `h2` visible sigue siendo «Permisos de los miembros». |

Test nuevo: `mantiene el resumen sr-only en móvil y los botones en fila
(B1-r/D3/D7)` comprueba `max-sm:sr-only`, `line-clamp-2`, el contenedor
`flex-row`, `flex-1` en ambos botones y el paso a `sr-only` con
`data-upload-bar='visible'`.

### Verificación de la segunda ronda

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm typecheck` | **9/9 tareas OK** |
| `pnpm lint` | **6/6 tareas OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 tareas OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

## Tercera ronda (2026-11-06)

| ID | Cambio |
| --- | --- |
| **1.4.4** | Barra `flex flex-wrap items-center gap-3`; resumen `min-w-0 flex-1 truncate` + `max-sm:sr-only` (y `sr-only` con la cola visible); botones en `flex flex-wrap gap-2 sm:ml-auto` con `min-w-[9rem] flex-1 sm:flex-none`. A 375/360 @200 % los botones bajan a dos filas sin recortar el texto; a 768/1440 el resumen trunca y los botones conservan su ancho. |
| **N-D** | Error compacto a `line-clamp-3` con `title` completo; sigue siendo el único `role="alert"` y la altura medida se recalcula. |
| **N-A** | «General» `sr-only lg:not-sr-only`; portada en fila etiqueta+miniatura en móvil y etiqueta encima desde `lg`; `TextArea rows={3}`; tarjeta General `padding="md"` + `lg:p-6` y `gap-4 lg:gap-5`. Se mantienen las descripciones de permisos por decisión de producto. |
| **N-B** | Tarjeta del icono de permisos con `border border-border` y `rounded-lg`; el `Switch` no cambia. |

Test nuevo: `mantiene el resumen sr-only en móvil y los botones en fila
(1.4.4/B1-r/D3/D7)` comprueba `min-w-0`, `flex-1`, `truncate`,
`max-sm:sr-only`, `flex-wrap` en el contenedor y en las acciones, y
`min-w-[9rem]` en ambos botones; con `data-upload-bar='visible'` el resumen pasa
a `sr-only`.

### Decisiones registradas

- **N-A:** se mantienen las descripciones de permisos visibles en móvil.
- **N-C:** el resumen sigue oculto con la cola de subidas visible para no repetir
  el problema de anchura; queda como nit.
- **N-E, N-F, D6, D9, N3/N4, MN-1 y NT-2:** documentados y fuera de esta ronda.

### Verificación de la tercera ronda

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm typecheck` | **9/9 tareas OK** |
| `pnpm lint` | **6/6 tareas OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 tareas OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

## Cuarta ronda (2026-11-06)

| ID | Cambio |
| --- | --- |
| **B1-r** | Botones sin `min-w-[9rem]`: `min-w-0 flex-1 h-auto! min-h-11 whitespace-normal px-3 py-2`; contenedor `flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto`. A 200 % el texto puede partir en dos líneas, pero los botones no se apilan ni se recortan y la barra baja a ~120 px. La nav de secciones deja de ser sticky en móvil con `html[data-save-bar='visible']` mediante `data-circle-section-nav` y una regla CSS; no se oculta. |
| **1.4.4** | `Switch` con `min-w-0` en el bloque de texto y `break-words` en etiqueta/descripción; el track sigue `shrink-0`. La tarjeta de permisos no expande el documento a 200 %. Test de clases en `selection.test.tsx`. |
| **N-D** | El aviso completo vuelve al principio del formulario como bloque `role="alert"`, `tabIndex={-1}`, `ref` y `title`; al fallar el `PATCH` se enfoca y se centra. La barra solo muestra «No se pudo guardar. Revisa el aviso.» en una línea `truncate`, sin `role="alert"`. |
| **N-A** | Portada `flex items-center gap-3 md:block` (etiqueta encima desde 768) y CTA en una línea a 100 % en 375/390. |
| **N-B** | Tarjeta del icono con `rounded-sm` además de `border border-border`. |

Test actualizado: la barra comprueba `min-w-0`, `flex-1`, `h-auto!`,
`whitespace-normal`, `flex-wrap` y `w-full`; el error comprueba foco en el aviso
superior, `title` completo, barra compacta y ausencia del texto completo
duplicado.

### Decisiones registradas

- **N-1 (orden Portada):** no se cambia.
- **N-C:** el resumen sigue oculto con la cola visible.
- **N-E, N-F, D6, D9, N3/N4, MN-1 y NT-2:** documentados y fuera de esta ronda.

### Verificación de la cuarta ronda

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm --filter @memora/ui test` | **283 tests, 14 archivos: OK** |
| `pnpm typecheck` | **9/9 tareas OK** |
| `pnpm lint` | **6/6 tareas OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 tareas OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

## Aceptación (G4, 2026-11-06)

El usuario aceptó F28 tras la cuarta ronda, **sin relanzar auditorías completas**.
Decisión explícita: el 200 % de zoom no tiene que quedar perfecto. La validación
de cierre es la tabla de arriba más los 725 tests de web y los 283 de `@memora/ui`,
todos ejecutados el 2026-11-06.

## Pendiente

- **Cierre operativo (G5):** **cerrado** con la rama `feat/F28-circle-settings`, el commit `e99a4b1`, la [PR #46](https://github.com/Luceir0/lab-final--memora/pull/46) (CI run `42289840796`, `success`) y el merge `e6d2a3c5b1df0fb58b45937f3b817d121d9be50d` en `main`.
- `[Menor]` El comando literal `pnpm --filter @memora/web test -- --maxWorkers=2`
  no aplica el límite de workers por cómo pnpm reenvía `--`; usar
  `pnpm --filter @memora/web test --maxWorkers=2`.
- `[Nit]` El test harness se amplió con la ruta de settings; es infraestructura
  de test, no código de producción.
- `[Menor]` El nombre del owner se busca solo en las páginas de miembros ya
  cargadas (24 por página); si el owner no está en ellas, se usa la copy
  genérica, tal como permite la spec.
- `[Menor]` `m3` (orden visual del pie en `overlay-parts`) y `m-06`/nits de copy
  dependientes de diseño siguen sin aplicar: son de `packages/ui` compartido y
  quedan para una revisión propia.
- **Diferido a F37/F38/F39:** barrido de navegador 320/375/768/1024/1440 en
  claro y oscuro, lector de pantalla y el 200 % de zoom fino. El usuario aceptó
  el 2026-11-06 que el 200 % no quede pixel-perfect.

## Riesgos y limitaciones

- La barra de guardado móvil usa `--settings-save-bar-bottom` y, con la cola de
  subidas visible, `--settings-save-bar-bottom-with-upload`, que suma la altura
  medida de la barra de subidas. La safe area sigue incluida en
  `--app-bottom-nav-height`.
- La verificación responsive/visual y de contraste real queda para la
  reauditoría de accesibilidad y `design-auditor`.
- El borrado y la salida navegan antes de limpiar `['circle', id]`; los tests
  cubren que el layout no vuelve a pedir el detalle.
- No hay cambios de contrato ni de API; todo se apoya en `PATCH`/`DELETE`
  `/circles/:circleId` y `POST /circles/:circleId/leave` ya existentes.

## Documentación actualizada

- `docs/04-features/F28-circle-settings/handoff.md` (este archivo).
- `docs/04-features/F28-circle-settings/review.md`: se añadieron al final las
  secciones «Segunda ronda de correcciones», «Tercera ronda (2026-11-06)»,
  «Cuarta ronda (2026-11-06)» y «Cierre (2026-11-06)».
- `docs/04-features/README.md`: F28 pasa a `done` en el tablero.
- `docs/06-process/ai-log.md`: entrada de aceptación, cierre y lección de proceso.
- `docs/07-curriculum/coverage-map.md`: sección de F28.

## Siguiente paso propuesto

1. F28 queda `done`. La siguiente del tablero es **F29 (Galería)**, que no se
   inicia sin permiso del usuario.
