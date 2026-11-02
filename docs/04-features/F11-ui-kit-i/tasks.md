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

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado (F11 en `review`).
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
