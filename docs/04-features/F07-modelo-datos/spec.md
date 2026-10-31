---
id: F07
title: "Modelo de datos, migraciones y seed"
milestone: M1
size: M
status: accepted
spec: complete
depends_on:
  - "F06"
blocks:
  - "F08"
  - "F15"
  - "F25"
design_refs: []
contracts:
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0004"
---

# F07 — Modelo de datos, migraciones y seed

> **Milestone:** M1 · **Talla:** M · **Estado:** accepted · **Spec:** completa
> **Depende de:** F06 · **Bloquea:** F08, F15, F25

## Objetivo

Implementar el esquema Prisma, migraciones, restricciones, índices y datos de prueba.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0004

## Alcance

### Incluye

- Modelos User, Session, Circle, Membership, Invitation, Album, Photo, PhotoTag, DownloadJob, Activity
- Enums
- Índices y unique constraints
- Migración inicial
- Seed determinista
- Base de datos de test
- Factories

### No incluye

- Endpoints
- UI
- Datos demo definitivos

## Entregables

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/**
- apps/api/prisma/seed.ts
- apps/api/src/test/db.ts

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** prisma migrate dev aplica sin errores.
- **AC-02.** Las relaciones y cascadas son correctas.
- **AC-03.** No existen latitude/longitude en Photo.
- **AC-04.** Activity tiene índices por círculo/fecha.
- **AC-05.** El seed es idempotente.
- **AC-06.** La BD de test se crea y limpia.

## Pruebas

- Migración desde cero
- Constraints de membership y tag
- Cascadas de borrado
- Seed repetido

## Archivos previstos

- `apps/api/prisma/**`
- `apps/api/src/test/db.ts`

## Verificación

- `pnpm --filter @memora/api db:migrate`
- `pnpm --filter @memora/api db:seed`
- `pnpm --filter @memora/api test`

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

No guardar coordenadas GPS. placeName es el único dato de lugar.
