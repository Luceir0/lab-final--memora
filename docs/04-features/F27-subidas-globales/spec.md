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

Añadir la página de subidas recientes y el contador del sidebar.

> **Dependencia ya cubierta por F26 (2026-11-06):** la cola global, la barra y el panel viven en el layout privado y sobreviven a la navegación interna. F27 **no** los reimplementa: solo añade la ruta `/uploads`, la lista de subidas recientes y el contador del sidebar.

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

- Ruta `/uploads`
- Subidas recientes
- Contador en sidebar
- Estados de la página

### No incluye

- Panel global y cola global (ya en F26)
- Subidas en segundo plano
- Persistencia tras recarga

## Entregables

- apps/web/src/routes/_app/uploads.tsx
- api GET /me/uploads

## UX y estados

- vacío
- subiendo
- error
- completadas
- recientes

## Criterios de aceptación

- **AC-01.** Ruta `/uploads` accesible desde el sidebar.
- **AC-02.** El sidebar muestra el contador de subidas.
- **AC-03.** Recientes del usuario.
- **AC-04.** Sin datos de otros.
- **AC-05.** Estado vacío.
- **AC-06.** Estados de carga y error de la página.

## Pruebas

- Ruta
- Contador
- Recientes
- Estados

## Archivos previstos

- `apps/web/src/routes/_app/uploads.tsx`
- `apps/web/src/features/uploads/**` (solo lectura del estado existente)
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

No prometer subida en segundo plano. El panel global y la barra son de F26: esta feature no los duplica.
