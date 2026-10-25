# Tasks — F05 Spike técnico integrado

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F04.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Ruta SSR de prueba
- [ ] Ruta privada ssr:false
- [ ] Ruta prerenderizada
- [ ] Proxy /api
- [ ] Endpoints de salud y eco Zod
- [ ] Migración mínima Prisma
- [ ] Procesamiento de una imagen con sharp
- [ ] Lectura de snapshot Content Island
- [ ] Informe de resultados y plan de salida

## Criterios de aceptación

- [ ] AC-01: Las tres rutas se renderizan en el modo esperado.
- [ ] AC-02: Tailwind 4 aplica tokens sin preset JS.
- [ ] AC-03: Fastify valida con Zod 4 y devuelve errores uniformes.
- [ ] AC-04: Prisma 7 migra y consulta.
- [ ] AC-05: sharp genera thumb y display sin perder orientación.
- [ ] AC-06: El snapshot de Content Island se lee en build.
- [ ] AC-07: Se documentan limitaciones y plan de salida.

## Verificación

- [ ] `pnpm dev`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] `curl /api/health`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
