---
id: F11
title: "UI kit I: controles y datos"
milestone: M1
size: M
status: draft
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

- [ ] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No crear variantes que no estén en el sistema.
