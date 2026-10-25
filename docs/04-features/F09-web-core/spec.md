---
id: F09
title: "Web core"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F06"
blocks:
  - "F10"
  - "F36"
  - "F37"
design_refs: []
contracts:
  - "docs/03-architecture/render-modes.md"
  - "docs/03-architecture/api-contract.md"
decisions:
  - "ADR-0001"
  - "ADR-0002"
---

# F09 — Web core

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F06 · **Bloquea:** F10, F36, F37

## Objetivo

Crear la base de TanStack Start: router, providers, api-client, proxy, errores y rutas de humo.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/render-modes.md](../../../docs/03-architecture/render-modes.md)
- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)

### Decisiones

- ADR-0001
- ADR-0002

## Alcance

### Incluye

- Router por archivos
- Root layout
- QueryClientProvider
- api-client tipado
- Proxy /api
- Error boundary
- 404
- Variables de entorno
- Rutas de humo SSR/SPA/SSG

### No incluye

- Pantallas de producto
- Sistema visual completo

## Entregables

- apps/web/src/routes/__root.tsx
- apps/web/src/router.tsx
- apps/web/src/lib/api-client.ts
- apps/web/vite.config.ts

## UX y estados

- 404 comprensible
- Error boundary con reintento

## Criterios de aceptación

- **AC-01.** La app arranca en desarrollo.
- **AC-02.** El proxy /api funciona.
- **AC-03.** Una ruta SSR renderiza en servidor.
- **AC-04.** Una ruta ssr:false no renderiza su componente en servidor.
- **AC-05.** Una ruta prerenderizada genera HTML.
- **AC-06.** No hay errores de hidratación en las rutas de humo.

## Pruebas

- Smoke de rutas
- Proxy
- 404
- Error boundary

## Archivos previstos

- `apps/web/src/**`
- `apps/web/vite.config.ts`

## Verificación

- `pnpm --filter @memora/web dev`
- `pnpm --filter @memora/web build`
- `pnpm --filter @memora/web test`

## Definition of Ready

- [ ] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No usar el modo SPA global. El servidor Node sigue existiendo.
