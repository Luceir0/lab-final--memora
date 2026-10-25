---
id: F20
title: "Invitación SSR + compartir"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F16"
  - "F19"
blocks: []
design_refs:
  - "assets/design/screens/invitacion-movil.png"
  - "assets/design/screens/invitacion-escritorio.png"
  - "assets/design/screens/invitacion-caducada-invalida-ya-eres-miembro.png"
contracts:
  - "docs/03-architecture/render-modes.md"
  - "docs/03-architecture/api-contract.md"
decisions:
  - "ADR-0002"
---

# F20 — Invitación SSR + compartir

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F16, F19 · **Bloquea:** —

## Objetivo

Construir la página de invitación con SSR, Open Graph, compartir y round-trip de auth.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/invitacion-movil.png](../../../assets/design/screens/invitacion-movil.png)
- [assets/design/screens/invitacion-escritorio.png](../../../assets/design/screens/invitacion-escritorio.png)
- [assets/design/screens/invitacion-caducada-invalida-ya-eres-miembro.png](../../../assets/design/screens/invitacion-caducada-invalida-ya-eres-miembro.png)

### Contratos

- [docs/03-architecture/render-modes.md](../../../docs/03-architecture/render-modes.md)
- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)

### Decisiones

- ADR-0002

## Alcance

### Incluye

- Ruta SSR
- Open Graph
- Preview mínima
- Web Share/copy
- Estados inválida/caducada/ya miembro
- Redirect tras login
- Aceptar

### No incluye

- Email real
- UI de personas

## Entregables

- apps/web/src/routes/invite.$token.tsx
- features/invitations/**
- og image genérica

## UX y estados

- válida
- inválida
- caducada
- ya miembro
- aceptando
- error

## Criterios de aceptación

- **AC-01.** SSR genera OG con nombre del círculo.
- **AC-02.** No muestra fotos/miembros.
- **AC-03.** Compartir/copiar funciona.
- **AC-04.** Login conserva token.
- **AC-05.** Aceptar une al círculo.
- **AC-06.** Estados caducada/revocada/ya miembro.
- **AC-07.** Open Graph validado.

## Pruebas

- SSR HTML/OG
- Aceptar
- Redirect
- Estados
- Share mock

## Archivos previstos

- `apps/web/src/routes/invite.$token.tsx`
- `apps/web/src/features/invitations/**`

## Verificación

- `pnpm --filter @memora/web test invitations`
- `curl -s /invite/token | rg "og:"`

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

La preview usa una imagen genérica, nunca la portada del círculo.
