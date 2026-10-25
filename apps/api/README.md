# @memora/api

API REST de Memora sobre Fastify 5.

En esta fase solo existe el esqueleto: la fábrica de servidor (`src/build-server.ts`) y el arranque
que escucha en `API_PORT` (3001 por defecto) y `HOST` (127.0.0.1 por defecto). No hay rutas de
producto, ni Prisma, ni conexión a base de datos; eso llega en F05 en adelante.

## Estructura

```text
apps/api/src/
├── build-server.ts   # crea la instancia de Fastify sin rutas
└── index.ts          # arranque: puerto, host y cierre ordenado
```

Próximas carpetas previstas por [monorepo.md](../../docs/03-architecture/monorepo.md):
`modules/`, `services/`, `plugins/` y `test/`.

## Comandos

```bash
pnpm --filter @memora/api dev        # node --watch src/index.ts
pnpm --filter @memora/api build      # tsc -p tsconfig.build.json
pnpm --filter @memora/api start      # node dist/index.js
pnpm --filter @memora/api lint
pnpm --filter @memora/api typecheck
```

## Variables

| Variable   | Por defecto | Uso                 |
| ---------- | ----------- | ------------------- |
| `API_PORT` | `3001`      | Puerto HTTP         |
| `HOST`     | `127.0.0.1` | Interfaz de escucha |
