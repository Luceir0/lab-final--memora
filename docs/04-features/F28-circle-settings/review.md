# Revisión y auditorías — F28 Ajustes del círculo

> **Estado:** `review` · **Fecha:** 2026-11-06 · **Nivel:** A
> **Implementación:** completa y verificada. **Correcciones:** aplicadas el 2026-11-06; pendiente la segunda auditoría de accesibilidad, la auditoría de diseño y la aceptación.
> Este archivo consolida los informes de `reviewer`, `a11y-auditor` y `design-auditor` para poder retomar sin la conversación.

## Veredictos

| Auditoría | Veredicto | Resumen |
| --- | --- | --- |
| `reviewer` (nivel A) | **Apto con correcciones** | Sin bloqueantes. 2 mayores, 9 menores y 12 nits. |
| `a11y-auditor` (navegador real + axe 4.14) | **No apto** | 2 bloqueantes de solape/foco (WCAG 2.2 AA 2.4.11), 2 mayores, 5 menores y 4 nits. Axe da 0 violaciones: los fallos son de apilado y `scroll-padding`, no de marcado. |
| `design-auditor` | **Pendiente** | La sesión terminó sin devolver informe. Hay que relanzarla cuando se retome. |

## Bloqueantes (a11y)

### B1 — El foco de teclado queda oculto bajo la barra de guardado

- **Dónde:** `apps/web/src/features/circles/settings/owner-settings.tsx:386` (barra `fixed`) y `apps/web/src/styles/app.css:64,70` (`scroll-padding-bottom`).
- **Evidencia:** a 375, 1024 y 1440 px, con 1 cambio pendiente, «Eliminar círculo…» enfocado queda 100 % tapado por la barra. A 768 px se salva solo por la altura del contenido.
- **Impacto:** WCAG 2.2 **2.4.11 Focus Not Obscured (Minimum)** (AA).
- **Corrección:** medir la altura real de la barra (`ResizeObserver`) y sumarla a `scroll-padding-bottom` mientras esté visible; o `scrollIntoView({ block: 'center' })` al enfocar.

### B2 — La barra de subidas de F26 tapa «Descartar» y «Guardar cambios»

- **Dónde:** `owner-settings.tsx:386` frente a `apps/web/src/features/uploads/upload-queue-bar.tsx:75-81`.
- **Evidencia:** hit-test real. A 375 px la barra de subidas (574–636) tapa los dos botones (540–584 y 592–636). A 1440 px la píldora (desde x=1049) tapa «Guardar cambios» (1245–1393). El hit-test devuelve la barra de subidas, no el botón.
- **Impacto:** el botón primario puede quedar inaccesible con la cola de F26 activa.
- **Corrección:** cuando `html[data-upload-bar='visible']`, desplazar la barra de guardado por encima de la barra/píldora (o a la izquierda en escritorio). Añadir test de navegador con cola activa.

## Mayores

### M-01 (reviewer) — La barra de guardado compite con la cola de subidas

Es el mismo problema que **B2**; se corrige una vez. El reviewer lo detectó por análisis estático y la auditoría de accesibilidad lo confirmó con hit-test.

### M-02 (reviewer) — El enlace «Ajustes» del sidebar no mueve el foco al H1

- **Dónde:** `apps/web/src/features/circles/circle-sidebar-nav.tsx:91-93`.
- **Qué falla:** el sidebar navega sin `state: sectionNavigationState`; `useSectionFocusRequest` no dispara. La pestaña sí lo hace.
- **Corrección:** pasar la marca también en el subnav (los tres enlaces), o documentar la excepción y ajustar AC-10.

### M1 (a11y) — A 200 % de zoom de texto la barra tapa el último control

- **Dónde:** `owner-settings.tsx:385` (espaciador fijo `h-28 lg:h-24`).
- **Evidencia:** a 375 px y 200 %, la barra mide 505 px y el espaciador 224 px; «Eliminar círculo…» queda 152 px tapado.
- **Corrección:** reservar la altura medida de la barra, no un valor fijo. Se arregla junto con B1.

