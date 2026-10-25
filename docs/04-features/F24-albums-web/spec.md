---
id: F24
title: "Albums web"
milestone: M3
size: M
status: draft
spec: complete
depends_on:
  - "F18"
  - "F23"
blocks:
  - "F26"
  - "F29"
design_refs:
  - "assets/design/screens/album-movil-vacio.png"
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
  - "assets/design/screens/crear-album-movil-guardando.png"
  - "assets/design/screens/crear-album-escritorio-validacion-y-error.png"
  - "assets/design/screens/circulo-movil.png"
contracts:
  - "docs/02-design/screens.md"
decisions: []
---

# F24 — Albums web

> **Milestone:** M3 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F18, F23 · **Bloquea:** F26, F29

## Objetivo

Construir creación, detalle y cabecera de álbum con estados.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-vacio.png](../../../assets/design/screens/album-movil-vacio.png)
- [assets/design/screens/album-escritorio-seleccion-multiple.png](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)
- [assets/design/screens/crear-album-movil-guardando.png](../../../assets/design/screens/crear-album-movil-guardando.png)
- [assets/design/screens/crear-album-escritorio-validacion-y-error.png](../../../assets/design/screens/crear-album-escritorio-validacion-y-error.png)
- [assets/design/screens/circulo-movil.png](../../../assets/design/screens/circulo-movil.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- AlbumForm
- AlbumHeader
- AlbumGrid base
- Estados vacío/carga/error
- Guardando
- Validación

### No incluye

- Visor (F30)
- Subidas (F26)

## Entregables

- apps/web/src/routes/_app/circles/$circleId/albums/**
- features/albums/**

## UX y estados

- vacío
- cargando
- error
- guardando
- validación

## Criterios de aceptación

- **AC-01.** Crear álbum valida y guarda.
- **AC-02.** Detalle muestra metadatos.
- **AC-03.** Móvil una columna; escritorio rejilla.
- **AC-04.** Estado vacío guía a subir.
- **AC-05.** Errores comprensibles.
- **AC-06.** Teclado y foco.

## Pruebas

- RTL formulario
- Detalle
- Estados
- Responsive

## Archivos previstos

- `apps/web/src/routes/_app/circles/$circleId/albums/**`
- `apps/web/src/features/albums/**`

## Verificación

- `pnpm --filter @memora/web test albums`

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

La galería real llega en F29.
