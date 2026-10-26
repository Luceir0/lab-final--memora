# @memora/web

Aplicación web de Memora: TanStack Start 1.169.4 sobre Vite 8.3.5 y React 19.

En F05 deja de ser un scaffold vacío: tiene Tailwind 4 con tokens, las rutas del spike
con sus modos de render, el proxy `/api` y la lectura del snapshot de Content Island.
Sigue siendo un spike: no hay producto real ni diseño final.

## Rutas de F05

| Ruta | Modo | Qué demuestra |
| --- | --- | --- |
| `/login` | SSR | Formulario inicial renderizado en servidor |
| `/circles` | `ssr: false` | Zona privada sin render en la primera petición |
| `/help` | Prerender | Contenido editorial generado en build |

`/` sigue siendo la página mínima del esqueleto de F04. Los contratos de render modes
están en `docs/03-architecture/render-modes.md`.

## Estructura

```text
apps/web/
├── src/
│   ├── features/spike/     # contenido de /help y página de /circles
│   ├── routes/
│   │   ├── __root.tsx      # documento HTML (`lang="es"`, `data-theme`, CSS global)
│   │   ├── index.tsx       # `main` + `h1` con SITE_NAME
│   │   ├── login.tsx       # SSR
│   │   ├── circles.tsx     # ssr: false
│   │   └── help.tsx        # loader + prerender
│   ├── styles/app.css      # Tailwind 4 + tokens
│   ├── test/setup.ts       # cleanup de Testing Library
│   └── router.tsx          # createRouter + registro de tipos
├── vitest.config.ts        # jsdom + include de src/**/*.test.{ts,tsx}
└── vite.config.ts          # Start, React, Tailwind y proxy /api
```

`src/routeTree.gen.ts` lo genera el plugin de TanStack Router a partir de `src/routes/**`
al ejecutar `dev` o `build`. No se edita a mano y está excluido de ESLint y Prettier; se
versiona para que `pnpm typecheck` funcione en un clon limpio y en CI. Los `*.test.tsx`
de `src/routes` se excluyen del árbol con `routeFileIgnorePattern`.

## Estilos y tokens

Tailwind 4.3.3 en modo CSS-first, sin preset JS ni `tailwind.config`.

- `src/styles/app.css` importa `tailwindcss` y `@memora/ui/tokens.css`, y declara
  `@source` hacia `packages/ui/src`.
- `@memora/ui/tokens.css` define los tokens semánticos en `:root` y `[data-theme="dark"]`
  y los expone con `@theme inline`: `bg-bg`, `text-text`, `bg-surface`, `text-primary`,
  `rounded-xl`, `shadow-md`.
- `__root.tsx` importa el CSS global y fija `data-theme="light"` en `<html>`.

## Proxy y datos

`vite.config.ts` proxya `/api` a `http://127.0.0.1:3001`, así que el navegador habla con
la API local sin CORS. El puerto 3000 está fijado con `--port 3000 --strictPort`.

`/help` lee `content-island-snapshot.json` de la raíz del repo en build, con
`@content-island/api-client` en modo `snapshot` y `language: 'es'`. El build no necesita
token: el snapshot está en disco. Si falta o es inválido, el build falla con un mensaje
que incluye la ruta esperada y cómo regenerarlo. `CONTENT_ISLAND_SNAPSHOT_PATH` permite
apuntar a otra copia.

El loader de `/help` es una server function (`createServerFn`), de modo que
`readHelpContent` y `node:fs` no entran en el bundle cliente.

## Fronteras

- `web` → `shared`, `api-client`, `ui`, `config` (ver `docs/03-architecture/monorepo.md`).
- Nada de lógica de autorización en cliente.
- Componentes presentacionales en `packages/ui`; composición de app en `src/components`.
  La excepción de F05 es `HelpContent`, que vive en `src/features/spike/` hasta que
  F11/F12 decidan su ubicación definitiva.

## Comandos

`pnpm` puede no estar en PATH; usa `corepack pnpm`.

```bash
corepack pnpm --filter @memora/web dev        # http://localhost:3000
corepack pnpm --filter @memora/web build
corepack pnpm --filter @memora/web test
corepack pnpm --filter @memora/web lint
corepack pnpm --filter @memora/web typecheck
```

## Tests

Vitest 5 con entorno `jsdom`, Testing Library y un setup propio para el cleanup.
Cubren los tokens y la ausencia de `tailwind.config`, la lectura del snapshot real
(6 artículos y 8 FAQ), los modos de `/circles` y `/login`, y el componente `HelpContent`.

## Limitaciones

F05 es un spike. `/login` y `/circles` son placeholders: F16 (auth web) y F18 (circles web)
los sustituirán. `/help` se rehará en F36 (Content Island). No hay autenticación ni datos
persistidos en la web todavía.
