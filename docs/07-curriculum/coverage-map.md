# Cobertura del temario

Estado: **F01–F03 cubren los temas transversales, F04 el entorno y tooling, F05 el stack de aplicación, F06 los contratos y permisos compartidos, F07 el modelo de datos, F08 el esqueleto de la API, F09 la base web y el cliente HTTP tipado, F10 el sistema visual y el tema y F11 el UI kit de controles y datos** (organización, documentación, IA agente, revisión, activos, TypeScript estricto, monorepo, Docker, CI, render modes, Tailwind 4 CSS-first, tokens, temas con SSR, Fastify + Zod, Prisma 7, migraciones, seed determinista, PostgreSQL real en tests, sharp, Content Island, Zod como fuente única, errores, paginación, autorización pura, OpenAPI, logs con redacción, harness de tests, cliente REST tipado, TanStack Query, error boundaries, contraste WCAG, cookies, scripts previos al pintado, fuentes self-hosted, React en un paquete de UI, `peerDependencies`, Testing Library y axe, catálogo dev-only con code-splitting y árbol de rutas estable). F05 está `done` tras el merge `8dfae5f` y CI en verde; F06 está `done` desde el 2026-10-31 tras la PR #2, el merge `b556168` y CI en verde (run `41246708428`); F07 está `done` desde el 2026-11-01 tras la PR #3, el merge `bd2769c` y CI en verde (run `41254603622`), con PostgreSQL 17.11 y tests de integración reales. F08 está `done` desde el 2026-11-01 tras la PR #4, el merge `ed1f316` y CI en verde (run `41261491641`); su verificación real es `pnpm --filter @memora/api test` → 77 passed + 13 skipped sin `DATABASE_URL` y 90 passed con `memora_test`, más `pnpm --filter @memora/shared test` → 138 passed. F09 está **`done`** desde el 2026-11-01: implementación y revisión independiente cerradas, aceptación del usuario en Firefox real sobre `/login`, `/circles`, `/help` y una ruta inexistente, PR #5 con CI en verde (run `41306238454`, `completed/success`) y merge `9fd987e` en `main` con CI en verde (run `41306484717`, `completed/success`). AC-06 (hidratación) queda **verificado en navegador**, aunque sin prueba automatizada, que corresponde a F37/F38. F10 está **`done`** desde el 2026-11-02: implementación y revisión independiente cerradas (primera **no apto**, segunda **apto con correcciones**), 44 tests en `packages/ui` y 88 en `apps/web`, y aceptación del usuario en Firefox real sobre `/login`, `/circles` y `/help` alternando claro/oscuro/sistema, en escritorio y móvil. AC-05, AC-06 y AC-07 quedan verificados por el usuario, sin prueba automatizada de navegador (F37/F38). Cierre operativo: rama `feat/F10-sistema-visual`, commits `517b6eb`, `3c79110` y `d4826df`, PR #7, CI en verde en la PR (run `41473542981`, `completed/success`, head `d4826df`), merge `f3b26a5` en `main` y CI en verde sobre el merge (run `41473996157`, `completed/success`). F11 está **`done`** desde el 2026-11-02: 18 componentes presentacionales con RTL y axe (**173 tests** en `packages/ui`: 95 de componentes + 78 de estilos), catálogo `/ui` solo de desarrollo con `import()` guardado por `import.meta.env.DEV`, árbol de rutas idéntico en desarrollo y producción (SHA de `routeTree.gen.ts` sin cambios tras el build) y `--memora-border-strong` corregido a 3:1. Revisión independiente en dos rondas (primera **no apto** por el hover del primario en oscuro a 4,06:1 y `routeTree.gen.ts` que cambiaba con el modo; segunda **apto con correcciones**, m-07 documental cerrado), auditoría de accesibilidad en navegador real (Chrome/CDP + axe 4.14) con 0 violaciones y 0 `incomplete` tras dos rondas de correcciones, y auditoría de diseño en tres pasadas, cerrada en apto. Aceptación del usuario (G4) el 2026-11-02 sin cambios pedidos. Cierre operativo: rama `feat/F11-ui-kit-i`, commits `0e815e2`, `a1648ce`, `bf22fd4` y `94620ee`, PR #11, CI en verde en la PR (run `41498545493`, `completed/success`, head `94620ee`), merge `6d160ce` en `main` y CI en verde sobre el merge (run `41499457291`, `completed/success`). El resto está planificado y se actualiza al cerrar cada feature con evidencias reales.

**Fuente del temario:** `assets/design/temario-tecnologias.png` y la especificación histórica `docs/archive/spec-v1.md` §7. No hay una transcripción oficial en texto; este mapa es la referencia operativa.

