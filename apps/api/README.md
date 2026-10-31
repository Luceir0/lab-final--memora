# @memora/api

API REST de Memora sobre Fastify 5.12.7, Prisma 7.10.1 con adapter `pg` y PostgreSQL 17.11.

El paquete incluye ya el modelo de datos completo, la migración inicial, el seed determinista y los tests de integración. Los endpoints de producto llegan en F08 y el auth en F15; hoy solo existen las rutas de spike (`/api/health` y `/api/spike/echo`).

## Datos

- Modelo y contratos: [docs/03-architecture/data-model.md](../../docs/03-architecture/data-model.md).
- Decisión de versión: [ADR-0004](../../docs/03-architecture/adr/ADR-0004-prisma.md).
- Modelos implementados (10): `User`, `Session`, `Circle`, `Membership`, `Invitation`, `Album`, `Photo`, `PhotoTag`, `DownloadJob` y `Activity`.
- Enums: `ThemePreference`, `Role`, `DownloadKind`, `DownloadStatus` y `ActivityType`.
- Una sola migración inicial: `prisma/migrations/20261031224916_init/`.
- Las fechas se guardan como `timestamptz(3)`. No se persisten coordenadas GPS; solo `placeName`.
- La URL del datasource vive en `prisma7.config.ts`, no en `schema.prisma`, para que `prisma generate` funcione sin base de datos.

## Estructura

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       └── 20261031224916_init/migration.sql
├── prisma7.config.ts
├── vitest.config.ts
└── src/
    ├── build-server.ts        # Fastify 5 + Zod 4, errores uniformes y rutas de spike
    ├── index.ts               # arranque: API_PORT, HOST y cierre ordenado
    ├── db.ts                  # cliente Prisma perezoso con @prisma/adapter-pg
    ├── db-url.ts              # resuelve DATABASE_URL y su fallback local
    ├── db.integration.test.ts # migración, constraints, cascadas, seed y guarda de BD
    ├── services/
    │   ├── images.ts          # procesado de imágenes con sharp
    │   └── images.test.ts
    ├── spike/
    │   ├── routes.ts          # /api/health y /api/spike/echo (temporal, F08)
    │   ├── routes.test.ts
    │   └── schemas.ts
    ├── test/
    │   ├── db.ts              # cliente de test, resetDb y guarda anti-truncado
    │   ├── db.test.ts         # tests unitarios de la guarda
    │   └── factories.ts       # factories tipadas para tests
    └── generated/prisma/      # ignorado en git; se regenera con prisma generate
```

`src/generated/prisma` está en `.gitignore`. No se edita a mano: `prisma generate` lo recrea, y los scripts `build`, `typecheck` y `test` lo ejecutan antes de compilar o probar.

## Comandos

```bash
pnpm --filter @memora/api dev                # node --watch src/index.ts
pnpm --filter @memora/api build              # prisma generate && tsc -p tsconfig.build.json
pnpm --filter @memora/api start              # node dist/index.js
pnpm --filter @memora/api lint               # eslint .
pnpm --filter @memora/api typecheck          # prisma generate && tsc -p tsconfig.json --noEmit
pnpm --filter @memora/api test               # prisma generate && vitest run
pnpm --filter @memora/api db:generate        # prisma generate
pnpm --filter @memora/api db:migrate         # prisma migrate dev (desarrollo)
pnpm --filter @memora/api db:migrate:deploy  # prisma migrate deploy (CI y bases ya creadas)
pnpm --filter @memora/api db:seed            # prisma db seed
```

## Base de datos

### Desarrollo

`db:migrate` aplica las migraciones en la base de desarrollo y `db:seed` carga los datos de prueba. El seed es determinista e idempotente:

- `prisma/seed.ts` usa `SEED_TIMESTAMP = 2025-01-15T09:00:00.000Z` en los timestamps de las filas y `upsert` con ids fijos.
- Carga 2 usuarios, 2 círculos, 4 memberships, 2 álbumes, 6 fotos, 2 tags, 1 invitación y 4 actividades.
- El círculo `Viaje a Lisboa` es de solo lectura: los cuatro permisos están a `false`.
- `User.passwordHash` es un placeholder deliberadamente inválido. No sirve para iniciar sesión; el hashing real llega en F15.

### Test

Los tests de integración usan una base separada cuyo nombre debe terminar en `_test`. En local, con el contenedor `memora-postgres-1`:

```bash
docker exec memora-postgres-1 psql -U memora -d memora -c 'CREATE DATABASE memora_test'

export DATABASE_URL="postgresql://<usuario>:<contraseña>@127.0.0.1:5432/memora_test"
pnpm --filter @memora/api db:migrate:deploy
pnpm --filter @memora/api test
```

Reglas de la base de test:

- Sin `DATABASE_URL`, los tests de integración se saltan; el resto de la suite sigue pasando.
- La guarda de `src/test/db.ts` exige host local (`localhost`, `127.0.0.1` o `::1`), nombre terminado en `_test` y entorno de test (`NODE_ENV=test` o `VITEST`).
- Se niega a truncar una base sin sufijo `_test`; así la suite no puede vaciar la base de desarrollo.
- `ALLOW_REMOTE_TEST_DB=1` relaja solo el host para una base remota desechable; el sufijo `_test` sigue siendo obligatorio.
- `resetDb()` trunca las tablas de los modelos con `RESTART IDENTITY CASCADE` y conserva `_prisma_migrations`.

## Variables

| Variable                | Por defecto                         | Uso                                                                                          |
| ----------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `API_PORT`              | `3001`                              | Puerto HTTP                                                                                  |
| `HOST`                  | `127.0.0.1`                         | Interfaz de escucha                                                                          |
| `DATABASE_URL`          | Fallback local de `src/db-url.ts`   | Conexión PostgreSQL para Prisma, la API y los tests. En tests debe apuntar a una base `_test`. |
| `ALLOW_REMOTE_TEST_DB`  | sin definir                         | `1` permite un host remoto en tests; nunca relaja el sufijo `_test` ni el entorno de test.   |
