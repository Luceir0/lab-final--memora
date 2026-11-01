# @memora/api

API REST de Memora sobre Fastify 5.12.7, Prisma 7.10.1 con adapter `pg` y PostgreSQL 17.11.

Desde F08 el paquete expone el esqueleto de la API: configuración validada con Zod, plugins base, error handler uniforme, healthcheck, OpenAPI, logging con redacción y un harness de tests con `fastify.inject`. Los módulos de producto llegan en F15 y posteriores.

## Endpoints actuales

| Método | Ruta | Entorno | Descripción |
| --- | --- | --- | --- |
| GET | `/api/health` | todos | `{ status, version, timestamp }`; sin sesión ni datos sensibles |
| GET | `/api/openapi.json` | todos | OpenAPI 3.1 generado desde los esquemas Zod |
| GET | `/api/docs` | solo no producción | Swagger UI sobre `/api/openapi.json` |

`/api/docs` no se registra con `NODE_ENV=production`; en producción solo existe el JSON. La CSP de desarrollo elimina `upgrade-insecure-requests` y permite estilos inline para Swagger UI; sus scripts son externos y siguen limitados a `'self'`. La CSP de producción mantiene los valores estrictos de helmet.

## Errores

Todos los errores usan el sobre canónico de `packages/shared`:

```json
{
  "code": "FORBIDDEN",
  "message": "No tienes acceso a este círculo.",
  "details": null
}
```

- Solo se emiten los códigos de `ERROR_CODES`, con el status de `ERROR_HTTP_STATUS`.
- `details` es un array no vacío o `null`; nunca `[]`. Cada elemento se valida con `errorResponseSchema`; un detalle vacío o un mensaje vacío es un error de programación y lanza `TypeError`.
- Los 5xx se registran completos en el log, pero la respuesta no incluye mensaje interno ni stack.
- Un body JSON o un cuerpo de petición por encima del límite se mapea a `413 PAYLOAD_TOO_LARGE`; el límite de un archivo multipart usa `413 FILE_TOO_LARGE`; F25 lanzará `QUOTA_EXCEEDED` cuando el problema sea la cuota del círculo.
- Un `Content-Type` no multipart en una ruta de subida (406 de `@fastify/multipart`) se mapea a `415 UNSUPPORTED_MEDIA_TYPE`, igual que un multipart sin `boundary`.

## Estructura

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── prisma7.config.ts
├── vitest.config.ts
└── src/
    ├── index.ts               # entrada fina: loadConfig + startServer
    ├── server.ts              # listen y cierre ordenado por señales
    ├── app.ts                 # buildApp: plugins, rutas y error handler
    ├── config.ts              # esquema Zod de process.env y fallo rápido
    ├── errors.ts              # ApiError, mapeo status → código y detalles
    ├── logging.ts             # opciones pino y rutas de redacción
    ├── zod-locale.ts          # mensajes de Zod en español
    ├── version.ts             # versión de /api/health
    ├── types.ts               # alias de la instancia Fastify con Zod
    ├── plugins/
    │   ├── cookie.ts          # @fastify/cookie
    │   ├── csrf.ts            # @fastify/csrf (helpers para F15)
    │   ├── helmet.ts          # cabeceras de seguridad; HSTS solo en producción
    │   ├── multipart.ts       # límites de subida y validación de boundary
    │   ├── rate-limit.ts      # techo global por IP
    │   └── swagger.ts         # @fastify/swagger + transform de Zod
    ├── routes/
    │   ├── health.ts          # GET /api/health
    │   └── docs.ts            # /api/openapi.json y Swagger UI dev-only
    ├── services/
    │   ├── index.ts           # interfaces e implementaciones que fallan cerrado
    │   ├── storage.ts
    │   ├── email.ts
    │   ├── geocoding.ts
    │   └── images.ts          # procesado con sharp (F07)
    ├── test/
    │   ├── harness.ts         # createTestApp con inject y servicios fake
    │   ├── fakes.ts           # storage/email/geocoding en memoria
    │   ├── routes.ts          # rutas solo de test (400, 500, logs)
    │   ├── db.ts              # cliente de test y guarda anti-truncado
    │   ├── db.test.ts
    │   └── factories.ts
    └── generated/prisma/      # ignorado en git; `prisma generate` lo recrea
