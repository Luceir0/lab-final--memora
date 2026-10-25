---
id: F12
title: "UI kit II: overlays y feedback"
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
  - "assets/design/screens/etiquetar-movil.png"
  - "assets/design/screens/cola-de-subida-movil.png"
contracts:
  - "docs/02-design/components.md"
decisions:
  - "ADR-0011"
---

# F12 — UI kit II: overlays y feedback

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F10 · **Bloquea:** F13

## Objetivo

Implementar diálogos, hojas, menús, tabs, acordeón y feedback.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/design-system-v0.1.png](../../../assets/design/design-system-v0.1.png)
- [assets/design/screens/etiquetar-movil.png](../../../assets/design/screens/etiquetar-movil.png)
- [assets/design/screens/cola-de-subida-movil.png](../../../assets/design/screens/cola-de-subida-movil.png)

### Contratos

- [docs/02-design/components.md](../../../docs/02-design/components.md)

### Decisiones

- ADR-0011

## Alcance

### Incluye

- Dialog, ConfirmDialog
- BottomSheet, ResponsiveDialog
- Menu, Tabs, Accordion
- Toast, InlineAlert
- EmptyState, Breadcrumb, Tooltip
- VisuallyHidden

### No incluye

- Lógica de producto
- Formularios

## Entregables

- packages/ui/src/components/**
- tests de foco y teclado

## UX y estados

- abierto
- cerrando
- foco
- Esc
- arrastrando

## Criterios de aceptación

- **AC-01.** Dialog tiene aria-modal, foco inicial y retorno.
- **AC-02.** BottomSheet tiene alternativa con botón.
- **AC-03.** Menu funciona con flechas y Esc.
- **AC-04.** Tabs usa tablist/tab/tabpanel.
- **AC-05.** Accordion usa aria-expanded/controls.
- **AC-06.** Toast es status; error es alert.
- **AC-07.** axe sin errores.

## Pruebas

- Foco
- Teclado
- Esc
- ResponsiveDialog
- axe

## Archivos previstos

- `packages/ui/src/components/**`

## Verificación

- `pnpm --filter @memora/ui test`
- `Revisar con teclado`

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

ResponsiveDialog decide por media query, no duplica árboles.
