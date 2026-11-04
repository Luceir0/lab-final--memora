---
id: F20
title: "Invitación SSR + compartir"
milestone: M2
size: M
status: done
spec: complete
depends_on:
  - "F16"
  - "F19"
blocks:
  - "F22"
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

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F16, F19 · **Bloquea:** F22

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

- `pnpm --filter @memora/web test invite`
- `curl -s /invite/token | rg "og:"`

## Definition of Ready

- [x] Dependencias `done`: F16 y F19.
- [x] Decisiones resueltas (D1–D5).
- [x] Contratos congelados: `GET /invitations/:token` y `POST /invitations/:token/accept`.
- [x] Diseño enlazado (móvil, escritorio y estados).
- [x] Datos de prueba: seed de F07 más invitación creada con la API.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna.

## Decisiones cerradas (2026-11-04)

| # | Decisión |
| --- | --- |
| D1 | Revocar una invitación ya aceptada sigue siendo **no-op** y el enlace es reutilizable hasta caducar. Sin cambios en la API ni en el contrato de F19. |
| D2 | La imagen `og:image` es **genérica** (1200×630), generada por script: fondo primario, anillos y punto del logotipo, **sin texto**. El nombre del círculo viaja en `og:title`. Nunca la portada del círculo. |
| D3 | **AC-07** se cierra con test automatizado del HTML del servidor y `curl` local. La comprobación en validadores externos (Facebook Sharing Debugger, LinkedIn Post Inspector) queda pendiente para **F42**, cuando exista URL pública con HTTPS. |
| D4 | El helper de compartir/copiar se implementa y se prueba en F20. Su botón visible llega en **F22**, donde el dueño genera el enlace; la página de invitación no se desvía del diseño. |
| D5 | Sin sesión se muestra la misma tarjeta con la preview y el CTA «Entrar para aceptar», que navega a `/login?redirect=/invite/<token>`. Se conserva el SSR y el Open Graph. |
