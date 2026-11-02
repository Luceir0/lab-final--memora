# Handoff — F11 UI kit I: controles y datos

- **Estado:** `done` (2026-11-02)
- **Rama:** `feat/F11-ui-kit-i` (commits `0e815e2`, `a1648ce`, `bf22fd4` y `94620ee`; PR #11, merge `6d160ce`)
- **Fecha:** 2026-11-02
- **Implementado por:** subagente `ui-dev`
- **Revisado por:** revisión independiente (dos rondas), auditoría de accesibilidad en navegador real (Chrome/CDP + axe 4.14) y auditoría de diseño (tres pasadas)

## Resultado

Cerrada la última tanda antes de la aceptación: el área táctil ya no depende del borde
(`::after` de 44 px de altura fija centrada), el quitar del `Chip` no pisa el cuerpo, los
controles deshabilitados no muestran hover, el `Checkbox` deshabilitado se distingue en ambos
temas y el catálogo incluye los estados y comparaciones que faltaban. Medición real en
Chromium headless: 29 controles con `::after` de 44 px, incluidos todos los que tienen borde.

Resultado real: **173 tests en `packages/ui`** (95 de componentes + 78 de estilos) y 88 en
`apps/web`; build 5/5 y `typecheck` 9/9. El catálogo sigue sin textos ni chunk propio en
producción. La revisión independiente, las auditorías, la aceptación del usuario y el cierre
operativo se completaron el 2026-11-02 (ver la sección siguiente).

## Revisión, auditorías, aceptación y cierre operativo (2026-11-02)

### Revisión independiente (G3)

Dos rondas:

| Ronda | Resultado | Hallazgos principales |
| --- | --- | --- |
| 1 | **No apto** | Hover del botón primario en oscuro a **4,06:1** (por debajo de 4,5:1) y `routeTree.gen.ts` que cambiaba según el modo |
| 2 | **Apto con correcciones** | Correcciones aplicadas; **m-07** (documental) cerrado en esta ronda |

### Auditorías

| Auditoría | Alcance | Resultado |
| --- | --- | --- |
| Accesibilidad | Navegador real (Chrome/CDP + axe 4.14) sobre `/ui` | **0 violaciones y 0 `incomplete`** tras dos rondas de correcciones |
| Diseño | Tokens, estados y catálogo | Tres pasadas, cerrada en **apto** |

### Aceptación (G4)

El usuario aceptó la feature el **2026-11-02** tras revisarla en navegador real. **No pidió
cambios.**

### Cierre operativo (G5)

| Elemento | Identificador real |
| --- | --- |
| Rama | `feat/F11-ui-kit-i` (sigue existiendo en remoto) |
| Commits | `0e815e2` (`docs: open F11 with approved decisions`), `a1648ce` (`docs: forbid commits while agents are working`), `bf22fd4` (`feat(ui): add UI kit controls and data (F11)`), `94620ee` (`docs: record F11 implementation and audits`) |
| PR | [#11](https://github.com/Luceir0/lab-final--memora/pull/11) `feat: F11 UI kit I — controls and data` |
| CI de la PR | run `41498545493`, `completed/success`, head `94620ee` |
| Merge en `main` | `6d160ce` (`Merge pull request #11 from Luceir0/feat/F11-ui-kit-i`) |
| CI de `main` | run `41499457291`, `completed/success` |

## Accesibilidad

| ID | Estado | Qué se hizo |
| --- | --- | --- |
| A-1 Áreas táctiles ≥44 px | **Corregido y medido** | Patrón de altura fija centrada: `after:top-1/2 after:h-11 after:-translate-y-1/2` en `Button`/`LinkButton` sm, cuerpo de `Chip` y segmentos; `after:h-11 after:w-11` en el quitar. Medido en Chromium: `getComputedStyle(el, '::after').height` = 44 px en 29 controles, incluidas todas las variantes con borde (antes 42 px) |
| A-2 `Avatar` interactivo 2.5.3 | **Corregido** | Sin `aria-label`; iniciales `aria-hidden` y nombre en `VisuallyHidden` dentro del botón. Test de rol/nombre y axe |
| A-3 `loading` sin `disabled` | **Corregido** | `Button` e `IconButton` usan `aria-disabled`, guarda en `onClick` y conservan foco/tabulación; `disabled` solo para el estado real. Tests actualizados |
| A-4 `aria-describedby` en `Switch`/`Checkbox` | **Corregido** | Se fusiona con la descripción, como en `TextField`; test con ayuda externa + descripción |
| A-5 `FieldLabel` doble ocultación | **Corregido** | Solo `sr-only` en el `<label>`; se quitó el `VisuallyHidden` interno |
| A-6 Teclado del segmentado | **Corregido (afirmación ajustada)** | Solo `ArrowLeft`/`ArrowRight` se gestionan y `ArrowUp`/`ArrowDown` **no se interceptan ni bloquean el scroll**. El grupo de radios puede seguir moviendo la selección por comportamiento nativo del navegador: APG lo permite y es lo correcto. `aria-orientation="horizontal"`; el test comprueba que el componente no mueve la selección por su cuenta |
| A-7 `ProgressBar` indeterminada | **Corregido** | `aria-label` incluye «en curso» (Chromium no expone `aria-valuetext`); con `motion-reduce` el relleno es una capa tenue de ancho completo, no un 40 % |
| A-8 Anillo de foco | **Corregido** | Botones con `transition-[background-color,border-color,color]`; `outline-color` fuera de la transición |
| A-9 Test de dos campos | **Corregido** | Dos `TextField` con ids y `aria-describedby` distintos |
| A-10 axe endurecido | **Corregido** | Falla con `incomplete` salvo reglas de layout (`color-contrast`, `color-contrast-enhanced`, `target-size`); README remite la cobertura de navegador a F37 |
| A-11 `Avatar` decorativo | **Corregido** | `decorative` pinta `alt=""`/`aria-hidden` y tiene prioridad sobre `onPress`; test y axe |

## Diseño

| ID | Estado | Qué se hizo |
| --- | --- | --- |
| D-1 Icono en `Chip` | **Corregido** | Contenido en `inline-flex` con `[&>svg]:shrink-0`; «+ Etiquetar» en una línea |
| D-2 Ancho del segmentado | **Corregido** | `w-fit max-w-full self-start`; sin `flex-1` en opciones |
| D-3 Knob del `Switch` | **Corregido** | Tokens `--memora-control-knob` (`#FFFFFF`/`#EEF0FA`) y `--memora-control-knob-border` (`#B9B6C9`/`#263049`); en claro el borde da 1,98:1 contra el knob y 1,74:1 contra `surface-2` (antes 1,11:1). Par oscuro 13,75:1 |
| D-4 Segmento seleccionado en oscuro | **Corregido** | Token `--memora-elevated` (`#FFFFFF`/`#2A3450`) + borde primario + `bold` |
| D-5 `Chip` seleccionado | **Corregido** | Check, `bold` y borde primario además del color; legible en grises |
| D-6 Hover ausente | **Corregido** | Hover con tokens en `Chip`, `Switch`, `Checkbox` y `Avatar` interactivo; anillo del avatar con `primary` (6,14:1 en claro y 3,52:1 sobre `surface` oscuro) en vez de `primary-soft` (1,15:1) |
| D-7 `Button` | **Corregido** | Ghost `text-primary-text`; disabled neutro + muted; `active` con `primary-active` y `surface-active` en `secondary`/`ghost` |
| D-8 Doble borde en campos | **Corregido** | Solo anillo global; se quitó `focus:border-primary` |
| D-9 Contador de `AvatarGroup` | **Corregido** | Sigue el `size` del grupo (24–64) |
| D-10 X de `SearchField` | **Corregido** | Solo aparece con texto; sin botón deshabilitado |
| D-11 Checkbox deshabilitado | **Corregido y medido** | El label interior ya no pisa el muted (`group-has-[:disabled]:text-muted`); el relleno usa `border-strong`, que da 3,67:1 en claro y 3,86:1 en oscuro contra `surface` (antes 1,11:1 con `surface-2`). Catálogo con desmarcado habilitado junto al deshabilitado |
| D-12 `Button.soft` | **Corregido** | Sin `brightness`; tokens `primary-soft-hover`/`primary-soft-active` |
| D-13 Movimiento | **Corregido** | `duration-(--memora-duration-fast)` y `ease-standard` en botones, chips, switch, checkbox, card y avatar |

## Cuarta tanda: cierre (2026-11-02)

| ID | Estado | Qué se hizo |
| --- | --- | --- |
| C-1 Hit de borde | **Corregido y medido** | `Button`/`LinkButton` sm, `Chip` y `SegmentedControl` usan `after:top-1/2 after:h-11 after:-translate-y-1/2`; el quitar usa `after:h-11 after:w-11`. `getComputedStyle(...,'::after').height` = **44 px en los 29 controles**; las variantes con borde (`secondary`, `outline` y segmentos) también dan 44 |
| C-2 Quitar del `Chip` | **Corregido y medido** | El cuerpo no tiene padding derecho y el quitar se separa 8 px: su hit de 44 px empieza 2 px después del cuerpo. `elementFromPoint` a 0,5 px del borde derecho devuelve el cuerpo; un clic real en ese punto alterna `aria-pressed` y **no elimina** el chip. El quitar sigue devolviendo 44 × 44 |
| C-3 Flechas verticales | **Afirmación corregida** | No se cambia el comportamiento: `ArrowUp`/`ArrowDown` no se interceptan ni bloquean el scroll; el grupo de radios puede mover la selección por comportamiento nativo. `handoff.md`, el comentario del componente y el test dicen exactamente eso |
| D-14 Hover en deshabilitados | **Corregido y medido** | `Switch` con `group-has-[:enabled]:group-hover`; `SegmentedControl` con `has-[:enabled]:hover`; `Chip` con `enabled:hover` en cuerpo y quitar. En Chromium, el borde/color/fondo no cambia al pasar el ratón por los tres controles deshabilitados |
| D-11 Checkbox | **Corregido y medido** | Ver tabla de diseño: label muted y relleno `border-strong` (3,67:1 / 3,86:1) |
| Menores | **Corregido** | Knob del switch (borde 1,98:1 en claro), hover del chip seleccionado y su X con `primary-soft-hover/active`, `surface-active` en `secondary`/`ghost`/`Chip`/X, `cursor-progress` y sin hover en `loading`, y `Spinner`/`Skeleton` documentados como animaciones fuera de la escala 150/250/350 |

## Catálogo `/ui`

- `Switch` off habilitado, además de on y disabled.
- `Avatar` con imagen, interactivo y decorativo, cada uno rotulado; `AvatarGroup` a 24, 40 y 64.
- `Chip` con avatar, con ambos handlers (`onClick` + `onRemove`), deshabilitado y sin la X duplicada en «Sin asignar».
- `Checkbox` desmarcado habilitado junto al deshabilitado.
- Filas estáticas de hover, foco y active/seleccionado para `Button`, `TextField`, `Checkbox`, `Switch`, `Chip` y `SegmentedControl`, rotuladas como simuladas; `TextField` indica que no define un active propio.
- `SegmentedControl` real conectado a `useTheme`, orden Claro / Sistema / Oscuro.
- `SearchField` vacío y con texto; `Skeleton` rect; `ProgressBar` primary/success/warning/danger con etiqueta visible y porcentaje.
- Icono de email corregido (`Mail`, no lupa); títulos de tarjeta en `h3`.
- Espécimen de tipografía, colores y radios; `bg-elevated` no se duplica porque en claro coincide con `bg-surface` (se explica en el catálogo) y el display no repite `tracking-[-0.03em]`.

## Cambios (archivos)

- `packages/ui/src/styles/{tokens.css,tokens.test.ts,contrast.test.ts}`
- `packages/ui/src/components/{button,icon-button,chip,switch,checkbox,avatar,avatar-group,segmented-control,progress-bar,search-field,field,text-field,text-area,card}.tsx`
- `packages/ui/src/components/{button,fields,selection,data,feedback}.test.tsx`
- `packages/ui/src/test/axe.ts`, `packages/ui/README.md`
- `apps/web/src/features/dev/{ui-showcase.tsx,avatar-sample.svg}`
- `docs/02-design/{tokens,components}.md`
- `docs/04-features/F11-ui-kit-i/{spec,tasks,handoff}.md`, `docs/05-quality/test-matrix.md`

## Verificación (comando → resultado real)

| Comando / comprobación | Resultado |
| --- | --- |
| `corepack pnpm --filter @memora/ui test` | **173 passed / 10 files** (95 componentes + 78 estilos) |
| `corepack pnpm --filter @memora/ui typecheck` | OK |
| `corepack pnpm --filter @memora/ui lint` | OK |
| `corepack pnpm --filter @memora/ui build` | OK; `dist` sin `src/test` |
| `corepack pnpm --filter @memora/web test` | **88 passed / 17 files** |
| `corepack pnpm --filter @memora/web typecheck` | OK |
| `corepack pnpm --filter @memora/web lint` | OK |
| `corepack pnpm -r typecheck` | OK |
| `corepack pnpm lint` | **6/6 tareas** |
| `corepack pnpm build` | **5/5 tareas** |
| `corepack pnpm typecheck` después del build | **9/9 tareas** |
| `corepack pnpm format:check` | OK |
| `corepack pnpm docs:check` | OK, 0 enlaces rotos |
| `corepack pnpm agents:check` | OK, 43 specs y 43 filas |
| `rg` del catálogo en `apps/web/dist` | **sin textos** (`Solo desarrollo`, `Filtro con ambos handlers`, `Estados simulados`); sin chunk `showcase-*` |
| CSS compilado | `bg-surface-active`, `control-knob-border`, `not-disabled:hover:*`, `group-has-[:enabled]`, `has-[:enabled]`, `after:h-11`, `after:w-11`, `after:top-1\/2`, `after:-translate-y-1\/2`; ya no hay `after:-inset-y-1` ni `after:-inset-1.5` |
| `::after` en Chromium headless | 29 controles con `getComputedStyle(el, '::after').height` = **44 px**; mínimo y máximo 44; variantes con borde (`secondary`, `outline`, segmentos) también 44 |
| Hit-test del `Chip` | cuerpo y quitar separados: `elementFromPoint(bodyRight - 0,5)` → cuerpo; `bodyRight + 0,5` → hueco; `removeLeft + 1` → quitar. Clic real en el borde derecho: `aria-pressed` alterna y el chip **sigue existiendo** |
| Hover de deshabilitados | `Switch` (borde `rgb(134,131,153)` antes/después), `SegmentedControl` (color `rgb(94,93,120)` antes/después) y `Chip` (fondo `rgba(0,0,0,0)` antes/después) sin cambios al pasar el ratón |
| Hover del `Avatar` | `box-shadow` con `rgb(91,71,224)` (primary) a 2 px; sin `none` tras el hover |
| `Button` loading | cursor `progress` y fondo `rgb(91,71,224)` antes/después del hover |
| `transition-property` de botones | `background-color,border-color,color` (sin `outline-color`) |
| SHA256 de `routeTree.gen.ts` antes/después de build | `db298306…e21206` idéntico |
| `git status --short` | limpio tras el merge del 2026-11-02; `routeTree.gen.ts` quedó commiteado con la ruta `/ui` |

## Verificación del cierre (orquestador, 2026-11-02)

| Comprobación | Resultado real |
| --- | --- |
| `@memora/ui` test | **173 tests** (95 de componentes + 78 de estilos, 10 archivos) |
| `@memora/web` test | **88 tests** (17 archivos) |
| `corepack pnpm build` forzado sin caché | **5/5** en **9,54 s** |
| `corepack pnpm typecheck` después del build | **9/9** |
| `format:check`, `docs:check`, `agents:check` | OK |
| SHA de `routeTree.gen.ts` antes/después del build | **idéntico** |
| Catálogo en `apps/web/dist` | **ausente**, con chunk stub de **103 B** |

## Ratios de los tokens nuevos y corregidos

| Par | Claro | Oscuro | Umbral |
| --- | --- | --- | --- |
| `on-primary` / `primary-active` | 9,39:1 | 7,08:1 | 4,5 |
| `on-primary-soft` / `soft-hover` | 9,19:1 | 7,94:1 | 4,5 |
| `on-primary-soft` / `soft-active` | 8,09:1 | 6,48:1 | 4,5 |
| `text` / `surface-active` | 14,27:1 | 10,84:1 | 4,5 |
| `primary-text` / `surface-active` | 6,16:1 | 5,21:1 | 4,5 |
| `control-knob-border` / `control-knob` | 1,98:1 | — | 1,5 |
| `control-knob-border` / `surface-2` | 1,74:1 | — | 1,5 |
| `primary` (anillo del avatar) / `surface` | 6,14:1 | 3,52:1 | 3 |
| `border-strong` (relleno disabled) / `surface` | 3,67:1 | 3,86:1 | 3 |
| `control-knob` / `surface-2` | 1,14:1 (borde+sombra) | 13,75:1 | 3 (solo oscuro) |
| `text` / `elevated` | — | 10,84:1 | 4,5 |

## Criterios de aceptación

AC-01 a AC-07: **pasan al cierre**. AC-01…AC-06 por implementación y auditorías; AC-07 **pasa con
matiz** — consultas por rol/nombre; `getByText` para hints/descripciones y la clase
`animate-spin` en el test de `Spinner.animated`. La revisión independiente (dos rondas), la
auditoría de accesibilidad en navegador real (0 violaciones, 0 `incomplete`) y la auditoría de
diseño (tres pasadas, apto) no dejaron bloqueantes abiertos.

## Definition of Done

Marcado solo lo evidenciado en esta feature:

- [x] Cumple sus criterios de aceptación (AC-01…AC-07).
- [ ] Estados de vacío, carga, éxito y error: cubiertos en los componentes (`loading`, `error`,
      disabled, empty del `SearchField`), pero no hay estados de página de producto.
- [ ] Datos persistidos y permisos en servidor: **no aplica**; F11 son componentes presentacionales.
- [x] Coincide con el diseño: auditoría de diseño, tres pasadas, apto.
- [x] Usa solo tokens y componentes del sistema (guard anti-hex en verde).
- [ ] Móvil y escritorio: catálogo revisado en Chromium headless y navegador real; no hay
      revisión sistemática a 320/375/768/1024/1440.
- [x] Claro y oscuro: ambos temas cubiertos por tests de contraste y auditoría de diseño.
- [x] Teclado y foco: roles, foco programático y flechas del `SegmentedControl` en tests; el
      comportamiento nativo de radios se documenta como correcto.
- [x] Etiquetas y errores: label/hint/error con `aria-describedby` y `aria-invalid`.
- [x] Contraste: ratios calculados sobre los hex reales de los tokens.
- [ ] Alternativa a gestos: no aplica en esta entrega (no hay gestos).
- [ ] axe sin errores críticos: 0 violaciones en **navegador real**; en jsdom sigue excluyendo
      `color-contrast` por falta de layout.
- [x] TypeScript estricto; sin `any`.
- [x] Lint y typecheck limpios.
- [ ] Sin errores de consola ni hidratación: el catálogo carga en desarrollo; no hay prueba
      automatizada de hidratación de `/ui`.
- [x] Contratos compartidos: no se duplican DTOs (no aplica dominio).
- [x] Sin secretos ni PII.
- [x] Unitarios de lógica nueva y componentes de interacción (173 tests).
- [ ] API de endpoints y permisos: **no aplica**.
- [x] Resultados ejecutados y reportados.
- [ ] E2E: **no aplica**; F37/F38.
- [x] Spec actualizada, `handoff.md` completo y estado en el tablero.
- [x] Bitácora y cobertura del temario.
- [ ] ADR: no hubo decisión nueva de arquitectura; las decisiones de arranque están en la spec.
- [x] Usuario ha probado y aceptado (2026-11-02).
- [x] Commit, PR, CI y merge ejecutados con autorización.

## Pendiente

Deudas reales, todas trasladadas:

- **axe en navegador real y medición automática de 44 px → F37.** La medición de áreas táctiles
  se hizo con `chrome-headless-shell` + CDP sobre `/ui`; no es un test del repo.
- **CSP con nonce/hash → F42** (incluye el script previo al pintado).
- **`ThemeToggle` al shell/Perfil → F13/F34.**
- **Chips con cuerpo y quitar en producto → F13/F14** (hoy solo existen en el catálogo).
- **`dist` de `@memora/ui` no es ESM nativo de Node:** los imports internos no llevan `.js` y
  `moduleResolution` es `bundler`; solo consumidores con bundler. Documentado en
  `packages/ui/README.md`.
- **Borde del knob del `Switch` en claro a 1,98:1** contra el knob (1,74:1 contra `surface-2`):
  cumple el 1,5:1 del criterio de componente no textual, pero queda justo.
- **`animate-spin`/`animate-pulse` fuera de la escala de movimiento** (150/250/350 ms);
  documentado, no corregido.
- **Anillo de hover del `Avatar` en oscuro a 3,52:1**: cumple 3:1 con margen justo; si F39 toca
  la paleta, hay que revisarlo.

## Riesgos y limitaciones

- jsdom no mide layout: la comprobación de 44 px y el hit-test del `Chip` se hicieron con
  `chrome-headless-shell` + CDP sobre `/ui` en desarrollo, no como test automatizado del repo.
  La suite de navegador queda para F37/F38.
- El catálogo se verificó en Chromium headless; la aceptación visual final (Firefox/Safari,
  zoom, escala de grises) sigue siendo del usuario.
- axe sigue sin `color-contrast` en jsdom; además ahora falla con `incomplete` no-layout.
- El contador de `AvatarGroup` conserva el `ring` de superficie, que en oscuro puede leerse
  como borde; no se cambió porque el diseño lo usa para el solape.
- `dist` de `@memora/ui` no es ESM nativo de Node (ver «Pendiente»).
- La rama remota `feat/F11-ui-kit-i` sigue existiendo tras el merge; no se ha borrado.

## Documentación actualizada

- [x] `docs/02-design/tokens.md` (tokens y ratios)
- [x] `docs/02-design/components.md` (solo contrato afectado)
- [x] `docs/04-features/F11-ui-kit-i/{spec,tasks,handoff}.md`
- [x] `docs/05-quality/test-matrix.md`
- [x] `packages/ui/README.md` (incluye la limitación de ESM)
- [x] `docs/04-features/README.md`, `docs/00-index.md` y `README.md`
- [x] `docs/06-process/ai-log.md` y `docs/07-curriculum/coverage-map.md`

## Siguiente paso propuesto

F12 — UI kit II: overlays y feedback queda en `draft` y no se abre sin autorización explícita
del usuario. Antes de empezar, decidir si se resuelven en F12 las deudas de `ThemeToggle` y
chips o se dejan para F13/F14.