## Transversales (F01–F03)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Organización y documentación | README, docs, ADRs, specs | `README.md`, `docs/` | Cubierto |
| IA agente | Agentes, comandos, skills, workflow | `.opencode/`, `AGENTS.md` | Cubierto |
| Revisión y calidad | Protocolo de revisión, DoD, auditoría | `docs/06-process/`, `docs/05-quality/` | Cubierto |
| Diseño y activos | Normalización, manifest, screens | `assets/design/`, `docs/02-design/screens.md` | Cubierto |

## Entorno, tooling y entrega (F04)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| TypeScript estricto | `tsconfig` base y variantes; CI | `packages/config/tsconfig/base.json`, `pnpm typecheck` | Cubierto |
| pnpm workspaces + Turborepo | 7 proyectos de workspace; pipeline y caché de tareas | `pnpm-workspace.yaml`, `turbo.json` | Cubierto |
| ESLint y Prettier | Configuración compartida, lint raíz y formato solo de código | `eslint.config.mjs`, `packages/config/eslint/base.mjs`, `.prettierrc.json`, `pnpm lint`, `pnpm format:check` | Cubierto |
| Docker Compose local | Postgres, Silo (S3) y Mailpit con healthchecks | `docker-compose.yml`, `.env.example` | Cubierto |
| GitHub Actions | Install, docs, agents, lint, typecheck, test y build | `.github/workflows/ci.yml` | Cubierto (validado por inspección y ejecución local) |
| Validadores documentales | Enlaces, estructura, agentes, comandos, skills y 43 specs | `scripts/check-docs.mjs`, `scripts/validate-agents.mjs` | Cubierto |
| Node 24 | `engines >=24` y CI con Node 24 | `package.json`, `.github/workflows/ci.yml` | Cubierto |

## Stack de aplicación (F05, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Tailwind 4 CSS-first | Variables runtime `--memora-*`, `@theme inline` y `@source`, sin preset JS, `tailwind.config` ni PostCSS propio | `packages/ui/src/styles/tokens.css`, `docs/02-design/tokens.md`, `apps/web/src/styles/app.css`, `apps/web/src/styles/tokens.test.ts`; CSS emitido con `--color-bg:var(--memora-bg)` y `.bg-bg` | Cubierto |
| Render modes | `/login` SSR, `/circles` `ssr: false`, `/help` prerender | `apps/web/src/routes/`, `apps/web/dist/client/help/index.html`, smoke HTTP | Cubierto con limitación: navegación SPA real pendiente |
| TanStack Start | Rutas tipadas, prerender y server function | `apps/web/src/routes/*`, `apps/web/src/features/spike/content.ts`, `apps/web/vite.config.ts` | Cubierto |
| Vite | Proxy `/api`, build de cliente y servidor | `apps/web/vite.config.ts`, `apps/web/dist/client`, `apps/web/dist/server` | Cubierto |
| Fastify 5 + Zod 4 | Validación y serialización tipadas; error handler canónico con `details` validados; 400/404/413/415/429 y 500 uniformes; logs `warn`/`error` sin stack | `apps/api/src/app.ts`, `apps/api/src/errors.ts`, `apps/api/src/app.test.ts` | Cubierto (F08, `done`) |
| API REST | `GET /api/health` con contrato Zod; `/api/openapi.json` y Swagger UI dev-only; 400/404/413/415/429/500 | `apps/api/src/routes/health.ts`, `apps/api/src/routes/docs.ts`, `apps/api/src/test/routes.ts` | Cubierto (F08) para esqueleto; recursos de producto en F15+ |
| Prisma 7 + PostgreSQL | Configuración, migración y consulta; `globalEnv` de Turbo para el test de integración | `apps/api/prisma7.config.ts`, `apps/api/prisma/schema.prisma`, `turbo.json`, `apps/api/src/db.integration.test.ts` | Cubierto en F05; ampliado en F07 (36 tests con base, 23 + 13 skipped sin base) |
| Turbo: caché y entorno | `globalDependencies` del snapshot y `globalEnv` con `DATABASE_URL` y `CONTENT_ISLAND_SNAPSHOT_PATH` | `turbo.json`; `turbo run test --filter=@memora/api --force` → 15/15 | Cubierto |
| Procesamiento de imágenes | thumb 400×400 cover, display ≤1600 px, orientación EXIF, sin EXIF/ICC, 50 MP con SOF parcheada | `apps/api/src/services/images.ts`, `apps/api/src/services/images.test.ts` | Cubierto para JPEG/PNG; WebP como entrada no probado; HEIC no validado |
| Content Island y SSG | Snapshot versionado, `view: published`, lectura en build sin token, error genérico y log de servidor | `content-island-snapshot.json`, `apps/web/src/features/spike/content.server.ts`, `apps/web/dist/client/help/index.html` | Cubierto |
| Vitest 5 y Testing Library | Tests de API, rutas, contenido, tokens, sistema visual, tema, web core, cliente HTTP y componentes de UI | `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`, `packages/ui/vitest.config.ts`; API 77 passed + 13 skipped sin `DATABASE_URL` y 90 con `memora_test` (F08); web 88 en 17 archivos (F10); `ui` 173 en 10 archivos (F11); `api-client` 39 (F09) | Cubierto para smoke; E2E en F37/F38 |
| TypeScript estricto aplicado | Código real de web, API y UI | `pnpm typecheck` → 9/9 tareas (F10) | Cubierto |
| Secretos fuera del build | El build no usa token; el JS cliente no contiene el snapshot ni `node:fs` | Inspección de `apps/web/dist/client/assets/*.js` | Cubierto |
| Documentación de resultados | Informe, handoff y plan de salida | `docs/03-architecture/spike-results.md`, `docs/04-features/F05-spike-tecnico/handoff.md` | Cubierto |

