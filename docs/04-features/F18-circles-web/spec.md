---
id: F18
title: "Circles web"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F16"
  - "F17"
blocks:
  - "F22"
  - "F24"
  - "F28"
design_refs:
  - "assets/design/screens/mis-circulos-movil.png"
  - "assets/design/screens/mis-circulos-movil-vacio.png"
  - "assets/design/screens/mis-circulos-movil-cargando.png"
  - "assets/design/screens/mis-circulos-escritorio.png"
  - "assets/design/screens/mis-circulos-escritorio-error.png"
  - "assets/design/screens/circulo-movil.png"
  - "assets/design/screens/circulo-movil-sin-albumes-recien-creado.png"
  - "assets/design/screens/circulo-escritorio.png"
  - "assets/design/screens/circulo-escritorio-sin-acceso.png"
  - "assets/design/screens/crear-circulo-movil-validacion.png"
  - "assets/design/screens/crear-circulo-escritorio-guardando.png"
  - "assets/design/screens/crear-circulo-escritorio-error.png"
contracts:
  - "docs/02-design/screens.md"
decisions: []
---

# F18 — Circles web

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F16, F17 · **Bloquea:** F22, F24, F28

## Objetivo

Construir Mis círculos, crear círculo y detalle con estados.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/mis-circulos-movil.png](../../../assets/design/screens/mis-circulos-movil.png)
- [assets/design/screens/mis-circulos-movil-vacio.png](../../../assets/design/screens/mis-circulos-movil-vacio.png)
- [assets/design/screens/mis-circulos-movil-cargando.png](../../../assets/design/screens/mis-circulos-movil-cargando.png)
- [assets/design/screens/mis-circulos-escritorio.png](../../../assets/design/screens/mis-circulos-escritorio.png)
- [assets/design/screens/mis-circulos-escritorio-error.png](../../../assets/design/screens/mis-circulos-escritorio-error.png)
- [assets/design/screens/circulo-movil.png](../../../assets/design/screens/circulo-movil.png)
- [assets/design/screens/circulo-movil-sin-albumes-recien-creado.png](../../../assets/design/screens/circulo-movil-sin-albumes-recien-creado.png)
- [assets/design/screens/circulo-escritorio.png](../../../assets/design/screens/circulo-escritorio.png)
- [assets/design/screens/circulo-escritorio-sin-acceso.png](../../../assets/design/screens/circulo-escritorio-sin-acceso.png)
- [assets/design/screens/crear-circulo-movil-validacion.png](../../../assets/design/screens/crear-circulo-movil-validacion.png)
- [assets/design/screens/crear-circulo-escritorio-guardando.png](../../../assets/design/screens/crear-circulo-escritorio-guardando.png)
- [assets/design/screens/crear-circulo-escritorio-error.png](../../../assets/design/screens/crear-circulo-escritorio-error.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Lista y destacado
- Crear círculo
- Detalle con pestañas
- Cabecera compacta
- Estados vacío/carga/error
- Sin acceso
- Stats

### No incluye

- Álbumes (F24)
- Ajustes (F28)
- Actividad (F35)

## Entregables

- apps/web/src/routes/_app/circles/**
- features/circles/**

## UX y estados

- vacío
- cargando
- error
- guardando
- sin acceso

## Criterios de aceptación

- **AC-01.** Móvil una columna; escritorio rejilla.
- **AC-02.** Estado vacío guía a crear.
- **AC-03.** Crear valida y guarda.
- **AC-04.** Detalle muestra miembros/stats.
- **AC-05.** Cabecera compacta al hacer scroll.
- **AC-06.** Sin acceso no filtra datos.
- **AC-07.** Todo con teclado.

## Pruebas

- RTL lista/crear/detalle
- MSW
- Responsive
- Estados

## Archivos previstos

- `apps/web/src/routes/_app/circles/**`
- `apps/web/src/features/circles/**`

## Verificación

- `pnpm --filter @memora/web test circles`
- `Revisar 375/1440`

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

Actividad se añade en F35.
