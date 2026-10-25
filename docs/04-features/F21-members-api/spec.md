---
id: F21
title: "Members API"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F17"
blocks:
  - "F22"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F21 — Members API

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F17 · **Bloquea:** F22

## Objetivo

Implementar listado de miembros, expulsión, salida y contadores de fotos etiquetadas.

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

- GET members
- DELETE member
- POST leave
- Contadores
- Invitaciones pendientes
- Reglas de owner
- Tests

### No incluye

- UI
- Transferencia de propiedad

## Entregables

- apps/api/src/modules/members/**

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Miembros solo del círculo.
- **AC-02.** Owner puede expulsar; member no.
- **AC-03.** Member puede salir; owner no sin borrar.
- **AC-04.** Fotos permanecen; tags del expulsado se eliminan.
- **AC-05.** Contadores correctos.
- **AC-06.** No se filtra información.

## Pruebas

- Listar
- Expulsar
- Salir
- Owner no sale
- Tags eliminados
- Permisos

## Archivos previstos

- `apps/api/src/modules/members/**`

## Verificación

- `pnpm --filter @memora/api test members`

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

La autoría de fotos se conserva aunque el miembro salga.
