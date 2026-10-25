---
id: F35
title: "Actividad"
milestone: M4
size: M
status: draft
spec: complete
depends_on:
  - "F21"
  - "F23"
  - "F25"
  - "F28"
blocks: []
design_refs:
  - "assets/design/screens/mis-circulos-escritorio.png"
contracts:
  - "docs/03-architecture/activity.md"
decisions:
  - "ADR-0009"
---

# F35 — Actividad

> **Milestone:** M4 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F21, F23, F25, F28 · **Bloquea:** —

## Objetivo

Implementar la tabla de eventos, API global/por círculo y UI de actividad.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/mis-circulos-escritorio.png](../../../assets/design/screens/mis-circulos-escritorio.png)
- No existe una pantalla específica de Actividad. Se infiere del panel de actividad de `Mis círculos · escritorio` y del patrón de lista/tarjetas; se valida con `design-auditor`.

### Contratos

- [docs/03-architecture/activity.md](../../../docs/03-architecture/activity.md)

### Decisiones

- ADR-0009

## Alcance

### Incluye

- Tabla Activity
- Escritura en transacción
- GET global/círculo
- Agrupación de subidas
- Panel
- Página
- Estados

### No incluye

- Push
- Email de actividad

## Entregables

- apps/api/src/modules/activity/**
- apps/web/src/features/activity/**

## UX y estados

- vacío
- cargando
- error
- paginación

## Criterios de aceptación

- **AC-01.** Cada acción relevante crea evento.
- **AC-02.** Solo círculos del usuario.
- **AC-03.** Agrupación correcta.
- **AC-04.** Paginación por cursor.
- **AC-05.** Panel y página.
- **AC-06.** No PII.
- **AC-07.** El diseño inferido se documenta y se revisa con `design-auditor`.

## Pruebas

- API eventos
- Privacidad
- Paginación
- UI

## Archivos previstos

- `apps/api/src/modules/activity/**`
- `apps/web/src/features/activity/**`

## Verificación

- `pnpm --filter @memora/api test activity`
- `pnpm --filter @memora/web test activity`

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

No se registran eventos de invitaciones privadas.
