# Tasks — F08 API core

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F06, F07.
- [x] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación. _(El usuario preautorizó la implementación y no apareció ningún bloqueo que exigiera plan previo; ver handoff.)_

## Implementación

- [x] Bootstrap Fastify
- [x] Config con Zod
- [x] Cookie, CSRF, helmet, rate limit, multipart
- [x] Error handler uniforme
- [x] Healthcheck
- [x] OpenAPI
- [x] Pino con redacción
- [x] Harness fastify.inject
- [x] Fakes de servicios

## Correcciones de la revisión independiente

- [x] `PAYLOAD_TOO_LARGE` añadido al contrato compartido y a la tabla canónica.
- [x] `@fastify/swagger-ui` real en `/api/docs`, solo fuera de producción.
- [x] 406 de multipart mapeado a `415 UNSUPPORTED_MEDIA_TYPE`.
- [x] Multipart sin `boundary` devuelve 4xx canónico, no 500.
- [x] `DATABASE_URL` obligatoria en producción; factoría Prisma sin fallback silencioso.
- [x] `startServer()` falla cerrado en producción sin adaptadores inyectados.
- [x] `errorResponse` valida los detalles con el esquema compartido.
- [x] Mensajes de Zod en español desde un único punto.
- [x] Límites explícitos de `fields`, `parts` y `fieldNameSize`.
- [x] Redacción ampliada (`csrfToken`, `sessionToken`, `sessionSecret`, `email`, más profundidad).
- [x] CSP de desarrollo relajada solo para Swagger UI; producción intacta.
- [x] `dist` se limpia antes de compilar y no incluye helpers de test.
- [x] AC-04 comprueba las propiedades del esquema Zod de `/api/health`.
- [x] Componente OpenAPI `ErrorResponse` y `securitySchemes.cookieAuth`.

## Correcciones de la segunda revisión

- [x] `prisma7.config.ts` genera sin `DATABASE_URL`; runtime y seed siguen fallando rápido.
- [x] `NODE_ENV=production pnpm build` sin `DATABASE_URL` → OK.
- [x] `NODE_ENV=production pnpm db:generate` sin `DATABASE_URL` → OK.
- [x] Multipart con boundary basura o truncado → 400, sin log nivel 50.
- [x] 406 global eliminado; `FST_INVALID_JSON_FIELD_ERROR` → 400 y `FST_INVALID_MULTIPART_CONTENT_TYPE` → 415.
- [x] CSP dev sin `unsafe-inline` para scripts; solo estilos inline.
- [x] `Services.kind` y arranque de producción solo con `'real'`.
- [x] Deuda de F25 documentada en el handoff.

## Correcciones de la tercera revisión

- [x] Fallback de Prisma solo para `generate`; migraciones y seed exigen `DATABASE_URL`.
- [x] `migrate status` falla sin URL en producción y fuera de producción.
- [x] `buildApp()` rechaza servicios no `'real'` en producción.
- [x] Allowlist explícita de errores de parser; `ERR_STREAM_PREMATURE_CLOSE` solo 400 en multipart.
- [x] Error de servidor con mensaje parecido a multipart sigue siendo 500.
- [x] Limitación de `kind` documentada como frontera de código.

## Criterios de aceptación

- [x] AC-01: GET /api/health responde sin datos sensibles.
- [x] AC-02: Un error de validación devuelve 400 uniforme.
- [x] AC-03: Un error interno no filtra stack en producción.
- [x] AC-04: OpenAPI se genera.
- [x] AC-05: Los tests usan inject sin puerto.
- [x] AC-06: Los logs redactan cookies y secretos.

## Verificación

- [x] `pnpm --filter @memora/api test` sin `DATABASE_URL`.
- [x] `pnpm --filter @memora/api test` con `DATABASE_URL` (`memora_test`).
- [x] `pnpm --filter @memora/api typecheck`, `lint` y `build`.
- [x] `pnpm --filter @memora/shared test`.
- [x] Typecheck de todos los workspaces con `pnpm -r typecheck`.
- [x] `pnpm docs:check` y `pnpm agents:check`.
- [x] Arranque real en desarrollo: health, OpenAPI, Swagger UI y multipart sin boundary.
- [x] Arranque dev con boundary basura y cuerpo truncado: ambos 400, sin log nivel 50.
- [x] `NODE_ENV=production pnpm build` y `db:generate` sin `DATABASE_URL`.
- [x] `prisma migrate status` sin `DATABASE_URL` falla en producción y en desarrollo.
- [x] Con `DATABASE_URL` de `memora_test`: `db:migrate:deploy` y `db:seed` OK.
- [x] Producción con servicios fake inyectados: `buildApp` falla.
- [x] Producción con servicios `'real'`: arranca.
- [x] Arranque en producción sin `DATABASE_URL`: falla con mensaje claro.
- [x] Arranque en producción completo: `/api/docs` 404 y `/api/openapi.json` 200.
- [x] Procesos detenidos y puertos 3001/3002 libres.

## Cierre

- [x] Revisión independiente (tres rondas: apto con correcciones → mayores de generación Prisma y multipart → fallback de migraciones).
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto (sin ejecutar).
