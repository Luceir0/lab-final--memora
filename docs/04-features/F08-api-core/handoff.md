# Handoff — F08 API core

> Fecha: 2026-11-01 · Implementador: subagente `api-dev` · Estado: `accepted`
> Revisión independiente: cerrada (tres rondas, veredicto final «apto») · Aceptación del usuario: 2026-11-01 · Commit: propuesto, pendiente de ejecución

## Resultado

La API tiene el esqueleto Fastify 5.12.7 completo y las tres rondas de revisión aplicadas: configuración Zod con `DATABASE_URL`/`SESSION_SECRET` obligatorias en producción, plugins base, error handler uniforme con `details` validados, `/api/health`, OpenAPI 3.1 con `ErrorResponse` y `cookieAuth`, Swagger UI real solo fuera de producción, pino con redacción ampliada, harness `inject` y fakes discriminados. `prisma generate` funciona sin URL, pero migraciones y seed la exigen; `buildApp` rechaza servicios no reales en producción.

## Cambios (archivos)

- `packages/shared/src/errors.ts` y `errors.test.ts`: `PAYLOAD_TOO_LARGE` (413).
- `docs/03-architecture/api-contract.md`: fila canónica 413.
- `apps/api/package.json` + `pnpm-lock.yaml`: `@fastify/swagger-ui@6.1.2` exacto; build limpia `dist`.
- `apps/api/prisma7.config.ts`: solo `prisma generate` usa el fallback local; migraciones, seed y comandos que conectan exigen `DATABASE_URL` mediante una función explícita sobre `process.argv`.
- `apps/api/src/db-url.ts`: `resolveRequiredDatabaseUrl()` sin fallback; `DEFAULT_DATABASE_URL` queda solo para generación.
- `apps/api/src/errors.ts`: 413 genérico→`PAYLOAD_TOO_LARGE`, overrides `FST_*`, allowlist explícita de códigos/mensajes de parser, `ERR_STREAM_PREMATURE_CLOSE` solo 400 en peticiones multipart.
- `apps/api/src/app.ts`: `buildApp()` rechaza servicios no `'real'` en producción; `startServer()` queda como entrada fina.
- `apps/api/src/zod-locale.ts`: locale español único.
- `apps/api/src/plugins/multipart.ts`: boundary obligatorio y límites `fileSize/files/fields/parts/fieldNameSize`.
- `apps/api/src/plugins/helmet.ts`: CSP dev sin `upgrade-insecure-requests`, scripts solo `'self'`, estilos inline; producción intacta.
- `apps/api/src/plugins/swagger.ts`: `ErrorResponse` + `securitySchemes.cookieAuth`.
- `apps/api/src/routes/docs.ts`: Swagger UI real dev-only.
- `apps/api/src/logging.ts`: `csrfToken`, `sessionToken`, `sessionSecret`, `email` y tres niveles.
- `apps/api/src/config.ts`, `db.ts`, `db-url.ts`, `prisma/seed.ts`, `server.ts`, `services/index.ts`: URL explícita, seed estricto y `kind` de servicios.
- `apps/api/src/test/fakes.ts`: `kind: 'fake'`.
- `apps/api/tsconfig.build.json`: excluye `src/test/**`.
- Tests: `errors.test.ts`, `app.test.ts`, `routes/docs.test.ts`, `logging.test.ts`, `config.test.ts` ampliados; ruta de subida solo de test.
- `apps/api/README.md`, `docs/04-features/F08-api-core/{tasks,handoff}.md`.

## Hallazgos del reviewer → estado

### Primera revisión

Veredicto: **apto con correcciones**.

| # | Hallazgo | Estado |
| --- | --- | --- |
| 1 | `PAYLOAD_TOO_LARGE` en el contrato y mapeo 413 | **Corregido.** Contrato, shared, API y tests. |
| 2 | Swagger UI real dev-only | **Corregido.** `@fastify/swagger-ui@6.1.2`; producción solo JSON. |
| 3 | 406 de multipart → 415 | **Corregido** vía `FST_INVALID_MULTIPART_CONTENT_TYPE`. |
| 4 | Multipart sin boundary no puede ser 500 | **Corregido.** Hook previo al parser; 415 y warn. |
| 5 | `DATABASE_URL` y servicios en producción | **Corregido.** Config obligatoria, factoría Prisma explícita y arranque cerrado. Adaptadores reales, F25. |
| 6 | Validar `details` | **Corregido.** Sobre completo validado con `errorResponseSchema`. |
| 7 | Mensajes Zod en español | **Corregido.** Locale único; shared sigue en 138 tests. |
| 8 | Límites multipart | **Corregido.** `fileSize/files/fields/parts/fieldNameSize`. |
| 9 | Redacción de logs | **Corregido.** Nuevas claves y profundidad. |
| 10 | CSP dev sin `upgrade-insecure-requests` | **Corregido.** |
| 11 | `dist` limpio y sin helpers de test | **Corregido.** |
| 12 | AC-04 con propiedades Zod | **Corregido.** |
| 13 | Componente OpenAPI `ErrorResponse` | **Corregido.** |
| — | Deuda `ActivityType` | **Diferida a F15/F17.** |

