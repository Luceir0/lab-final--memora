# Tasks — F11 UI kit I: controles y datos

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F10.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (decisiones de arranque aprobadas el 2026-11-02).

## Implementación

- [x] Button, IconButton, LinkButton
- [x] TextField, TextArea, SearchField
- [x] Checkbox, Switch, SegmentedControl
- [x] Avatar, AvatarGroup, Badge, Chip
- [x] Card, ProgressBar, Spinner, Skeleton
- [x] VisuallyHidden
- [x] Ruta `/ui` solo de desarrollo
- [x] `--memora-border-strong` a 3:1

## Criterios de aceptación

- [x] AC-01: Cada componente tiene estados y accesibilidad.
- [x] AC-02: Button usa button real y aria-busy.
- [x] AC-03: TextField asocia label/hint/error.
- [x] AC-04: Checkbox/Switch usan controles nativos o roles correctos.
- [x] AC-05: Avatar tiene alt o iniciales.
- [x] AC-06: ProgressBar tiene progressbar y label.
- [x] AC-07: Tests por rol.

## Verificación

- [x] `pnpm --filter @memora/ui test` → 173 tests tras la cuarta tanda (95 componentes + 78 estilos).
- [x] `pnpm --filter @memora/web test` → 88 tests.
- [x] `pnpm typecheck` y `pnpm lint`.
- [x] `pnpm build`: árbol de rutas estable (mismo `routeTree.gen.ts` en desarrollo y producción), catálogo ausente de `dist/` y chunk stub de ruta de 103 B.
- [x] `pnpm format:check`, `docs:check` y `agents:check`.

## Tercera tanda: accesibilidad y diseño (2026-11-02)

- [x] A-1 áreas táctiles 44 px en `Chip` y segmentos.
- [x] A-2 `Avatar` interactivo sin `aria-label`.
- [x] A-3 `loading` con `aria-disabled`, foco y guarda en `onClick`.
- [x] A-4 `aria-describedby` fusionado en `Switch`/`Checkbox`.
- [x] A-5 `FieldLabel` oculto una sola vez.
- [x] A-6 flechas horizontales y `aria-orientation`.
- [x] A-7 `ProgressBar` indeterminada anunciable y estática con reduced motion.
- [x] A-8 anillo fuera de `transition-colors`.
- [x] A-9 test con dos `TextField`.
- [x] A-10 axe falla con `incomplete` no-layout; F37 para navegador.
- [x] A-11 `Avatar.decorative`.
- [x] D-1 a D-13 aplicados.
- [x] Catálogo completo y conectado al tema real.
- [x] Build 5/5, `typecheck` después del build 9/9, dist sin catálogo.

## Cuarta tanda: cierre previo a la aceptación (2026-11-02)

- [x] C-1 hit de 44 px de altura fija centrada en `Button`/`LinkButton` sm, `Chip` y segmentos; medido en Chromium.
- [x] C-2 quitar del `Chip` separado del cuerpo; hit-test con ambos handlers y clic real en el borde sin borrar.
- [x] C-3 afirmación de `ArrowUp`/`ArrowDown` corregida (no se interceptan ni bloquean el scroll).
- [x] D-11 checkbox deshabilitado: label muted y relleno `border-strong` (3,67:1 / 3,86:1).
- [x] D-14 hover en `Switch`, `SegmentedControl` y `Chip` deshabilitados, verificado en navegador.
- [x] Anillo de hover del `Avatar` con `primary` (6,14:1 / 3,52:1).
- [x] Menores: knob, chip seleccionado y X, `surface-active`, `loading`, `Spinner`/`Skeleton`, catálogo.
- [x] Tests de `::after`, chip y guardas de hover añadidos.
- [x] Verificación completa repetida: 173 tests de `@memora/ui`, 88 de `@memora/web`, build 5/5 y typecheck 9/9.

## Cierre

- [x] Revisión independiente: dos rondas (primera **no apto**: hover del primario en oscuro 4,06:1 y `routeTree.gen.ts` que cambiaba con el modo; segunda **apto con correcciones**, m-07 documental cerrado).
- [x] Auditoría de accesibilidad en navegador real (Chrome/CDP + axe 4.14): 0 violaciones y 0 `incomplete` tras dos rondas de correcciones.
- [x] Auditoría de diseño: tres pasadas, cerrada en apto.
- [x] Aceptación del usuario (G4): 2026-11-02, tras revisión en navegador real, sin cambios pedidos.
- [x] `handoff.md` completo.
- [x] Tablero actualizado (F11 en `done`).
- [x] Bitácora y cobertura actualizadas.
- [x] Commit, push, PR, CI y merge ejecutados con autorización (ver «Cierre operativo»).

## Cierre operativo (2026-11-02)

- [x] Commits en `feat/F11-ui-kit-i`: `0e815e2` (`docs: open F11 with approved decisions`), `a1648ce` (`docs: forbid commits while agents are working`), `bf22fd4` (`feat(ui): add UI kit controls and data (F11)`) y `94620ee` (`docs: record F11 implementation and audits`).
- [x] PR [#11](https://github.com/Luceir0/lab-final--memora/pull/11) `feat: F11 UI kit I — controls and data`.
- [x] CI de la PR: run `41498545493`, `completed/success`, head `94620ee`.
- [x] Merge en `main`: `6d160ce` (`Merge pull request #11 from Luceir0/feat/F11-ui-kit-i`).
- [x] CI de `main` sobre el merge: run `41499457291`, `completed/success`.
- [x] Verificación del orquestador: `@memora/ui` 173 tests, `@memora/web` 88 tests, `build` forzado sin caché 5/5 en 9,54 s, `typecheck` 9/9 después del build, `format:check`/`docs:check`/`agents:check` OK, `routeTree.gen.ts` con SHA idéntico antes y después del build y catálogo ausente de `apps/web/dist` (chunk stub de 103 B).
- [x] Deudas trasladadas documentadas en «Pendiente» de [handoff.md](handoff.md): axe en navegador real y medición automática de 44 px → F37; CSP → F42; `ThemeToggle` → F13/F34; chips con cuerpo y quitar → F13/F14; `dist` no ESM nativo de Node; borde del knob en claro 1,98:1; `animate-spin`/`animate-pulse` fuera de la escala de movimiento; anillo de hover del `Avatar` en oscuro 3,52:1.
