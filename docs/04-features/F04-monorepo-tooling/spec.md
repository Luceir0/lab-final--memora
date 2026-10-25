---
id: F04
title: "Monorepo, tooling, Docker y CI"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F03"
blocks:
  - "F05"
design_refs: []
contracts:
  - "docs/03-architecture/monorepo.md"
decisions:
  - "ADR-0001"
  - "ADR-0003"
  - "ADR-0004"
---

# F04 — Monorepo, tooling, Docker y CI

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F03 · **Bloquea:** F05

## Objetivo

Crear la base reproducible del monorepo: pnpm, Turborepo, paquetes, Docker local, lint, typecheck y CI.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/monorepo.md](../../../docs/03-architecture/monorepo.md)

### Decisiones

- ADR-0001
- ADR-0003
- ADR-0004

## Alcance

### Incluye

- pnpm + corepack
- Turborepo
- apps/web, apps/api, packages/shared, api-client, ui, config
- tsconfig estricto
- ESLint y Prettier
- Docker Compose: Postgres, MinIO, Mailpit
- .env.example
- .gitignore
- GitHub Actions base
- Scripts raíz

### No incluye

- Lógica de producto
- Migraciones (F07)
- Rutas (F09)

## Entregables

- package.json raíz
- pnpm-workspace.yaml
- turbo.json
- docker-compose.yml
- .github/workflows/ci.yml
- tsconfig base
- ESLint/Prettier

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** pnpm install funciona desde cero.
- **AC-02.** pnpm lint y pnpm typecheck pasan.
- **AC-03.** pnpm build construye paquetes vacíos.
- **AC-04.** docker compose up levanta Postgres, MinIO y Mailpit.
- **AC-05.** .env.example documenta todas las variables.
- **AC-06.** CI ejecuta install, lint, typecheck, test y build.
- **AC-07.** Los límites de imports están documentados.

## Pruebas

- Instalación limpia
- Build de humo
- Docker healthchecks
- CI en rama

## Archivos previstos

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `docker-compose.yml`
- `apps/**`
- `packages/**`
- `.github/workflows/ci.yml`

## Verificación

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `docker compose config`

## Definition of Ready

- [ ] Dependencias `done` o autorizadas.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Fijar versiones exactas. No usar Prisma 8 RC.