### M2 (a11y) — El error de guardado se pinta fuera de pantalla en móvil

- **Dónde:** `owner-settings.tsx:255-257`.
- **Evidencia:** con `scrollY = 1148`, el `InlineAlert` queda en `top = -989`. `role="alert"` lo anuncia, pero visualmente no se ve.
- **Corrección:** mostrar el error también en la barra fija o hacer `scrollIntoView` + `focus()` al fallar.

## Menores

- **m-01 (reviewer):** faltan tests del toast de borrado/salida y de la limpieza de `?deleted`/`?left`.
- **m-02 (reviewer):** faltan tests de 401, 404, 429, error de red, estado «Guardando…» y carga.
- **m-03 (reviewer):** `removeQueries` antes de navegar puede recrear la query y lanzar un `GET` que devolverá `404`. Navegar primero y limpiar después, o cancelar.
- **m-04 (reviewer):** los campos siguen editables durante el `PATCH`; al resolver se hace `setDraft(nextBaseline)` y se pierden cambios hechos mientras se guardaba. Deshabilitar el formulario o fusionar solo campos no tocados.
- **m-05 (reviewer):** `tasks.md` sin marcar y estado `in-progress`; ya corregido en este cierre (F28 pasa a `review`).
- **m-06 (reviewer):** el owner solo se busca en la primera página de miembros (24). Aceptado como limitación si no se añade endpoint.
- **m-07 (reviewer):** el error de guardado aparece lejos de la barra fija. Mismo problema que **M2 (a11y)**.
- **m-08 (reviewer) / m4 (a11y):** «Cancelar» sigue habilitado pero inerte durante `loading` en `ConfirmDialog` (`packages/ui/src/components/confirm-dialog.tsx:80-87`). Deshabilitarlo con `loading`.
- **m-09 (reviewer):** axe solo cubre owner y member base; faltan los diálogos, el error y «Guardando…».
- **m1 (a11y):** la aparición de la barra y el resumen «N cambios sin guardar» no se anuncian. Añadir `aria-live="polite"` al resumen.
- **m2 (a11y):** `<legend>` de permisos no se expone como `heading`; envolver el texto en `<h2>` dentro del `legend`.
- **m3 (a11y):** el orden visual del pie del sheet está invertido respecto al foco (preexistente en `overlay-parts.tsx`, compartido por todos los `ConfirmDialog`).
- **m5 (a11y):** el contador `46/200` es `aria-hidden` y no está asociado al textarea. Añadir `aria-describedby` y `aria-live`.

## Nits

- `lostAccessCopy(0)` inalcanzable; la copy de 1 persona incluye al owner.
- Dos `ToastViewport` si coinciden `deleted` y `left`; unificar.
- `parseFlag` duplicado entre `_app.circles.index.tsx` y `_app.circles.$circleId.tsx`.
- «Permisos de los miembros» vs «Qué pueden hacer los miembros» del PNG móvil; validar con diseño.
- «Eliminar para siempre» vs «Eliminar el círculo para siempre» del PNG móvil.
- El subnav activo va en negrita sin píldora; el PNG muestra píldora. Validar con diseño.
- El contador `0/200` no aparece en los PNG.
- El `aria-live` solo anuncia «Guardando cambios…».
- Parpadeo de la copy genérica mientras carga la lista de miembros.
- No hay guarda de cambios sin guardar al navegar fuera de Ajustes (no lo exige la spec).
- `CIRCLE_DESCRIPTION_MAX_LENGTH` se importa de `create-circle-dialog`; mover a constantes compartidas.
- El comando de la spec con `-- --maxWorkers=2` no aplica el límite; usar `pnpm --filter @memora/web test --maxWorkers=2`.
- **n1 (a11y):** «1 invitación pendiente **dejarán** de funcionar» → «dejará».
- **n2 (a11y):** etiqueta visible de descripción duplicada con la `sr-only`.
- **n3 (a11y):** pestañas de 42 px (cumple AA 24 px, no AAA 44 px).
- **n4 (a11y):** `aria-current="page"` aparece una vez por navegación (4 en total); el AC-10 debería precisar «único por navegación».

