---
id: F30
title: "Visor de foto"
milestone: M4
size: L
status: draft
spec: complete
depends_on:
  - "F29"
blocks:
  - "F31"
  - "F32"
  - "F33"
design_refs:
  - "assets/design/screens/foto-movil.png"
  - "assets/design/screens/foto-movil-cargando.png"
  - "assets/design/screens/foto-movil-no-disponible.png"
  - "assets/design/screens/foto-escritorio-modal.png"
contracts:
  - "docs/03-architecture/render-modes.md"
  - "docs/02-design/components.md"
decisions:
  - "ADR-0002"
  - "ADR-0011"
---

# F30 — Visor de foto

> **Milestone:** M4 · **Talla:** L · **Estado:** draft · **Spec:** completa
> **Depende de:** F29 · **Bloquea:** F31, F32, F33

## Objetivo

Construir el visor móvil/escritorio con navegación, detalles y accesibilidad.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/foto-movil.png](../../../assets/design/screens/foto-movil.png)
- [assets/design/screens/foto-movil-cargando.png](../../../assets/design/screens/foto-movil-cargando.png)
- [assets/design/screens/foto-movil-no-disponible.png](../../../assets/design/screens/foto-movil-no-disponible.png)
- [assets/design/screens/foto-escritorio-modal.png](../../../assets/design/screens/foto-escritorio-modal.png)

### Contratos

- [docs/03-architecture/render-modes.md](../../../docs/03-architecture/render-modes.md)
- [docs/02-design/components.md](../../../docs/02-design/components.md)

### Decisiones

- ADR-0002
- ADR-0011

## Alcance

### Incluye

- Ruta propia
- Modal escritorio
- Fullscreen móvil
- Teclado/flechas/Esc
- Swipe con alternativa
- Panel de detalles
- Loading/no disponible
- Restaurar scroll

### No incluye

- Edición de metadatos (F31)
- Etiquetas (F32)

## Entregables

- apps/web/src/routes/_app/.../photos/$photoId.tsx
- features/photos/viewer/**

## UX y estados

- cargando
- no disponible
- detalles
- siguiente/anterior

## Criterios de aceptación

- **AC-01.** Móvil fullscreen; escritorio modal.
- **AC-02.** Atrás cierra y conserva scroll.
- **AC-03.** Flechas y Esc.
- **AC-04.** Swipe con botones.
- **AC-05.** Foco gestionado.
- **AC-06.** Detalles con autor/fecha/lugar.
- **AC-07.** Imagen no disponible.

## Pruebas

- RTL visor
- Teclado
- Swipe alternativo
- Foco
- E2E

## Archivos previstos

- `apps/web/src/routes/_app/**/photos/$photoId.tsx`
- `apps/web/src/features/photos/viewer/**`

## Verificación

- `pnpm --filter @memora/web test viewer`
- `Revisar móvil/escritorio`

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

La ruta permite compartir enlace privado.
