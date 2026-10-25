---
id: F36
title: "Content Island"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F09"
  - "F10"
blocks:
  - "F42"
design_refs:
  - "assets/design/screens/ayuda-movil.png"
  - "assets/design/screens/ayuda-escritorio.png"
  - "assets/design/screens/privacidad-movil.png"
  - "assets/design/screens/privacidad-escritorio.png"
contracts:
  - "docs/03-architecture/external-services.md"
decisions:
  - "ADR-0010"
---

# F36 — Content Island

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F09, F10 · **Bloquea:** F42

## Objetivo

Integrar Content Island para Ayuda, FAQ y Privacidad con snapshot y SSG.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/ayuda-movil.png](../../../assets/design/screens/ayuda-movil.png)
- [assets/design/screens/ayuda-escritorio.png](../../../assets/design/screens/ayuda-escritorio.png)
- [assets/design/screens/privacidad-movil.png](../../../assets/design/screens/privacidad-movil.png)
- [assets/design/screens/privacidad-escritorio.png](../../../assets/design/screens/privacidad-escritorio.png)

### Contratos

- [docs/03-architecture/external-services.md](../../../docs/03-architecture/external-services.md)

### Decisiones

- ADR-0010

## Alcance

### Incluye

- Tipos helpArticle/faqItem/legalPage
- Cliente con snapshot
- Export de snapshot
- Rutas /help y /privacy
- Accordion FAQ
- Build falla si falta snapshot
- MCP/skills

### No incluye

- Edición de contenido desde la app
- Token en cliente

## Entregables

- packages/shared/src/content/**
- apps/web/src/routes/help.tsx
- privacy.tsx
- content-island-snapshot.json

## UX y estados

- carga
- error de build
- FAQ abierta/cerrada

## Criterios de aceptación

- **AC-01.** Tipos tipados y validados.
- **AC-02.** Snapshot versionado.
- **AC-03.** SSG genera HTML.
- **AC-04.** FAQ accesible.
- **AC-05.** Privacidad con slug legalPage.
- **AC-06.** Token solo build.
- **AC-07.** Build falla sin snapshot.

## Pruebas

- Validación de snapshot
- Build SSG
- RTL Help/Privacy
- axe

## Archivos previstos

- `packages/shared/src/content/**`
- `apps/web/src/routes/help.tsx`
- `apps/web/src/routes/privacy.tsx`
- `content-island-snapshot.json`

## Verificación

- `pnpm --filter @memora/web build`
- `pnpm --filter @memora/web test content`

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

Se necesitan proyecto y token; se solicitan al iniciar. No bloquea el diseño.