## Correcciones aplicadas (2026-11-06)

| ID | Estado | Evidencia |
| --- | --- | --- |
| **B1** | Corregido | `OwnerSettings` mide la barra con `ResizeObserver`, publica `--settings-save-bar-height` y marca `html[data-save-bar='visible']`; `app.css` reserva esa altura en `scroll-padding-bottom` y el espaciador usa la misma variable. Se limpia al desmontar o al quedarse sin cambios. Test: altura de 505 px publicada y retirada al descartar. |
| **B2** | Corregido | `useUploadBarVisible` observa `html[data-upload-bar]`; con la cola visible la barra sube sobre ella en móvil y se recorta por la derecha en escritorio (`--settings-save-bar-right`), apilando sus acciones. Test: cambia `bottom` al marcar `data-upload-bar='visible'`. |
| **M-02** | Corregido | El subnav del sidebar navega con `state: sectionNavigationState`; test de regresión que comprueba la marca de historial (el consumidor ya tenía test de foco). |
| **M1** | Corregido | El espaciador usa la altura medida (`calc(var(--settings-save-bar-height) + 0.5rem)`), no `h-28 lg:h-24`; cubre el zoom al 200 %. Mismo test que B1. |
| **M2** | Corregido | El error de guardado se pinta dentro de la barra fija (siempre en pantalla) y es la única región viva (`role="alert"`); el aviso de permisos deja de ser una segunda región viva. Test con axe. |
| m1 (a11y) | Corregido | `aria-live="polite"` en el resumen de cambios de la barra. |
| m2 (a11y) | Corregido | El grupo de permisos expone un `<h2>` real; el `legend` queda `sr-only` como nombre del `fieldset`. |
| m5 (a11y) | Corregido | El contador `n/200` se enlaza con `aria-describedby`, ya no es `aria-hidden` y anuncia con `aria-live`. |
| n1 (a11y) | Corregido | «1 invitación pendiente **dejará** de funcionar». |
| n2 (a11y) | Corregido | Una sola etiqueta de descripción: la visible del `TextArea`; se eliminó la fila duplicada. |
| n4 (a11y) | Corregido | AC-10 precisa «`aria-current` único por navegación». |
| m-01 (reviewer) | Corregido | Tests de los avisos de borrado/salida y de la limpieza vía `onNoticeClose`; la navegación conserva `?deleted`/`?left`. |
| m-02 (reviewer) | Corregido | Tests de 401, 404, 429, error de red, «Guardando…» y carga. |
| m-03 (reviewer) | Corregido | Se navega antes de `removeQueries` y la limpieza se hace al desmontar la ruta; test que verifica que no hay un segundo `GET` del detalle. |
| m-04 (reviewer) | Corregido | Campos y switches deshabilitados y formulario `aria-busy` durante el `PATCH`; el botón de guardado conserva el foco (`loading`). |
| m-09 (reviewer) | Corregido | Axe ampliado al error de guardado, al estado «Guardando…» y a los diálogos de borrado y salida. |

Pendientes por estar fuera de alcance (`packages/ui`, decisión aparte): `m-08`/`m4` («Cancelar» inerte durante `loading` en `ConfirmDialog`) y `m3` (orden visual del pie en `overlay-parts`). Quedan también los nits de copy y estructura que dependen de diseño (`m-06`, píldora del subnav, «Eliminar para siempre», unificar `ToastViewport`/`parseFlag`).

> **Nota de árbol de trabajo:** durante este cierre había dos sesiones trabajando en el mismo árbol. Además de los archivos de F28, el diff contiene cambios en `packages/ui` (`ConfirmDialog` y sus tests), en la barra de subidas de F26 y en `search-flags.ts`. Esos cambios **no forman parte de la corrección de B1/B2** y deben revisarse aparte antes de commitear; no se han revertido para no pisar el trabajo de la otra sesión.

## Verificación ejecutada

Segunda pasada tras las correcciones (2026-11-06):

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **36 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 724 tests: OK** |
| `pnpm typecheck` | **9/9 OK** |
| `pnpm lint` | **6/6 OK** |
| `pnpm format:check` | **OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |
| `pnpm agents:check` | **43 specs, 43 filas, OK** |
| `pnpm build` | **5/5 OK**, 5 rutas prerenderizadas |

