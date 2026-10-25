---
id: F10
title: "Sistema visual y tema"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F09"
blocks:
  - "F11"
  - "F12"
  - "F14"
  - "F36"
design_refs:
  - "assets/design/design-system-v0.1.png"
  - "assets/design/screens/mis-circulos-movil.png"
  - "assets/design/screens/perfil-movil.png"
contracts:
  - "docs/02-design/tokens.md"
  - "docs/02-design/principles.md"
decisions:
  - "ADR-0003"
  - "ADR-0011"
---

# F10 — Sistema visual y tema

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F09 · **Bloquea:** F11, F12, F14, F36

## Objetivo

Implementar tokens, Tailwind 4, temas claro/oscuro/sistema, fuente, iconos y ausencia de destello.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/design-system-v0.1.png](../../../assets/design/design-system-v0.1.png)
- [assets/design/screens/mis-circulos-movil.png](../../../assets/design/screens/mis-circulos-movil.png)
- [assets/design/screens/perfil-movil.png](../../../assets/design/screens/perfil-movil.png)

### Contratos

- [docs/02-design/tokens.md](../../../docs/02-design/tokens.md)
- [docs/02-design/principles.md](../../../docs/02-design/principles.md)

### Decisiones

- ADR-0003
- ADR-0011

## Alcance

### Incluye

- tokens.css
- @theme de Tailwind 4
- data-theme
- Resolución de sistema en servidor
- Cookie de tema
- theme-color
- Plus Jakarta Sans
- Lucide
- Focus visible
- prefers-reduced-motion

### No incluye

- Componentes (F11/F12)
- App shell (F13)

## Entregables

- packages/ui/src/styles/tokens.css
- packages/ui/src/styles/theme.css
- apps/web/src/lib/theme.ts
- ThemeProvider

## UX y estados

- Claro
- Oscuro
- Sistema
- Sin destello

## Criterios de aceptación

- **AC-01.** Los tokens se usan vía utilidades Tailwind.
- **AC-02.** No hay hex sueltos en componentes.
- **AC-03.** El tema persiste en cookie.
- **AC-04.** Sistema sigue prefers-color-scheme.
- **AC-05.** No hay destello al cargar.
- **AC-06.** theme-color cambia con el tema.
- **AC-07.** Funciona con reduced motion.

## Pruebas

- ThemeProvider
- Cookie
- SSR sin destello
- Contraste inicial

## Archivos previstos

- `packages/ui/src/styles/**`
- `apps/web/src/lib/theme.ts`
- `apps/web/src/components/ThemeProvider.tsx`

## Verificación

- `pnpm --filter @memora/ui test`
- `pnpm --filter @memora/web test`
- `Revisar en claro/oscuro`

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

La fuente se sirve self-hosted si es posible; si no, documentar Google Fonts.
