# @memora/ui

Componentes presentacionales, tokens y base visual de Memora.

El paquete reúne los **30 componentes** de F11–F12: los 18 de F11 (17 controles y datos +
`VisuallyHidden`), los 4 overlays y los 8 de navegación y feedback, además de los tokens de
F05/F10 y la base del documento. Es presentacional: no importa router, query, fetch, dominio
ni `apps/*`.

## Fronteras

- `ui` → `config` (tooling). Nada más.
- No importa `@memora/shared`, `@memora/api-client` ni `apps/*`.
- Sin lógica de dominio, sin fetch y sin estado de servidor.
- React 19, `react-dom` y `lucide-react` son **peerDependencies**: el consumidor fija las
  versiones. Para desarrollo y tests están también como `devDependencies`.
- Se consume a través del `dist` compilado por `tsc` (`main`/`types`), no como fuente.

## Estructura

```text
packages/ui/
├── src/
│   ├── index.ts                  # exports de componentes, props y UI_PACKAGE_NAME
│   ├── vite-assets.d.ts          # tipos de imports ?raw usados por los tests
│   ├── components/               # componentes + helpers internos + tests
│   │   ├── button.tsx
│   │   ├── icon-button.tsx
│   │   ├── link-button.tsx
│   │   ├── text-field.tsx
│   │   ├── text-area.tsx
│   │   ├── search-field.tsx
│   │   ├── visually-hidden.tsx
│   │   ├── checkbox.tsx
│   │   ├── switch.tsx
│   │   ├── segmented-control.tsx
│   │   ├── avatar.tsx
│   │   ├── avatar-group.tsx
│   │   ├── badge.tsx
│   │   ├── chip.tsx
│   │   ├── card.tsx
│   │   ├── progress-bar.tsx
│   │   ├── spinner.tsx
│   │   ├── skeleton.tsx
│   │   ├── dialog.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── bottom-sheet.tsx
│   │   ├── responsive-dialog.tsx
│   │   ├── menu.tsx
│   │   ├── tabs.tsx
│   │   ├── accordion.tsx
│   │   ├── toast.tsx
│   │   ├── inline-alert.tsx
│   │   ├── empty-state.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── tooltip.tsx
│   │   ├── feedback-tone.tsx    # iconos y superficies de estado compartidos
│   │   ├── overlay-utils.ts      # foco, Esc, scroll lock, presencia y media query
│   │   ├── overlay-parts.tsx     # fondo y cabecera compartidos
│   │   └── *.test.tsx
│   ├── test/                     # setup de RTL y helper de axe
│   └── styles/
│       ├── tokens.css            # tokens runtime + @theme, exportado como ./tokens.css
│       ├── theme.css             # base del documento, foco y reduced motion
│       ├── fonts.css             # @font-face de Plus Jakarta Sans
│       └── *.test.ts             # contrato de tokens, contraste, tema y fuentes
├── vitest.config.ts              # jsdom + plugin React + setup
├── tsconfig.json                 # typecheck (sin emitir)
└── tsconfig.build.json           # build a dist con declaraciones
```

## Componentes

Tanda A (acción y formulario): `Button`, `IconButton`, `LinkButton`, `TextField`, `TextArea`,
`SearchField` y `VisuallyHidden`.

Tanda B (selección y datos): `Checkbox`, `Switch`, `SegmentedControl`, `Avatar`, `AvatarGroup`,
`Badge`, `Chip`, `Card`, `ProgressBar`, `Spinner` y `Skeleton`.

Tanda C (overlays, F12): `Dialog`, `ConfirmDialog`, `BottomSheet` y `ResponsiveDialog`.
No usan `<dialog>` nativo (jsdom 30 no implementa `showModal`/`close`): renderizan un overlay
propio con `createPortal`, `role="dialog"`, `aria-modal`, trampa de foco, `Esc` y retorno al
disparador. El fondo queda inerte y el scroll del documento bloqueado. `BottomSheet` añade
arrastre con puntero como mejora, pero siempre ofrece botón «Cerrar» de 44 px y `Esc`.
`ResponsiveDialog` elige `BottomSheet` o `Dialog` con `matchMedia('(min-width: 768px)')` y
asume móvil en SSR; no monta los dos árboles. Su `size` solo aplica al `Dialog` de escritorio
(desde 768 px); en móvil la hoja lo ignora.