Primera pasada (implementación inicial, antes de las correcciones): 13 tests de settings, 87 archivos y 700 tests, `docs:check` con 592 enlaces.

Auditoría de accesibilidad (previa a las correcciones): 24 pasadas viewport × tema × estado, **0 violaciones axe**, 1 `incomplete` preexistente (avatar del sidebar). Contraste medido a mano: texto 18,1:1 / 13,6:1; muted 6,34:1 / 6,5:1; «Permitido» 7,99:1; borde de peligro 5,49:1 / 6,31:1; anillo de foco 3,97:1. La segunda pasada en navegador real queda pendiente de relanzar.

## Incidencia de datos

Durante la prueba de «Guardando…», la auditoría de accesibilidad reanudó un `PATCH` interceptado y cambió `membersCanTag` de `true` a `false` en «Familia Ferrer». Lo revirtió por API y verificó el estado: mismos valores, 2 álbumes, 17 fotos, 3 miembros. No hay cambios pendientes en los datos de seed.

## Siguiente paso al retomar

1. Corregir **B1/B2/M1/M2** en una sesión de `ui-dev` (mismo `sessionID` si sigue disponible).
2. Aplicar los menores y nits aplicables; los de `packages/ui` (`ConfirmDialog`/`overlay-parts`) requieren decisión aparte porque son compartidos.
3. Añadir los tests que faltan (toasts, errores, estados, axe de diálogos, cola activa).
4. Relanzar `a11y-auditor` y `design-auditor`.
5. Segunda ronda de `reviewer` solo si queda algún bloqueante.
6. Aceptación del usuario (G4), cierre documental y commit propuesto.

## Segunda ronda de correcciones (2026-11-06)

| ID | Estado | Evidencia |
| --- | --- | --- |
| **B1-r** | Corregido | La barra de guardado ya no crece con 2+ cambios: el resumen es `max-sm:sr-only` (visible desde `sm` con `line-clamp-2`) y pasa a `sr-only` en todos los tamaños cuando `uploadBarVisible`. Los botones van siempre en `flex-row`, con `flex-1` en móvil y ancho automático desde `sm`. El error de guardado es un `<p role="alert">` compacto de 2 líneas, no un `InlineAlert`. Test: resumen con `max-sm:sr-only`/`line-clamp-2`, botones en el mismo `flex-row` y resumen `sr-only` con la cola visible. La verificación real a 375×667 @200 % queda para `a11y-auditor`. |
| **D1** | Corregido | Portada de solo lectura: miniatura `w-24 aspect-[3/2]` en móvil y `md:w-full md:aspect-[12/5] md:max-h-56` desde tablet/escritorio. Sin «Cambiar portada». |
| **D2** | Corregido | Las filas de permisos del owner llevan icono decorativo (`FolderPlus`, `Upload`, `Tag`, `Download`) en tarjeta `size-8 lg:size-10` con `bg-surface-2 text-muted`, y el `Switch` va en `flex items-center gap-3` + `min-w-0 flex-1`. El mapa se comparte desde `settings-icons.ts` con la vista de member. |
| **D3** | Corregido | La barra móvil queda compacta al ocultar el resumen y mantener los botones en fila; mismo cambio que B1-r. |
| **D4** | Corregido | «Permisos de los miembros», «Lo que puedes hacer aquí» y el título principal de member usan `text-h3 lg:text-h2`; «General» sigue en `text-h2`. |
| **D5** | Corregido | La tarjeta de member usa `padding="md"` + `lg:p-6`; el estado reduce el `gap` a `gap-1` y la etiqueta conserva `min-w-0` para no truncar «Descargar originales». |
| **D7** | Corregido | Con la cola visible el resumen queda `sr-only` en todos los tamaños y los botones siguen en fila; la barra recortada por la derecha mantiene ambos botones visibles y clicables a 1024. |
| **D8** | Corregido | El error compacto de 2 líneas sustituye al `InlineAlert` y reduce la altura de la barra con error; mantiene un único `role="alert"` y el texto completo en el DOM. |
| **NT-1** | Corregido | El `legend` del `fieldset` es `sr-only` con «Permisos»; el `h2` visible sigue siendo «Permisos de los miembros», así que grupo y encabezado no se anuncian iguales. |

### Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm typecheck` | **9/9 OK** |
| `pnpm lint` | **6/6 OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

### Pendiente de la reauditoría

- `a11y-auditor`: comprobar en navegador real 375×667 y 360×740 a 200 % de zoom con 2+ cambios, la barra compacta, el error compacto y el foco del último control.
- `design-auditor`: validar D1–D5 y la barra móvil/escritorio con la cola de F26 visible.
- `reviewer`: segunda ronda solo si la reauditoría deja un bloqueante.
- Aceptación del usuario (G4) y commit propuesto.

## Tercera ronda (2026-11-06)

| ID | Estado | Evidencia |
| --- | --- | --- |
| **1.4.4** | Corregido | La barra usa `flex flex-wrap items-center gap-3`; el resumen es `min-w-0 flex-1 truncate` (una línea) y `max-sm:sr-only`, `sr-only` en todos los tamaños con la cola visible; los botones van en `flex flex-wrap gap-2 sm:ml-auto` con `min-w-[9rem] flex-1 sm:flex-none`. A 375/360 al 200 % los botones bajan a dos filas sin recortar el texto; a 768/1440 el resumen trunca y los botones conservan su ancho. Test estructural de `truncate`/`min-w-0`, `flex-wrap` y `min-w-[9rem]`. |
| **N-D** | Corregido | El error compacto pasa a `line-clamp-3` y añade `title` con el texto completo; sigue siendo el único `role="alert"` y la altura medida se recalcula. |
| **N-A** | Corregido | «General» es `sr-only lg:not-sr-only`; la portada va en fila etiqueta+miniatura en móvil y con etiqueta encima desde `lg`; `TextArea rows={3}`; la tarjeta General usa `padding="md"` + `lg:p-6` y `gap-4 lg:gap-5`. Se mantienen las descripciones de permisos por decisión de producto. |
| **N-B** | Corregido | La tarjeta del icono de permisos añade `border border-border` y `rounded-lg`; el `Switch` no cambia. |

### Decisiones registradas

- **N-A:** se mantienen las descripciones de los permisos visibles en móvil por claridad; la compactación se limita a título, portada, textarea y padding de la tarjeta.
- **N-C:** el resumen con la cola de subidas visible sigue oculto en todos los tamaños para no repetir el problema de anchura; queda como nit.
- **N-E, N-F, D6, D9, N3/N4, MN-1 y NT-2:** se quedan documentados y fuera de esta ronda (chrome compartido, decisiones de producto o shell).

### Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm typecheck` | **9/9 OK** |
| `pnpm lint` | **6/6 OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

### Pendiente

- `a11y-auditor`: confirmar 1.4.4 a 375/360 @200 % (botones en dos filas, texto completo, foco visible) y N-D.
- `design-auditor`: validar N-A y N-B en navegador real.
- `reviewer`: solo si la reauditoría deja un bloqueante.
- Aceptación del usuario (G4) y commit propuesto.

## Cuarta ronda (2026-11-06)

