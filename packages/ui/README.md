# @memora/ui

Componentes presentacionales y tokens de diseño de Memora.

En F05 deja de estar vacío: exporta `./tokens.css` con los tokens semánticos en claro y
oscuro y un bloque `@theme inline` para Tailwind 4. Los componentes llegan en F11/F12.

## Fronteras

- `ui` → `config` (tooling). Nada más.
- No importa `@memora/shared`, `@memora/api-client` ni `apps/*`.
- Sin lógica de dominio, sin fetch, sin estado de servidor.
- Se consume como fuente en dev y se compila a `dist` para el build.

## Estructura

```text
packages/ui/
├── src/
│   ├── index.ts              # punto de entrada (UI_PACKAGE_NAME)
│   └── styles/tokens.css     # tokens + @theme inline, exportado como ./tokens.css
├── tsconfig.json             # typecheck (sin emitir)
└── tsconfig.build.json       # build a dist con declaraciones
```

## Tokens

`src/styles/tokens.css` es CSS-first: no hay preset JS ni `tailwind.config`.

- Variables CSS en `:root` y `[data-theme="dark"]`: colores, estados, acentos,
  tipografía, radios, sombras y movimiento (fuente: `docs/02-design/tokens.md`).
- `@theme inline` las expone como utilidades de Tailwind 4 (`bg-bg`, `text-text`,
  `bg-surface`, `text-primary`, `rounded-xl`, `shadow-md`).
- Los cambios de tema funcionan porque las utilidades referencian la variable, no un
  valor congelado.

Consumo previsto en `apps/web`: importa `@memora/ui/tokens.css` desde su CSS global y
declara `@source` hacia `packages/ui/src` para que Tailwind vea las clases de los
componentes. Sin `tailwind.config` en ninguna de las dos partes.

## Comandos

`pnpm` puede no estar en PATH; usa `corepack pnpm`.

```bash
corepack pnpm --filter @memora/ui build
corepack pnpm --filter @memora/ui lint
corepack pnpm --filter @memora/ui typecheck
```

## Pendiente

- Componentes base y sus estados (F11/F12).
- Decidir si `HelpContent`, hoy en `apps/web`, se mueve aquí cuando exista React en el
  paquete (F11/F12).
