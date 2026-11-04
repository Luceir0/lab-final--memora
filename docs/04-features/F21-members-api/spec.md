---
id: F21
title: "Members API"
milestone: M2
size: M
status: done
spec: complete
depends_on:
  - "F17"
blocks:
  - "F22"
  - "F35"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F21 — Members API

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F17 · **Bloquea:** F22, F35

## Objetivo

Implementar listado de miembros, expulsión, salida y contadores de fotos etiquetadas.

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

### Decisiones cerradas en G1 (2026-11-04)

- **Contador por miembro:** `MemberDto` incorpora `photosCount`, el número de fotos **de ese círculo** en las que la persona está etiquetada. Corresponde a la columna «Aparece en» del diseño.
- **Sin email de miembros:** el listado no expone el email de nadie. Es una desviación consciente del mock de escritorio por minimización de datos; `UserDto` sigue sin email.
- **Fotos de esta persona:** se incluye `GET /circles/:circleId/members/:userId/photos` en F21 porque ninguna otra feature lo reclamaba y F22 lo necesita. Se añade AC-07.
- **Invitaciones pendientes:** no se implementa nada en F21. F19 ya entrega el listado owner-only; la tarea se marca como cubierta por F19.
- **Rol:** solo `owner` y `member`. El mock muestra dos «Administradores» y una acción «Hacer administradora»; no existe ese rol ni promoción en el MVP y no entra en F21. Se registra para F22.

## Alcance

### Incluye

- GET members
- DELETE member
- POST leave
- Contadores de fotos etiquetadas
- Fotos de esta persona
- Reglas de owner
- Tests

### No incluye

- UI
- Transferencia de propiedad
- Promoción a administrador (no existe ese rol)
- Email de los miembros
- Invitaciones pendientes (cubiertas por F19)

## Entregables

- apps/api/src/modules/members/**
- packages/shared/src/schemas/** (solo el contrato de miembros)

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Miembros solo del círculo.
- **AC-02.** Owner puede expulsar; member no.
- **AC-03.** Member puede salir; owner no sin borrar.
- **AC-04.** Fotos permanecen; tags del expulsado se eliminan.
- **AC-05.** Contadores correctos: `photosCount` cuenta solo fotos de ese círculo en las que la persona está etiquetada.
- **AC-06.** No se filtra información: sin email, sin datos de otros círculos y sin revelar existencia con `403` cuando corresponde un `404`.
- **AC-07.** Fotos de esta persona solo del círculo: lista paginada de fotos etiquetadas con ese miembro, sin fotos de otros círculos.

## Pruebas

- Listar
- Expulsar
- Salir
- Owner no sale
- Owner no se expulsa
- Tags eliminados y fotos conservadas
- Fotos de esta persona aisladas por círculo
- Permisos (401/403/404)
- Sin `email` en el payload

## Archivos previstos

- `apps/api/src/modules/members/**`
- `packages/shared/src/schemas/{circles,dto}.ts`

## Verificación

- `pnpm --filter @memora/api test members`

## Definition of Ready

- [x] Dependencias `done`: F17.
- [x] Decisiones resueltas: G1 del 2026-11-04.
- [x] Contratos congelados: `MemberDto` con `photosCount`; `personPhotos*` reutilizados; sin email.
- [x] Diseño enlazado (si aplica): el diseño de Personas guía el contador y la desviación del email.
- [x] Datos de prueba: factorías de `apps/api/src/test/factories.ts`.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. La autoría de las fotos se conserva aunque el miembro salga o sea expulsado; solo se borran sus etiquetas en ese círculo.