```

Los servicios externos se inyectan como adaptadores con un discriminante `kind: 'unavailable' | 'fake' | 'real'`. Sin implementación, `buildApp` falla cerrado en vez de llamar a la red; los tests usan fakes y `buildApp()` solo acepta `'real'` en producción. Es una frontera de código, no una garantía criptográfica: cualquier adaptador puede declararse `'real'`, pero los fakes de test no se compilan a `dist`.

## Variables

Todas se validan en `src/config.ts` al arrancar. Un valor inválido detiene el proceso con un mensaje que nombra la variable y nunca repite su valor.

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` o `production`. Controla HSTS, trust proxy y `/api/docs`. |
| `API_PORT` | `3001` | Puerto HTTP (1–65535). |
| `HOST` | `127.0.0.1` | Interfaz de escucha. |
| `LOG_LEVEL` | `info` | Nivel de pino (`fatal`…`trace` o `silent`). |
| `SESSION_SECRET` | sin definir | Firma HMAC de CSRF. Obligatoria (mínimo 32 caracteres) en producción. |
| `DATABASE_URL` | solo `prisma generate` usa el fallback local | Obligatoria para migraciones, `db seed`, cualquier comando que conecte y el runtime en producción. En tests debe apuntar a una base `_test`. |
| `ALLOW_REMOTE_TEST_DB` | sin definir | `1` permite un host remoto en tests; nunca relaja el sufijo `_test` ni el entorno. |

`startServer()` falla cerrado en producción si no recibe adaptadores reales de storage, email y geocoding. En desarrollo y test se usa el fallback que falla en la primera llamada, nunca en la red.

## Logging

Pino redacta `req.headers.cookie`, `req.headers.authorization`, `res.headers['set-cookie']`, `req.headers['x-csrf-token']`, `password`, `token`, `passwordHash`, `tokenHash`, `csrfToken`, `sessionToken`, `sessionSecret` y `email`, también anidados hasta tres niveles. No se registran cuerpos con secretos ni PII, ni DTOs completos.

## Comandos

```bash
pnpm --filter @memora/api dev                # node --watch src/index.ts
pnpm --filter @memora/api build              # limpia dist, prisma generate y tsc
pnpm --filter @memora/api start              # node dist/index.js
pnpm --filter @memora/api lint               # eslint .
pnpm --filter @memora/api typecheck          # prisma generate && tsc -p tsconfig.json --noEmit
pnpm --filter @memora/api test               # prisma generate && vitest run
pnpm --filter @memora/api db:generate        # prisma generate
pnpm --filter @memora/api db:migrate         # prisma migrate dev (desarrollo)
pnpm --filter @memora/api db:migrate:deploy  # prisma migrate deploy (CI y bases ya creadas)
pnpm --filter @memora/api db:seed            # prisma db seed (requiere DATABASE_URL)
```

`prisma generate` es el único comando que puede ejecutarse sin `DATABASE_URL`; el resto de comandos que abren conexión fallan con un mensaje claro para no apuntar por accidente a la base local.

## Datos

- Modelo y contratos: [docs/03-architecture/data-model.md](../../docs/03-architecture/data-model.md).
- Decisión de versión: [ADR-0004](../../docs/03-architecture/adr/ADR-0004-prisma.md).
- Modelos implementados (10): `User`, `Session`, `Circle`, `Membership`, `Invitation`, `Album`, `Photo`, `PhotoTag`, `DownloadJob` y `Activity`.
- Enums: `ThemePreference`, `Role`, `DownloadKind`, `DownloadStatus` y `ActivityType`.
- Una sola migración inicial: `prisma/migrations/20261031224916_init/`.
- Las fechas se guardan como `timestamptz(3)`. No se persisten coordenadas GPS; solo `placeName`.
- La URL del datasource vive en `prisma7.config.ts`, no en `schema.prisma`, para que `prisma generate` funcione sin base de datos.

`src/generated/prisma` está en `.gitignore`. No se edita a mano: `prisma generate` lo recrea, y los scripts `build`, `typecheck` y `test` lo ejecutan antes de compilar o probar.

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

## Tests HTTP

`src/test/harness.ts` expone `createTestApp()`: valida la configuración de test, inyecta servicios fake, desactiva el logger por defecto, deja el rate limit holgado y llama a `app.ready()`. Las aserciones usan `app.inject()`, sin abrir puerto. El límite global es 300 peticiones/minuto por IP; las pruebas que verifican 429 bajan el techo explícitamente.
