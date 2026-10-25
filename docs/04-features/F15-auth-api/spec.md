---
id: F15
title: "Auth API"
milestone: M2
size: M
status: draft
spec: complete
depends_on:
  - "F07"
  - "F08"
blocks:
  - "F16"
  - "F17"
design_refs: []
contracts:
  - "docs/03-architecture/auth.md"
  - "docs/03-architecture/api-contract.md"
decisions:
  - "ADR-0005"
---

# F15 — Auth API

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F07, F08 · **Bloquea:** F16, F17

## Objetivo

Implementar registro, login, logout, sesión y usuario actual.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)
- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- POST register/login/logout
- GET csrf/me
- PATCH me
- Sesiones en BD
- argon2id
- Cookie
- CSRF
- Rate limit
- Tests

### No incluye

- UI
- Verificación de email
- Reset de contraseña

## Entregables

- apps/api/src/modules/auth/**
- tests de API

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Registro crea usuario y sesión.
- **AC-02.** Login no revela si el email existe.
- **AC-03.** Logout invalida la sesión.
- **AC-04.** Cookie tiene flags correctos.
- **AC-05.** CSRF se valida en mutaciones.
- **AC-06.** Rate limit funciona.
- **AC-07.** Sesión expirada devuelve 401.

## Pruebas

- Registro/login/logout
- Email duplicado
- Cookie
- CSRF
- Rate limit
- Sesión expirada

## Archivos previstos

- `apps/api/src/modules/auth/**`
- `apps/api/src/test/auth.test.ts`

## Verificación

- `pnpm --filter @memora/api test auth`

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

Sin verificación de email ni reset en MVP.