### Segunda revisión

Veredicto: **correcciones mayores en generación Prisma y multipart malformado**, además de menores en el 406 global y la CSP de desarrollo.

| # | Hallazgo | Estado |
| --- | --- | --- |
| 14 | `prisma generate` dependía de `DATABASE_URL` | **Corregido.** `prisma7.config.ts` usa `DATABASE_URL` o el fallback local solo para generación; no abre conexión. `build` y `db:generate` pasan con `NODE_ENV=production` sin URL. Runtime y seed conservan el fallo rápido. |
| 15 | Multipart con boundary y cuerpo malformado daba 500 | **Corregido.** El parser/busboy/stream sin status se normaliza a 400 `VALIDATION_ERROR`; `ERR_STREAM_PREMATURE_CLOSE` y mensajes de truncado incluidos. Tests de cuerpo basura y truncado. |
| 16 | 406 global demasiado amplio | **Corregido.** Eliminado de `STATUS_TO_CODE`; `FST_INVALID_MULTIPART_CONTENT_TYPE`→415 y `FST_INVALID_JSON_FIELD_ERROR`→400 por override. |
| 17 | CSP dev con `unsafe-inline` para scripts | **Corregido.** Swagger UI carga scripts con `<script src>`; dev deja `script-src 'self'` y solo estilos inline. Producción no hereda nada. |
| 18 | Fakes podían pasar por reales | **Corregido.** `Services.kind: 'unavailable' \| 'fake' \| 'real'`; `buildApp()` exige `'real'` en producción y un test cubre el fake. |

### Tercera revisión

Veredicto: **el fallback de Prisma se aplicaba también a migraciones**; se corrigió junto con la guarda de servicios y la allowlist de errores de parser.

| # | Hallazgo | Estado |
| --- | --- | --- |
| 19 | El fallback de Prisma se aplicaba a migraciones | **Corregido.** `prisma7.config.ts` inspecciona explícitamente el comando: solo `generate` usa el fallback. `migrate status/deploy/dev`, `db push/execute/seed` exigen `DATABASE_URL` también fuera de producción. Verificado con comandos reales. |
| 20 | La guarda de servicios solo estaba en `startServer` | **Corregido.** La comprobación vive en `buildApp()`; `startServer()` solo delega. Test directo con `buildApp` y fake. |
| 21 | Normalización a 400 demasiado amplia | **Corregido.** Allowlist explícita de códigos de parser y mensajes exactos de busboy; `ERR_STREAM_PREMATURE_CLOSE` solo es 400 si la petición declara multipart. Test de error de servidor con «Invalid multipart state in storage adapter» → 500. |
| 22 | `kind` como supuesta frontera de seguridad | **Corregido/documentado.** Es una frontera de código: producción exige la marca explícita y `src/test/**` no se compila a `dist`; cualquier código podría declararse `'real'`. Sin criptografía ni sobre-ingeniería. |

## Deuda de F25 (documentada, no implementada)

- Con `request.file()`, un multipart con 11 campos o 2 archivos devuelve 200: los límites `fields`/`files` solo se disparan consumiendo `request.parts()`. F25 debe consumir todas las partes o comprobar explícitamente que hay un archivo por petición.
- `fieldNameSize` trunca el nombre en vez de rechazarlo; F25 decide si eso es aceptable o hay que validarlo antes.
- `FST_FILES_LIMIT`, `FST_FIELDS_LIMIT` y `FST_PARTS_LIMIT` se mapean hoy a `413 PAYLOAD_TOO_LARGE`; F25 debe decidir si algún caso concreto es `400 VALIDATION_ERROR`.
- `buildApp` aún no cablea `config.databaseUrl` a un cliente Prisma: seam pendiente para F15.
- Un `ApiError` con `details: [{}]` lanza `TypeError` y acaba en 500 seguro: es un fallo de programación, detectado en tests; no se maquilla.

## Verificación (comando → resultado real)

- `pnpm --filter @memora/shared test` → `Test Files 5 passed`, `Tests 138 passed`.
- `pnpm --filter @memora/api test` (sin `DATABASE_URL`) → `Test Files 7 passed | 1 skipped (8)`, `Tests 77 passed | 13 skipped (90)`.
- `DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test` → `Test Files 8 passed (8)`, `Tests 90 passed (90)`.
- `pnpm --filter @memora/api typecheck` → sin errores.
- `pnpm --filter @memora/api lint` → sin errores.
- `pnpm --filter @memora/api build` → sin errores; `dist` limpio, sin spike ni helpers de test.
- `NODE_ENV=production pnpm --filter @memora/api build` **sin** `DATABASE_URL` → exit 0.
- `NODE_ENV=production pnpm --filter @memora/api db:generate` **sin** `DATABASE_URL` → exit 0.
- `NODE_ENV=production … prisma migrate status` **sin** `DATABASE_URL` → exit 1:
  `DATABASE_URL es obligatoria para migraciones, seed y comandos que abren conexión.` (sin URL ni credenciales).
