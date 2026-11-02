# @memora/ui

Componentes presentacionales, tokens y base visual de Memora.

El paquete reúne los **18 componentes** de F11 (17 controles y datos + `VisuallyHidden`), los
tokens de F05/F10 y la base del documento. Es presentacional: no importa router, query, fetch,
dominio ni `apps/*`.

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
│   ├── components/               # 18 componentes + helpers internos + tests
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

Reglas que aplican todos:

- `<button>` o `<a>` reales; nunca un `div` con `onClick`.
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
`axe-core` con `color-contrast` desactivado (jsdom no calcula layout ni pintado). El helper
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

- Overlays y feedback de F12 (`Toast`, `InlineAlert`, `Dialog`…).
- Decidir si `HelpContent`, hoy en `apps/web`, se mueve aquí cuando exista un componente de
  contenido compartido (F36).
- ESM nativo en Node si aparece un consumidor fuera de un bundler.
