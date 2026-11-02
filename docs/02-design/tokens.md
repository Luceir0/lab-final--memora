# Tokens

Fuente visual: `assets/design/design-system-v0.1.png`. Los tokens se implementan como variables CSS y se conectan a Tailwind 4 con `@theme`.

## Colores semánticos

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-bg` | `#F6F6FA` | `#0B0F1E` | Fondo |
| `--color-surface` | `#FFFFFF` | `#131A2C` | Tarjetas, barras, hojas |
| `--color-surface-2` | `#F0EFF7` | `#1B2338` | Inputs, hover, progreso, skeleton |
| `--color-surface-active` | `#E4E3EE` | `#2A3450` | Fondo pulsado (`active`) de botones, chips y quitar |
| `--color-border` | `#E4E3EE` | `#263049` | Bordes |
| `--color-border-strong` | `#868399` | `#6B7699` | Bordes de control, discontinuos, tirador |
| `--color-text` | `#14132B` | `#EEF0FA` | Texto principal |
| `--color-muted` | `#5E5D78` | `#A3A9C2` | Texto secundario |
| `--color-primary` | `#5B47E0` | `#6A58F0` | Acción principal |
| `--color-primary-hover` | `#4A37C9` | `#5F4CE6` | Hover/pulsado |
| `--color-primary-active` | `#3D2BB8` | `#4F3FD1` | Pulsado (distinto de hover) |
| `--color-primary-text` | `#4A37C9` | `#A99CFF` | Enlaces y texto de acción |
| `--color-primary-soft` | `#EEEBFE` | `#241F4D` | Fondos suaves |
| `--color-primary-soft-hover` | `#E4DEFD` | `#2D2760` | Hover sobre soft |
| `--color-primary-soft-active` | `#D8CFFB` | `#3A3378` | Pulsado sobre soft |
| `--color-on-primary-soft` | `#2E2390` | `#C9C0FF` | Texto sobre soft |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` | Texto sobre primary |
| `--color-focus` | `#7C6CF2` | `#A99CFF` | Anillo de foco |
| `--color-elevated` | `#FFFFFF` | `#2A3450` | Superficie elevada (segmento activo) |
| `--color-control-knob` | `#FFFFFF` | `#EEF0FA` | Knob del switch |
| `--color-control-knob-border` | `#B9B6C9` | `#263049` | Borde del knob (lo delimita en claro) |
| `--color-overlay` | `rgba(11,15,30,.5)` | `rgba(0,0,0,.6)` | Fondo de modales |
| `--color-viewer-bg` | `#070A14` | `#070A14` | Visor de fotos |
| `--color-inverse` | `#14132B` | `#EEF0FA` | Toasts y barra de selección |
| `--color-on-inverse` | `#FFFFFF` | `#0B0F1E` | Texto y foco sobre inverse |

En oscuro, `--color-primary-hover` es `#5F4CE6` (F11): con `--color-on-primary` da 5,73:1 y
cumple AA en los botones de 14–16 px semibold. El valor anterior `#7A69F5` daba 4,06:1.
`--color-primary-active` da 9,39:1 en claro y 7,08:1 en oscuro sobre `on-primary`, así que
`active` se distingue de `hover` sin bajar de AA. El knob claro se delimita con borde y sombra:
el borde `control-knob-border` da 1,98:1 contra el knob y 1,74:1 contra `surface-2` (antes
1,11:1 y no se percibía); en oscuro el par `control-knob`/`surface-2` da 13,75:1 y se prueba
en `contrast.test.ts`. El texto sobre `elevated` oscuro da 10,84:1.

`--color-surface-active` es la superficie de pulsación: `#E4E3EE` en claro y `#2A3450` en
oscuro. El texto `text` da 14,27:1 / 10,84:1 y `primary-text` 6,16:1 / 5,21:1, así que cumple
AA en `secondary`, `ghost`, `Chip` y el quitar. Sustituye el uso de `--color-border` como
fondo `active`, que era un token de borde usado como superficie.

**Sobre `inverse` el foco no usa `--color-focus`.** En oscuro el anillo (`#A99CFF`) sobre el
toast inverso (`#EEF0FA`) da 2,07:1 y no llega al 3:1 de componente. Los controles que viven
sobre `inverse` (cierre y acción del toast) usan `--color-on-inverse` como color de anillo:
18,14:1 en claro y 16,78:1 en oscuro.

**Borde del panel de overlay en oscuro.** `Dialog` y `BottomSheet` usan `--color-border` en
claro (`#E4E3EE`) y `--color-border-strong` en oscuro (`#6B7699`) solo en el borde del panel:
3,86:1 contra el panel y 4,51:1 contra el scrim compuesto. Sin él, panel (`#131A2C`) y scrim
(`#04060C`) quedan a 1,17:1 y se pierde el límite del modal. No cambia el token global.