## Contratos y permisos compartidos (F06, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Zod como fuente única | Requests, responses y DTOs de los dominios del contrato | `packages/shared/src/schemas/**`, `packages/shared/src/schemas/contracts.test.ts` | Cubierto (F06) |
| DTOs inferidos y privacidad | `z.infer`; sin `objectKey`, tokens ni GPS | `packages/shared/src/schemas/dto.ts`, tests de privacidad de DTOs | Cubierto (F06) |
| Errores uniformes | `code`/`message`/`details`; `details` no vacío o `null` | `packages/shared/src/errors.ts`, `packages/shared/src/errors.test.ts` | Cubierto (F06) |
| Paginación por cursor | Default 24, 1–100, `Page<T>`, `createPageSchema`, `buildPageQuery` | `packages/shared/src/pagination.ts`, `packages/shared/src/pagination.test.ts` | Cubierto (F06) |
| Permisos puros | Owner/member × flags × acciones; owner por `ownerId`; falla cerrado ante acciones desconocidas y recursos de otro círculo | `packages/shared/src/permissions.ts`, `packages/shared/src/permissions.test.ts` | Cubierto (F06) |
| Validación en español | Mensajes de constraints y rango de `limit` | `packages/shared/src/validation-messages.ts`, `contracts.test.ts` | Cubierto (F06) |
| Testing unitario | 5 archivos, 138 tests; sin mocks en permisos | `packages/shared/src/*.test.ts`; `pnpm --filter @memora/shared test` | Cubierto (F06) |

## Modelo de datos, migraciones y seed (F07, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Prisma 7 y PostgreSQL | 10 modelos y 5 enums; `timestamptz(3)`; sin GPS | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261031224916_init/migration.sql` | Cubierto (F07) |
| Migración inicial | Una sola migración; `spike_init` y `SpikeNote` eliminados | `apps/api/src/db.integration.test.ts` (comprueba `_prisma_migrations`) | Cubierto (F07) |
| Constraints e índices | Unique de email, membership, upload y tag; índices de galería, persona y actividad | `migration.sql`, tests de constraints en `db.integration.test.ts` | Cubierto (F07) |
| Cascadas | Círculo borra hijos; foto conserva actividad y borra tags; portadas a `null`; job conserva `albumId = null` | `db.integration.test.ts` | Cubierto (F07) |
| Seed determinista | Fechas fijas, upserts con id fijo y digests idénticos; 2 usuarios, 2 círculos, 4 memberships, 2 álbumes, 6 fotos, 2 tags, 1 invitación y 4 actividades | `apps/api/prisma/seed.ts`, tests de seed repetido | Cubierto (F07) |
| Tests de integración reales | 4 archivos, 36 tests con `DATABASE_URL`; 23 + 13 skipped sin base | `apps/api/src/test/db.ts`, `apps/api/src/test/factories.ts`, `apps/api/src/db.integration.test.ts` | Cubierto (F07) |
| Guardas de base de test | `_test`, host local y entorno de test; `ALLOW_REMOTE_TEST_DB=1` solo relaja el host | `apps/api/src/test/db.ts`, `apps/api/src/test/db.test.ts` | Cubierto (F07) |
| PostgreSQL en CI | Servicio `postgres:17.11-alpine`, `db:migrate:deploy`, `NODE_ENV=test` | `.github/workflows/ci.yml`; run `41254603622` | Validado en el runner; tests contra `memora_test` sin skips |

