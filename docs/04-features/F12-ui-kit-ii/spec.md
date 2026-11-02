---
id: F12
title: "UI kit II: overlays y feedback"
milestone: M1
size: M
status: accepted
spec: complete
depends_on:
  - "F10"
blocks:
  - "F13"
design_refs:
  - "assets/design/design-system-v0.1.png"
  - "assets/design/screens/etiquetar-movil.png"
  - "assets/design/screens/cola-de-subida-movil.png"
contracts:
  - "docs/02-design/components.md"
decisions:
  - "ADR-0011"
---

# F12 — UI kit II: overlays y feedback

> **Milestone:** M1 · **Talla:** M · **Estado:** accepted · **Spec:** completa
> **Depende de:** F10 · **Bloquea:** F13

## Objetivo

Implementar diálogos, hojas, menús, tabs, acordeón y feedback.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/design-system-v0.1.png](../../../assets/design/design-system-v0.1.png)
- [assets/design/screens/etiquetar-movil.png](../../../assets/design/screens/etiquetar-movil.png)
- [assets/design/screens/cola-de-subida-movil.png](../../../assets/design/screens/cola-de-subida-movil.png)

### Contratos

- [docs/02-design/components.md](../../../docs/02-design/components.md)

### Decisiones

- ADR-0011

## Alcance

### Incluye

- Dialog, ConfirmDialog
- BottomSheet, ResponsiveDialog
- Menu, Tabs, Accordion
- Toast, InlineAlert
- EmptyState, Breadcrumb, Tooltip
- VisuallyHidden

### No incluye

- Lógica de producto
- Formularios

### Decisiones de arranque

Acordadas con el usuario el 2026-11-02 al abrir la feature:

1. **Alcance completo de la spec.** `Tabs`, `Accordion`, `EmptyState` y `Breadcrumb` se
   implementan en F12. La asignación anterior del tablero (Breadcrumb en F13; Tabs,
   EmptyState y Accordion en la primera feature que los usara) queda anulada.
2. **`VisuallyHidden` no se duplica.** Ya existe desde F11; se reutiliza y se documenta como
   dependencia interna.
3. **Sin `<dialog>` nativo.** jsdom 30.1.3 no implementa `showModal`/`close` (comprobado con
   `JSDOM`), así que un `<dialog>` modal no sería testeable. Se usa un overlay propio con
   `role="dialog"`, `aria-modal="true"`, trampa de foco explícita, `Esc` y retorno al
   disparador.
4. **`BottomSheet` arrastrable, pero no solo gesto.** El arrastre con puntero es una mejora;
   el cierre siempre tiene botón visible y `Esc`, conforme a «alternativa a gestos».
5. **`ResponsiveDialog` sin duplicar árboles.** Una sola implementación decide por
   `matchMedia('(min-width: 768px)')`; en tests se simula `matchMedia`, como ya hace
   `apps/web`.
6. **Toasts con temporizador explícito** y `role="status"` (`alert` cuando es error), sin
   tapar el elemento con foco (2.4.11).
7. **Deudas de F11 fuera de alcance.** `ThemeToggle` (ya implementado en `apps/web`) se
   integra en F13/F34 y los chips de producto en F13/F14.
8. **Catálogo `/ui`.** Se amplía `apps/web/src/features/dev/ui-showcase.tsx` para poder
   revisar los overlays con teclado y auditarlos en navegador real; sigue siendo solo de
   desarrollo.

### Decisiones de diseño y correcciones (2026-11-02)

Tomadas con el usuario y las auditorías durante la implementación:

1. **CTA destructiva en rojo suave.** `ConfirmDialog` usa una única piel para acciones
   destructivas: `variant="danger"` (borde y texto rojos sobre fondo rojo claro) con papelera
   cuando `danger`; el resto de confirmaciones usan `primary`. Cancelar va sobre `surface-2`
   sin borde. Decisión del usuario el 2026-11-02, que sustituye la CTA inversa de
   `ajustes-movil-eliminar.png`: el rojo sólido y la CTA inversa para borrar quedan
   descartados en toda la app.
2. **`ConfirmDialog` responsive.** Hoja por debajo de 768 px y diálogo desde 768, con un solo
   contenido; el foco inicial va a Cancelar.
3. **Borde del panel en oscuro.** `border-strong` solo en el borde de `Dialog`/`BottomSheet`
   en tema oscuro (3,86:1 contra el panel); el token global no cambia.
4. **`snapPoints` → `maxHeightPercent`.** La hoja no tiene paradas intermedias: el valor fija
   la altura máxima (10–90 % de `dvh`) y el arrastre solo cierra. Contrato actualizado en
   `docs/02-design/components.md`.
5. **`Tabs` y `Accordion` según las pantallas.** Píldora activa con icono y contador en
   `Tabs`; tarjetas independientes, chevron circular y respuesta a 16 px en `Accordion`.
6. **Toast inverso con icono monocromo**, cierre de 36 px visibles y 44 px de área táctil;
   foco con `on-inverse` para no bajar de 3:1 en oscuro. El viewport no declara regiones
   vivas y ajusta `scroll-padding-bottom` mientras hay avisos (2.4.11).
7. **Apilado de overlays por secuencia de apertura**, no por tipo: una hoja abierta sobre un
   diálogo se pinta encima y `Esc` cierra solo la capa superior.

## Entregables

- packages/ui/src/components/**
- tests de foco y teclado

## UX y estados

- abierto
- cerrando
- foco
- Esc
- arrastrando

## Criterios de aceptación

- **AC-01.** Dialog tiene aria-modal, foco inicial y retorno.
- **AC-02.** BottomSheet tiene alternativa con botón.
- **AC-03.** Menu funciona con flechas y Esc.
- **AC-04.** Tabs usa tablist/tab/tabpanel.
- **AC-05.** Accordion usa aria-expanded/controls.
- **AC-06.** Toast es status; error es alert.
- **AC-07.** axe sin errores.

## Pruebas

- Foco
- Teclado
- Esc
- ResponsiveDialog
- axe

## Archivos previstos

- `packages/ui/src/components/**`

## Verificación

- `pnpm --filter @memora/ui test`
- `Revisar con teclado`

## Definition of Ready

- [x] Dependencias `done`. F10 está `done` (y F11 también, que aporta `VisuallyHidden` y
      los controles que usan los overlays).
- [x] Decisiones resueltas: ver «Decisiones de arranque» (2026-11-02).
- [x] Contratos congelados: `docs/02-design/components.md` define props, estados y
      accesibilidad de los doce componentes.
- [x] Diseño enlazado: sistema de diseño v0.1, `etiquetar-movil.png` (hoja), `cola-de-subida-movil.png` (progreso y feedback), `ajustes-movil-eliminar.png` y `ajustes-escritorio-eliminar.png` (confirmación destructiva y modal de escritorio), `circulo-movil.png` (tabs) y `ayuda-movil.png` (acordeón).
- [x] Datos de prueba: el catálogo `/ui` cubre todos los estados con datos locales.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. `ResponsiveDialog` decide por media query y no duplica árboles (decisión 5).
