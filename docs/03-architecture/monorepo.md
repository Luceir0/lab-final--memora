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
│       ├── prisma/           # schema, migrations y seed
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

La tabla es el **máximo** permitido, no una lista de dependencias obligatorias. Cada workspace declara en su `package.json` solo lo que usa: tras F05, `apps/web` depende de `shared`, `ui` y `config`; `api-client` se añadirá cuando exista consumo real de la API (F09+).

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

## Base de datos de test

Los tests de integración de la API usan una base PostgreSQL real y separada, `memora_test`. No se crea ni se migra automáticamente: el runner debe inyectar `DATABASE_URL`.

```bash
docker exec memora-postgres-1 psql -U memora -d memora -c 'CREATE DATABASE memora_test'
DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api db:migrate:deploy
DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test
```

- `resetDb` trunca tablas: solo acepta nombre acabado en `_test`, host local y entorno de test (`NODE_ENV=test` o `VITEST`).
- `ALLOW_REMOTE_TEST_DB=1` relaja **solo** el host; el sufijo `_test` y el entorno de test siguen siendo obligatorios.
- Sin `DATABASE_URL`, las suites de base se saltan; no fallan. Detalle del modelo en [data-model.md](data-model.md#migraciones).

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