El `SegmentedControl` mantiene un borde exterior de 1 px con `--color-border` que el diseño no
dibuja: sin él la pista (`surface-2`) se confunde con `bg` (1,1:1) y el grupo pierde límite.
Es una desviación documentada del diseño, no silenciosa.

### Desviaciones deliberadas respecto al PNG

El asset `design-system-v0.1.png` está desactualizado respecto a estas decisiones; se
actualizará cuando se regenere el diseño:

- **Segmento seleccionado con borde primario.** El PNG no dibuja borde; se añadió para que la
  selección no dependa solo del color y se lea en escala de grises.
- **Chip seleccionado con check y `bold`.** El PNG solo cambia el color de fondo; el check y
  el peso son señales no cromáticas obligatorias.
- **Borde del knob del `Switch` en claro.** El PNG no lo delimita; con `#FFFFFF` sobre
  `#F0EFF7` (1,14:1) el knob se perdía.
- **Botones destructivos en rojo suave.** El PNG pinta «Eliminar» en rojo sólido y las
  pantallas de Ajustes usan una CTA azul-noche. Desde F12 manda una sola piel: borde y texto
  rojos sobre `danger-soft`. Decisión del usuario: el rojo sólido y la CTA inversa para
  borrar quedan descartados. Los assets se actualizarán cuando se regeneren.

## Estados

| Token | Claro | Oscuro | Suave claro / oscuro |
| --- | --- | --- | --- |
| `--color-success` | `#1E8A5A` | `#4CC38A` | `#D3F0E2` / `#12332A` |
| `--color-warning` | `#B4610A` | `#F0A04B` | `#FCE3CC` / `#3A2814` |
| `--color-danger` | `#C8283C` | `#FF6B7D` | `#FDECEE` / `#3A1820` |
| `--color-danger-text` | `#A61F31` | `#FF8A98` | — |
| `--color-info` | `#2F6FD6` | `#6FA4FF` | `#DCE9FB` / `#14284A` |
| `--color-success-text` | `#145C3D` | `#4CC38A` | — |
| `--color-warning-text` | `#8A4510` | `#F0A04B` | — |
| `--color-info-text` | `#1C4F8A` | `#6FA4FF` | — |

Los tokens `*-text` son texto de estado sobre su fondo *soft* (`--color-*-soft`) o sobre
`--color-bg`; los colores base de estado se reservan para iconos, barras y bordes. En
claro los base no llegan a 4.5:1 como texto (`#1E8A5A` 3,58:1, `#B4610A` 3,65:1 y
`#2F6FD6` 3,92:1 sobre su soft), y los `*-text` sí (`#145C3D` 6,60:1, `#8A4510` 5,78:1 y
`#1C4F8A` 6,74:1). En oscuro coinciden con el color base porque ya superan AA
(6,19:1, 6,59:1 y 5,89:1 sobre su soft). `--color-danger` sí cumple como texto en claro
(4,81:1), por eso mantiene su `--color-danger-text` propio.

### Rojo suave de acciones destructivas (F12)

Las acciones destructivas de botones y CTA usan la misma piel: borde y texto rojos sobre
fondo rojo suave (`#FDECEE` en claro, `#3A1820` en oscuro). No hay rojo sólido en botones ni
CTA inversa para borrar. En filas de menú la piel se reduce a texto rojo con hover suave,
porque una fila con borde y relleno permanentes rompería el patrón del `Menu`.

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--color-danger-soft` | `#FDECEE` | `#3A1820` | Fondo base del botón |
| `--color-danger-soft-hover` | `#F9DDE1` | `#4A1F29` | Hover |
| `--color-danger-soft-active` | `#F4CFD6` | `#582733` | Pulsado |
| `--color-danger` | `#C8283C` | `#FF6B7D` | Borde |
| `--color-danger-text` | `#A61F31` | `#FF8A98` | Texto e icono |

Ratios: texto sobre soft **6,43:1 / 7,02:1**, sobre hover **5,75 / 6,15** y sobre active
**5,15 / 5,33**; borde sobre soft **4,81 / 5,75**. Todo cumple AA (texto 4,5 y componente
no textual 3). El estado deshabilitado sigue el neutro global (`surface-2`, `muted`), no el
rojo.

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
| `text-h1` | 32 / 38 · móvil 26 / 32 | 800 | -0.02em | Título de pantalla |
| `text-h2` | 24 / 30 | 700 | -0.01em | Sección |
| `text-h3` | 18 / 24 | 700 | 0 | Tarjeta |
| `text-body` | 16 / 24 | 400 | 0 | Texto e inputs |
| `text-body-sm` | 14 / 20 | 500 | 0 | Metadatos |
| `text-caption` | 12 / 16 | 600 | 0.02em | Etiquetas y contadores |

