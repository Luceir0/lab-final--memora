# Handoff — F15 Auth API

> Estado: **`done`** (2026-11-03). Aceptada por el usuario el 2026-11-03 y revisada de forma independiente en nivel **A** por `reviewer` (**apto con correcciones**: 1 Mayor y 8 Menores resueltos, N-01 aceptado). Verificación real: 127/127 tests de la API (auth: 29/29) contra `memora_test`. **Cierre operativo pendiente**: no hay commit, PR ni CI.

## Resultado

F15 queda cerrada técnicamente. Además de la feature original, esta ronda aplica las correcciones M-01, M-03, M-04, M-05, M-06, M-07 y M-09 de la revisión independiente, y las opcionales N-03. M-02 y N-01 se aceptan y documentan; M-08 lo corrige el orquestador en la spec. El usuario aceptó la feature el **2026-11-03**, con AC-01…AC-07 en verde, y queda en **`done`**; el cierre operativo sigue pendiente de autorización.

## Cambios (archivos)

### Feature original (rondas previas)

- `apps/api/package.json` + `pnpm-lock.yaml`: `@node-rs/argon2@2.2.2` exacta; `@node-rs/argon2-wasm32-wasi@2.2.2` como devDependency (instalado por el usuario para este Windows).
- `packages/shared/src/errors.ts` + test: `INVALID_CREDENTIALS_MESSAGE`.
- `apps/api/src/config.ts` + test: `APP_URL` y `COOKIE_DOMAIN`.
- `apps/api/src/app.ts`: Prisma inyectable, decorado y cerrado; rutas de auth; handlers de error antes de las rutas (corrección previa).
- `apps/api/src/modules/auth/password.ts`, `session.ts`, `origin.ts`, `dto.ts`, `routes.ts`.
- `apps/api/src/test/harness.ts`, `factories.ts` (`makeSession`), `auth.test.ts`.
- `apps/api/vitest.config.ts`: `fileParallelism: false` (suites de BD sobre `memora_test`).
- `apps/api/src/app.test.ts`: regresión del orden de handlers.

### Correcciones de esta ronda

- **M-01 — techo agregado de login por IP.** `routes.ts`: `LOGIN_IP_RATE_LIMIT_MAX = 20`, limitador independiente creado con `app.createRateLimit({ max: 20, timeWindow: '1 minute', keyGenerator: (req) => req.ip })` y ejecutado en un `preHandler` adicional, conviviendo con el de 5/min por IP+email y con el global. Documentado en la descripción OpenAPI. Nota de implementación: `applyRateLimit` de `@fastify/rate-limit` devuelve siempre `isAllowed: false` y expresa la decisión en `isExceeded`; se comprueba `!isAllowed && isExceeded` (comentado en el código). Test: 20 logins con emails distintos → 401, el 21.º → 429.
- **M-03 — credenciales reales del seed.** `prisma/seed.ts`: `SEED_PASSWORD = 'memora-demo'` hasheada en cada seed con `hashPassword()` (Argon2id). Sal fija (`memora-seed-salt`) solo para que el fixture público sea reproducible entre ejecuciones; los usuarios reales usan sal aleatoria (`hashPassword(password, { salt? })`). Emails y demás datos intactos. Verificado con seed real y login `inject`.
- **M-04 — test de rotación real.** Ahora registra, guarda la cookie, hace login **enviando** esa cookie, comprueba que la antigua da 401, la nueva 200 y que queda **una** fila `Session`.
- **M-05 — `Cache-Control`.** `GET /api/me` y `GET /api/auth/csrf` responden `Cache-Control: private, no-store` y `Vary: Cookie`. Test propio.
- **M-06 — `APP_URL` HTTPS en producción.** `config.ts` rechaza `APP_URL` no `https:` con `NODE_ENV=production`; el mensaje no incluye el valor. Test en `config.test.ts`. El harness usa `https://localhost:3000` como origen por defecto en apps de producción.
- **M-07 — CSRF obsoleto tras login/registro.** Login y registro limpian `memora_csrf`; no devuelven token (el contrato no lo incluye). Documentado en OpenAPI como requisito de F16: llamar a `GET /auth/csrf` después de autenticarse. Test: tras login la cookie CSRF queda vacía.
- **M-09 — OpenAPI.** Tag `Auth` con descripción en `plugins/swagger.ts`; parámetro `X-CSRF-Token` documentado (string, `required: true`) en `POST /auth/logout` y `PATCH /me`; `429` en `logout`, `csrf`, `me` y `patch me`; sin `403` en los GET (no comprueban `Origin`). El header se documenta como requerido mediante un transform de OpenAPI, pero su validación runtime sigue en el módulo de auth para que falte → **403**, no 400 (AC-05).
- **N-03 (opcional).** Test del prefijo `$argon2id$` del hash almacenado y test del refresco de `lastUsedAt` a los 5 minutos, reutilizando `makeSession`.

## Decisiones técnicas aplicadas

