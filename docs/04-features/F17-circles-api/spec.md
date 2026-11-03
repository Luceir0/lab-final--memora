---
id: F17
title: "Circles API"
milestone: M2
size: M
status: done
spec: complete
depends_on:
  - "F08"
  - "F15"
blocks:
  - "F18"
  - "F19"
  - "F21"
  - "F23"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F17 — Circles API

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F08, F15 · **Bloquea:** F18, F19, F21, F23

## Objetivo

Implementar CRUD de círculos, membresía, settings y permisos reales.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- GET/POST /circles
- GET/PATCH/DELETE /circles/:circleId
- Membership owner
- Settings flags
- Stats
- Autorización
- Tests de acceso cruzado

### No incluye

- UI
- Invitaciones (F19)
- Miembros (F21)

## Entregables

- apps/api/src/modules/circles/**
- tests

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Crear círculo añade owner membership.
- **AC-02.** Solo miembros ven el círculo.
- **AC-03.** Solo owner edita settings/borra.
- **AC-04.** Un extraño recibe 404.
- **AC-05.** settings valida flags.
- **AC-06.** Stats no filtran otros círculos.
- **AC-07.** Tests negativos.

## Pruebas

- CRUD
- Permisos
- Acceso cruzado
- Settings inválidos

## Archivos previstos

- `apps/api/src/modules/circles/**`

## Verificación

- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test circles`
- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test`
- `pnpm --filter @memora/api typecheck`
- `pnpm --filter @memora/api lint`
- `pnpm format:check`
- Sin `DATABASE_URL` la suite de integración se salta por diseño y no demuestra los AC.

## Definition of Ready

- [x] Dependencias `done` (F08 y F15).
- [x] Decisiones resueltas (ver «Decisiones registradas»).
- [x] Contratos congelados.
- [x] Diseño enlazado (si aplica). No aplica: backend.
- [x] Datos de prueba: factories de F07 y `memora_test` migrada.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Decisiones registradas

El usuario las registró en el G1 del 2026-11-03:

1. **Listado:** `GET /circles` ordena por `updatedAt desc` con desempate `id desc`; cursor opaco keyset `(updatedAt, id)`; `limit` 1–100, defecto 24; cursor inválido → `400 VALIDATION_ERROR`.
2. **Portada:** `coverPhotoId` inexistente o de otro círculo → `404 NOT_FOUND`; `null` limpia la portada.
3. **Borrado:** borrar un círculo elimina solo filas de la base de datos (cascada); la limpieza de objetos de MinIO/S3 queda **diferida** y es una limitación conocida.

Decisiones técnicas adicionales:

4. `POST /circles` responde `201`.
5. `Origin` se valida antes de resolver la sesión, igual que en F15: una mutación sin sesión y sin `Origin` → `403`.

## Nota de cierre (2026-11-03)

Revisión independiente de nivel **A** en **una ronda**: veredicto **cambios requeridos** con **1 Mayor, 6 Menores y 5 Nits**, todos corregidos. No hubo segunda ronda porque no quedaba ningún bloqueante. El Mayor era una carrera entre la lectura de la membresía y `PATCH`/`DELETE` que devolvía `500` por `P2025`/`P2003`; ahora `PATCH` los mapea a `404`, `DELETE` usa `deleteMany` con `count === 0` → `404`, y hay cuatro tests nuevos (P2025, P2003, `count 0` y doble `DELETE` secuencial).

Verificación real: `28/28` tests de circles, `155/155` de la API en 10 archivos, `typecheck` y `lint` limpios, `format:check` limpio, contra PostgreSQL 17.11 en Docker (`memora_test`, migración `20261031224916_init`), sin tests saltados.

Limitaciones registradas:

- Objetos de storage huérfanos al borrar un círculo (decisión 3).
- `coverPhoto.thumbUrl` apunta a `/api/photos/{id}/image?size=thumb`; ese endpoint llega en **F29**, no en F17.
- Cursor opaco pero no firmado: solo posiciona, no concede acceso.
- Las stats se leen en una transacción de tres consultas, sin snapshot único bajo escrituras concurrentes.
- `settings` corruptos en base de datos → `500`, decisión deliberada de no servir settings inválidos.
- Los tests de carrera simulan la pérdida de fila con un `Proxy` del cliente Prisma sobre el camino HTTP real; no son transacciones concurrentes reales.
- `PATCH` y `DELETE` no distinguen «círculo borrado» de «portada borrada»: ambos responden `404`, de forma deliberada.
