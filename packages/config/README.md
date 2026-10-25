# @memora/config

Configuración compartida del monorepo: `tsconfig` estricto, ESLint 9 flat config y Prettier 3.

No contiene código de producto y no depende de ningún otro workspace.

## Estructura

```text
packages/config/
├── eslint/base.mjs        # flat config compartida (@memora/config/eslint)
├── prettier/index.json    # opciones de Prettier (@memora/config/prettier)
├── tsconfig/base.json     # estricto, bundler, ES2022
├── tsconfig/node.json     # NodeNext para paquetes y API
└── tsconfig/react.json    # JSX + DOM para web y UI
```

## Cómo se consume

```jsonc
// tsconfig.json de un paquete
{ "extends": "@memora/config/tsconfig/node.json" }
```

```jsonc
// .prettierrc.json de la raíz
"@memora/config/prettier"
```

El `eslint.config.mjs` de la raíz reexporta `@memora/config/eslint`; cualquier workspace lo resuelve
por búsqueda ascendente, así que un único archivo cubre todo el monorepo.

## Reglas destacadas

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `verbatimModuleSyntax`.
- `@typescript-eslint/no-explicit-any: error` (el `any` implícito lo bloquea `strict`).
- Sin `dist`, `.turbo`, `assets`, `docs` ni `routeTree.gen.ts` en el lint.

## Comandos

```bash
pnpm --filter @memora/config typecheck
pnpm --filter @memora/config lint
```
