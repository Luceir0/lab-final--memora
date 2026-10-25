---
id: F32
title: "Etiquetado"
milestone: M4
size: M
status: draft
spec: complete
depends_on:
  - "F22"
  - "F30"
blocks: []
design_refs:
  - "assets/design/screens/etiquetar-movil.png"
  - "assets/design/screens/etiquetar-movil-sin-resultados.png"
  - "assets/design/screens/etiquetar-escritorio-guardando.png"
  - "assets/design/screens/fotos-de-una-persona-movil.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F32 — Etiquetado

> **Milestone:** M4 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F22, F30 · **Bloquea:** —

## Objetivo

Etiquetar miembros en fotos y filtrar “fotos de esta persona”.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/etiquetar-movil.png](../../../assets/design/screens/etiquetar-movil.png)
- [assets/design/screens/etiquetar-movil-sin-resultados.png](../../../assets/design/screens/etiquetar-movil-sin-resultados.png)
- [assets/design/screens/etiquetar-escritorio-guardando.png](../../../assets/design/screens/etiquetar-escritorio-guardando.png)
- [assets/design/screens/fotos-de-una-persona-movil.png](../../../assets/design/screens/fotos-de-una-persona-movil.png)

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- POST/DELETE tags
- TagPeopleSheet/Dialog
- Buscador
- Solo miembros
- Optimistic update
- Fotos de persona
- Estados

### No incluye

- Reconocimiento facial
- Etiquetas externas

## Entregables

- apps/api/src/modules/photos/tags.ts
- apps/web/src/features/photos/tags/**

## UX y estados

- sin resultados
- guardando
- error
- optimista

## Criterios de aceptación

- **AC-01.** Solo miembros del círculo.
- **AC-02.** No duplicar.
- **AC-03.** Optimista con rollback.
- **AC-04.** Filtro solo del círculo.
- **AC-05.** Accesible como lista.
- **AC-06.** Quitar etiqueta.

## Pruebas

- API tags
- Permisos
- Optimista/rollback
- Filtro
- A11y

## Archivos previstos

- `apps/api/src/modules/photos/tags.ts`
- `apps/web/src/features/photos/tags/**`

## Verificación

- `pnpm --filter @memora/api test tags`
- `pnpm --filter @memora/web test tags`

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

Las etiquetas de un miembro expulsado se eliminan.