| ID | Estado | Evidencia |
| --- | --- | --- |
| **B1-r** | Corregido | Botones sin `min-w-[9rem]`: `min-w-0 flex-1 h-auto! min-h-11 whitespace-normal px-3 py-2`; contenedor `flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto`. A 200 % el texto parte en dos líneas pero los botones no se apilan ni se recortan; la barra baja a ~120 px. La nav de secciones deja de ser sticky en móvil mientras `html[data-save-bar='visible']` (`data-circle-section-nav` + regla CSS), así el foco no queda entre nav y barra. |
| **1.4.4** | Corregido | `Switch` con `min-w-0` en el bloque de texto y `break-words` en etiqueta/descripción; el track sigue `shrink-0`. La tarjeta de permisos ya no expande el documento a 200 %. Test de clases en `selection.test.tsx`. |
| **N-D** | Corregido | El aviso completo vuelve al principio del formulario como bloque `role="alert"`, `tabIndex={-1}`, `ref` y `title`; al fallar el `PATCH` se enfoca y se centra con `scrollIntoView`. La barra solo muestra una línea `truncate` no viva: «No se pudo guardar. Revisa el aviso.». |
| **N-A** | Corregido | La portada pasa a `flex items-center gap-3 md:block`: desde 768 la etiqueta va encima del banner; se mantiene `w-24` en móvil y `md:w-full md:aspect-[12/5] md:max-h-56`. El CTA queda en una línea a 100 % en 375/390. |
| **N-B** | Corregido | La tarjeta del icono de permisos usa `rounded-sm` (además de `border border-border`). |

### Decisiones registradas

- **N-1 (orden Portada):** no se cambia; se registra como decisión.
- **N-C:** el resumen sigue oculto con la cola visible.
- **N-E, N-F, D6, D9, N3/N4, MN-1 y NT-2:** documentados y fuera de esta ronda.

### Verificación ejecutada

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm --filter @memora/ui test` | **283 tests, 14 archivos: OK** |
| `pnpm typecheck` | **9/9 OK** |
| `pnpm lint` | **6/6 OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |

### Pendiente

- `a11y-auditor`: confirmar a 375×667 @200 % que la barra queda ~120 px, los botones no se apilan, la nav no es sticky y el aviso superior recibe el foco.
- `a11y-auditor` / `design-auditor`: confirmar que la tarjeta de permisos no desborda y validar N-A/N-B.
- `reviewer`: solo si la reauditoría deja un bloqueante.
- Aceptación del usuario (G4) y commit propuesto.

## Cierre (2026-11-06): aceptación sin reauditoría completa

El usuario **aceptó F28 (G4)** tras la cuarta ronda, con dos decisiones explícitas:

1. **No se relanzan auditorías completas.** La cuarta ronda se valida con la verificación acotada de abajo, no con otra pasada de `a11y-auditor` y `design-auditor` sobre la pantalla entera.
2. **El 200 % de zoom no tiene que quedar perfecto.** Se acepta como limitación conocida; lo que se exige es que el texto no se recorte y que los botones sigan siendo clicables, que es lo que cubren los tests estructurales de la ronda 4.

### Verificación de cierre (ejecutada, 2026-11-06)

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test settings --maxWorkers=2` | **37 tests, 2 archivos: OK** |
| `pnpm --filter @memora/ui test` | **283 tests, 14 archivos: OK** |
| `pnpm --filter @memora/web test --maxWorkers=2` | **88 archivos, 725 tests: OK** |
| `pnpm typecheck` | **9/9 OK** |
| `pnpm lint` | **6/6 OK** |
| `pnpm format:check` | **OK** |
| `pnpm build` | **5/5 OK** |
| `pnpm docs:check` | **192 archivos, 601 enlaces, 0 rotos** |
| `pnpm agents:check` | **43 specs, 43 filas: OK** |

### Lección de proceso

Cuatro rondas sobre el mismo componente no fueron cuatro correcciones: fueron **cuatro diagnósticos distintos de la barra de guardado** (foco tapado → tapada por la cola de F26 → desborde a 200 % → botones apilados), cada uno con la batería completa detrás y con hallazgos nuevos de diseño entrando a mitad. Desde F28 se aplica esta regla: **un fix = un hallazgo**, la revisión posterior cubre solo el archivo de test afectado, el `axe` del estado tocado y el viewport que falló, y la batería completa se ejecuta **una sola vez** antes del commit. Queda registrada en la bitácora.

### Pendiente real tras la aceptación

- Commit, PR y merge (cierre operativo, G5).
- Los menores y nits no aplicados siguen en `Pendiente` del [handoff](handoff.md); ninguno bloquea la entrega.
- El barrido de navegador 320/375/768/1024/1440 en claro/oscuro y la comprobación con lector de pantalla siguen diferidos a **F37/F38/F39**, como en F26 y F27.
