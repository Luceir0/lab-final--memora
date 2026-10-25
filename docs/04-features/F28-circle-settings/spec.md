---
id: F28
title: "Ajustes del círculo"
milestone: M3
size: M
status: draft
spec: complete
depends_on:
  - "F18"
blocks:
  - "F35"
design_refs:
  - "assets/design/screens/ajustes-movil.png"
  - "assets/design/screens/ajustes-movil-eliminar.png"
  - "assets/design/screens/ajustes-movil-sin-permisos.png"
  - "assets/design/screens/ajustes-escritorio-guardando.png"
  - "assets/design/screens/ajustes-escritorio-eliminar.png"
contracts:
  - "docs/03-architecture/auth.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F28 — Ajustes del círculo

> **Milestone:** M3 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F18 · **Bloquea:** F35

## Objetivo

Construir ajustes de círculo, permisos y zona de peligro.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/ajustes-movil.png](../../../assets/design/screens/ajustes-movil.png)
- [assets/design/screens/ajustes-movil-eliminar.png](../../../assets/design/screens/ajustes-movil-eliminar.png)
- [assets/design/screens/ajustes-movil-sin-permisos.png](../../../assets/design/screens/ajustes-movil-sin-permisos.png)
- [assets/design/screens/ajustes-escritorio-guardando.png](../../../assets/design/screens/ajustes-escritorio-guardando.png)
- [assets/design/screens/ajustes-escritorio-eliminar.png](../../../assets/design/screens/ajustes-escritorio-eliminar.png)

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- CircleForm
- CirclePermissions
- DangerZone
- Confirmación por nombre
- Owner-only
- Estados

### No incluye

- Transferencia de propiedad
- Borrado de cuenta

## Entregables

- apps/web/src/routes/_app/circles/$circleId/settings.tsx
- features/circles/settings/**

## UX y estados

- guardando
- sin permisos
- eliminar
- error

## Criterios de aceptación

- **AC-01.** Solo owner accede.
- **AC-02.** Guardar settings afecta a permisos reales.
- **AC-03.** Borrar exige escribir nombre.
- **AC-04.** Confirmación en sheet/dialog.
- **AC-05.** Miembro sin permisos ve estado.
- **AC-06.** Teclado y foco.

## Pruebas

- RTL settings
- Permisos
- Confirmación
- Responsive

## Archivos previstos

- `apps/web/src/routes/_app/circles/$circleId/settings.tsx`
- `apps/web/src/features/circles/settings/**`

## Verificación

- `pnpm --filter @memora/web test settings`

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

La zona de peligro no se puede activar por accidente.
