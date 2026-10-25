# Tasks — F08 API core

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F06, F07.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Bootstrap Fastify
- [ ] Config con Zod
- [ ] Cookie, CSRF, helmet, rate limit, multipart
- [ ] Error handler uniforme
- [ ] Healthcheck
- [ ] OpenAPI
- [ ] Pino con redacción
- [ ] Harness fastify.inject
- [ ] Fakes de servicios

## Criterios de aceptación

- [ ] AC-01: GET /api/health responde sin datos sensibles.
- [ ] AC-02: Un error de validación devuelve 400 uniforme.
- [ ] AC-03: Un error interno no filtra stack en producción.
- [ ] AC-04: OpenAPI se genera.
- [ ] AC-05: Los tests usan inject sin puerto.
- [ ] AC-06: Los logs redactan cookies y secretos.

## Verificación

- [ ] `pnpm --filter @memora/api test`
- [ ] `pnpm --filter @memora/api build`
- [ ] `curl localhost:3001/api/health`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
