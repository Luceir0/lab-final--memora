# Handoff — F12 UI kit II: overlays y feedback

- **Estado:** `done` (2026-11-02)
- **Rama:** `feat/F12-ui-kit-ii` (commits `d79286e`, `5e5871f` y `eedb652`; PR #13, merge `62d98b9`)
- **Fecha:** 2026-11-02
- **Implementado por:** subagente `ui-dev` (cuatro tandas y tres turnos de correcciones)
- **Revisado por:** revisión independiente (dos rondas), auditoría de accesibilidad en navegador real (chrome-headless-shell 156 + CDP + axe 4.14) y auditoría de diseño (tres pasadas)

## Resultado

Implementados los doce componentes de la spec en `packages/ui/src/components`: `Dialog`,
`ConfirmDialog`, `BottomSheet`, `ResponsiveDialog`, `Menu`, `Tabs`, `Accordion`, `Toast` (con
`ToastViewport`), `InlineAlert`, `EmptyState`, `Breadcrumb` y `Tooltip`, más tres módulos
internos (`overlay-utils.ts`, `overlay-parts.tsx` y `feedback-tone.tsx`). `VisuallyHidden` se
reutiliza desde F11 sin duplicarlo.

Los overlays no usan `<dialog>` nativo: overlay propio con `role="dialog"`, `aria-modal`,
trampa de foco, `Esc`, retorno al disparador, fondo inerte, bloqueo de scroll y apilado por
secuencia de apertura. `BottomSheet` añade arrastre como mejora, pero siempre ofrece botón
«Cerrar» de 44 px y `Esc`. `ResponsiveDialog` decide por `matchMedia('(min-width: 768px)')`
sin duplicar árboles y `ConfirmDialog` se construye sobre él: hoja en móvil y diálogo desde
768 px, con CTA destructiva en rojo suave y foco inicial en Cancelar.

Resultado real: **270 tests en `packages/ui`** (172 de componentes + 98 de estilos, 13
archivos) y **88 tests en `apps/web`** (17 archivos). `build` 5/5 en 8,78 s con `/help`
prerenderizado, `typecheck` 9/9 también después del build y `lint` 6/6. La auditoría de
accesibilidad en navegador real terminó con **0 violaciones en 32 pasadas** (8 estados × 2
anchos × 2 temas) y la de diseño cerró en **apto** con los doce componentes en verde.

## Revisión y auditorías

### Revisión independiente (G3)

| Ronda | Resultado | Hallazgos principales |
| --- | --- | --- |
| 1 | **Apto con correcciones** | **M-01** `Esc` del menú cerraba también el diálogo que lo contenía; **M-02** overlays montados en el mismo commit se inactivaban mutuamente; **M-03** salida de 150 ms frente a 250 ms; **M-04** doble región viva; **M-05** foco enviado al fondo; **N-01…N-03** (menores, aplicados) |
| 2 | **Apto** | Sin bloqueantes; correcciones verificadas |

### Accesibilidad en navegador real

- Herramientas: `chrome-headless-shell` 156, Chrome DevTools Protocol y `axe-core` 4.14.
- Cobertura: **32 pasadas** (8 estados × 2 anchos × 2 temas).
- Resultado: **0 violaciones** tras corregir A-1…A-6 y H-1…H-3 (ver tabla).
- **Veredicto final: apto.**

### Auditoría de diseño

| Pasada | Resultado | Contenido |
| --- | --- | --- |
| 1 | **No apto** | Cinco hallazgos mayores (ConfirmDialog no era hoja en móvil, Tabs con subrayado, Accordion en caja única, BottomSheet con scroll de todo el panel, foco del toast a 2,07:1) y 14 menores |
| 2 | **Apto con correcciones** | N-01 (CTA deshabilitada indistinguible), F-08 (tooltip recortado), F-11 (radio del icono) y N-02 (tabs en dos filas), aplicados |
| 3 | **Apto** | Los doce componentes en verde |

## Cierre operativo (G5)

| Elemento | Identificador real |
| --- | --- |
| Rama | `feat/F12-ui-kit-ii` (sigue existiendo en remoto) |
| Commits | `d79286e` (`feat(ui): add overlays, navigation and feedback components (F12)`), `5e5871f` (`feat(web): add F12 specimens to the dev catalog`) y `eedb652` (`docs: record F12 implementation, audits and acceptance`) |
| PR | [#13](https://github.com/Luceir0/lab-final--memora/pull/13) `feat: F12 UI kit II — overlays and feedback` |
| CI de la PR | run `41537887650`, `completed/success`, head `eedb652` |
| Merge en `main` | `62d98b9` (`Merge pull request #13 from Luceir0/feat/F12-ui-kit-ii`) |
| CI de `main` | run `41538068474`, `completed/success` |

## Accesibilidad

| ID | Estado | Qué se hizo |
| --- | --- | --- |
| A-1 Apilado visual invertido | **Corregido** | El orden lo decide la secuencia de apertura, no el tipo: cada overlay recibe `--memora-z-sheet + 2 × secuencia` (60, 62, 64…) con techo por debajo de `toast` (80). Una hoja abierta desde un diálogo se pinta encima y `Esc` cierra solo la capa superior; el fondo inerte y el bloqueo de scroll siguen la misma pila. Tests en `overlays.test.tsx` («apilado visual por turno de apertura» y «overlays anidados») |
| A-2 2.4.11 con toasts | **Corregido** | `ToastViewport` calcula `scroll-padding-bottom` desde la parte superior real de la pila hasta el borde inferior de la ventana mientras hay avisos y lo restaura al vaciarse. Test en `feedback-ii.test.tsx` |
| A-3 Toast a 16 px fuera a 375 | **Corregido** | El viewport usa `left`/`right` sin `w-full`; varios avisos caben dentro del ancho. Test en `feedback-ii.test.tsx` |
| A-4 Menú de 36 px | **Corregido** | Los ítems del menú usan `min-h-11` (44 px); `Menu` conserva roving tabindex y omite los deshabilitados |
| A-5 Breadcrumb de 20 px | **Corregido** | Los enlaces del `Breadcrumb` usan el patrón de área táctil de 44 px de F11 sin cambiar la altura visual del texto |
| A-6 Región viva del `InlineAlert` | **Corregido** | El rol (`alert` solo en peligro, `status` en el resto) envuelve únicamente el texto; la acción queda fuera de la región viva. Test en `feedback-ii.test.tsx` |
| A-7 `aria-describedby` del `Tooltip` al enfocar | **Trasladado a F37** | El id se añade al recibir foco; los lectores lo leen al entrar en el elemento. La comprobación real con NVDA/VoiceOver no es posible en CDP y queda en F37/F39 |
| A-8 Catálogo sin escenarios anidados | **Corregido** | `/ui` pasó a «UI kit F11–F12» y añadió `Menu` dentro de `Dialog` y `Dialog + BottomSheet` anidados con disparadores reales |
| A-9 Panel oscuro a 1,17:1 | **Corregido** | `Dialog` y `BottomSheet` usan `border-strong` solo en el borde del panel en oscuro: 3,86:1 contra el panel y 4,51:1 contra el scrim. Sin cambios en `--color-border` global |
| H-1 Tabs recortados | **Corregido** | Una sola fila con densidad compacta, `overflow-x-auto` con scrollbar oculto a 320 y revelado por foco; la pestaña activa es una píldora `primary-soft` |
| H-2 Tooltip oculto con zoom 200 % | **Corregido** | El tooltip se muestra solo con capacidad de puntero (`@media (hover: hover)`), **sin gate de ancho**, así que sigue disponible con zoom de escritorio; `max-w-[calc(100vw-2rem)]` y corrección de colisión horizontal con 8 px de margen |
| H-3 Cuerpo scrollable no enfocable | **Corregido** | El cuerpo de `BottomSheet` es una región enfocable (`tabIndex={0}`) con `bodyLabel` (por defecto «Contenido»); asa, cabecera y footer quedan fijos y solo el cuerpo hace scroll |

Nota de alcance: A-7 y A-9 se revisaron con el mismo criterio que el resto de la auditoría;
A-7 no puede demostrarse sin lector de pantalla y queda trasladado.

## Diseño

### Hallazgos mayores de la primera pasada

| Hallazgo | Estado | Qué se hizo |
| --- | --- | --- |
| `ConfirmDialog` no era hoja en móvil | **Corregido** | Se construye sobre `ResponsiveDialog`: hoja por debajo de 768 px y diálogo desde 768, con un solo contenido y foco inicial en Cancelar |
| `Tabs` con subrayado | **Corregido** | Píldora activa `bg-primary-soft`/`text-on-primary-soft`, con icono decorativo y contador visibles en el nombre accesible |
| `Accordion` en caja única | **Corregido** | Tarjetas independientes `rounded-lg` con borde suave, chevron circular `bg-surface-2` y respuesta separada por borde a 16 px |
| `BottomSheet` con scroll de todo el panel | **Corregido** | Panel `overflow-hidden`; asa, cabecera y footer fijos; solo el cuerpo hace scroll |
| Foco del toast a 2,07:1 | **Corregido** | Los controles sobre `inverse` usan `--color-on-inverse` como anillo: 18,14:1 en claro y 16,78:1 en oscuro (pares añadidos a `contrast.test.ts` y documentados en `tokens.md`) |

### Hallazgos menores con identificador confirmado

| ID | Estado | Qué se hizo |
| --- | --- | --- |
| F-06 CTA destructiva | **Cerrado (decisión del usuario, revisada)** | Primero se siguió `ajustes-movil-eliminar.png` (CTA inversa); el 2026-11-02 el usuario unificó el estilo destructivo: `danger` (borde y texto rojos sobre fondo suave) con papelera, y `primary` cuando no es destructiva. Cancelar sigue sobre `surface-2` |
| F-07 Sombra del menú | **Corregido** | `Menu` usa `shadow-md` (antes `shadow-lg`), conforme a `tokens.md` |
| F-08 Tooltip recortado | **Corregido** | `max-w-[calc(100vw-2rem)]` y desplazamiento calculado para no salir del viewport; test en `feedback-ii.test.tsx` |
| F-09 Paddings | **Corregido** | `Dialog` `p-6 sm:p-8` y `BottomSheet` `px-5 pb-6`, medidos a 320 y 390 |
| F-10 Círculo de peligro | **Corregido** | `ConfirmDialog` ya no pinta el círculo de 36 px que no existe en las pantallas |
| F-11 Radio del icono | **Corregido** | `EmptyState` expone `iconShape="circle" | "square"`; `square` usa `rounded-lg` de 16 px sin cambiar el tamaño del icono |
| F-12 Densidad del toast | **Corregido** | Cierre de 36 px visibles con 44 px de área táctil; el toast mide 68 px |
| F-13 Breadcrumb | **Corregido** | El ítem actual usa `font-medium` |
| F-14 Asa no descartable | **Corregido** | Sin `dismissible` el asa no se pinta; se conserva el espaciador de 24 px |
| F-15 Capas | **Corregido (documental)** | `tokens.md` documenta el apilado por secuencia de apertura y la base nominal de las capas |
| F-16 Región viva del toast | **Corregido** | El rol envuelve solo el texto; cierre y acción quedan fuera |
| F-17 `snapPoints` | **Corregido** | Renombrado a `maxHeightPercent` (10–90 % de `dvh`), sin paradas; contrato actualizado |
| F-18 Referencias | **Corregido** | La spec apunta a `ajustes-movil/escritorio-eliminar.png` para el modal de diálogo; el visor de foto deja de citarse como referencia de F12 |
| N-01 CTA deshabilitada indistinguible | **Corregido** (segunda pasada; superado por la decisión de estilo del 2026-11-02) | La CTA deshabilitada usa el neutro global (`surface-2`, `muted`), no el rojo, y se distingue del habilitado. Se quitó `disabled:opacity-100` de `button.tsx`, que impedía fusionar el estado |
| N-02 Tabs en dos filas | **Corregido** (segunda pasada) | Densidad compacta y una sola fila a 375/390; a 320 scroll con revelado por foco |

### Hallazgos mayores de la primera pasada, con identificador

Los cinco mayores son F-01 (ConfirmDialog no era hoja en móvil), F-02 (Tabs con subrayado),
F-03 (Accordion en caja única), F-04 (BottomSheet con scroll de todo el panel) y F-05 (foco
del toast a 2,07:1). Todos cerrados; el detalle está en la tabla anterior de esta sección.

## Cambio posterior a la revisión (2026-11-02): estilo único destructivo

El usuario aceptó la feature con un cambio: unificar todos los botones de eliminación,
borrado y alerta irreversible bajo un solo estilo, con borde y texto rojos sobre fondo rojo
muy claro. Alcance acordado: **solo acciones destructivas o irreversibles**; las de
advertencia no destructivas no usan este estilo.

- `Button variant="danger"` pasa de rojo sólido a `border-danger` + `bg-danger-soft` +
  `text-danger-text`, con `danger-soft-hover`/`danger-soft-active` nuevos.
- `IconButton` gana `variant="danger"` con la misma piel; `LinkButton` la hereda.
- La CTA de `ConfirmDialog` deja de ser inversa: `danger` cuando es destructiva y `primary`
  cuando no. El estado deshabilitado sigue el neutro global.
- `ProgressBar tone="danger"` mantiene el rojo sólido porque es una barra, no un botón;
  `Badge`, `InlineAlert` y `Toast` no cambian.
- Ratios: texto sobre soft **6,43:1 / 7,02:1**, sobre hover **5,75 / 6,15** y sobre active
  **5,15 / 5,33**; borde sobre soft **4,81 / 5,75**.
- Contrato y tokens actualizados en `docs/02-design/components.md` y
  `docs/02-design/tokens.md`; la decisión 1 de la spec recoge el cambio.
- El catálogo `/ui` muestra `Button`/`IconButton` en `loading`, los tres `ConfirmDialog`
  (pide frase, destructivo habilitado y no destructivo) y la papelera donde corresponde.

Verificación: **270 tests** en `@memora/ui` y 88 en `@memora/web`, con build y checks en
verde. Pendiente de la comprobación visual del usuario con el estilo nuevo.

## Catálogo `/ui`

Se amplió `apps/web/src/features/dev/ui-showcase.tsx` con los overlays y el feedback para
poder revisarlos con teclado y auditarlos en navegador real. Sigue siendo solo de desarrollo:
el catálogo no aparece en `apps/web/dist` y únicamente queda el chunk stub de la ruta.

## Cambios (archivos)

- `packages/ui/src/components/{dialog,confirm-dialog,bottom-sheet,responsive-dialog,overlay-utils,overlay-parts}.tsx` y `.ts`
- `packages/ui/src/components/{menu,tabs,accordion,toast,inline-alert,feedback-tone,empty-state,breadcrumb,tooltip}.tsx`
- `packages/ui/src/components/{overlays,navigation,feedback-ii}.test.tsx`
- `packages/ui/src/index.ts` (exports y tipos de los nuevos componentes)
- `packages/ui/README.md` (tandas C y D, límites y verificación)
- `packages/ui/src/components/button.tsx` (se quitó `disabled:opacity-100` para fusionar el estado deshabilitado de la CTA)
- `packages/ui/src/styles/contrast.test.ts` (pares nuevos de `inverse`, foco y CTA deshabilitada)
- `apps/web/src/features/dev/ui-showcase.tsx` (catálogo de los nuevos estados)
- `docs/02-design/components.md` y `docs/02-design/tokens.md` (contrato y tokens afectados)
- `docs/04-features/F12-ui-kit-ii/{spec,tasks,handoff}.md`, `docs/04-features/README.md`
- `docs/05-quality/test-matrix.md`, `docs/06-process/ai-log.md`, `docs/07-curriculum/coverage-map.md`

## Verificación (comando → resultado real)

Ejecutada por el orquestador el 2026-11-02:

| Comando / comprobación | Resultado |
| --- | --- |
| `@memora/ui test` | **270 tests, 13 archivos** |
| `@memora/web test` | **88 tests, 17 archivos** |
| `corepack pnpm lint` | **6/6 tareas** |
| `corepack pnpm typecheck` | **9/9 tareas** (también después del build) |
| `corepack pnpm build` | **5/5 tareas**, 8,78 s; `/help` prerenderizado |
| `corepack pnpm format:check` | OK |
| `corepack pnpm docs:check` | 191 archivos, 452 enlaces, **0 rotos** |
| `corepack pnpm agents:check` | **43 specs, 43 filas** |
| `git status` (implementación, antes del cierre documental) | **10 modificados y 18 nuevos**; `routeTree.gen.ts` sin cambios |
| Catálogo en `apps/web/dist` | **sin textos**; queda el chunk stub `ui-BGGNz8zQ.js` (103 B) |

Desglose de los 270 tests de `packages/ui`: `overlays.test.tsx` 36, `feedback-ii.test.tsx`
27, `data.test.tsx` 23, `selection.test.tsx` 21, `button.test.tsx` 21, `navigation.test.tsx`
17, `fields.test.tsx` 14, `feedback.test.tsx` 13 (172 de componentes) y 98 de estilos
(`contrast.test.ts` 76, `tokens.test.ts` 11, `theme.test.ts` 6, `fonts.test.ts` 3 y
`package.test.ts` 2).

## Criterios de aceptación

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 Dialog con `aria-modal`, foco inicial y retorno | **Pasa** | `overlays.test.tsx`: rol, `aria-modal`, nombre y descripción, foco inicial, ciclo de `Tab`, `Esc` y retorno al disparador |
| AC-02 BottomSheet con alternativa con botón | **Pasa** | `overlays.test.tsx`: cierre con botón y con `Esc`; arrastre solo como mejora |
| AC-03 Menu con flechas y `Esc` | **Pasa** | `navigation.test.tsx`: flechas, `Home`/`End`, `Esc` con retorno, `Esc` que no cierra el diálogo contenedor |
| AC-04 Tabs con `tablist`/`tab`/`tabpanel` | **Pasa** | `navigation.test.tsx`: relaciones ARIA y activación con flechas y `Home`/`End` |
| AC-05 Accordion con `aria-expanded`/`aria-controls` | **Pasa** | `navigation.test.tsx`: relación cabecera/panel, modo simple y múltiple, flechas |
| AC-06 Toast `status`; error `alert` | **Pasa** | `feedback-ii.test.tsx`: rol por tono y controles fuera de la región viva |
| AC-07 axe sin errores | **Pasa** | axe 4.14 en jsdom por familia y **0 violaciones** en 32 pasadas de navegador real |

## Definition of Done

Marcado solo lo evidenciado en esta feature:

- [x] Cumple sus criterios de aceptación (AC-01…AC-07).
- [ ] Estados de vacío, carga, éxito y error: cubiertos como estados de componente
      (`open`, `exit`, vacío del `EmptyState`, tonos de `Toast`/`InlineAlert`, `loading` de
      `ConfirmDialog`), pero no hay estados de página de producto.
- [ ] Datos persistidos y permisos en servidor: **no aplica**; F12 son componentes
      presentacionales.
- [x] Coincide con el diseño: auditoría de diseño, tres pasadas, cerrada en apto.
- [x] Usa solo tokens y componentes del sistema (guard anti-hex y pares de contraste en verde).
- [x] Funciona en móvil y escritorio: hoja/diálogo por `matchMedia`, breakpoint 768 en tests y
      auditoría en navegador real a dos anchos.
- [x] Claro y oscuro: ambos temas en tests de contraste y en las 32 pasadas de axe.
- [x] Revisada en 320, 375, 768, 1024 y 1440 px: auditoría de diseño a 320, 375, 390, 768,
      1024 y 1440 y auditoría de accesibilidad a 320, 375, 390, 767, 768, 1024 y 1440, en
      claro y oscuro.
- [x] Teclado y foco: trampa de foco, retorno, `Esc`, flechas, `Home`/`End` y roving tabindex
      en tests.
- [x] Etiquetas y errores: `aria-labelledby`/`aria-describedby` en overlays y error de la
      frase de confirmación anunciado con `aria-describedby`.
- [x] Contraste: 76 tests de pares sobre los hex reales de los tokens.
- [x] Alternativa a gestos: `BottomSheet` cierra con botón, `Esc` y fondo además del arrastre.
- [x] axe sin errores críticos: **0 violaciones** en navegador real; en jsdom sigue sin
      `color-contrast` ni `target-size` por falta de layout.
- [x] TypeScript estricto; sin `any`.
- [x] Lint y typecheck limpios.
- [x] Sin errores de consola ni de hidratación: 0 errores y 0 warnings en los recorridos de
      las dos auditorías, en 320/375/390/768/1024/1440 y ambos temas.
- [x] Contratos compartidos: no se duplican DTOs (no aplica dominio); el contrato de
      componentes se actualizó en `docs/02-design/components.md`.
- [x] Sin secretos ni PII.
- [x] Sin dependencias nuevas (`package.json` sin cambios en el árbol de trabajo).
- [x] Unitarios de componentes de interacción: **270 tests** en 13 archivos.
- [x] Casos negativos: `dismissible=false`, ítems deshabilitados, frase de confirmación
      incompleta, tooltip fuera del viewport y fondo inerte.
- [ ] API de endpoints y permisos: **no aplica**.
- [x] Resultados ejecutados y reportados.
- [ ] E2E: **no aplica**; F37/F38.
- [x] Spec actualizada, `handoff.md` completo y estado en el tablero.
- [x] Bitácora y cobertura del temario.
- [ ] ADR: no hubo decisión nueva de arquitectura; las decisiones están en la spec.
- [x] Usuario ha probado y aceptado el 2026-11-02 en `/ui` (móvil y escritorio, claro y oscuro). Pidió un cambio, ya aplicado: estilo único destructivo en rojo suave.
- [x] Commit, PR y CI: `d79286e`, `5e5871f` y `eedb652`; PR #13 con CI en verde (run `41537887650`) y merge `62d98b9` con CI en verde (run `41538068474`).

## Pendiente

- **Lector de pantalla real** (NVDA/VoiceOver/TalkBack) para tooltip y anuncios → **F37/F39**.
- **Límite de avisos simultáneos** en el viewport → **F26**.
- **Chips de producto** → **F13/F14**.
- **`ThemeToggle`** → **F13/F34**.
- **`Dialog` directo en móvil** no es el patrón de producto: se usa `ResponsiveDialog`.
- **`dist` de `@memora/ui` no es ESM nativo** (deuda de F11): imports internos sin `.js` y
  `moduleResolution: bundler`.
- **Chunk stub de 103 B** de la ruta del catálogo en `apps/web/dist`.

## Riesgos y limitaciones

- jsdom no calcula layout: áreas táctiles, zoom, colisión del tooltip y apilado visual se
  comprobaron con `chrome-headless-shell` + CDP, no como test del repo. La suite de navegador
  queda para F37/F38.
- El gate de puntero del `Tooltip` (`hover: hover`) no se puede comprobar en jsdom; se verificó
  en navegador y su automatización queda pendiente.
- axe en jsdom sigue excluyendo `color-contrast` y `target-size`; el contraste se cubre en
  `contrast.test.ts` y las áreas táctiles en la auditoría de navegador.
- Las 32 pasadas cubren 8 estados, no todas las combinaciones de estado de cada componente.
- La auditoría se hizo en una sola familia de navegador (Chromium); Firefox/Safari quedan para
  la aceptación del usuario o F39.
- El árbol de trabajo sigue sin commitear: la rama `feat/F12-ui-kit-ii` solo existe en local.
- El borde del botón deshabilitado queda a 1,11:1 (claro) y 1,19:1 (oscuro) sobre su propio
  fondo. No incumple 1.4.11 porque el componente está inactivo y el estado es programático
  (`disabled`, fuera del orden de tabulación, `cursor: not-allowed`). Si F39 quiere reforzarlo,
  basta cambiar el borde del deshabilitado a `border-strong`.
- En `Menu`, el ítem destructivo usa texto rojo y hover suave, sin borde ni relleno
  permanentes, para no romper el patrón de fila. La etiqueta es la señal no cromática.

## Documentación actualizada

- [x] `docs/04-features/F12-ui-kit-ii/{spec,tasks,handoff}.md`
- [x] `docs/04-features/README.md` (fila F12 → `done` y situación)
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/05-quality/test-matrix.md`
- [x] `docs/02-design/components.md` y `docs/02-design/tokens.md` (contrato y tokens)
- [x] `packages/ui/README.md`
- [x] `README.md` y `docs/00-index.md` (referencias al estado de F12)

## Siguiente paso propuesto

F12 está cerrada. El siguiente paso es F13 — App shell y navegación adaptativa, que depende de
F11 y F12 y no se abre sin permiso del usuario. Deudas trasladadas: `ThemeToggle` y chips de
producto (F13/F14), límite de avisos (F26), lector de pantalla (F37/F39).
