---
name: Memora Design System
description: Tokens, componentes, responsive, temas y reglas visuales de Memora.
---

# Sistema de diseño de Memora

## Reglas

- Nunca un hex, radio o sombra fuera de un token.
- La fotografía manda; el color fuerte se reserva para la acción principal.
- Una sola familia: Plus Jakarta Sans.
- Claro y oscuro se construyen con los mismos tokens semánticos.
- Oscuro no es negro: fondos azul-negro y superficies elevadas.
- Movimiento discreto; respeta `prefers-reduced-motion`.

## Responsive

- Móvil 320–767: una columna, bottom nav.
- Tablet 768–1023: 2–3 columnas, bottom nav o rail.
- Escritorio ≥ 1024: sidebar, 4–7 columnas, paneles.
- Prueba 320, 375, 390, 768, 1024, 1280 y 1440 px.
- Container queries para tarjetas reutilizables.
- Móvil primero; `useMediaQuery` solo para cambiar de componente.

## Componentes

- `packages/ui` contiene presentacionales.
- `apps/web/features` contiene dominio.
- Todo componente interactivo: teclado, foco, `aria-*` y estados.
- `ResponsiveDialog` elige `Dialog` o `BottomSheet`.

## Referencias

- `docs/02-design/tokens.md`
- `docs/02-design/components.md`
- `docs/02-design/screens.md`
- `docs/02-design/accessibility.md`
- `assets/design/design-system-v0.1.png`