- Sin `NODE_ENV` y sin `DATABASE_URL`, `prisma migrate status` → exit 1 con el mismo mensaje; no usa la base local.
- `DATABASE_URL=…/memora_test pnpm db:migrate:deploy` → `No pending migrations to apply` (exit 0).
- `DATABASE_URL=…/memora_test pnpm db:seed` → `Seed completed: {"users":2,"circles":2,...,"activities":4}` (exit 0).
- `pnpm -r typecheck` → 6 workspaces `Done`. `pnpm typecheck` (Turbo) falla en este runner por `Unable to find package manager binary` (PATH, no código).
- `pnpm docs:check` → 191 archivos, 430 enlaces, 0 rotos, OK (431 tras enlazar este handoff desde el README). `pnpm agents:check` → OK.
- Dev real (app + rutas de test) con multipart:
  - sin boundary → **415** `{"code":"UNSUPPORTED_MEDIA_TYPE",...,"details":null}`.
  - `boundary=abc` + `garbage-no-delimiters` → **400** `{"code":"VALIDATION_ERROR","details":null}`.
  - `boundary=abc` + cuerpo truncado → **400** `{"code":"VALIDATION_ERROR","details":null}`.
  - log: `"level":50` aparece **0 veces**; los tres casos se registran como `"level":40` `Request rejected`.
- Producción + `SESSION_SECRET` + `DATABASE_URL` + servicios `kind:'fake'` → `buildApp` exit 1:
  `NODE_ENV=production exige adaptadores reales (kind: "real")…`.
- Producción completa con adaptadores `kind:'real'` → health 200, `/api/docs` **404**, `/api/openapi.json` **200**, CSP estricta con `upgrade-insecure-requests` y HSTS.
- Procesos detenidos; puertos 3001/3002 libres.

## Criterios de aceptación

- **AC-01 — pasa.** Health solo con `status`, `version`, `timestamp`.
- **AC-02 — pasa.** 400 `VALIDATION_ERROR` con detalles no vacíos y mensajes en español.
- **AC-03 — pasa.** 500 en producción sin mensaje interno, stack ni `.ts`.
- **AC-04 — pasa.** OpenAPI 3.1 con propiedades Zod, `ErrorResponse` y `cookieAuth`.
- **AC-05 — pasa.** `inject` con `server.listening === false`.
- **AC-06 — pasa.** Redacción verificada con pino real.

## Pendiente

- Aceptación del usuario. Revisión independiente cerrada; tablero, bitácora y cobertura ya actualizados por `docs-scribe`.
- Adaptadores reales de S3/email/geocoding (F25).
- Wiring de CSRF/`memora_session` (F15) y límites por acción (F15/F25).
- Deuda `ActivityType` (F15/F17).
- Evaluar si `LOG_LEVEL` debe figurar en `.env.example`.

## Riesgos y limitaciones

- La CLI de producción no arranca todavía sin adaptadores reales; es el fallo cerrado exigido y se resolverá en F25.
- `kind` es una frontera de código, no de seguridad: producción rechaza el fallback y los fakes de test, y `src/test/**` no se compila a `dist`, pero cualquier código podría declararse `'real'`. No hay firma ni criptografía a propósito.
- Swagger UI verificado por HTML, assets y CSP, no con navegador real.
- Los límites `fields`/`files` no se disparan con `request.file()` (deuda F25).
- `packages/shared/dist` está ignorado: un checkout limpio debe construir shared antes de typechequear/probar la API.
- `pnpm typecheck` global (Turbo) falla por PATH del runner; `pnpm -r typecheck` pasa.

## Documentación actualizada

- `docs/03-architecture/api-contract.md`: `PAYLOAD_TOO_LARGE`.
- `docs/04-features/README.md`: F08 `accepted`; siete plugins; cambio de contrato y Swagger UI dev-only.
- `docs/04-features/F08-api-core/spec.md`, `tasks.md` y este handoff.
- `docs/05-quality/test-matrix.md`: filas de F08 y evidencia de ejecución.
- `docs/06-process/ai-log.md`: entrada de F08.
- `docs/07-curriculum/coverage-map.md`: sección de F08 y sustitución de las referencias al spike eliminado.
- `docs/00-index.md` y `README.md`: estado de F08.
- `apps/api/README.md`: Swagger UI, errores 413/415, variables, `kind` de servicios, redacción, build y límites.

## Siguiente paso propuesto

1. Aceptación del usuario: al ser una feature de backend, validar `/api/health`, `/api/openapi.json` y `/api/docs` en desarrollo.
2. Tras la aceptación, proponer:
   `fix(api): close F08 review findings on generation, multipart and services` (sin ejecutar).
3. No marcar `done` hasta commit, PR, CI y merge; el cierre documental lo hará el orquestador.