`ConfirmDialog` se construye sobre `ResponsiveDialog`: hoja en móvil y diálogo desde 768 px.
Su CTA usa `Button variant="danger"` cuando `danger` (borde y texto rojos, fondo rojo suave)
y `primary` en el resto; con `danger` añade la papelera. Cancelar usa `surface-2` sin borde.
`danger` sigue siendo la semántica destructiva del flujo; el aviso del cuerpo lo aporta el
consumidor. La cabecera no muestra el círculo de peligro por defecto.

`BottomSheet` interpreta `maxHeightPercent` como **altura máxima** única en `dvh` (sin paradas
intermedias): arrastrar más de 96 px cierra la hoja. El panel tiene `overflow-hidden`; asa,
cabecera y footer son fijos y solo el cuerpo hace scroll. El cuerpo es una región enfocable
(`tabIndex={0}`) con `bodyLabel` (por defecto «Contenido»), para que los navegadores sin
«focusable scrollers» no dejen el contenido inaccesible. `footerLayout` permite fila, columna
o la disposición responsive por defecto. El cierre siempre tiene botón, `Esc` y fondo como
alternativas. En oscuro el borde del panel usa `border-strong`; `Dialog` y `BottomSheet` usan
`p-6 sm:p-8` y `px-5 pb-6` respectivamente.

Tanda D (navegación y feedback, F12): `Menu`, `Tabs`, `Accordion`, `Toast`/`ToastViewport`,
`InlineAlert`, `EmptyState`, `Breadcrumb` y `Tooltip`.

- `Menu` y `Tabs` usan roving tabindex, flechas, `Home`/`End` y `Esc` donde aplica. `Tabs`
  activa con flechas y relaciona `tab`/`tabpanel`; la pestaña activa es una píldora
  `bg-primary-soft`/`text-on-primary-soft`, con icono decorativo y contador visible en el
  nombre accesible. La lista va en una sola fila (densidad compacta para 390 px y
  `overflow-x-auto` con scrollbar oculto a 320, con revelado por foco), tiene separador inferior
  `border-b border-border` y la etiqueta inactiva usa `text-text` con icono/contador en
  `text-muted`. `Menu` usa sombra `shadow-md`.
- `Accordion` usa tarjetas independientes `rounded-lg` con borde suave, chevron circular
  `bg-surface-2` y respuesta separada por borde en `text-body text-text`; mantiene
  `aria-expanded`/`aria-controls`, `role="region"` y los modos simple/múltiple.
- `Toast` usa `role="status"` y `role="alert"` para `danger`; el rol envuelve solo el texto y
  cierre/acción quedan fuera de la región viva. El temporizador es opcional y se pausa con
  hover o foco. El cierre conserva 44 px de área táctil con un cuadrado visible de 36 px y el
  foco de los controles usa `outline-on-inverse`. `ToastViewport` es solo estructura visual:
  no declara `aria-live` propio para no duplicar el anuncio, y nunca mueve el foco. Mientras
  hay avisos montados calcula `scroll-padding-bottom` desde la parte superior real de la pila
  hasta el borde inferior de la ventana, para no tapar el foco (2.4.11); el límite de avisos
  simultáneos se decidirá en F26. `Toast` e `InlineAlert` aceptan `open` y exponen `data-state`
  (`enter`, `open`, `exit`) con transición corta y `motion-reduce`; para animar la salida hay
  que mantenerlos montados y pasar `open={false}`.
- `InlineAlert` usa `alert` solo en peligro; el rol envuelve el texto y la acción queda fuera
  de la región viva. `EmptyState` titula con un encabezado configurable y permite icono
  circular o cuadrado redondeado (`iconShape="circle" | "square"`); `square` usa `rounded-lg`
  de 16 px. Su descripción usa `text-body`. `Breadcrumb`
  marca el último elemento con `aria-current="page"`, sin enlace y con `font-medium`; sus
  enlaces usan el patrón de área táctil de 44 px de F11 sin cambiar la altura visual del texto.
- `Tooltip` se enlaza con `aria-describedby`, aparece con foco y hover y se cierra con `Esc`.
  Usa `max-w-[calc(100vw-2rem)]`, corrige la colisión horizontal con un margen de 8 px y se
  muestra solo con capacidad de puntero (`@media (hover: hover)`), **sin gate de ancho**: en
  táctil no aparece y con zoom de escritorio sigue disponible. Su contenido nunca es la única
  fuente de información.

