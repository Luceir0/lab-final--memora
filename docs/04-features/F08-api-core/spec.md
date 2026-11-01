---
id: F08
title: "API core"
milestone: M1
size: M
status: accepted
spec: complete
depends_on:
  - "F06"
  - "F07"
blocks:
  - "F15"
  - "F17"
  - "F25"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F08 — API core

> **Milestone:** M1 · **Talla:** M · **Estado:** accepted · **Spec:** completa
> **Depende de:** F06, F07 · **Bloquea:** F15, F17, F25

## Objetivo

Crear el esqueleto de Fastify con configuración, plugins, errores, OpenAPI y harness de tests.

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

- Bootstrap Fastify
- Config con Zod
- Cookie, CSRF, helmet, rate limit, multipart
- Error handler uniforme
- Healthcheck
- OpenAPI
- Pino con redacción
- Harness fastify.inject
- Fakes de servicios

### No incluye

- Módulos de producto
- UI

## Entregables

- apps/api/src/server.ts
- apps/api/src/app.ts
- apps/api/src/plugins/**
- apps/api/src/errors.ts
- apps/api/src/test/harness.ts

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** GET /api/health responde sin datos sensibles.
- **AC-02.** Un error de validación devuelve 400 uniforme.
- **AC-03.** Un error interno no filtra stack en producción.
- **AC-04.** OpenAPI se genera.
- **AC-05.** Los tests usan inject sin puerto.
- **AC-06.** Los logs redactan cookies y secretos.

## Pruebas

- Health
- Validación
- 404
- Error handler
- OpenAPI

## Archivos previstos

- `apps/api/src/**`

## Verificación

- `pnpm --filter @memora/api test`
- `pnpm --filter @memora/api build`
- `curl localhost:3001/api/health`

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

La API no habla con la UI. Los tests no llaman a servicios reales.