## API core (F08, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Bootstrap Fastify 5 | `buildApp()` sin abrir puerto; `server.ts` es la única entrada que escucha; `trustProxy` solo en producción | `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/src/index.ts` | Cubierto (F08) |
| Config Zod con fallo rápido | `NODE_ENV`, `API_PORT`, `HOST`, `LOG_LEVEL`, `SESSION_SECRET` y `DATABASE_URL` validados; producción exige secreto y URL; el error nombra la variable y no filtra valores | `apps/api/src/config.ts`, `apps/api/src/config.test.ts` | Cubierto (F08) |
| Plugins base | cookie, CSRF, helmet, rate limit, multipart, swagger y swagger-ui; CSP de desarrollo relajada solo para Swagger UI | `apps/api/src/plugins/*`, `apps/api/src/app.test.ts` | Cubierto (F08) |
| Error handler canónico | `ApiError`, `mapError`, overrides `FST_*`, allowlist de errores de parser y `details` validados con el esquema compartido | `apps/api/src/errors.ts`, `apps/api/src/errors.test.ts` | Cubierto (F08) |
| `PAYLOAD_TOO_LARGE` (413) | Código canónico para cuerpo sobredimensionado; `FILE_TOO_LARGE` queda para el límite de archivo de multipart | `packages/shared/src/errors.ts`, `apps/api/src/errors.ts`, `docs/03-architecture/api-contract.md`, `apps/api/src/errors.test.ts` | Cubierto (F08); cambio de contrato autorizado |
| OpenAPI 3.1 desde Zod | Documento generado desde los esquemas de ruta; `ErrorResponse` y `securitySchemes.cookieAuth`; `/api/openapi.json` con `no-store` | `apps/api/src/plugins/swagger.ts`, `apps/api/src/routes/health.ts`, `apps/api/src/routes/docs.test.ts` | Cubierto (F08) |
| Swagger UI dev-only | `/api/docs` solo fuera de producción; en producción la ruta responde 404 y el JSON sigue disponible | `apps/api/src/routes/docs.ts`, `apps/api/src/routes/docs.test.ts` | Cubierto (F08) |
| pino con redacción | Cookies, `authorization`, `set-cookie`, CSRF, tokens, hashes, `sessionSecret` y `email` censurados a tres niveles; niveles `warn` para 4xx y `error` para 5xx | `apps/api/src/logging.ts`, `apps/api/src/logging.test.ts`, `apps/api/src/test/routes.ts` | Cubierto (F08) |
| Harness `inject` | `createTestApp()` arranca sin puerto, con config de test, logger capturable y rate limit configurable | `apps/api/src/test/harness.ts`, `apps/api/src/app.test.ts` | Cubierto (F08) |
| Fakes de servicios | Storage, email y geocoding en memoria con `kind: 'fake'`; `buildApp()` rechaza servicios no `'real'` en producción | `apps/api/src/test/fakes.ts`, `apps/api/src/services/index.ts`, `apps/api/src/app.test.ts` | Cubierto (F08) |
| Guardas de arranque y Prisma | `prisma generate` funciona sin URL; migraciones y seed exigen `DATABASE_URL`; producción falla cerrada sin adaptadores reales | `apps/api/prisma7.config.ts`, `apps/api/src/db-url.ts`, `apps/api/src/app.ts` | Cubierto (F08); adaptadores reales en F25 |

## Base web y cliente HTTP tipado (F09, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| TanStack Start: router y providers | Router por archivos; `QueryClientProvider` en el contexto del router, con un `QueryClient` por petición en servidor y sin caché compartida entre peticiones | `apps/web/src/router.tsx`, `apps/web/src/routes/__root.tsx`, `apps/web/src/lib/query-client.ts`, `apps/web/src/lib/query-client.test.ts` | Cubierto (F09, `done`) |
| Render modes con rutas de humo | `/login` SSR, `/circles` con `ssr: false` y `/help` prerenderizado; smoke HTTP real de las tres y prueba manual del usuario en Firefox | `apps/web/src/routes/{login,circles,help}.tsx`, `apps/web/src/features/spike/login-page.tsx`, `apps/web/dist/client/help/index.html` | Cubierto (F09, `done`); AC-06 verificado en navegador el 2026-11-01; prueba automatizada en F37/F38 |
| Code-splitting por ruta | Los archivos de `src/routes/` exportan solo `Route`; el componente de `/login` vive en `features/spike/login-page.tsx` | `apps/web/src/routes/login.tsx`, `apps/web/src/features/spike/login-page.tsx`, `apps/web/src/routes/login.test.tsx` | Cubierto (F09, `done`): advertencia de TanStack Router corregida |
| Cliente REST tipado | `createApiClient({ basePath?, fetch? })`, `request<T>()`, atajos por verbo, validación estructural (`parse`, sin `zod`), query determinista, 204/205 y `Content-Length: 0`, `credentials: 'include'`, `dist` compilado | `packages/api-client/src/client.ts`, `packages/api-client/src/types.ts`, `packages/api-client/src/url.ts`, `packages/api-client/README.md` | Cubierto (F09) |
| Errores de contrato y de transporte | `ApiError` canónico de `shared`; `ApiTransportError` con `kind` (`network`, `invalid-json`, `invalid-response`, `unexpected-error-response`); mensajes seguros en español; guards; `AbortError` relanzado sin envolver | `packages/api-client/src/errors.ts`, `packages/api-client/src/errors.test.ts`, `apps/web/src/lib/error-message.ts` | Cubierto (F09) |
| TanStack Query aplicado | `staleTime` 30 s; 4xx sin reintento, 5xx y fallo de red con máximo 2 reintentos | `apps/web/src/lib/query-client.ts`, `apps/web/src/lib/query-client.test.ts` | Cubierto (F09); hooks de datos de producto en F18+ |
| Error boundaries y 404 | Error boundary raíz con reintento, foco y enlace; 404 con foco y enlace a `/` | `apps/web/src/components/route-error.tsx`, `apps/web/src/components/not-found.tsx` y sus tests | Cubierto (F09) |
| Configuración por entorno | `VITE_API_BASE_URL` (default `/api`) y `API_INTERNAL_URL` como origen absoluto validado al arrancar (default `http://127.0.0.1:3001`, base final `${origen}/api`); `.env.example`; `dist/client` sin `API_INTERNAL_URL` ni `127.0.0.1` | `apps/web/src/lib/env.ts`, `apps/web/src/lib/env.server.ts` y tests, `.env.example` | Cubierto (F09); enrutado de `/api` en producción en F42 |
| Proxy `/api` | Proxy de Vite con target desde `API_INTERNAL_URL`; `/api/health` por proxy 200 y `/health` directo 404 | `apps/web/vite.config.ts`, smoke HTTP | Cubierto (F09) para desarrollo |
| Frontera cliente/servidor | `api-client.server.ts` importa `@tanstack/react-start/server-only`; la base de servidor se compone como `${origen}/api` | `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api-client.server.ts` y tests | Cubierto (F09); sin consumidor de producto hasta F10+ |
| Testing de web y cliente | `api-client` 39 tests en 3 archivos con `fetch` sustituido; `apps/web` 52 tests en 13 archivos con Testing Library | `packages/api-client/src/*.test.ts`, `apps/web/src/**/*.test.tsx` | Cubierto (F09); E2E y navegador en F37/F38 |
| Revisión independiente y aceptación | Dos rondas: **no apto** (B-01, M-01 y menores/sugerencias) → **apto con correcciones** (N-01, N-02, N-03), todas aplicadas; después, corrección C-01 del code-splitting de `/login` y aceptación del usuario en Firefox real (G4) | [handoff de F09](../04-features/F09-web-core/handoff.md) | Cubierto (F09, `done`); PR #5, merge `9fd987e` y CI en verde |

