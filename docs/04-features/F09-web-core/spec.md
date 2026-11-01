---
id: F09
title: "Web core"
milestone: M1
size: M
status: accepted
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

> **Milestone:** M1 · **Talla:** M · **Estado:** accepted · **Spec:** completa
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

- [x] Dependencias `done`. F06 está `done`; el tablero registra la apertura autorizada por el usuario el 2026-11-01.
- [x] Decisiones resueltas. ADR-0001 y ADR-0002 aceptadas; las cuatro decisiones de arranque están abajo.
- [x] Contratos congelados. `render-modes.md` y `api-contract.md`.
- [x] Diseño enlazado. No aplica: F09 no tiene pantallas de producto.
- [x] Datos de prueba. No aplica: las rutas de humo no leen datos persistidos; los tests usan fixtures locales y `fetch` sustituido.
- [x] Sin preguntas bloqueantes. Resueltas el 2026-11-01.

## Decisiones de arranque (2026-11-01)

1. **Dependencia nueva autorizada:** `@tanstack/react-query` en `apps/web`, versión exacta y compatible con React 19. Es la única dependencia de producto nueva de la feature.
2. **Cliente API:** la lógica genérica (`request<T>()`, normalización de errores, base path) vive en `packages/api-client`; `apps/web/src/lib/api-client.ts` solo configura y exporta la instancia. `packages/api-client` deja de ser un stub.
3. **Variables de entorno:** `VITE_API_BASE_URL` (navegador, por defecto `/api`) y `API_INTERNAL_URL` (SSR y server functions, por defecto `http://127.0.0.1:3001`), con validación al arrancar y documentación en `.env.example`. Sin secretos.
4. **Rutas de humo:** se conservan `/login` (SSR), `/circles` (`ssr: false`) y `/help` (prerender) del spike F05, anotadas como placeholders. F16, F18 y F36 las sustituirán. No se retira la lectura del snapshot de Content Island en esta feature.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

No usar el modo SPA global. El servidor Node sigue existiendo.
