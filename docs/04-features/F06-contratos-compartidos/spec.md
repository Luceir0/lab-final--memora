---
id: F06
title: "Contratos compartidos y permisos"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F05"
blocks:
  - "F07"
  - "F08"
  - "F09"
  - "F37"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F06 — Contratos compartidos y permisos

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F05 · **Bloquea:** F07, F08, F09, F37

## Objetivo

Definir una sola fuente de verdad para requests, responses, errores, paginación y permisos.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- Esquemas Zod 4 de auth, círculos, álbumes, fotos, tags, invitaciones, descargas y actividad
- DTOs con z.infer
- ErrorResponse y ApiResult
- Paginación por cursor
- Función can() pura
- Tests unitarios

### No incluye

- Persistencia
- Endpoints
- UI

## Entregables

- packages/shared/src/schemas/**
- packages/shared/src/permissions.ts
- packages/shared/src/errors.ts
- tests unitarios

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Cada endpoint del contrato tiene request/response Zod.
- **AC-02.** Los DTOs no exponen objectKey ni tokens.
- **AC-03.** can() cubre owner/member × flags × acciones.
- **AC-04.** Los errores tienen code/message/details.
- **AC-05.** La paginación es genérica y testeada.
- **AC-06.** No hay any.

## Pruebas

- Permisos: todas las combinaciones
- Validación de schemas
- Tipos inferidos
- Casos límite de paginación

## Archivos previstos

- `packages/shared/src/**`
- `packages/shared/test/**`

## Verificación

- `pnpm --filter @memora/shared test`
- `pnpm typecheck`

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

Los contratos se congelan antes de implementar API/UI. Cambiarlos requiere aviso.
