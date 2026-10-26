# Tokens

Fuente visual: `assets/design/design-system-v0.1.png`. Los tokens se implementan como variables CSS y se conectan a Tailwind 4 con `@theme`.

## Colores semánticos

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-bg` | `#F6F6FA` | `#0B0F1E` | Fondo |
| `--color-surface` | `#FFFFFF` | `#131A2C` | Tarjetas, barras, hojas |
| `--color-surface-2` | `#F0EFF7` | `#1B2338` | Inputs, hover, progreso, skeleton |
| `--color-border` | `#E4E3EE` | `#263049` | Bordes |
| `--color-border-strong` | `#B9B7CC` | `#3A4563` | Bordes discontinuos, tirador |
| `--color-text` | `#14132B` | `#EEF0FA` | Texto principal |
| `--color-muted` | `#5E5D78` | `#A3A9C2` | Texto secundario |
| `--color-primary` | `#5B47E0` | `#6A58F0` | Acción principal |
| `--color-primary-hover` | `#4A37C9` | `#7A69F5` | Hover/pulsado |
| `--color-primary-text` | `#4A37C9` | `#A99CFF` | Enlaces y texto de acción |
| `--color-primary-soft` | `#EEEBFE` | `#241F4D` | Fondos suaves |
| `--color-on-primary-soft` | `#2E2390` | `#C9C0FF` | Texto sobre soft |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` | Texto sobre primary |
| `--color-focus` | `#7C6CF2` | `#A99CFF` | Anillo de foco |
| `--color-overlay` | `rgba(11,15,30,.5)` | `rgba(0,0,0,.6)` | Fondo de modales |
| `--color-viewer-bg` | `#070A14` | `#070A14` | Visor de fotos |
| `--color-inverse` | `#14132B` | `#EEF0FA` | Toasts, barra de selección |
| `--color-on-inverse` | `#FFFFFF` | `#0B0F1E` | Texto sobre inverse |

## Estados

| Token | Claro | Oscuro | Suave claro / oscuro |
| --- | --- | --- | --- |
| `--color-success` | `#1E8A5A` | `#4CC38A` | `#D3F0E2` / `#12332A` |
| `--color-warning` | `#B4610A` | `#F0A04B` | `#FCE3CC` / `#3A2814` |
| `--color-danger` | `#C8283C` | `#FF6B7D` | `#FDECEE` / `#3A1820` |
| `--color-danger-text` | `#A61F31` | `#FF8A98` | — |
| `--color-info` | `#2F6FD6` | `#6FA4FF` | `#DCE9FB` / `#14284A` |

## Acentos de identidad

Asignación estable `hash(userId) % 5`, iguales en ambos temas.

| Token | Fondo | Texto |
| --- | --- | --- |
| `--accent-violet` | `#E6E1FE` | `#3F2DB5` |
| `--accent-pink` | `#FAD4E1` | `#8A1C46` |
| `--accent-green` | `#D3F0E2` | `#145C3D` |
| `--accent-orange` | `#FCE3CC` | `#8A4510` |
| `--accent-sky` | `#DCE9FB` | `#1C4F8A` |

## Tipografía

`'Plus Jakarta Sans', system-ui, sans-serif`, pesos 400–800.

| Token | Tamaño / interlineado | Peso | Tracking | Uso |
| --- | --- | --- | --- | --- |
| `text-display` | 40 / 44 | 800 | -0.03em | Títulos grandes |
| `text-h1` | 32 / 38 (móvil 26–28) | 800 | -0.02em | Título de pantalla |
| `text-h2` | 24 / 30 | 700 | -0.01em | Sección |
| `text-h3` | 18 / 24 | 700 | 0 | Tarjeta |
| `text-body` | 16 / 24 | 400 | 0 | Texto e inputs |
| `text-body-sm` | 14 / 20 | 500 | 0 | Metadatos |
| `text-caption` | 12 / 16 | 600 | 0.02em | Etiquetas y contadores |

## Espaciado y radios

Base 4 px: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64.

| Radio | Valor | Uso |
| --- | --- | --- |
| `radius-sm` | 8 px | Miniaturas pequeñas |
| `radius-md` | 12 px | Botones, inputs |
| `radius-lg` | 16 px | Miniaturas de lista |
| `radius-xl` | 24 px | Tarjetas |
| `radius-2xl` | 32 px | Hojas, modales |
| `radius-full` | 999 px | Avatares, chips |

Ancho de borde: `--border-width: 1px`. No se usan grosores arbitrarios.

## Sombras y movimiento

| Token | Valor |
| --- | --- |
| `shadow-sm` | `0 1px 2px rgba(20,19,43,.06), 0 1px 3px rgba(20,19,43,.08)` |
| `shadow-md` | `0 4px 12px rgba(20,19,43,.08), 0 2px 4px rgba(20,19,43,.05)` |
| `shadow-lg` | `0 16px 40px rgba(20,19,43,.16), 0 4px 12px rgba(20,19,43,.08)` |

Oscuro: solo `0 16px 40px rgba(0,0,0,.45)` en flotantes. Duraciones 150/250/350 ms, `cubic-bezier(.2,0,0,1)`.

## Medidas

| Medida | Valor |
| --- | --- |
| Breakpoints | 480 / 768 / 1024 / 1280 px |
| Tap target | 44 px |
| Bottom nav | 72 px + safe area |
| Header | 60–64 px móvil · 72 px escritorio |
| Sidebar | 248–264 px |
| Content max | 1200–1280 px |
| z-index | nav 40 · sheet 60 · modal 70 · toast 80 |

## Implementación

- Variables en `packages/ui/src/styles/tokens.css`.
- `packages/ui/src/styles/tokens.css` usa variables de runtime `--memora-*`; `@theme inline` las mapea a `--color-*`, `--radius-*`, `--shadow-*`, `--text-*` y `--font-sans`. Los nombres de la tabla siguen siendo los públicos.
- Tailwind 4 con `@theme` apuntando a las variables.
- `data-theme="light|dark"` en `<html>`; el servidor lo resuelve con cookie y `prefers-color-scheme`.
- Sin destello: script mínimo en el documento o HTML generado en servidor.
- `theme-color` y manifest coherentes.
