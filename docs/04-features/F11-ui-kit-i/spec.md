---
id: F11
title: "UI kit I: controles y datos"
milestone: M1
size: M
status: done
spec: complete
depends_on:
  - "F10"
blocks:
  - "F13"
design_refs:
  - "assets/design/design-system-v0.1.png"
contracts:
  - "docs/02-design/components.md"
decisions:
  - "ADR-0011"
---

# F11 — UI kit I: controles y datos

> **Milestone:** M1 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F10 · **Bloquea:** F13

## Objetivo

Implementar los componentes base de formularios, acciones y datos.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/design-system-v0.1.png](../../../assets/design/design-system-v0.1.png)

### Contratos

- [docs/02-design/components.md](../../../docs/02-design/components.md)

### Decisiones

- ADR-0011

## Alcance

### Incluye

- 17 componentes del contrato + `VisuallyHidden` (18 en total).
- Button, IconButton, LinkButton
- TextField, TextArea, SearchField
- Checkbox, Switch, SegmentedControl
- Avatar, AvatarGroup, Badge, Chip
- Card, ProgressBar, Spinner, Skeleton

### No incluye

- Overlays (F12)
- Componentes de dominio

## Entregables

- packages/ui/src/components/**
- Stories o ejemplos
- Tests RTL

## UX y estados

- default
- hover
- focus
- disabled
- loading
- error

## Criterios de aceptación

- **AC-01.** Cada componente tiene estados y accesibilidad.
- **AC-02.** Button usa button real y aria-busy.
- **AC-03.** TextField asocia label/hint/error.
- **AC-04.** Checkbox/Switch usan controles nativos o roles correctos.
- **AC-05.** Avatar tiene alt o iniciales.
- **AC-06.** ProgressBar tiene progressbar y label.
- **AC-07.** Tests por rol.

## Pruebas

- RTL de cada componente
- Teclado
- Estados
- axe

## Archivos previstos

- `packages/ui/src/components/**`
- `packages/ui/src/index.ts`

## Verificación

- `pnpm --filter @memora/ui test`
- `pnpm typecheck`

## Definition of Ready

- [x] Dependencias `done`. F10 cerrada el 2026-11-02 (PR #7, merge `f3b26a5`).
- [x] Decisiones resueltas (ver «Decisiones de arranque»).
- [x] Contratos congelados: `docs/02-design/components.md` y `docs/02-design/tokens.md`.
- [x] Diseño enlazado: `assets/design/design-system-v0.1.png`.
- [x] Datos de prueba: no aplica (componentes presentacionales sin datos de dominio).
- [x] Sin preguntas bloqueantes.

## Decisiones de arranque (2026-11-02)

Aprobadas por el usuario antes de empezar:

1. **Dependencias de React y testing en `packages/ui`.** Se autoriza declarar `react@19.3.1` y `react-dom@19.3.1` como `peerDependencies` y como `devDependencies` (para tests), más `@testing-library/react@16.3.3`, `@testing-library/dom@10.4.2`, `jsdom@30.1.3`, `@vitejs/plugin-react@6.1.2`, `@types/react@19.3.0`, `@types/react-dom@19.3.0` y `axe-core` (última estable, fijada al instalar). Son las versiones que ya usa `apps/web`; no entra ninguna librería nueva al monorepo. Esto no contradice la revisión de F10: aquella prohibió React en el paquete *antes* de F11, no después.
2. **Iconos.** `lucide-react@1.66.0` como `peerDependency` de `@memora/ui`; el consumidor fija la versión. Uso directo dentro de los componentes, con `aria-hidden` en los decorativos.
3. **Ejemplos.** Ruta `/ui` en `apps/web` **solo en desarrollo**, con todos los componentes y estados. No se instala Storybook. El **catálogo** no debe entrar en el bundle de producción: la ruta existe siempre en el árbol generado (idéntico en desarrollo y producción) y en producción renderiza la página 404, mientras el catálogo se carga con `import()` solo en desarrollo. Verificado sobre `dist/` tras un build forzado.
4. **Token de borde.** `--memora-border-strong` pasa a `#868399` en claro (3,41:1 sobre `bg`, 3,67:1 sobre blanco, 3,21:1 sobre `surface-2`) y `#6B7699` en oscuro (4,25:1 / 3,86:1 / 3,48:1). Sustituye al `#8E8CA6` propuesto en F10, que fallaba sobre `surface-2` (2,84:1).
5. **Componentes del contrato sin feature.** `Toast` e `InlineAlert` → F12; `Breadcrumb` → F13; `Tabs`, `EmptyState` y `Accordion` → la primera feature que los necesite. Queda anotado en el tablero de `docs/04-features/README.md`.
6. **`format:check`.** Se arregló aparte antes de F11 (PR #10, merge `0e57654`); no forma parte de esta rama.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No crear variantes que no estén en el sistema.

## Revisión de accesibilidad y diseño (2026-11-02)

Tercera tanda: **apto con correcciones**, sin bloqueantes. Se aplicaron A-1…A-11 y D-1…D-13.
Decisiones del usuario registradas: señal no cromática en `Chip`/`SegmentedControl` y knob del
`Switch` visible en oscuro; el diseño canónico manda en `Button`; axe en navegador real se
traslada a F37 (sin Playwright aquí). El catálogo `/ui` se completa y se conecta al tema real.

## Cierre previo a la aceptación (2026-11-02)

Cuarta tanda: se aplicaron C-1, C-2 y C-3, se completó D-11 y se cerró D-14 (hover en
deshabilitados), además de los menores de knob, chip seleccionado, `surface-active`,
`loading`, animaciones y catálogo. Sin cambios de contrato ni de API. Verificación real en
Chromium headless (`::after` = 44 px en 29 controles y hit-test del chip con ambos handlers) y
suite completa en verde. Detalle en [handoff.md](handoff.md).

## Aceptación y cierre operativo (2026-11-02)

- **Revisión independiente (G3):** dos rondas. Primera **no apto** por el hover del primario en
  oscuro a 4,06:1 y por `routeTree.gen.ts`, que cambiaba con el modo. Segunda **apto con
  correcciones**, con m-07 (documental) cerrado. Auditoría de accesibilidad en navegador real
  (Chrome/CDP + axe 4.14): 0 violaciones y 0 `incomplete` tras dos rondas de correcciones.
  Auditoría de diseño: tres pasadas, cerrada en apto.
- **Aceptación del usuario (G4):** 2026-11-02, tras revisión en navegador real; sin cambios
  pedidos.
- **Cierre operativo (G5):** rama `feat/F11-ui-kit-i` con los commits `0e815e2`
  (`docs: open F11 with approved decisions`), `a1648ce` (`docs: forbid commits while agents are
  working`), `bf22fd4` (`feat(ui): add UI kit controls and data (F11)`) y `94620ee`
  (`docs: record F11 implementation and audits`); PR
  [#11](https://github.com/Luceir0/lab-final--memora/pull/11) `feat: F11 UI kit I — controls and
  data` con CI en verde (run `41498545493`, `completed/success`, head `94620ee`); merge
  `6d160ce` en `main` (`Merge pull request #11 from Luceir0/feat/F11-ui-kit-i`) con CI en verde
  (run `41499457291`, `completed/success`). La rama remota sigue existiendo.
- **Estado:** `done`. Las deudas reales quedan en «Pendiente» de [handoff.md](handoff.md).
