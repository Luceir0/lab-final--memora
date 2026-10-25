---
id: F26
title: "Upload queue web"
milestone: M3
size: L
status: draft
spec: complete
depends_on:
  - "F24"
  - "F25"
blocks:
  - "F27"
  - "F29"
design_refs:
  - "assets/design/screens/album-movil-subiendo.png"
  - "assets/design/screens/cola-de-subida-movil.png"
  - "assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png"
contracts:
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F26 — Upload queue web

> **Milestone:** M3 · **Talla:** L · **Estado:** draft · **Spec:** completa
> **Depende de:** F24, F25 · **Bloquea:** F27, F29

## Objetivo

Implementar la cola de subida con progreso, reintento, cancelación y drag & drop.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-subiendo.png](../../../assets/design/screens/album-movil-subiendo.png)
- [assets/design/screens/cola-de-subida-movil.png](../../../assets/design/screens/cola-de-subida-movil.png)
- [assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png](../../../assets/design/screens/album-escritorio-oscuro-subidas-y-soltar.png)

### Contratos

- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Alcance

### Incluye

- useUploadQueue
- Reducer con unión discriminada
- Concurrencia 3
- Progreso XHR
- Retry/cancel
- Dropzone
- Selector cámara/galería
- Aviso al salir
- Tests

### No incluye

- Página global (F27)
- Subidas en segundo plano

## Entregables

- apps/web/src/features/uploads/**
- hooks/useUploadQueue.ts
- tests

## UX y estados

- en cola
- subiendo
- completada
- error
- cancelada
- reintento

## Criterios de aceptación

- **AC-01.** Cada archivo tiene estado discriminado.
- **AC-02.** Progreso por archivo y global.
- **AC-03.** Reintento individual.
- **AC-04.** Cancelación.
- **AC-05.** Un error no pierde los demás.
- **AC-06.** Drag & drop y selector.
- **AC-07.** Aviso al salir.

## Pruebas

- Reducer
- Hook
- Componente
- MSW fallo/reintento

## Archivos previstos

- `apps/web/src/features/uploads/**`
- `apps/web/src/hooks/useUploadQueue.ts`

## Verificación

- `pnpm --filter @memora/web test uploads`

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

La cola no sobrevive a recarga; se avisa.
