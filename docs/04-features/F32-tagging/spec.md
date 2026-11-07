---
id: F32
title: "Etiquetado"
milestone: M4
size: M
status: done
spec: complete
depends_on:
  - "F22"
  - "F30"
blocks: []
design_refs:
  - "assets/design/screens/etiquetar-movil.png"
  - "assets/design/screens/etiquetar-movil-sin-resultados.png"
  - "assets/design/screens/etiquetar-escritorio-guardando.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F32 — Etiquetado

> **Milestone:** M4 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F22, F30 · **Bloquea:** —

## Objetivo

Etiquetar miembros en fotos y mantener el filtro por persona en el visor y la galería.

> **Nota (2026-11-04):** la página «Fotos de esta persona» vive en F29. F32 solo etiqueta y mantiene el filtro por persona en el visor/galería; no construye esa página.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/etiquetar-movil.png](../../../assets/design/screens/etiquetar-movil.png)
- [assets/design/screens/etiquetar-movil-sin-resultados.png](../../../assets/design/screens/etiquetar-movil-sin-resultados.png)
- [assets/design/screens/etiquetar-escritorio-guardando.png](../../../assets/design/screens/etiquetar-escritorio-guardando.png)

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

- [x] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [x] Decisiones resueltas (G1 del 2026-11-07: permiso simétrico, `POST` idempotente, buscador en cliente, UI en el visor, caché optimista).
- [x] Contratos congelados (`tags.ts` y `photoTagDtoSchema`; solo se documentó el `200` idempotente).
- [x] Diseño enlazado (móvil, sin resultados y escritorio guardando).
- [x] Datos de prueba (`makeTag`, `makeUser`, `makeMembership`, `makePhoto`).
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. «Las etiquetas de un miembro expulsado se eliminan» ya estaba implementado en F21 y se ha reforzado en F32 con el orden de locks `Membership → PhotoTag` para cerrar la carrera etiquetar/expulsar (m-06).