## Sistema visual y tema (F10, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Tailwind 4 CSS-first y tokens | Tokens `--memora-*` con `@theme inline`, breakpoints propios y capas `z-nav/sheet/modal/toast`; sin preset JS ni `tailwind.config` | `packages/ui/src/styles/tokens.css`, `packages/ui/src/styles/tokens.test.ts`, [tokens.md](../02-design/tokens.md) | Cubierto (F10): CSS compilado con `@media (width>=30/48/64/80rem)` y `has-[:checked]:*` |
| Contraste y accesibilidad de color | Ratios WCAG 2.2 calculados sobre los hex reales; umbral 4.5:1 para texto y 3:1 para foco y componentes; tokens `*-text` de estado | `packages/ui/src/styles/contrast.test.ts`, `docs/02-design/tokens.md` | Cubierto (F10); borde de control corregido en F11 |
| Tema claro/oscuro/sistema con SSR | Cookie `memora-theme`, resolución en servidor de `data-theme`, listener de `prefers-color-scheme` solo en modo `system` | `apps/web/src/lib/theme.ts`, `apps/web/src/components/theme-provider.tsx` y sus tests | Cubierto (F10); aceptado en Firefox real el 2026-11-02 (claro/oscuro/sistema, escritorio y móvil) |
| Script previo al pintado e hidratación | Script inline en `<head>` antes de `<body>` que fija `data-theme` y `theme-color`; `resolveDocumentTheme` parte del valor ya pintado | `apps/web/src/routes/__root.tsx`, `apps/web/src/lib/theme.ts` | Cubierto (F10) por SSR, tests y aceptación en Firefox real el 2026-11-02; sin prueba automatizada de navegador (F37/F38). CSP en F42 |
| Cookie de tema | `memora-theme` con `Path=/`, `Max-Age` de un año, `SameSite=Lax` y `Secure` en https | `apps/web/src/lib/theme.ts`, `apps/web/src/lib/theme.test.ts` | Cubierto (F10) |
| `theme-color` por tema | Meta resuelto en servidor y actualizado por script y provider; coincide con `--color-bg` | `apps/web/src/routes/__root.tsx`, `apps/web/src/lib/theme.test.ts` | Cubierto (F10) por `curl` y verificado en Firefox real el 2026-11-02; sin prueba automatizada (F37/F38) |
| Fuentes self-hosted | Plus Jakarta Sans vendorizada (latin y latin-ext) con `OFL.txt`, `@font-face` con `swap` y `preload` solo del subset latin | `apps/web/public/fonts/`, `packages/ui/src/styles/fonts.css`, `packages/ui/src/styles/fonts.test.ts` | Cubierto (F10) |
| Foco visible y movimiento reducido | Regla global de `:focus-visible` con token y bloque `prefers-reduced-motion` que anula duraciones, animaciones y scroll suave | `packages/ui/src/styles/theme.css`, `packages/ui/src/styles/theme.test.ts` | Cubierto (F10) en CSS y tests; aceptado en Firefox real el 2026-11-02; sin prueba automatizada con la preferencia activa (F37/F38) |
| Guardas anti-hex | `src` y `packages/ui/src` sin colores literales; única excepción `lib/theme.ts`, comparada con `tokens.css` | `apps/web/src/styles/no-hex.test.ts`, `apps/web/src/lib/theme.test.ts` | Cubierto (F10) |
| Vitest en un paquete de UI | Entorno Node con tests de contrato y cálculo de contraste; 5 archivos y 44 tests | `packages/ui/vitest.config.ts`, `packages/ui/src/styles/*.test.ts` | Cubierto (F10) |
| Revisión independiente | Primera **no apto** (B-01, M-01, M-03) → **apto con correcciones** (M-02 y menores), sin bloqueantes | [handoff de F10](../04-features/F10-sistema-visual/handoff.md) | Cubierto (F10); aceptada el 2026-11-02 y cerrada en `done` con la PR #7, el merge `f3b26a5` y CI en verde |

