# Responsive y navegación

## Breakpoints

| Rango | Nombre | Layout |
| --- | --- | --- |
| 320–767 | Móvil | Una columna; bottom nav; hojas inferiores |
| 768–1023 | Tablet | 2–3 columnas; bottom nav o rail |
| ≥ 1024 | Escritorio | Sidebar; 4–7 columnas; paneles; modales |

Probar 320, 375, 390, 768, 1024, 1280 y 1440 px, vertical y horizontal, zoom 200 % y 400 %.

## Navegación

| Elemento | Móvil | Tablet | Escritorio |
| --- | --- | --- | --- |
| Global | Bottom nav: Círculos, Subir, Perfil | Bottom nav o rail | Sidebar persistente |
| Dentro del círculo | Tabs Álbumes/Personas/Ajustes | Tabs | Subnav en sidebar |
| Acción principal | Botón central de subir | Cabecera | Cabecera + dropzone |
| Secundarias | Bottom sheet | Menú | Menú/barra |
| Tema | Perfil | Perfil/cabecera | Cabecera y perfil |

## Reglas

- Mobile-first; el HTML inicial asume móvil porque el SSR no conoce el viewport.
- Media queries para layout; container queries para tarjetas y miniaturas.
- `useMediaQuery` solo para cambiar de componente (Dialog vs BottomSheet).
- Safe areas: `env(safe-area-inset-*)`, `viewport-fit=cover`.
- Unidades `dvh`/`svh`; inputs ≥ 16 px en iOS.
- Nada esencial depende de `hover`.
- Escritorio: foco visible, atajos (`←`, `→`, `Esc`), selección con `Shift`/`Ctrl`.
- Móvil: acciones principales en la mitad inferior, alcanzables con el pulgar.
- Deslizar, pellizcar y arrastrar siempre tienen alternativa con botón.

## Estados

Cada pantalla implementa: vacío, carga, error, éxito y, si aplica, sin permiso. Los skeletons no deben provocar saltos de layout.
