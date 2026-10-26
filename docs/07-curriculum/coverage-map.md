# Cobertura del temario

Estado: **F01–F03 cubren los temas transversales, F04 el entorno y tooling, y F05 valida el stack de aplicación** (organización, documentación, IA agente, revisión, activos, TypeScript estricto, monorepo, Docker, CI, render modes, Tailwind 4, Fastify + Zod, Prisma 7, sharp y Content Island). F05 está `done` tras el merge `8dfae5f` y CI en verde. El resto está planificado y se actualiza al cerrar cada feature con evidencias reales.

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
| Fastify 5 + Zod 4 | Validación y serialización tipadas; 4xx reales, 413 y 500 uniformes; logs `warn`/`error`; cobertura parcial de 4xx | `apps/api/src/build-server.ts`, `apps/api/src/spike/*` | Cubierto con limitación: 401/403/409/415/422/429 sin ruta que los produzca |
| API REST | `GET /api/health`, `POST /api/spike/echo`; `/api/spike/boom` solo en test; 400/404/413/500 | `apps/api/src/spike/routes.test.ts`, smoke en vivo | Cubierto para el spike; recursos reales en F08+ |
| Prisma 7 + PostgreSQL | Configuración, migración y consulta; `globalEnv` de Turbo para el test de integración | `apps/api/prisma7.config.ts`, `apps/api/prisma/schema.prisma`, `turbo.json`, `apps/api/src/db.integration.test.ts` | Cubierto; 15/15 con `DATABASE_URL` y 1 saltado sin base |
| Turbo: caché y entorno | `globalDependencies` del snapshot y `globalEnv` con `DATABASE_URL` y `CONTENT_ISLAND_SNAPSHOT_PATH` | `turbo.json`; `turbo run test --filter=@memora/api --force` → 15/15 | Cubierto |
| Procesamiento de imágenes | thumb 400×400 cover, display ≤1600 px, orientación EXIF, sin EXIF/ICC, 50 MP con SOF parcheada | `apps/api/src/services/images.ts`, `apps/api/src/services/images.test.ts` | Cubierto para JPEG/PNG; WebP como entrada no probado; HEIC no validado |
| Content Island y SSG | Snapshot versionado, `view: published`, lectura en build sin token, error genérico y log de servidor | `content-island-snapshot.json`, `apps/web/src/features/spike/content.server.ts`, `apps/web/dist/client/help/index.html` | Cubierto |
| Vitest 5 y Testing Library | Tests de API, rutas, contenido y tokens | `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`, 30 passed + 1 skipped sin DB; 31 con DB | Cubierto para smoke; E2E en F37/F38 |
| TypeScript estricto aplicado | Código real de web, API y UI | `pnpm typecheck` → 8/8 tareas | Cubierto |
| Secretos fuera del build | El build no usa token; el JS cliente no contiene el snapshot ni `node:fs` | Inspección de `apps/web/dist/client/assets/*.js` | Cubierto |
| Documentación de resultados | Informe, handoff y plan de salida | `docs/03-architecture/spike-results.md`, `docs/04-features/F05-spike-tecnico/handoff.md` | Cubierto |

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
| Union types y narrowing | Upload state, roles, tema, ApiResult | `useUploadQueue`, api-client | Pendiente |
| Genéricos | `Paginated<T>`, `ApiResult<T>`, `request<T>` | `shared`, `api-client` | Pendiente |
| Utility types | `Omit`, `Partial`, `Pick`, `Record` | DTOs | Pendiente |
| Tipos inferidos de Zod | `z.infer` como fuente | `apps/api/src/spike/schemas.ts` | Parcial (F05: health y echo; contratos completos en F06) |
| Inmutabilidad | Reducer y caché | Upload reducer | Pendiente |
| Funciones puras | Permisos, filtros, formatos | Tests unitarios | Pendiente |
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
| Paquetes compartidos | `shared`, `api-client`, `ui`, `config` | `pnpm-workspace.yaml`, `packages/*/package.json` | Parcial (F05: web consume `shared` y `ui`; `api-client` sin uso real) |

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
| Además | API, E2E, axe | `apps/api/src/spike/routes.test.ts`, `apps/api/src/services/images.test.ts`; 30 passed + 1 skipped sin DB, 31 con DB; E2E y axe pendientes | Parcial (F05: tests de API) |

## 6. API REST

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| API REST I y II | Recursos, verbos, códigos, paginación, subida, cookie | `apps/api/src/build-server.ts`, `apps/api/src/spike/routes.ts` | Parcial (F05: health, eco/boom, 4xx/413/500; recursos reales en F08+) |
| Consumo de APIs | Cliente tipado en web y SSR | `api-client`; proxy `/api` validado | Parcial (F05: proxy; cliente tipado en F06/F09) |
| Servicios externos | S3, email, geocoding, Content Island | `apps/web/src/features/spike/content.server.ts`, `content-island-snapshot.json` | Parcial (F05: Content Island snapshot; S3, email y geocoding pendientes) |

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
