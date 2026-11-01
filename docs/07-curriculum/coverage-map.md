# Cobertura del temario

Estado: **F01–F03 cubren los temas transversales, F04 el entorno y tooling, F05 el stack de aplicación, F06 los contratos y permisos compartidos, F07 el modelo de datos y F08 el esqueleto de la API** (organización, documentación, IA agente, revisión, activos, TypeScript estricto, monorepo, Docker, CI, render modes, Tailwind 4, Fastify + Zod, Prisma 7, migraciones, seed determinista, PostgreSQL real en tests, sharp, Content Island, Zod como fuente única, errores, paginación, autorización pura, OpenAPI, logs con redacción y harness de tests). F05 está `done` tras el merge `8dfae5f` y CI en verde; F06 está `done` desde el 2026-10-31 tras la PR #2, el merge `b556168` y CI en verde (run `41246708428`); F07 está `done` desde el 2026-11-01 tras la PR #3, el merge `bd2769c` y CI en verde (run `41254603622`), con PostgreSQL 17.11 y tests de integración reales. F08 está `done` desde el 2026-11-01 tras la PR #4, el merge `ed1f316` y CI en verde (run `41261491641`); su verificación real es `pnpm --filter @memora/api test` → 77 passed + 13 skipped sin `DATABASE_URL` y 90 passed con `memora_test`, más `pnpm --filter @memora/shared test` → 138 passed. El resto está planificado y se actualiza al cerrar cada feature con evidencias reales.

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
| Vitest 5 y Testing Library | Tests de API, rutas, contenido y tokens | `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`; API 77 passed + 13 skipped sin `DATABASE_URL` y 90 con `memora_test` (F08) | Cubierto para smoke; E2E en F37/F38 |
| TypeScript estricto aplicado | Código real de web, API y UI | `pnpm typecheck` → 8/8 tareas | Cubierto |
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

## 1. Maquetación

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| HTML semántico | App shell, fotos, formularios, diálogos | axe; componentes | Pendiente |
| CSS moderno | Variables CSS, `100dvh`, `focus-visible`; `clamp`, safe areas y reduced motion pendientes | `apps/web/src/styles/app.css`, `packages/ui/src/styles/tokens.css` | Parcial (F05) |
| Flexbox | Navegación, cabeceras, miembros, avatares | App shell | Pendiente |
| Grid | Galería, círculos, layout escritorio | Galería | Pendiente |
| Responsive | 320–1440; bottom nav/sidebar | Capturas + E2E | Pendiente |
| Container queries | Tarjetas de álbum/círculo/foto | `packages/ui` | Pendiente |
| PostCSS | Tailwind 4 se integra con `@tailwindcss/vite`; no hay configuración PostCSS propia | `apps/web/vite.config.ts` | No aplica por ahora (F05) |
| Tailwind CSS | Utilidades y tokens sin preset JS | `packages/ui/src/styles/tokens.css`, `apps/web/src/styles/app.css` | Cubierto (F05) |
| IA para maquetación | Variantes y revisión visual | Bitácora | Pendiente |

## 2. Lenguaje

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| TypeScript core | `strict`, sin `any` | `packages/config/tsconfig/base.json`, `pnpm typecheck` 8/8 | Cubierto (F05: aplicado a código real) |
| Union types y narrowing | Roles, acciones, tema y `ApiResult` | `packages/shared/src/permissions.ts`, `packages/shared/src/errors.ts`, `packages/shared/src/schemas/common.ts` | Cubierto (F06: roles, acciones, tema y resultado; estados de subida en F26) |
| Genéricos | `Page<T>`, `ApiResult<T>`, `createPageSchema<T>`, `request<T>` | `packages/shared/src/pagination.ts`, `packages/shared/src/errors.ts` | Parcial (F06: `Page<T>` y `ApiResult<T>`; `request<T>` en F09) |
| Utility types | `Omit`, `Partial`, `Pick`, `Record` | DTOs | Pendiente |
| Tipos inferidos de Zod | `z.infer` como fuente | `packages/shared/src/schemas/dto.ts`, resto de `schemas/**` | Cubierto (F06) |
| Inmutabilidad | `Readonly`/`Object.freeze` en settings; reducer y caché pendientes | `packages/shared/src/permissions.ts` | Parcial (F06: settings; upload reducer en F26) |
| Funciones puras | Permisos, paginación y mensajes por defecto | `permissions.ts`, `pagination.ts`, `errors.ts`; tests unitarios | Cubierto (F06) |
| IA para tipados | Revisión de contratos | Bitácora | Pendiente |

