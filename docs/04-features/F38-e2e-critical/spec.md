---
id: F38
title: "E2E de flujos críticos"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F33"
  - "F37"
blocks:
  - "F39"
  - "F40"
  - "F41"
design_refs:
  - "assets/design/screens"
contracts:
  - "docs/05-quality/test-matrix.md"
decisions: []
---

# F38 — E2E de flujos críticos

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F33, F37 · **Bloquea:** F39, F40, F41

## Objetivo

Automatizar el flujo completo con dos usuarios y dos círculos en móvil y escritorio.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens](../../../assets/design/screens)

### Contratos

- [docs/05-quality/test-matrix.md](../../../docs/05-quality/test-matrix.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Registro
- Círculo
- Invitación
- Álbum
- Subida
- Etiqueta
- Descarga
- Acceso cruzado
- Preview OG
- Tema

### No incluye

- Todos los casos límite
- iOS real

## Entregables

- e2e/critical-flow.spec.ts
- seed/reset de E2E
- artefactos de CI

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Flujo completo pasa en Chromium y Pixel.
- **AC-02.** Acceso cruzado falla como debe.
- **AC-03.** Preview no expone datos.
- **AC-04.** Datos aislados.
- **AC-05.** CI estable.

## Pruebas

- E2E
- Negativos
- Responsive

## Archivos previstos

- `e2e/**`
- `apps/api/src/test/seed-e2e.ts`

## Verificación

- `pnpm test:e2e`

## Definition of Ready

- [ ] Dependencias `done` o autorizadas.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No usar datos de producción.