Por debajo del primer breakpoint (480 px) `h1` baja a **26 / 32 px**: es el tamaño del
diseño móvil y evita que el título se parta en pantallas de 320–400 px.

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

`Spinner` y `Skeleton` usan las animaciones de Tailwind (`animate-spin` 1 s lineal y
`animate-pulse` 2 s) porque una animación continua no es una transición de interacción. Se
mantienen fuera de la escala 150/250/350 y **no se crea una escala nueva**; con
`prefers-reduced-motion` se anulan desde `theme.css`.

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

Los nombres públicos de las capas son `--z-index-nav`, `--z-index-sheet`,
`--z-index-modal` y `--z-index-toast`, mapeados a las variables de runtime
`--memora-z-*` en `@theme inline`: se usan como utilidad (`z-nav`, `z-sheet`, `z-modal`,
`z-toast`) o como variable (`z-(--memora-z-nav)`). Nada de números sueltos en
componentes. Tailwind trae `2xl` por defecto; aquí queda **anulado**
(`--breakpoint-2xl: initial`) porque el contrato solo define cuatro breakpoints y
`2xl` (1536 px) no forma parte del diseño.

**Apilado de overlays anidados (F12).** `sheet` y `modal` son la base nominal, pero el orden
real lo decide la apertura: cada overlay recibe `--memora-z-sheet + 2 × secuencia` (60, 62,
64…) con techo por debajo de `toast` (80), de modo que una hoja abierta desde un diálogo se
pinta encima de él y `Esc` cierra solo la capa superior. El fondo inerte y el bloqueo de
scroll siguen esa misma pila; al vaciarse se restauran. No se usan números sueltos: la base
se lee de los tokens y el desplazamiento lo calcula `overlay-utils`.

## Implementación

- **Tokens y utilidades.** Variables de runtime `--memora-*` en
  `packages/ui/src/styles/tokens.css` (`:root` y `[data-theme='dark']`); `@theme inline`
  las mapea a `--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--z-index-*` y
  `--font-sans`. F11 añade los acentos de identidad como utilidades (`bg-accent-pink`,
  `text-accent-pink-text`…), que usan `Avatar`, `Badge` y `Chip`. Los nombres de las tablas
  de este documento son los públicos. Los breakpoints (`sm` 30rem, `md` 48rem, `lg` 64rem,
  `xl` 80rem) viven en un `@theme` sin `inline` porque son estáticos. Tailwind 4 CSS-first:
  sin preset JS ni `tailwind.config`.
- **Base y comportamiento.** `packages/ui/src/styles/theme.css` contiene la base de
  `html`/`body`, la selección, el foco visible global (token de foco, 2 px con
  `offset 2px`) y las reglas de `prefers-reduced-motion` (duraciones a 0, scroll
  instantáneo). `color-scheme` se declara solo en `tokens.css` (`1+1`: claro en `:root`,
  oscuro en `[data-theme='dark']`).
- **Tema.** `data-theme="light|dark"` en `<html>`. El servidor resuelve el modo explícito
  desde la cookie `memora-theme` (`light|dark|system`, `Path=/`, `Max-Age` de un año,
  `SameSite=Lax` y `Secure` cuando la petición es https), y un script de arranque en
  `<head>`, anterior a `<body>`, resuelve `system` con `prefers-color-scheme` y actualiza
  `theme-color`: así no hay destello. `apps/web/src/lib/theme.ts` centraliza el parseo,
  la cookie, la resolución y el script; `ThemeProvider` escucha el cambio del sistema
  solo en modo `system`.
- **`theme-color`.** Coincide con `--color-bg` (`#F6F6FA` claro, `#0B0F1E` oscuro); el
  meta del servidor y el script usan los mismos valores y un test los compara con los
  tokens.
- **Fuente.** Plus Jakarta Sans self-hosted y vendorizada: `.woff2` (subset latin y
  latin-ext) y `OFL.txt` en `apps/web/public/fonts/`; `@font-face` en
  `packages/ui/src/styles/fonts.css` con `font-display: swap` y pesos 200–800; la app
  añade `preload` solo del subset latin. Sin peticiones a terceros.

### Deuda conocida (resuelta en F11)

`--color-border-strong` no llegaba a 3:1 sobre superficie (`1,96:1` en claro y `1,82:1` en
oscuro), que es el mínimo de WCAG 2.2 para el borde de un control. F11 lo subió a
`#868399` en claro (3,41:1 sobre `bg`, 3,67:1 sobre `surface`, 3,22:1 sobre `surface-2`)
y `#6B7699` en oscuro (4,25:1 / 3,86:1 / 3,48:1). El antiguo `#8E8CA6` se descartó por
fallar sobre `surface-2` (2,84:1). `contrast.test.ts` cubre los seis pares.
