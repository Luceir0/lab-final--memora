---
id: F37
title: "Infraestructura de tests"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F06"
  - "F09"
blocks:
  - "F38"
design_refs: []
contracts:
  - "docs/05-quality/strategy.md"
  - "docs/05-quality/test-matrix.md"
decisions: []
---

# F37 — Infraestructura de tests

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F06, F09 · **Bloquea:** F38

## Objetivo

Consolidar Vitest, RTL, MSW, Postgres de test, Playwright y axe con CI.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/05-quality/strategy.md](../../../docs/05-quality/strategy.md)
- [docs/05-quality/test-matrix.md](../../../docs/05-quality/test-matrix.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Config Vitest
- Setup RTL
- MSW handlers
- Fixtures/factories
- BD de test
- Playwright desktop/mobile
- axe
- CI matrix
- Cobertura

### No incluye

- Tests de features concretas
- Carga

## Entregables

- vitest.config.ts
- apps/web/src/test/**
- apps/api/src/test/**
- e2e/**
- .github/workflows/ci.yml

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** pnpm test ejecuta todos los niveles.
- **AC-02.** MSW reutiliza contratos.
- **AC-03.** Playwright arranca web+api.
- **AC-04.** axe corre en páginas clave.
- **AC-05.** CI reproduce local.
- **AC-06.** Cobertura se reporta.

## Pruebas

- Smoke de infraestructura
- Un test por nivel
- CI

## Archivos previstos

- `vitest.config.ts`
- `apps/web/src/test/**`
- `apps/api/src/test/**`
- `e2e/**`
- `.github/workflows/ci.yml`

## Verificación

- `pnpm test`
- `pnpm test:e2e`
- `CI`

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

F37 puede empezar antes de F29; no bloquea features.
