---
id: F22
title: "People web"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F18"
  - "F19"
  - "F20"
  - "F21"
blocks:
  - "F32"
design_refs:
  - "assets/design/screens/personas-movil.png"
  - "assets/design/screens/personas-movil-sin-etiquetas.png"
  - "assets/design/screens/personas-escritorio.png"
  - "assets/design/screens/fotos-de-una-persona-movil.png"
  - "assets/design/screens/fotos-de-una-persona-movil-vacio.png"
  - "assets/design/screens/fotos-de-una-persona-escritorio.png"
contracts:
  - "docs/02-design/screens.md"
decisions: []
---

# F22 — People web

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F18, F19, F20, F21 · **Bloquea:** F32

## Objetivo

Construir Personas, invitaciones pendientes y fotos de esta persona.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/personas-movil.png](../../../assets/design/screens/personas-movil.png)
- [assets/design/screens/personas-movil-sin-etiquetas.png](../../../assets/design/screens/personas-movil-sin-etiquetas.png)
- [assets/design/screens/personas-escritorio.png](../../../assets/design/screens/personas-escritorio.png)
- [assets/design/screens/fotos-de-una-persona-movil.png](../../../assets/design/screens/fotos-de-una-persona-movil.png)
- [assets/design/screens/fotos-de-una-persona-movil-vacio.png](../../../assets/design/screens/fotos-de-una-persona-movil-vacio.png)
- [assets/design/screens/fotos-de-una-persona-escritorio.png](../../../assets/design/screens/fotos-de-una-persona-escritorio.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- MemberList
- InvitePanel
- PendingInvitationRow
- Personas con contador
- Fotos de esta persona
- Estados vacío/carga/error

### No incluye

- Etiquetado (F32)
- Ajustes (F28)

## Entregables

- apps/web/src/routes/_app/circles/$circleId/people/**
- features/members/**

## UX y estados

- vacío
- sin etiquetas
- cargando
- error
- invitación pendiente

## Criterios de aceptación

- **AC-01.** Móvil lista; escritorio más detalle.
- **AC-02.** Invitar comparte/copia.
- **AC-03.** Pendientes visibles solo owner.
- **AC-04.** Contadores correctos.
- **AC-05.** Fotos de esta persona solo del círculo.
- **AC-06.** Estados vacíos.

## Pruebas

- RTL personas
- Invitar
- Pendientes
- Fotos persona
- Responsive

## Archivos previstos

- `apps/web/src/routes/_app/circles/$circleId/people/**`
- `apps/web/src/features/members/**`

## Verificación

- `pnpm --filter @memora/web test members`

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

El botón de invitar se conecta a F20.
