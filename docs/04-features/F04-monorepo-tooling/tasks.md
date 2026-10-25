# Tasks — F04 Monorepo, tooling, Docker y CI

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F03.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] pnpm + corepack
- [x] Turborepo
- [x] apps/web, apps/api, packages/shared, api-client, ui, config
- [x] tsconfig estricto
- [x] ESLint y Prettier
- [x] Docker Compose: Postgres, MinIO, Mailpit
- [x] .env.example
- [x] .gitignore
- [x] GitHub Actions base
- [x] Scripts raíz
- [x] `scripts/check-docs.mjs`
- [x] `scripts/validate-agents.mjs`

## Criterios de aceptación

- [x] AC-01: pnpm install funciona desde cero.
- [x] AC-02: pnpm lint y pnpm typecheck pasan.
- [x] AC-03: pnpm build construye paquetes vacíos.
- [x] AC-04: docker compose up levanta Postgres, MinIO y Mailpit.
- [x] AC-05: .env.example documenta todas las variables.
- [x] AC-06: CI ejecuta install, lint, typecheck, test y build.
- [x] AC-07: Los límites de imports están documentados.
- [x] AC-08: `check-docs.mjs` devuelve 0 enlaces rotos.
- [x] AC-09: `validate-agents.mjs` valida agentes, comandos, skills y las 43 specs.

## Verificación

- [x] `pnpm install`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `docker compose config`
- [x] `node scripts/check-docs.mjs`
- [x] `node scripts/validate-agents.mjs`

## Cierre

- [x] Revisión independiente.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto (sin ejecutar).