- Cookie `memora_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, 30 días, `Secure` solo en producción; `Domain` solo con `COOKIE_DOMAIN`.
- Cookie `memora_csrf`: legible, mismas banderas/duración; se limpia en login/registro. Token HMAC atado al token de sesión en claro (nunca persistido ni logueado).
- Mutaciones autenticadas: `Origin`/`Referer` permitido + `X-CSRF-Token`. `register`/`login`: solo `Origin`/`Referer`. Ausencia o valor no permitido → 403.
- Rate limits: login 5/min por IP+email **y** 20/min por IP agregado; registro 3/hora por IP. Sin relajarlos en tests.
- Registro: usuario + sesión en transacción; `P2002` → `409 CONFLICT` con detalle `email`.
- Login fallido: mismo 401 y mensaje; email desconocido consume el mismo coste Argon2.
- Limpieza de sesiones perezosa (purga programada → F42).
- `PATCH /me` actúa solo sobre `session.userId`; `email` → 400; `avatar` fuera del MVP.

## Verificación (comandos y resultado reales)

| Comando | Resultado |
| --- | --- |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test auth` | **1 archivo, 29/29 tests pasan**. |
| `DATABASE_URL=…memora_test pnpm --filter @memora/api test` | **9 archivos, 127/127 tests pasan**. |
| `pnpm --filter @memora/api typecheck` | Pasa. |
| `pnpm --filter @memora/api lint` | Pasa. |
| `pnpm --filter @memora/shared test` | **138/138 tests pasan**. |
| `pnpm typecheck` | 9/9 tareas correctas. |
| `pnpm lint` | 6/6 tareas correctas. |
| `pnpm format:check` | Todos los archivos formateados. |
| `DATABASE_URL=…memora pnpm --filter @memora/api db:seed` | `Seed completed: {"users":2,"circles":2,"memberships":4,"albums":2,"photos":6,"tags":2,"invitations":1,"activities":4}`. |
| Login real con `inject` contra la BD de desarrollo | `login=200 code=OK email=lucia@memora.test cookie=true` con `lucia@memora.test` / `memora-demo`. |

## Criterios de aceptación (AC-01…AC-07)

- **AC-01: pasa.** Registro 201; usuario y `Session` con `tokenHash = SHA-256(token)`; sin `passwordHash`; hash almacenado con prefijo `$argon2id$`.
- **AC-02: pasa.** Email desconocido y contraseña incorrecta → `ErrorResponse` idéntico (401 `UNAUTHENTICATED`, «Email o contraseña incorrectos.»), sin sesión.
- **AC-03: pasa.** Logout 204, cookies limpias, cookie antigua → 401 y 0 sesiones.
- **AC-04: pasa.** `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000`; `Secure` solo en producción; cookie CSRF sin `HttpOnly`.
- **AC-05: pasa.** Sin token / inválido / de otra sesión → 403; token válido → 204. El header faltante sigue siendo 403 (no 400).
- **AC-06: pasa.** 6.º login por IP+email → 429; 21.º login por IP con emails distintos → 429; 4.º registro → 429.
- **AC-07: pasa.** Sesión expirada → 401 y fila eliminada.
- **Acceso cruzado:** un `id` ajeno en `PATCH /me` no modifica al primer usuario.
- **Rotación:** la cookie anterior deja de valer y solo queda una sesión.
- **OpenAPI:** tag `Auth`, header `X-CSRF-Token` requerido en mutaciones y `429` en las cuatro rutas.

## Pendiente

- **Cierre operativo pendiente:** commit, PR y CI no ejecutados; esperan autorización del usuario. No hay hash, número de PR ni run que registrar.
- **M-02: corregido por el orquestador** en `auth.md`, `ADR-0005` y `.env.example`.
- **N-01: aceptado.** En `PATCH /me` la validación del body ocurre antes que el 401; se deja como está.
- **M-08: corregido por el orquestador** en la spec (comando con `DATABASE_URL`).
- Purga programada de sesiones → **F42**.
- **F16:** tras login/registro debe pedir `GET /api/auth/csrf` (no se devuelve token). Las mutaciones exigen `Origin`/`Referer`; el SSR debe mutar desde el navegador o abrir decisión para llamadas servidor-a-servidor. `GET /me` no exige origen, pero sí reenvío de cookie.
- Rate limit en memoria: multi-instancia necesitará almacén compartido (F42).
- `ExperimentalWarning: WASI is an experimental feature` en local por el fallback WASM (solo dev/Windows).
- Contraseña demo `memora-demo` pública y solo para datos de desarrollo; no usar en producción.

## Riesgos y limitaciones

- El techo agregado de 20/min por IP es una defensa derivada, no está en `api-contract.md`; puede ajustarse sin cambiar contratos.
- `fileParallelism: false` alarga la suite (~13 s) para aislar las suites que truncan `memora_test`.
- `app.prisma` es `null` sin `DATABASE_URL` (modo salud); auth respondería 500 canónico.
- El hash del seed usa sal fija para ser reproducible; es un fixture público, no un secreto.
- Registro revela existencia de email por diseño (`409`), aprobado en G1.

## Documentación actualizada

- `docs/04-features/F15-auth-api/handoff.md` (este archivo).
- `docs/04-features/F15-auth-api/spec.md` (`status: done`; verificación con `DATABASE_URL`, DoR y decisiones técnicas).
- `docs/04-features/F15-auth-api/tasks.md` (M corregidas, AC, verificación y cierre documental).
- `docs/04-features/README.md` (fila F15 a `done` y cierre de F15 en «Situación actual»).
- `docs/06-process/ai-log.md` (entrada del 2026-11-03 con implementación, revisión y verificación).
- `docs/07-curriculum/coverage-map.md` (temas de auth de F15 con evidencias).
- `docs/03-architecture/auth.md` (limpieza perezosa, registro 409, CSRF HMAC, Origin, rate limit agregado, `APP_URL`).
- `docs/03-architecture/adr/ADR-0005-auth.md` (nota de implementación).
- `.env.example` (`APP_URL` y `SESSION_SECRET` descritos con su uso real).

## Siguiente paso propuesto

1. Autorización del usuario para commit y push.
2. Cierre operativo: rama `feat/F15-auth-api`, commit, PR y CI.
3. Abrir F16 (Auth web), que debe pedir `GET /api/auth/csrf` tras login/registro y resolver `Origin` en SSR.