Reglas que aplican todos:

- `<button>` o `<a>` reales; nunca un `div` con `onClick`.
- **Acciones destructivas:** `Button`, `IconButton` y `LinkButton` con `variant="danger"` usan
  borde y texto rojos sobre `danger-soft`, con `danger-soft-hover`/`danger-soft-active` en
  hover/active. No se usa rojo sólido para botones; las advertencias no destructivas no llevan
  esta piel.
- Estados default, hover, focus, disabled, loading o error cuando el contrato los define.
- Foco visible global desde `theme.css`; no se duplica en cada componente.
- Iconos decorativos con `aria-hidden`; botones de icono con `aria-label` obligatorio.
- `forwardRef` en `Button`, `TextField`, `TextArea`, `SearchField`, `Checkbox` y `Switch`.
- Sin colores literales: solo tokens y utilidades Tailwind del `@theme`.

## Tokens, tema y fuentes

`src/styles/tokens.css` es CSS-first: no hay preset JS ni `tailwind.config`. Variables en
`:root` y `[data-theme="dark"]`; `@theme inline` las expone como utilidades (`bg-surface`,
`text-muted`, `border-border-strong`, `bg-accent-violet`…). Un `@theme` no inline fija los
breakpoints 480/768/1024/1280 y anula `2xl`.

`src/styles/theme.css` define la base del documento, `::selection`, el foco visible global y
`prefers-reduced-motion`. `src/styles/fonts.css` declara Plus Jakarta Sans (latin y latin-ext,
pesos 200–800, `font-display: swap`); los `.woff2` los sirve la app consumidora en `/fonts/`.

## Tests

```bash
corepack pnpm --filter @memora/ui test
```

Vitest 5 con **jsdom**, `@testing-library/react` y `@testing-library/dom`. Los tests de
componentes consultan por **rol y nombre accesible**, cubren teclado, estados y ejecutan
`axe-core` con `color-contrast` desactivado (jsdom no calcula layout ni pintado). Los overlays
añaden foco inicial, ciclo de `Tab`, `Esc`, retorno al disparador, `inert` del fondo y los dos
modos de `ResponsiveDialog`. La tanda D añade navegación con flechas y `Home`/`End`, modos
simple/múltiple de `Accordion`, temporizador y pausa de `Toast`, ausencia de `aria-live`
duplicado en el viewport, entrada/salida de feedback, la relación `aria-describedby` de
`Tooltip` y el `role` según tono. El gate táctil de `Tooltip` no se puede comprobar en jsdom:
se verifica en navegador/F37. El helper
falla también con `incomplete` salvo en las reglas que dependen de layout (`color-contrast`,
`color-contrast-enhanced`, `target-size`). El contraste real se cubre en
`src/styles/contrast.test.ts` sobre los hex de `tokens.css`.

**La cobertura con axe en navegador real es de F37**, no de este paquete: aquí no se instala
Playwright ni se simulan medidas de layout.

## Script `dev`

```bash
corepack pnpm --filter @memora/ui dev
```

`tsc --watch --preserveWatchOutput` recompila `dist` al editar fuentes. `turbo dev` lo arranca
junto a `apps/web`, de modo que el catálogo `/ui` (que consume `dist`) refleja los cambios sin
reiniciar el servidor.

## Limitación conocida: ESM en Node

`dist` no es importable directamente por Node ESM: los imports internos no llevan extensión
`.js` y `moduleResolution` es `bundler`. El paquete está pensado para consumidores con
**bundler** (Vite/Next), que es el único caso actual (`apps/web`). No hay consumidor Node. Si
aparece uno, habrá que decidir entre extensiones explícitas o un paso de bundling; no se
cambia ahora.

## Comandos

`pnpm` puede no estar en PATH; usa `corepack pnpm`.

```bash
corepack pnpm --filter @memora/ui dev
corepack pnpm --filter @memora/ui build
corepack pnpm --filter @memora/ui lint
corepack pnpm --filter @memora/ui test
corepack pnpm --filter @memora/ui typecheck
```

## Pendiente

- Decide si `HelpContent`, hoy en `apps/web`, se mueve aquí cuando exista un componente de
  contenido compartido (F36).
- ESM nativo en Node si aparece un consumidor fuera de un bundler.
- La auditoría de teclado y lector de pantalla en navegador real corresponde a F37.
