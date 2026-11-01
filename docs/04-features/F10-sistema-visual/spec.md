---
id: F10
title: "Sistema visual y tema"
milestone: M1
size: M
status: review
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

> **Milestone:** M1 · **Talla:** M · **Estado:** review · **Spec:** completa
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

- [x] Dependencias `done`. F09 está `done` (PR #5, merge `9fd987e` en `main`).
- [x] Decisiones resueltas. ADR-0003 y ADR-0011 aceptadas; las siete decisiones de arranque están abajo, aprobadas por el usuario el 2026-11-01.
- [x] Contratos congelados. `docs/02-design/tokens.md` y `docs/02-design/principles.md`; los cambios de contrato aprobados se registran en las decisiones 4 y 5.
- [x] Diseño enlazado. Sistema de diseño v0.1, `mis-circulos-movil.png` y `perfil-movil.png` (control «Apariencia»).
- [x] Datos de prueba. No aplica: los tests usan fixtures, cookie y `matchMedia` simulados.
- [x] Sin preguntas bloqueantes. Resueltas el 2026-11-01.

## Decisiones de arranque (2026-11-01)

Aprobadas por el usuario («opción A» en las siete):

1. **Fuente self-hosted vendorizada.** Los `.woff2` de Plus Jakarta Sans viven en `apps/web/public/fonts/` con su `OFL.txt`; `packages/ui/src/styles/fonts.css` declara `@font-face` y la app añade `preload`. No se añade dependencia de fuentes ni se usa Google Fonts.
2. **«Sistema» sin destello con script mínimo en `<head>`.** El servidor resuelve el modo explícito desde la cookie `memora-theme` (`light|dark|system`); un script de arranque anterior al primer pintado aplica `prefers-color-scheme` cuando el modo es `system` y actualiza `theme-color`. `<html>` lleva `suppressHydrationWarning` por ese ajuste y el script queda anotado para el hash/nonce de CSP en F42.
3. **Iconos y control de tema.** `lucide-react` se instala en `apps/web` (no en `packages/ui`); `ThemeToggle` se implementa en `apps/web/src/components/` y se monta de forma provisional en el placeholder `/circles` con `TODO(F11/F34)`, para poder verificar los AC en navegador. `components.md` ya ubica `ThemeToggle` en `apps/web`.
4. **Contraste de estados.** Se añaden `--color-success-text`, `--color-warning-text` y `--color-info-text` (claro: `#145C3D`, `#8A4510`, `#1C4F8A`; oscuro: los valores base, que ya superan AA). Los bordes de input quedan para F11 con candidato `#8E8CA6` en claro.
5. **Breakpoints y tipografía móvil.** `sm/md/lg/xl` = 480/768/1024/1280 px y `h1` móvil 26/32 px, alineados con `tokens.md`.
6. **Verificación de `packages/ui`.** Se añade Vitest (solo entorno Node) y el script `test`; el contrato de tokens se prueba en `packages/ui/src/styles/` y `apps/web` conserva los tests de integración de su CSS.
7. **Rama y entrega.** Rama `feat/F10-sistema-visual`, commits convencionales, push y PR a `main`; el merge solo con CI en verde y autorización explícita del usuario.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. La fuente se sirve self-hosted y vendorizada (decisión 1).
