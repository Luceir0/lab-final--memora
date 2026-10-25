# @memora/web

Aplicación web de Memora: TanStack Start 1.169 sobre Vite 8 y React 19.

En F04 es un esqueleto sin producto: sin Tailwind, sin tokens, sin layout, sin datos y sin fetch.
Las rutas reales, el SSR selectivo, el prerender y el proxy `/api` llegan en F05/F09.

## Estructura

```text
apps/web/
├── src/
│   ├── router.tsx          # createRouter + registro de tipos
│   └── routes/
│       ├── __root.tsx      # documento HTML (`lang="es"`, viewport, título)
│       └── index.tsx       # `main` + `h1` con SITE_NAME
└── vite.config.ts          # plugin de Start + plugin de React
```

`src/routeTree.gen.ts` lo genera el plugin de TanStack Router a partir de `src/routes/**`
al ejecutar `dev` o `build`. No se edita a mano y está excluido de ESLint y Prettier; se
versiona para que `pnpm typecheck` funcione en un clon limpio y en CI.

## Fronteras

- `web` → `shared`, `api-client`, `ui`, `config` (ver `docs/03-architecture/monorepo.md`).
- Nada de lógica de autorización en cliente.
- Componentes presentacionales en `packages/ui`; composición de app en `src/components`.

## Comandos

```bash
pnpm --filter @memora/web dev        # http://localhost:3000
pnpm --filter @memora/web build
pnpm --filter @memora/web lint
pnpm --filter @memora/web typecheck
pnpm --filter @memora/web test
```

El puerto 3000 está fijado en el script (`--port 3000 --strictPort`) para que coincida con
el proxy de la API y con el resto de la documentación.
