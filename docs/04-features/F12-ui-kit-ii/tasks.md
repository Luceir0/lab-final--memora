# Tasks — F12 UI kit II: overlays y feedback

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F10 (y F11, que aporta `VisuallyHidden` y los controles).
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Dialog, ConfirmDialog
- [x] BottomSheet, ResponsiveDialog
- [x] Menu, Tabs, Accordion
- [x] Toast, InlineAlert
- [x] EmptyState, Breadcrumb, Tooltip
- [x] VisuallyHidden — reutilizado desde F11, sin duplicarlo

## Criterios de aceptación

- [x] AC-01: Dialog tiene aria-modal, foco inicial y retorno.
- [x] AC-02: BottomSheet tiene alternativa con botón.
- [x] AC-03: Menu funciona con flechas y Esc.
- [x] AC-04: Tabs usa tablist/tab/tabpanel.
- [x] AC-05: Accordion usa aria-expanded/controls.
- [x] AC-06: Toast es status; error es alert.
- [x] AC-07: axe sin errores (0 violaciones en 32 pasadas de navegador real).

## Verificación

- [x] `corepack pnpm --filter @memora/ui test` → 270 tests en 13 archivos.
- [x] `corepack pnpm --filter @memora/web test` → 88 tests en 17 archivos.
- [x] `corepack pnpm lint` → 6/6 tareas.
- [x] `corepack pnpm typecheck` → 9/9 tareas (también después del build).
- [x] `corepack pnpm build` → 5/5 tareas, 8,78 s, `/help` prerenderizado.
- [x] `format:check`, `docs:check` (0 enlaces rotos) y `agents:check` (43 specs, 43 filas).
- [x] Revisar con teclado en navegador real (auditoría de accesibilidad, 0 violaciones).

## Cierre

- [x] Revisión independiente (dos rondas; la segunda, apta).
- [x] Auditoría de accesibilidad en navegador real (apto) y auditoría de diseño (tres pasadas, apto).
- [x] `handoff.md` completo.
- [x] Tablero actualizado (F12 → `done`).
- [x] Bitácora y cobertura actualizadas.
- [x] Aceptación del usuario (G4) el 2026-11-02 en `/ui`, móvil y escritorio, claro y oscuro, con un cambio ya aplicado: estilo único destructivo en rojo suave.
- [x] Commits `d79286e`, `5e5871f` y `eedb652` en `feat/F12-ui-kit-ii`.
- [x] Push, PR #13 y CI en verde (run `41537887650`).
- [x] Merge `62d98b9` en `main` y CI en verde sobre el merge (run `41538068474`).
- [x] Paso a `done`.

## Cierre

Cerrada el 2026-11-02: PR #13, merge `62d98b9` en `main` y CI en verde en la PR y en `main`. Deudas trasladadas a F13, F26, F34, F37 y F39.
