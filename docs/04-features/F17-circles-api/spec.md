---
id: F17
title: "Circles API"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F08"
  - "F15"
blocks:
  - "F18"
  - "F19"
  - "F21"
  - "F23"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F17 — Circles API

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F08, F15 · **Bloquea:** F18, F19, F21, F23

## Objetivo

Implementar CRUD de círculos, membresía, settings y permisos reales.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- GET/POST /circles
- GET/PATCH/DELETE /circles/:circleId
- Membership owner
- Settings flags
- Stats
- Autorización
- Tests de acceso cruzado

### No incluye

- UI
- Invitaciones (F19)
- Miembros (F21)

## Entregables

- apps/api/src/modules/circles/**
- tests

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Crear círculo añade owner membership.
- **AC-02.** Solo miembros ven el círculo.
- **AC-03.** Solo owner edita settings/borra.
- **AC-04.** Un extraño recibe 404.
- **AC-05.** settings valida flags.
- **AC-06.** Stats no filtran otros círculos.
- **AC-07.** Tests negativos.

## Pruebas

- CRUD
- Permisos
- Acceso cruzado
- Settings inválidos

## Archivos previstos

- `apps/api/src/modules/circles/**`

## Verificación

- `pnpm --filter @memora/api test circles`

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

El circleId de fotos/álbumes se valida contra la membresía.