## UI kit I: controles y datos (F11, done)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Componentes presentacionales | 18 componentes en `packages/ui/src/components`: acción, formulario, selección, datos y feedback; sin router, query, fetch ni dominio | `packages/ui/src/components/*.tsx`, `packages/ui/src/index.ts` | Cubierto (F11, `done`) |
| React en un paquete de UI | React 19.3.1 y React DOM como `peerDependencies` y `devDependencies`; componentes con `forwardRef`, contexto y `useTheme` fuera del paquete; el paquete no importa router, query ni fetch | `packages/ui/package.json`, `packages/ui/src/components/*.tsx`, `packages/ui/README.md` | Cubierto (F11): frontera de paquete decidida y documentada |
| `peerDependencies` y build | `react`, `react-dom` y `lucide-react` como peers; testing, jsdom y `@vitejs/plugin-react` como devDependencies; `dist` con `tsc` sin `src/test`; limitación conocida: `dist` no es ESM nativo de Node (consumidores con bundler) | `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/README.md` | Cubierto (F11); ESM nativo si aparece un consumidor Node, no necesario hoy |
| Controles nativos y roles | `Button`/`LinkButton` reales, `Checkbox` y `Switch` sobre input nativo con `role="switch"`, `SegmentedControl` con `radiogroup` y flechas, `Card` con un solo enlace | `packages/ui/src/components/{button,checkbox,switch,segmented-control,card}.tsx` y sus tests | Cubierto (F11) |
| Asociación de formularios | Label/hint/error con `aria-describedby`, `aria-invalid`, `label` oculto en búsqueda y foco al nodo real con `forwardRef` | `packages/ui/src/components/{text-field,text-area,search-field}.tsx`, `fields.test.tsx` | Cubierto (F11) |
| Tokens y utilidades | Solo tokens y utilidades Tailwind; acentos expuestos en `@theme inline` y guard anti-hex sobre `packages/ui/src` | `packages/ui/src/styles/tokens.css`, `apps/web/src/styles/no-hex.test.ts` | Cubierto (F11); sin hex en componentes |
| Contraste calculado sobre tokens | Ratios WCAG 2.2 calculados sobre los hex reales de `tokens.css`, con umbral 4,5:1 para texto y 3:1 para componentes; `--memora-border-strong` a `#868399`/`#6B7699` y pares nuevos de knob, `border-strong` y anillo del avatar | `packages/ui/src/styles/contrast.test.ts`, [tokens.md](../02-design/tokens.md) | Cubierto (F11): 78 tests de estilos; axe en jsdom no mide color por falta de layout |
| Testing con RTL y axe | Testing Library por rol y nombre accesible, sin consultas por clase; `axe-core` 4.14.0 sobre cada familia con fallo también en `incomplete` no-layout | `packages/ui/src/components/*.test.tsx`, `packages/ui/src/test/axe.ts`, `packages/ui/vitest.config.ts` | Cubierto (F11): **173 tests** en 10 archivos (95 de componentes + 78 de estilos) |
| Áreas táctiles y hover | `::after` de 44 px de altura fija centrada en botones sm, `Chip` y segmentos; quitar del `Chip` separado 8 px del cuerpo; deshabilitados sin hover | `packages/ui/src/components/*.tsx`; medición CDP registrada en [handoff de F11](../04-features/F11-ui-kit-i/handoff.md) | Cubierto (F11) por medición puntual en Chromium; **medición automática en F37** |
| Catálogo solo de desarrollo | Ruta `/ui` con todos los estados; el árbol de rutas es idéntico en desarrollo y producción (SHA de `routeTree.gen.ts` idéntico antes y después del build) y la ruta renderiza la página 404 con `notFound()`, mientras el catálogo se carga con `import()` solo en desarrollo | `apps/web/src/routes/ui.tsx`, `apps/web/vite.config.ts`, `apps/web/src/features/dev/ui-showcase.tsx` | Cubierto (F11, `done`): `dist/` sin textos ni chunk del catálogo, solo el chunk stub de ruta de 103 B |
| Revisión y auditorías | Revisión independiente en dos rondas, axe en navegador real (Chrome/CDP + axe 4.14) y auditoría de diseño en tres pasadas | [handoff de F11](../04-features/F11-ui-kit-i/handoff.md) | Cubierto (F11, `done`): 0 violaciones y 0 `incomplete`; automatización de navegador en F37/F38 |

