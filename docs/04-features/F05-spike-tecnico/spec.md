---
id: F05
title: "Spike técnico integrado"
milestone: M1
size: M
status: draft
spec: complete
depends_on:
  - "F04"
blocks:
  - "F06"
design_refs: []
contracts:
  - "docs/03-architecture/render-modes.md"
decisions:
  - "ADR-0001"
  - "ADR-0002"
  - "ADR-0003"
  - "ADR-0004"
  - "ADR-0007"
---

# F05 — Spike técnico integrado

> **Milestone:** M1 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F04 · **Bloquea:** F06

## Objetivo

Validar juntas las piezas de riesgo antes de construir features: Start, Tailwind 4, Fastify, Zod 4, Prisma 7, sharp y snapshot de Content Island.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/render-modes.md](../../../docs/03-architecture/render-modes.md)

### Decisiones

- ADR-0001
- ADR-0002
- ADR-0003
- ADR-0004
- ADR-0007

## Alcance

### Incluye

- Ruta SSR de prueba
- Ruta privada ssr:false
- Ruta prerenderizada
- Proxy /api
- Endpoints de salud y eco Zod
- Migración mínima Prisma
- Procesamiento de una imagen con sharp
- Lectura de snapshot Content Island
- Informe de resultados y plan de salida

### No incluye

- Producto real
- Diseño final
- Tests completos

## Entregables

- Spike funcional
- docs/03-architecture/spike-results.md
- ADRs actualizados si algo cambia

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Las tres rutas se renderizan en el modo esperado.
- **AC-02.** Tailwind 4 aplica tokens sin preset JS.
- **AC-03.** Fastify valida con Zod 4 y devuelve errores uniformes.
- **AC-04.** Prisma 7 migra y consulta.
- **AC-05.** sharp genera thumb y display sin perder orientación.
- **AC-06.** El snapshot de Content Island se lee en build.
- **AC-07.** Se documentan limitaciones y plan de salida.

## Pruebas

- Smoke test de cada ruta
- Test de endpoint eco
- Test de imagen
- Build de prerender

## Archivos previstos

- `apps/web/src/routes/**`
- `apps/api/src/**`
- `docs/03-architecture/spike-results.md`

## Verificación

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `curl /api/health`

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

Si TanStack Start bloquea, se documenta el plan de salida antes de seguir.