## 3. Bundlers

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Vite y bundling | Start sobre Vite, proxy, env, splitting | `apps/web/vite.config.ts`, `apps/web/dist/client`, `apps/web/dist/server` | Cubierto (F05) |
| SPA | Rutas privadas `ssr: false` | `/circles`, tabla de rutas | Cubierto (F05) |
| SSR | Login, registro, invitación | `/login` en HTML inicial | Cubierto (F05: smoke; invitación en F20) |
| SSG | Ayuda y privacidad | `apps/web/dist/client/help/index.html` | Cubierto (F05: `/help`; `/privacy` en F36) |
| MPA | No se fuerza; ADR | ADR-0002 | Pendiente |
| Turborepo | Monorepo, caché, CI y entorno global | `turbo.json` (`globalDependencies`/`globalEnv`), `.github/workflows/ci.yml`; test forzado 15/15 | Cubierto |
| Paquetes compartidos | `shared`, `api-client`, `ui`, `config` | `pnpm-workspace.yaml`, `packages/*/package.json`, `packages/shared/src/**` | Parcial (F06: `shared` con contratos y permisos; `api-client` sin uso real) |

## 4. Frameworks

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| React componentes | UI kit y features | `apps/web/src/routes/login.tsx`, `apps/web/src/features/spike/help-content.tsx` | Parcial (F05: páginas placeholder; UI kit en F11/F12) |
| Hooks | `useUploadQueue`, `useMediaQuery`, `useTheme`, `useShare` | Tests de hooks | Pendiente |
| Formularios | RHF + Zod | Auth, círculo, álbum, metadatos | Pendiente |
| APIs | TanStack Query: caché, infinito, optimista | Etiquetas, galería | Pendiente |
| Metaframework | TanStack Start | `apps/web/src/routes/*`, `apps/web/vite.config.ts` | Cubierto (F05) |
| Next.js | Comparación documentada | ADR-0001 | Cubierto (comparación) |
| IA agente | Tareas acotadas y revisadas | Bitácora | Cubierto |

## 5. Testing

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Componentes | Formularios, galería, navegación, tema | `apps/web/src/features/spike/help-content.test.tsx`, `apps/web/src/routes/*.test.tsx` | Parcial (F05: smoke; features reales en F09+) |
| Testing Library | Roles y texto accesible | `apps/web/src/routes/login.test.tsx` | Cubierto (F05) |
| Mocking APIs | MSW con contratos; 401/403/500 | Handlers | Pendiente |
| Hooks | `renderHook` | Tests | Pendiente |
| Revisión con IA | Casos límite | Bitácora | Cubierto |
| Además | API, E2E, axe | `apps/api/src/app.test.ts`, `apps/api/src/errors.test.ts`, `apps/api/src/services/images.test.ts`; API 77 passed + 13 skipped sin `DATABASE_URL`, 90 con `memora_test`; shared 138; E2E y axe pendientes | Parcial (F08: tests HTTP con `inject`; E2E en F38) |

## 6. API REST

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| API REST I y II | Recursos, verbos, códigos, paginación, subida, cookie | `apps/api/src/routes/health.ts`, `apps/api/src/errors.ts`, `apps/api/src/app.test.ts` | Parcial (F08: health, errores canónicos, 413/415/429, multipart; recursos de producto en F15+) |
| Consumo de APIs | Cliente tipado en web y SSR | `api-client`; proxy `/api` validado; contratos en `shared` | Parcial (F06: contratos; cliente tipado en F09) |
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