## 1. Maquetación

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| HTML semántico | App shell, fotos, formularios, diálogos | axe; componentes | Pendiente |
| CSS moderno | Variables CSS, `100dvh`, `focus-visible`, `prefers-reduced-motion` y `:has()`; `clamp` y safe areas pendientes | `apps/web/src/styles/app.css`, `packages/ui/src/styles/tokens.css`, `packages/ui/src/styles/theme.css` | Parcial (F05 + F10: base, foco y movimiento reducido) |
| Flexbox | Navegación, cabeceras, miembros, avatares | App shell | Pendiente |
| Grid | Galería, círculos, layout escritorio | Galería | Pendiente |
| Responsive | 320–1440; bottom nav/sidebar | `packages/ui/src/styles/tokens.css` (breakpoints 480/768/1024/1280) + E2E | Parcial (F10: breakpoints y `h1` móvil; revisión visual aceptada el 2026-11-02) |
| Container queries | Tarjetas de álbum/círculo/foto | `packages/ui` | Pendiente |
| PostCSS | Tailwind 4 se integra con `@tailwindcss/vite`; no hay configuración PostCSS propia | `apps/web/vite.config.ts` | No aplica por ahora (F05) |
| Tailwind CSS | Utilidades y tokens sin preset JS | `packages/ui/src/styles/tokens.css`, `apps/web/src/styles/app.css` | Cubierto (F05) |
| IA para maquetación | Variantes y revisión visual | Bitácora | Pendiente |

## 2. Lenguaje

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| TypeScript core | `strict`, sin `any` | `packages/config/tsconfig/base.json`, `pnpm typecheck` 9/9 (F10) | Cubierto (F05: aplicado a código real) |
| Union types y narrowing | Roles, acciones, tema y `ApiResult` | `packages/shared/src/permissions.ts`, `packages/shared/src/errors.ts`, `packages/shared/src/schemas/common.ts` | Cubierto (F06: roles, acciones, tema y resultado; estados de subida en F26) |
| Genéricos | `Page<T>`, `ApiResult<T>`, `createPageSchema<T>`, `request<T>` | `packages/shared/src/pagination.ts`, `packages/shared/src/errors.ts`, `packages/api-client/src/client.ts` | Cubierto (F06: `Page<T>` y `ApiResult<T>`; F09: `request<T>` y `StructuralValidator<T>`) |
| Utility types | `Omit`, `Partial`, `Pick`, `Record` | DTOs | Pendiente |
| Tipos inferidos de Zod | `z.infer` como fuente | `packages/shared/src/schemas/dto.ts`, resto de `schemas/**` | Cubierto (F06) |
| Inmutabilidad | `Readonly`/`Object.freeze` en settings; reducer y caché pendientes | `packages/shared/src/permissions.ts` | Parcial (F06: settings; upload reducer en F26) |
| Funciones puras | Permisos, paginación y mensajes por defecto | `permissions.ts`, `pagination.ts`, `errors.ts`; tests unitarios | Cubierto (F06) |
| IA para tipados | Revisión de contratos | Bitácora | Pendiente |

## 3. Bundlers

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Vite y bundling | Start sobre Vite, proxy, env, splitting | `apps/web/vite.config.ts`, `apps/web/dist/client`, `apps/web/dist/server` | Cubierto (F05; proxy con target por entorno en F09) |
| SPA | Rutas privadas `ssr: false` | `/circles`, tabla de rutas | Cubierto (F05) |
| SSR | Login, registro, invitación | `/login` en HTML inicial | Cubierto (F05: smoke; invitación en F20) |
| SSG | Ayuda y privacidad | `apps/web/dist/client/help/index.html` | Cubierto (F05: `/help`; `/privacy` en F36) |
| MPA | No se fuerza; ADR | ADR-0002 | Pendiente |
| Turborepo | Monorepo, caché, CI y entorno global | `turbo.json` (`globalDependencies`/`globalEnv`), `.github/workflows/ci.yml`; test forzado 15/15 | Cubierto |
| Paquetes compartidos | `shared`, `api-client`, `ui`, `config` | `pnpm-workspace.yaml`, `packages/*/package.json`, `packages/shared/src/**`, `packages/api-client/src/**`, `packages/ui/src/styles/**`, `packages/ui/src/components/**` | Cubierto (F06: `shared`; F09: `api-client`; F10: `ui` con tres CSS y tests; F11: `ui` con 18 componentes React y `peerDependencies`) |

