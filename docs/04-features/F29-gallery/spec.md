---
id: F29
title: "Galería"
milestone: M4
size: M
status: draft
spec: complete
depends_on:
  - "F24"
  - "F26"
blocks:
  - "F30"
  - "F33"
design_refs:
  - "assets/design/screens/album-movil-subiendo.png"
  - "assets/design/screens/album-movil-vacio.png"
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0006"
---

# F29 — Galería

> **Milestone:** M4 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F24, F26 · **Bloquea:** F30, F33

## Objetivo

Construir la galería con scroll infinito, selección y filtro por persona.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-subiendo.png](../../../assets/design/screens/album-movil-subiendo.png)
- [assets/design/screens/album-movil-vacio.png](../../../assets/design/screens/album-movil-vacio.png)
- [assets/design/screens/album-escritorio-seleccion-multiple.png](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0006

## Alcance

### Incluye

- PhotoGrid
- PhotoTile
- TanStack Query infinito
- srcset/sizes
- Lazy
- Selección
- SelectionBar
- PersonFilter
- Scroll restaurado
- Estados

### No incluye

- Visor (F30)
- Descargas (F33)

## Entregables

- apps/web/src/features/photos/PhotoGrid.tsx
- PhotoTile
- SelectionBar
- PersonFilter
- tests

## UX y estados

- vacío
- cargando
- error
- seleccionada
- no disponible

## Criterios de aceptación

- **AC-01.** Móvil 3 columnas; escritorio 4–7.
- **AC-02.** Scroll infinito por cursor.
- **AC-03.** Filtro por persona solo del círculo.
- **AC-04.** Selección con clic/Shift/Ctrl.
- **AC-05.** Scroll restaurado.
- **AC-06.** Imágenes adaptadas.

## Pruebas

- RTL galería
- Scroll infinito
- Filtro
- Selección
- Responsive

## Archivos previstos

- `apps/web/src/features/photos/**`

## Verificación

- `pnpm --filter @memora/web test gallery`

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

No cargar todas las fotos de golpe.
