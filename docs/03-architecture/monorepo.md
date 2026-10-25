# Monorepo

## Estructura

```text
memora/
├── apps/
│   ├── web/                  # TanStack Start
│   │   └── src/
│   │       ├── routes/
│   │       ├── features/
│   │       ├── hooks/
│   │       ├── components/   # composición de app
│   │       └── test/
│   └── api/
│       └── src/
│           ├── modules/      # auth, circles, albums, photos, invitations, downloads, activity
│           ├── services/     # storage, email, geocoding, zip
│           ├── plugins/
│           └── test/
├── packages/
│   ├── shared/
│   ├── api-client/
│   ├── ui/
│   └── config/
├── docs/
├── assets/
├── scripts/                  # check-docs, validate-agents
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Dependencias permitidas

```text
apps/web  → shared, api-client, ui, config
apps/api  → shared, config
api-client → shared, config
ui        → config
shared    → config
config    → (nada interno)
```

- `shared` no importa React, Fastify ni Prisma.
- `ui` no importa API ni dominio.
- `api-client` no importa UI.
- `apps/api` no importa `ui` ni `api-client`. Los tipos compartidos viven en `shared`.
- Evitar dependencias circulares.

## Scripts previstos

```json
{
  "dev": "turbo dev",
  "build": "turbo build",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck",
  "test": "turbo test",
  "test:e2e": "turbo test:e2e",
  "docs:check": "node scripts/check-docs.mjs",
  "agents:check": "node scripts/validate-agents.mjs",
  "db:migrate": "pnpm --filter @memora/api db:migrate",
  "db:seed": "pnpm --filter @memora/api db:seed"
}
```

## Reglas

- `pnpm` + `packageManager` fijado; `corepack`.
- TypeScript `strict` con `tsconfig` base.
- Imports `@memora/*`.
- `packages/ui` se consume como fuente en dev y se compila para build si hace falta.
- Tailwind 4: tokens y `@source` en `packages/ui`; sin preset JS.
- Cada paquete tiene su `README.md` con propósito y comandos.
- CI ejecuta lint, typecheck, test y build con caché de Turborepo.

## Fronteras

Si un cambio necesita importar algo no permitido, se para y se decide si mover el código o crear una abstracción. No se rompe la frontera por conveniencia.
