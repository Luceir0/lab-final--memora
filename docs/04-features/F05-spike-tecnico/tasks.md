# Tasks — F05 Spike técnico integrado

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`. — `AGENTS.md`, `docs/04-features/F05-spike-tecnico/spec.md`.
- [x] Comprobar dependencias: F04. — F04 está `done` en el tablero.
- [x] Comprobar Definition of Ready. — Spec completa, contratos y ADRs enlazados; sin preguntas bloqueantes.
- [x] Proponer plan y esperar confirmación. — Plan confirmado antes de implementar; rama `feat/F05-spike-tecnico`.

## Implementación

- [x] Ruta SSR de prueba — `apps/web/src/routes/login.tsx`; smoke `200` con `h1` y formulario en HTML inicial.
- [x] Ruta privada ssr:false — `apps/web/src/routes/circles.tsx`; smoke `200` sin «Tus círculos» en HTML inicial.
- [x] Ruta prerenderizada — `apps/web/src/routes/help.tsx`; `dist/client/help/index.html` con «Primeros pasos en Memora».
- [x] Proxy /api — `apps/web/vite.config.ts`; `GET /api/health` por Vite → `200` JSON.
- [x] Endpoints de salud y eco Zod — `apps/api/src/spike/routes.ts`; `health` y `echo` con errores uniformes. `/api/spike/boom` vive solo en `routes.test.ts` sobre la instancia de test y no se registra en producción.
- [x] Migración mínima Prisma — `apps/api/prisma/migrations/20261026153600_spike_init/migration.sql`; aplicada en PostgreSQL 17.11.
- [x] Procesamiento de una imagen con sharp — `apps/api/src/services/images.ts`; thumb 400×400 cover y display ≤1600 px WebP.
- [x] Lectura de snapshot Content Island — `apps/web/src/features/spike/content.server.ts`; snapshot `schemaVersion: 1`, `view: published`.
- [x] Informe de resultados y plan de salida — `docs/03-architecture/spike-results.md`.

## Criterios de aceptación

- [x] AC-01: Las tres rutas se renderizan en el modo esperado. — Smoke HTTP y build; navegación SPA real pendiente.
- [x] AC-02: Tailwind 4 aplica tokens sin preset JS. — `packages/ui/src/styles/tokens.css`, `apps/web/src/styles/app.css`; sin `tailwind.config` ni PostCSS propio.
- [x] AC-03: Fastify valida con Zod 4 y devuelve errores uniformes. — 400/401/403/404/409/413/415/422/429 implementados; las rutas de prueba solo producen 400/404/413/500. Tests de JSON malformado, body >1 MB y 500.
- [x] AC-04: Prisma 7 migra y consulta. — Migración aplicada; 15/15 con `DATABASE_URL` y 1 test saltado sin base.
- [x] AC-05: sharp genera thumb y display sin perder orientación. — Tests de EXIF, ICC eliminado, 1600 px y límite 50 MP con cabecera SOF parcheada.
- [x] AC-06: El snapshot de Content Island se lee en build. — `view: published` validado; `accessToken: ''`; build sin token; error genérico sin ruta y detalle en el log del servidor.
- [x] AC-07: Se documentan limitaciones y plan de salida. — `spike-results.md`, handoff y `render-modes.md`.

## Verificación

- [x] `pnpm dev` — API en `127.0.0.1:3001`; smoke web propio en `127.0.0.1:3000` porque el 3000 estaba ocupado. El reviewer usó el puerto 3100 en su propia prueba; no es una contradicción.
- [x] `pnpm build` — 5/5 tareas; `/help` prerenderizado; CSS 14,66 kB.
- [x] `pnpm test` — shared 1, API 14 passed + 1 skipped, web 15; total 30 passed + 1 skipped sin DB.
- [x] `DATABASE_URL=... pnpm test` — total 31 passed; API 15/15.
- [x] `pnpm lint` — 6/6 con el shim temporal de pnpm; sin shim, el comando raíz falla por `pnpm` fuera de PATH.
- [x] `pnpm typecheck` — 8/8 con el mismo shim.
- [x] `curl /api/health` — `200` con `status`, `version` y `timestamp`.
- [x] `DATABASE_URL=... turbo run test --filter=@memora/api --force` — 15/15; el test de integración no se salta.
- [x] Smoke de errores — JSON malformado → 400, body 1.100.014 bytes → 413, ruta inexistente → 404, `/api/spike/boom` → 500 solo en la instancia de test.
- [x] `docs:check`, `agents:check` y `format:check` — OK; resultados en `handoff.md`.

## Cierre

- [x] Revisión independiente inicial — «apto con correcciones», sin bloqueantes.
- [x] Re-revisión — «apto con correcciones menores»; correcciones aplicadas y verificadas.
- [x] Verificación final del orquestador/reviewer — completada.
- [x] Aceptación del usuario — 2026-10-26.
- [x] `handoff.md` completo — cerrado con aceptación.
- [x] Tablero actualizado — F05 en `accepted`.
- [x] Bitácora y cobertura actualizadas — `docs/06-process/ai-log.md`, `docs/07-curriculum/coverage-map.md`.
- [ ] Commit — pendiente de ejecución inmediata; prever commit de F05 y `chore(agents)` separado.
- [ ] `done` — pendiente de merge y CI, como en F04.