## 4. Frameworks

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| React componentes | UI kit y features | `packages/ui/src/components/*.tsx`, `apps/web/src/routes/ui.tsx`, `apps/web/src/routes/login.tsx` | Parcial (F11 `done`: 18 componentes presentacionales en `@memora/ui`; features reales desde F16+) |
| Hooks | `useUploadQueue`, `useMediaQuery`, `useTheme`, `useShare` | `apps/web/src/components/theme-provider.tsx` (`useTheme` + `ThemeProvider`) y su test | Parcial (F10: `useTheme` con contexto; `useUploadQueue`, `useMediaQuery` y `useShare` en F11+) |
| Formularios | RHF + Zod | Auth, círculo, álbum, metadatos | Pendiente |
| APIs | TanStack Query: caché, infinito, optimista | `apps/web/src/lib/query-client.ts`, `apps/web/src/router.tsx` | Parcial (F09: provider, `staleTime` y reintentos; caché de producto, infinito y optimista en F18–F35) |
| Metaframework | TanStack Start | `apps/web/src/routes/*`, `apps/web/src/router.tsx`, `apps/web/vite.config.ts` | Cubierto (F05; providers y router propios en F09) |
| Next.js | Comparación documentada | ADR-0001 | Cubierto (comparación) |
| IA agente | Tareas acotadas y revisadas | Bitácora | Cubierto |

## 5. Testing

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Componentes | Formularios, galería, navegación, tema | `apps/web/src/features/spike/help-content.test.tsx`, `apps/web/src/routes/*.test.tsx`, `apps/web/src/components/*.test.tsx`, `packages/ui/src/components/*.test.tsx` | Parcial (F05: smoke; F09: `route-error` y `not-found`; F10: `ThemeToggle` y `ThemeProvider`; F11 `done`: 95 tests de componentes con RTL + axe; features reales desde F16+) |
| Testing Library | Roles y nombre accesible, sin consultas por clase | `apps/web/src/routes/login.test.tsx`, `packages/ui/src/components/*.test.tsx` | Cubierto (F05; ampliado en F11 con 18 componentes y 95 tests) |
| Mocking APIs | MSW con contratos; 401/403/500 | Handlers | Pendiente |
| Hooks | `renderHook` | Tests | Pendiente |
| Revisión con IA | Casos límite | Bitácora | Cubierto |
| Además | API, web, cliente HTTP, UI, E2E, axe | `apps/api/src/app.test.ts`, `apps/api/src/errors.test.ts`, `apps/api/src/services/images.test.ts`, `packages/api-client/src/*.test.ts`, `packages/ui/src/styles/*.test.ts`, `packages/ui/src/components/*.test.tsx`, `apps/web/src/**/*.test.tsx`; API 77 passed + 13 skipped sin `DATABASE_URL`, 90 con `memora_test`; shared 138; api-client 39; ui 173 (95 componentes + 78 estilos); web 88; E2E pendiente | Parcial (F08: tests HTTP con `inject`; F09: cliente y web core; F10: contrato visual y contraste; F11 `done`: RTL + axe en componentes y 173 tests en `@memora/ui`; E2E en F38) |

## 6. API REST

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| API REST I y II | Recursos, verbos, códigos, paginación, subida, cookie | `apps/api/src/routes/health.ts`, `apps/api/src/errors.ts`, `apps/api/src/app.test.ts` | Parcial (F08: health, errores canónicos, 413/415/429, multipart; recursos de producto en F15+) |
| Consumo de APIs | Cliente tipado en web y SSR | `packages/api-client/src/**`, `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api-client.server.ts`; proxy `/api` validado en vivo | Cubierto (F09: cliente tipado, errores y validación de respuesta; recursos de producto en F15+) |
| Servicios externos | S3, email, geocoding, Content Island | `apps/api/src/services/{storage,email,geocoding}.ts`, `apps/api/src/test/fakes.ts`, `apps/web/src/features/spike/content.server.ts`, `content-island-snapshot.json` | Parcial (F08: contratos de servicio y fakes en memoria; Content Island cubierto; adaptadores reales de S3, email y geocoding en F25) |

## Evidencias de entrega

- [ ] README con instalación y scripts.
- [ ] ADRs.
- [ ] OpenAPI.
- [ ] Tests en CI.
- [ ] Informe de accesibilidad.
- [ ] Capturas 375/768/1440.
- [ ] Bitácora.
- [ ] Defensa.

## Regla

No se marca “cubierto” sin enlace verificable. Si algo no se cubre, se explica por qué en este documento y en el README.
