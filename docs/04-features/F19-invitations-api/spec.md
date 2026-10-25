---
id: F19
title: "Invitations API"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F17"
blocks:
  - "F20"
  - "F22"
design_refs: []
contracts:
  - "docs/03-architecture/auth.md"
  - "docs/03-architecture/api-contract.md"
decisions:
  - "ADR-0005"
---

# F19 — Invitations API

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F17 · **Bloquea:** F20, F22

## Objetivo

Implementar creación, listado, revocación y aceptación de invitaciones con email opcional.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)
- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- Token aleatorio y hash
- Caducidad 7 días
- Revocación
- Aceptación idempotente
- Email adapter
- Listado pendiente
- Tests

### No incluye

- UI
- SSR preview (F20)

## Entregables

- apps/api/src/modules/invitations/**
- email adapter

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Token no predecible y hasheado.
- **AC-02.** Caduca y se puede revocar.
- **AC-03.** Aceptar dos veces no duplica.
- **AC-04.** Ya miembro devuelve estado.
- **AC-05.** Email fallido no rompe la invitación.
- **AC-06.** Solo owner crea/lista/revoca.
- **AC-07.** No se exponen datos privados.

## Pruebas

- Crear/aceptar
- Caducada
- Revocada
- Ya miembro
- Email falla
- Permisos

## Archivos previstos

- `apps/api/src/modules/invitations/**`
- `apps/api/src/services/email/**`

## Verificación

- `pnpm --filter @memora/api test invitations`

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

El raw token solo aparece en el enlace.
