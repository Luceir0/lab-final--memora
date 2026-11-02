---
id: F11
title: "UI kit I: controles y datos"
milestone: M1
size: M
status: in-progress
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

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
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
3. **Ejemplos.** Ruta `/ui` en `apps/web` **solo en desarrollo**, con todos los componentes y estados. No se instala Storybook. La ruta **no debe existir en el bundle de producción**; se verificará sobre `dist/` tras `build`.
4. **Token de borde.** `--memora-border-strong` pasa a `#868399` en claro (3,41:1 sobre `bg`, 3,67:1 sobre blanco, 3,21:1 sobre `surface-2`) y `#6B7699` en oscuro (4,25:1 / 3,86:1 / 3,48:1). Sustituye al `#8E8CA6` propuesto en F10, que fallaba sobre `surface-2` (2,84:1).
5. **Componentes del contrato sin feature.** `Toast` e `InlineAlert` → F12; `Breadcrumb` → F13; `Tabs`, `EmptyState` y `Accordion` → la primera feature que los necesite. Queda anotado en el tablero de `docs/04-features/README.md`.
6. **`format:check`.** Se arregló aparte antes de F11 (PR #10, merge `0e57654`); no forma parte de esta rama.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No crear variantes que no estén en el sistema.
