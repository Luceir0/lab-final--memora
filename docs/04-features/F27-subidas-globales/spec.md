---
id: F27
title: "Subidas globales"
milestone: M3
size: S/M
status: draft
spec: complete
depends_on:
  - "F26"
blocks: []
design_refs:
  - "assets/design/screens/cola-de-subida-movil.png"
  - "assets/design/screens/mis-circulos-escritorio.png"
contracts:
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F27 — Subidas globales

> **Milestone:** M3 · **Talla:** S/M · **Estado:** draft · **Spec:** completa
> **Depende de:** F26 · **Bloquea:** —

## Objetivo

Añadir la cola global y la página de subidas recientes.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/cola-de-subida-movil.png](../../../assets/design/screens/cola-de-subida-movil.png)
- [assets/design/screens/mis-circulos-escritorio.png](../../../assets/design/screens/mis-circulos-escritorio.png)

### Contratos

- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Alcance

### Incluye

- UploadProvider global
- Ruta /uploads
- Panel
- Subidas recientes
- Contador en sidebar
- Estados

### No incluye

- Subidas en segundo plano
- Persistencia tras recarga

## Entregables

- apps/web/src/routes/_app/uploads.tsx
- features/uploads/UploadPanel.tsx
- api GET /me/uploads

## UX y estados

- vacío
- subiendo
- error
- completadas
- recientes

## Criterios de aceptación

- **AC-01.** La cola sigue al navegar.
- **AC-02.** Sidebar muestra contador.
- **AC-03.** Ruta /uploads accesible.
- **AC-04.** Recientes del usuario.
- **AC-05.** Sin datos de otros.
- **AC-06.** Estado vacío.

## Pruebas

- Provider
- Ruta
- Contador
- Recientes

## Archivos previstos

- `apps/web/src/routes/_app/uploads.tsx`
- `apps/web/src/features/uploads/**`
- `apps/api/src/modules/photos/recent.ts`

## Verificación

- `pnpm --filter @memora/web test uploads`
- `pnpm --filter @memora/api test uploads`

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

No prometer subida en segundo plano.
