# @memora/web

Aplicación web de Memora: TanStack Start 1.169.4 sobre Vite 8.3.5 y React 19.

F05 dejó las rutas de humo y los tokens. F09 añade la base de la aplicación: cliente
de API, `QueryClientProvider` por petición, error boundary con reintento, 404 y
variables de entorno tipadas. Sigue sin haber pantallas de producto.

## Rutas de humo

| Ruta | Modo | Qué demuestra |
| --- | --- | --- |
| `/login` | SSR | Formulario inicial renderizado en servidor (placeholder de F16) |
| `/circles` | `ssr: false` | Zona privada sin render en la primera petición (placeholder de F18) |
| `/help` | Prerender | Contenido editorial generado en build (F36) |

`/` es la página mínima del esqueleto. Una ruta desconocida renderiza el 404 de la
raíz. Los contratos de render modes están en `docs/03-architecture/render-modes.md`.

## Estructura

```text
apps/web/
├── src/
│   ├── components/         # composición de app: 404 y error de ruta
│   ├── features/spike/     # contenido de /help y páginas de /circles y /login
│   ├── lib/
│   │   ├── api-client.ts        # instancia de navegador (VITE_API_BASE_URL)
│   │   ├── api-client.server.ts # instancia de servidor (API_INTERNAL_URL, server-only)
│   │   ├── env.ts               # base del navegador y normalización común
│   │   ├── env.server.ts        # origen interno validado + base `/api` (solo servidor)
│   │   ├── query-client.ts      # QueryClient, contexto del router y política de retry
│   │   └── error-message.ts     # error -> mensaje seguro en español
│   ├── routes/              # __root (documento + providers), index, login, circles, help
│   ├── styles/app.css       # Tailwind 4 + tokens
│   ├── test/setup.ts        # cleanup de Testing Library
│   ├── router.tsx           # getRouter + QueryClient por petición
│   └── vite-env.d.ts        # tipado de import.meta.env
├── vitest.config.ts         # jsdom + include de src/**/*.test.{ts,tsx}
└── vite.config.ts           # Start, React, Tailwind, proxy /api y prerender
```

`src/routeTree.gen.ts` lo genera el plugin de TanStack Router a partir de `src/routes/**`
al ejecutar `dev` o `build`. No se edita a mano y está excluido de ESLint y Prettier; se
versiona para que `pnpm typecheck` funcione en un clon limpio y en CI. Los `*.test.tsx`
de `src/routes` se excluyen del árbol con `routeFileIgnorePattern`.

## Variables de entorno

Solo dos, ninguna secreta. La sección «Web» de `.env.example` de la raíz las deja como
referencia, pero **Vite no lee ese archivo**: defínelas en el entorno o en
`apps/web/.env`.

| Variable | Dónde se lee | Formato | Por defecto |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Navegador (bundle cliente) | Ruta (`/api`) o URL absoluta | `/api` |
| `API_INTERNAL_URL` | SSR, server functions y destino del proxy de Vite | Origen absoluto `http(s)`, **sin `/api`** | `http://127.0.0.1:3001` |

- Si faltan, están vacías o solo tienen espacios, se aplica el valor por defecto.
- `VITE_API_BASE_URL` se normaliza sin barras finales.
- `API_INTERNAL_URL` se valida al arrancar: debe ser una URL absoluta con protocolo
  `http:` o `https:`, sin ruta, credenciales, query ni hash. Si no lo es, el arranque
  falla con un error claro en español. La base del cliente de servidor es
  `${API_INTERNAL_URL}/api`.
- En local no hace falta `.env`: los valores por defecto ya apuntan al proxy y a la
  API del puerto 3001. Para cambiarlos, define las variables en el entorno o en
  `apps/web/.env`.
- `API_INTERNAL_URL` no empieza por `VITE_`, así que Vite no la expone al navegador.
- `apps/web/src/lib/api-client.server.ts` importa `@tanstack/react-start/server-only`:
  si un módulo cliente lo importa, el build falla. No debe aparecer en `dist/client`.

## API y datos

`apps/web/src/lib/api-client.ts` crea la instancia de navegador con
`createApiClient` de `@memora/api-client`. No implementa sesión, CSRF ni caché: solo
configura la base. La instancia de servidor vive en `api-client.server.ts` y usa como
base `${API_INTERNAL_URL}/api`: la variable es un origen, no la base del contrato.

`vite.config.ts` proxya `/api` al **origen** de `API_INTERNAL_URL`, así que el navegador
habla con la API local sin CORS. El puerto 3000 está fijado con `--port 3000
--strictPort`.

Ese proxy es **solo de desarrollo**. En producción, el servidor web o el reverse proxy
(F42) debe enrutar `/api` hacia la API; si no, el navegador recibiría el 404 de la web.

En SSR, `credentials: 'include'` no reenvía cookies en el `fetch` de Node. Las server
functions autenticadas deberán pasar la cabecera `cookie` explícitamente (F10/F22).

## Query y errores

- `getRouter()` crea un `QueryClient` nuevo: uno por navegador y uno por petición en
  servidor. No hay caché compartida entre peticiones.
- `staleTime` es de 30 s. `retry` no reintenta `ApiError` 4xx; sí 5xx y errores de red,
  con un máximo de 2 reintentos.
- `__root.tsx` monta `QueryClientProvider` en el `shellComponent`, de modo que el error
  boundary y el 404 también tienen contexto.
- El error boundary raíz muestra `role="alert"`, mueve el foco al título, invalida las
  queries y ejecuta `reset()`. Incluye enlace a la portada.
- El 404 de la raíz es `components/not-found.tsx`, con enlace SPA a `/`.

## Estilos y tokens

Tailwind 4.3.3 en modo CSS-first, sin preset JS ni `tailwind.config`.

- `src/styles/app.css` importa `tailwindcss` y `@memora/ui/tokens.css`, y declara
  `@source` hacia `packages/ui/src`.
- `@memora/ui/tokens.css` define los tokens semánticos en `:root` y `[data-theme="dark"]`
  y los expone con `@theme inline`.
- `__root.tsx` fija `data-theme="light"` en `<html>`.

## Contenido editorial

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

Vitest 5 con entorno `jsdom`, Testing Library y un setup propio para el cleanup. Cubren
los tokens y la ausencia de `tailwind.config`, la lectura del snapshot real (6 artículos
y 8 FAQ), los modos de `/circles` y `/login`, `HelpContent`, la resolución de las dos
bases de API, la política de reintentos del `QueryClient`, la instancia del cliente sin
red real, el 404 y el error boundary.

## Limitaciones

- `/login` y `/circles` son placeholders: F16 y F18 los sustituirán.
- `/help` se rehará en F36 (Content Island).
- No hay autenticación ni datos persistidos en la web todavía.
- La verificación de hidratación es estática (tests y HTML de servidor): no hay navegador
  real ni Playwright hasta F37/F38.
- `scripts/no-tests.mjs` es un resto de F04, sin uso; se conserva por si Turbo lo
  necesita.
