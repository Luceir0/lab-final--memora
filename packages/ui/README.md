# @memora/ui

Componentes presentacionales y tokens de diseño de Memora.

F05 dejó `./tokens.css` con los tokens semánticos en claro y oscuro y un bloque
`@theme inline` para Tailwind 4. F10 añade `./theme.css`, `./fonts.css`, Vitest en Node y
los tests de contrato y contraste. Todavía no hay React ni componentes: llegan en
F11/F12.

## Fronteras

- `ui` → `config` (tooling). Nada más.
- No importa `@memora/shared`, `@memora/api-client` ni `apps/*`.
- Los tests del paquete no leen archivos de `apps/*`; la existencia de las fuentes
  vendorizadas se verifica desde `apps/web`.
- Sin React, sin componentes, sin lógica de dominio, sin fetch y sin estado de servidor.
- Se consume como fuente en dev y se compila a `dist` para el build.

## Estructura

```text
packages/ui/
├── src/
│   ├── index.ts                  # punto de entrada (UI_PACKAGE_NAME)
│   ├── vite-assets.d.ts          # tipos de imports ?raw usados por los tests
│   └── styles/
│       ├── tokens.css            # tokens runtime + @theme, exportado como ./tokens.css
│       ├── theme.css             # base del documento, foco y reduced motion
│       ├── fonts.css             # @font-face de Plus Jakarta Sans
│       ├── tokens.test.ts        # contrato de tokens y breakpoints
│       ├── contrast.test.ts      # contraste WCAG calculado sobre tokens.css
│       ├── theme.test.ts         # base, foco y reduced motion
│       ├── fonts.test.ts         # contrato de los @font-face
│       └── package.test.ts       # exports y script de test
├── vitest.config.ts              # entorno Node, include de src/**/*.test.ts
├── tsconfig.json                 # typecheck (sin emitir)
└── tsconfig.build.json           # build a dist con declaraciones
```

## Tokens

`src/styles/tokens.css` es CSS-first: no hay preset JS ni `tailwind.config`.

- Variables CSS en `:root` y `[data-theme="dark"]`: colores, estados, acentos,
  tipografía, radios, sombras, movimiento y capas (fuente: `docs/02-design/tokens.md`).
- `color-scheme` vive aquí, junto al resto de tokens de runtime.
- `@theme inline` las expone como utilidades de Tailwind 4 (`bg-bg`, `text-text`,
  `bg-surface`, `text-primary`, `rounded-xl`, `shadow-md`).
- Los cambios de tema funcionan porque las utilidades referencian la variable, no un
  valor congelado.
- Un `@theme` no inline fija los breakpoints de Memora (`sm` 480, `md` 768, `lg` 1024,
  `xl` 1280) y anula `2xl`; el `h1` móvil baja a 26/32 px por debajo de 480 px.

## Tema

`src/styles/theme.css` define la base del documento que necesita cualquier app
consumidora: `html`/`body` con tokens, `::selection`, foco visible global y la regla de
`prefers-reduced-motion` que lleva animaciones, transiciones y scroll suave a 0. No
duplica `color-scheme`: ese token sigue en `tokens.css`.

## Fuentes

`src/styles/fonts.css` declara Plus Jakarta Sans con dos subsets variables (latin y
latin-ext), pesos 200–800 y `font-display: swap`. Las rutas apuntan a
`/fonts/plus-jakarta-sans-*.woff2`.

El paquete no incluye los binarios: la app consumidora debe servir esos `.woff2` y el
`OFL.txt` en `/fonts/`. En `apps/web` viven en `public/fonts/` y el `<head>` precarga
solo el subset latin.

## Tests

```bash
corepack pnpm --filter @memora/ui test
```

Vitest 5 en entorno Node, sin React ni jsdom. Cubren:

- contrato de tokens en claro y oscuro, `@theme inline` sin autorreferencias, radios,
  sombras y los tres tokens `*-text`;
- breakpoints propios, anulación de `2xl` y `h1` móvil;
- contraste WCAG 2.2 calculado sobre los hex reales: AA para texto normal y 3:1 para
  foco, componentes gráficos y borde de selección, con informe de los pares que llegan
  a AAA;
- `theme.css`: base, foco visible y `prefers-reduced-motion`;
- `fonts.css`: dos `@font-face`, pesos, `swap`, `unicode-range` y ausencia de fuentes de
  terceros;
- exports de los tres CSS y script `test` del paquete.

## Consumo previsto

`apps/web` importa `@memora/ui/tokens.css`, `@memora/ui/theme.css` y
`@memora/ui/fonts.css` desde su CSS global y declara `@source` hacia
`packages/ui/src` para que Tailwind vea las clases de los componentes. Sin
`tailwind.config` en ninguna de las dos partes.

## Comandos

`pnpm` puede no estar en PATH; usa `corepack pnpm`.

```bash
corepack pnpm --filter @memora/ui build
corepack pnpm --filter @memora/ui lint
corepack pnpm --filter @memora/ui test
corepack pnpm --filter @memora/ui typecheck
```

## Pendiente

- Componentes base y sus estados (F11/F12).
- Decidir si `HelpContent`, hoy en `apps/web`, se mueve aquí cuando exista React en el
  paquete (F11/F12).
