# Tasks — F04 Monorepo, tooling, Docker y CI

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F03.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] pnpm + corepack
- [ ] Turborepo
- [ ] apps/web, apps/api, packages/shared, api-client, ui, config
- [ ] tsconfig estricto
- [ ] ESLint y Prettier
- [ ] Docker Compose: Postgres, MinIO, Mailpit
- [ ] .env.example
- [ ] .gitignore
- [ ] GitHub Actions base
- [ ] Scripts raíz

## Criterios de aceptación

- [ ] AC-01: pnpm install funciona desde cero.
- [ ] AC-02: pnpm lint y pnpm typecheck pasan.
- [ ] AC-03: pnpm build construye paquetes vacíos.
- [ ] AC-04: docker compose up levanta Postgres, MinIO y Mailpit.
- [ ] AC-05: .env.example documenta todas las variables.
- [ ] AC-06: CI ejecuta install, lint, typecheck, test y build.
- [ ] AC-07: Los límites de imports están documentados.

## Verificación

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `docker compose config`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
