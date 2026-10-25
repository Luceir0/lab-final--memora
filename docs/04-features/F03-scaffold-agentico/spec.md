---
id: F03
title: "Scaffold agéntico"
milestone: M0
size: M
status: done
spec: complete
depends_on:
  - "F02"
blocks:
  - "F04"
design_refs: []
contracts:
  - "AGENTS.md"
  - "docs/06-process/"
decisions: []
---

# F03 — Scaffold agéntico

> **Milestone:** M0 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F02 · **Bloquea:** F04

## Objetivo

Crear la estructura de agentes, comandos, skills y specs para que cada feature sea ejecutable por un subagente sin depender de la conversación.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [AGENTS.md](../../../AGENTS.md)
- [docs/06-process/](../../../docs/06-process/)

### Decisiones

- No aplica.

## Alcance

### Incluye

- AGENTS.md
- opencode.jsonc
- CLAUDE.md
- 10 agentes
- 10 comandos
- 6 skills
- Plantillas de spec/tasks/handoff
- 43 specs
- Tablero de estado

### No incluye

- Código de app
- Dependencias
- CI (F04)

## Entregables

- AGENTS.md
- .opencode/agents/*
- .opencode/commands/*
- .opencode/skills/*
- docs/04-features/**

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** opencode.jsonc es JSONC válido.
- **AC-02.** Todos los agentes tienen descripción, modo y permisos.
- **AC-03.** Todos los comandos tienen plantilla y propósito.
- **AC-04.** Las skills tienen descripción y contenido accionable.
- **AC-05.** Cada feature tiene spec, tasks y handoff.
- **AC-06.** El tablero enlaza las 43 features.
- **AC-07.** Un subagente puede trabajar con AGENTS.md + spec + contratos.

## Pruebas

- Validar JSONC con Node
- Comprobar que cada feature tiene 3 archivos
- Revisar que no hay enlaces rotos

## Archivos previstos

- `AGENTS.md`
- `opencode.jsonc`
- `CLAUDE.md`
- `.opencode/**`
- `docs/04-features/**`

## Verificación

- `node scripts/validate-agents.mjs` (se implementa en F04)
- `find docs/04-features -name spec.md | wc -l`
- `rg -n "TODO" AGENTS.md .opencode docs/04-features`

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

Este scaffold no implementa la app. F04 empieza el monorepo.
