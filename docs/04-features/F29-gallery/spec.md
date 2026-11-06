---
id: F29
title: "Galería"
milestone: M4
size: M
status: draft
spec: complete
depends_on:
  - "F21"
  - "F24"
  - "F26"
blocks:
  - "F30"
  - "F33"
design_refs:
  - "assets/design/screens/album-movil-subiendo.png"
  - "assets/design/screens/album-movil-vacio.png"
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
  - "assets/design/screens/fotos-de-una-persona-movil.png"
  - "assets/design/screens/fotos-de-una-persona-movil-vacio.png"
  - "assets/design/screens/fotos-de-una-persona-escritorio.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0006"
---

# F29 — Galería

> **Milestone:** M4 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F21, F24, F26 · **Bloquea:** F30, F33

> **Invariante de portada (F24, 2026-11-05).** F29 elige la portada **entre las fotos del álbum** y la marca con `coverPhotoId` mediante el `PATCH` existente. No sube un objeto aparte (eso es F26) ni necesita un endpoint nuevo: el contrato de F23 ya valida que la foto sea del mismo álbum.

> **Nota (2026-11-06).** `GET /photos/:photoId/image?size=thumb|display|original` **ya no llega con esta feature**: F27 lo adelantó (auditoría A) para mostrar miniaturas en «Mis subidas». F29 usa el endpoint existente y añade `srcset`/`sizes`, el scroll infinito, la selección y el filtro por persona.

> **Nota (2026-11-06, F28).** El **selector de portada del círculo** se traslada a esta feature: F28 deja la portada en solo lectura y F29 añade la elección entre las fotos del círculo, reutilizando `PATCH /circles/:circleId` con `coverPhotoId` (contrato de F17). No se sube un objeto aparte ni se añade endpoint nuevo. Al abrir F29 hay que incorporar esta decisión a su alcance y a sus AC.

## Objetivo

Construir la galería con scroll infinito, selección, filtro por persona y la página «Fotos de esta persona».

> **Nota (2026-11-04):** la página «Fotos de esta persona» se movió desde F22. El visor sigue en F30 y las descargas en F33. F22 no deja un enlace muerto: es F29 quien añade la entrada «Ver sus fotos» en la fila del miembro o en la cabecera de la página.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-subiendo.png](../../../assets/design/screens/album-movil-subiendo.png)
- [assets/design/screens/album-movil-vacio.png](../../../assets/design/screens/album-movil-vacio.png)
- [assets/design/screens/album-escritorio-seleccion-multiple.png](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)
- [assets/design/screens/fotos-de-una-persona-movil.png](../../../assets/design/screens/fotos-de-una-persona-movil.png)
- [assets/design/screens/fotos-de-una-persona-movil-vacio.png](../../../assets/design/screens/fotos-de-una-persona-movil-vacio.png)
- [assets/design/screens/fotos-de-una-persona-escritorio.png](../../../assets/design/screens/fotos-de-una-persona-escritorio.png)

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
- Página «Fotos de esta persona» (`/circles/:circleId/people/:userId/photos`) con cabecera (total y álbumes), chips por álbum, grid infinito con `srcset`, estado vacío y enlace de vuelta

### No incluye

- Visor (F30)
- Descargas (F33)

La página de persona no incluye visor ni descargas: hereda el visor de F30 y la descarga de F33, y solo lista fotos del círculo.

## Entregables

- apps/web/src/features/photos/PhotoGrid.tsx
- PhotoTile
- SelectionBar
- PersonFilter
- Página «Fotos de esta persona» y su ruta
- tests

## UX y estados

- vacío
- vacío de persona
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
- **AC-07.** La página «Fotos de esta persona» muestra solo fotos del círculo, con la cabecera (total y álbumes) y el enlace de vuelta.
- **AC-08.** Chips «Todos» y uno por álbum con su conteo; el filtro no mezcla fotos de otros círculos.
- **AC-09.** Estado vacío propio cuando la persona no aparece en ninguna foto del círculo.
- **AC-10.** Scroll infinito y recorrido con teclado en la página de persona.
- **AC-11.** F29 añade la entrada «Ver sus fotos» en la fila del miembro o en su propia cabecera; no se espera un enlace de F22.

## Pruebas

- RTL galería
- Scroll infinito
- Filtro
- Selección
- Responsive
- Página de persona: chips, vacío y solo del círculo

## Archivos previstos

- `apps/web/src/features/photos/**`
- `apps/web/src/routes/_app.circles.$circleId.people.$userId.photos.tsx`

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
