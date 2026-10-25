---
id: F13
title: "App shell y navegación adaptativa"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F11"
  - "F12"
blocks:
  - "F14"
  - "F16"
design_refs:
  - "assets/design/screens/mis-circulos-movil.png"
  - "assets/design/screens/mis-circulos-escritorio.png"
  - "assets/design/screens/circulo-movil-cabecera-compacta.png"
contracts:
  - "docs/02-design/responsive.md"
  - "docs/02-design/components.md"
decisions: []
---

# F13 — App shell y navegación adaptativa

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F11, F12 · **Bloquea:** F14, F16

## Objetivo

Construir el esqueleto de navegación móvil/escritorio con safe areas, tema y accesibilidad.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/mis-circulos-movil.png](../../../assets/design/screens/mis-circulos-movil.png)
- [assets/design/screens/mis-circulos-escritorio.png](../../../assets/design/screens/mis-circulos-escritorio.png)
- [assets/design/screens/circulo-movil-cabecera-compacta.png](../../../assets/design/screens/circulo-movil-cabecera-compacta.png)

### Contratos

- [docs/02-design/responsive.md](../../../docs/02-design/responsive.md)
- [docs/02-design/components.md](../../../docs/02-design/components.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- AppShell
- BottomNav (Círculos, Subir, Perfil)
- Sidebar (Mis círculos, Subidas, círculos, Ayuda, Privacidad)
- TopBar
- ThemeToggle
- Safe areas
- Skip link
- Estado activo

### No incluye

- Pantallas de producto
- Lógica de auth

## Entregables

- apps/web/src/components/AppShell.tsx
- BottomNav
- Sidebar
- TopBar
- ThemeToggle

## UX y estados

- móvil
- tablet
- escritorio
- tema claro/oscuro
- ruta activa

## Criterios de aceptación

- **AC-01.** Móvil usa bottom nav; escritorio sidebar.
- **AC-02.** Subir es alcanzable con el pulgar.
- **AC-03.** Safe areas respetadas.
- **AC-04.** Ruta activa con aria-current.
- **AC-05.** Skip link funciona.
- **AC-06.** No hay dos árboles duplicados.
- **AC-07.** Navegación con teclado.

## Pruebas

- Responsive
- aria-current
- Skip link
- Tema

## Archivos previstos

- `apps/web/src/components/layout/**`
- `apps/web/src/routes/_app.tsx`

## Verificación

- `pnpm --filter @memora/web test`
- `Revisar 375/768/1440`

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

Subidas y Actividad se añaden en F27/F35.
