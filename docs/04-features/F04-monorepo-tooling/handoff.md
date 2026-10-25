# Handoff — F04 Monorepo, tooling, Docker y CI

- **Estado:** done
- **Rama:** `feat/F04-monorepo-tooling` mergeada en `main` (`ff6c6d7`)
- **Fecha:** 2026-10-25
- **Implementado por:** orquestador + subagentes de implementación
- **Revisado por:** reviewer independiente
- **Aceptado por:** usuario (2026-10-25)

## Resultado

Monorepo reproducible con pnpm 10.34.8 y Turborepo: apps `web` y `api`, paquetes `shared`, `api-client`, `ui` y `config`, TypeScript estricto, ESLint y Prettier, Docker Compose local (Postgres, MinIO, Mailpit), `.env.example`, CI base y los validadores documentales `check-docs.mjs` y `validate-agents.mjs`.

La revisión independiente dio **«apto con correcciones», sin bloqueantes**. Las seis correcciones solicitadas están resueltas: I1 permisos de `.env`, I2 `displayPath` del checker, I3 `lint:root` para `scripts/`, I4 Prettier limitado a código, I5 CI ejecuta `docs:check` y `agents:check`, e I6 MinIO fijado por digest y documentado.

La feature está `done`: el usuario dio su conformidad, el trabajo se mergeó en `main` y CI pasó en verde sobre ese merge ([run 40220950230](https://github.com/Luceir0/lab-final--memora/actions/runs/40220950230), job único con install, docs, agents, lint, typecheck, test y build).

## Cambios (archivos)

- `package.json`: scripts raíz, `packageManager` y `engines`; workspace con 7 proyectos.
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`: definición y congelado de dependencias.
- `turbo.json`: pipeline de `dev`, `build`, `lint`, `typecheck`, `test` y `test:e2e`.
- `tsconfig` base y variantes (`packages/config/tsconfig/{base,node,react}.json`).
- `eslint.config.mjs` y `packages/config/eslint/base.mjs`: configuración compartida.
- `.prettierrc.json`, `packages/config/prettier/index.json` y `.prettierignore`: formato solo de código.
- `apps/web/**`: scaffold TanStack Start 1.169.4 sobre Vite 8.3.5 (router, ruta raíz, `routeTree.gen.ts` versionado).
- `apps/api/**`: scaffold Fastify 5.12.7 con arranque y build propios.
- `packages/shared/**`: utilidades base con el primer test real; `packages/api-client/**`, `packages/ui/**` y `packages/config/**` como paquetes vacíos con README y tsconfig.
- `docker-compose.yml`: Postgres 17.11, MinIO por digest, Mailpit 1.32.0, healthchecks, red y volúmenes.
- `.env.example`: variables de aplicación, servicios externos e infraestructura local.
- `.gitignore`: excluye `dist/`, `.turbo/`, `node_modules/`, `.env` y artefactos.
- `.github/workflows/ci.yml`: install, docs, agents, lint, typecheck, test y build.
- `scripts/check-docs.mjs` y `scripts/validate-agents.mjs`: validadores con `--root` para pruebas negativas.
- `docs/03-architecture/monorepo.md`, `docs/08-delivery/deployment.md`, README y documentación de la feature: contratos y guía alineados con lo implementado.

## Verificación (comandos y resultado)

Ejecución real del orquestador y del reviewer, sin caché cuando se indica:

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | 0; pnpm 10.34.8 vía corepack, 7 proyectos de workspace, lockfile v9; warning conocido `Ignored build scripts: esbuild@0.28.2` |
| `pnpm lint` | 0; 6/6 tareas Turbo + `lint:root` sobre `scripts/` y `eslint.config.mjs` |
| `pnpm typecheck` | 0; 7/7 |
| `pnpm build` | 0; 5/5; web emite `dist/client` + `dist/server` |
| `pnpm test` | 0; 3/3; 1 test real en `@memora/shared`; `apps/web` aún sin tests |
| `turbo run build typecheck lint test --force` | 19/19 tareas, 0 caché |
| `pnpm docs:check` | 0; 189 archivos, 399 enlaces, 0 rotos, estructura OK |
| `pnpm agents:check` | 0; configuración OK, 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas de tablero |
| `pnpm format:check` | 0; solo código |
| `docker compose config -q` | 0, sin warnings |
| `docker compose up -d` | postgres, minio y mailpit `healthy`; `pg_isready` acepta conexiones; MinIO `/minio/health/live` → 200; Mailpit `:8025` → 200 |
| `docker compose down` | conserva los volúmenes `memora_postgres-data` y `memora_minio-data` |
| `pnpm --filter @memora/api dev` | `Server listening at http://127.0.0.1:3001`; `GET /` → 404 JSON (correcto: sin rutas hasta F05) |
| Humo web (`pnpm --filter @memora/web dev`) | Vite 8.3.5; `GET http://localhost:3000/` → 200; `<html lang="es">`, `<title>Memora</title>`, `main` + `h1` con `SITE_NAME` |
| Pruebas negativas de validadores (`--root` sobre copia temporal) | enlace roto, `status: bogus`, `default_agent` inexistente y `subagent+allow` en `api-dev` → exit 1 en cada caso |
| CI en GitHub Actions (`main`, merge `ff6c6d7`) | [run 40220950230](https://github.com/Luceir0/lab-final--memora/actions/runs/40220950230): completed/success; ningún paso fallido |
| `git status` | limpio; artefactos y secretos ignorados; trabajo en 4 commits sobre `feat/F04-monorepo-tooling` |

## Criterios de aceptación

| AC | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | pnpm install funciona desde cero | Pasa | `pnpm install --frozen-lockfile` → 0; 7 proyectos; lockfile v9 |
| AC-02 | pnpm lint y pnpm typecheck pasan | Pasa | lint 6/6 + `lint:root`; typecheck 7/7 |
| AC-03 | pnpm build construye paquetes vacíos | Pasa | build 5/5; web `dist/client` + `dist/server` |
| AC-04 | docker compose up levanta Postgres, MinIO y Mailpit | Pasa | tres servicios `healthy`; `pg_isready`, MinIO y Mailpit responden |
| AC-05 | .env.example documenta todas las variables | Pasa | aplicación, base de datos, sesión, S3, email, geocodificación, Content Island e infraestructura local |
| AC-06 | CI ejecuta install, lint, typecheck, test y build | Pasa | [Run 40220950230](https://github.com/Luceir0/lab-final--memora/actions/runs/40220950230) en `main`: completed/success, ningún paso fallido; incluye además `docs:check` y `agents:check` |
| AC-07 | Los límites de imports están documentados | Pasa con limitación | `docs/03-architecture/monorepo.md`; sin enforcement automático hasta F05/F09 |
| AC-08 | `check-docs.mjs` devuelve 0 enlaces rotos | Pasa | 189 archivos, 399 enlaces, 0 rotos, estructura OK |
| AC-09 | `validate-agents.mjs` valida agentes, comandos, skills y las 43 specs | Pasa | 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas de tablero |

## Pendiente

- **Enforcement de fronteras de imports.** Documentadas en `monorepo.md`, sin regla automática. Previsto en F05/F09.
- **`onlyBuiltDependencies` para `esbuild@0.28.2`.** pnpm 10 sigue ignorando su postinstall; no rompe el build (Vite 8 usa rolldown). Se decide en F05.
- **Tests reales de `apps/web` y `test:e2e`.** Hoy son placeholders que salen 0; llegan con F05 y F37/F38.
- **`db:migrate` / `db:seed`.** Apuntan a scripts de `@memora/api` que existen a partir de F07.
- **Lectura de `.env` por shell.** Limitación de `opencode.jsonc`; no se puede cerrar por configuración.

## Riesgos y limitaciones

1. **Lectura de `.env` por shell.** La regla de `opencode.jsonc` no puede impedir `cat .env` desde una shell; es una limitación de la herramienta, aceptada y no ocultada.
2. **MinIO de terceros.** `alpine/minio` es un mirror (las imágenes oficiales dejaron de ser públicas), fijado por digest, solo para local y ejecutado como root por permisos del volumen. En producción se usa R2/S3 gestionado.
3. **`esbuild@0.28.2`.** pnpm 10 ignora su postinstall; hoy no afecta porque Vite 8 usa rolldown. Se valorará `onlyBuiltDependencies` en F05.
4. **Cobertura de tests incompleta.** `apps/web` no tiene tests reales (placeholder que sale 0) y `test:e2e` no ejecuta nada todavía; `db:migrate` y `db:seed` fallarán hasta F07.
5. **`routeTree.gen.ts`.** Se versiona a propósito; si se ignora, un clon limpio no pasa typecheck.
6. **Fronteras sin enforcement.** Los límites de imports están documentados, pero no hay comprobación automática; se abordará en F05/F09.
7. **CI.** Ejecutada en `main` sobre el merge `ff6c6d7`: [run 40220950230](https://github.com/Luceir0/lab-final--memora/actions/runs/40220950230), completed/success, sin pasos fallidos.

## Documentación actualizada

- [x] `docs/04-features/F04-monorepo-tooling/handoff.md`
- [x] `docs/04-features/README.md` (F04 → `done` y situación actual)
- [x] `docs/04-features/F04-monorepo-tooling/spec.md` (`status: done`)
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md` (sección «Entorno, tooling y entrega (F04)»)
- [x] `README.md` (estado, árbol, versiones fijadas)
- [x] `docs/08-delivery/deployment.md` (`.env.example` como fuente de verdad)
- [x] `docs/03-architecture/monorepo.md` (tabla de dependencias como máximo permitido)

## Siguiente paso propuesto

1. Abrir F05 (spike técnico integrado), que añadirá tests reales, enforcement de fronteras y valorará `onlyBuiltDependencies` para esbuild.
