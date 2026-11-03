---
id: F15
title: "Auth API"
milestone: M2
size: M
status: done
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

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
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

- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test auth`
- Sin `DATABASE_URL` la suite de integración se salta por diseño y no demuestra los AC.

## Definition of Ready

- [x] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [x] Decisiones resueltas (ver «Decisiones cerradas»).
- [x] Contratos congelados.
- [x] Diseño enlazado (si aplica). No aplica: backend.
- [x] Datos de prueba: factories de F07 y factoría de `Session` añadida en F15.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Sin verificación de email ni reset en MVP.

## Decisiones cerradas

El usuario las autorizó el 2026-11-03 en el G1:

1. **Dependencia:** se autoriza instalar `@node-rs/argon2` en `apps/api`, con versión exacta fijada. Es la librería de `auth.md`; no hay alternativa sin cambiar una decisión de arquitectura.
2. **Email duplicado en registro:** `409 CONFLICT` con `details: [{ field: 'email', message: 'Ya existe una cuenta con ese email.' }]`. El registro revela existencia de forma inevitable; AC-02 solo exige que **login** no la revele.
3. **Login fallido:** código `UNAUTHENTICATED` (canónico) con mensaje específico «Email o contraseña incorrectos.», añadido como constante en `packages/shared`. No cambia códigos ni formas de respuesta.
4. **Limpieza de sesiones:** en F15, toda lectura comprueba expiración y borra la sesión caducada (limpieza perezosa). La purga programada queda para F42 y debe anotarse en `Pendiente`.
5. **PostgreSQL para tests:** los tests de auth son de integración contra `memora_test`; sin base de datos no se demuestran AC-01, AC-03 ni AC-07.

Decisiones técnicas tomadas durante la implementación (2026-11-03), documentadas en `auth.md`:

6. **CSRF:** token HMAC atado al token de sesión y cookie legible `memora_csrf`; la cookie no es la fuente de verdad. `GET /auth/csrf` exige sesión.
7. **Cookie de sesión:** `memora_session`, `HttpOnly`, `SameSite=Lax`, `Path=/`, 30 días, `Secure` solo en producción; `Domain` solo con `COOKIE_DOMAIN`.
8. **`APP_URL`:** origen de confianza obligatorio y `https` en producción.
9. **Rate limit derivado:** login añade 20/min por IP además de 5/min por IP+email.
10. **Fallback argon2 en Windows:** `@node-rs/argon2-wasm32-wasi` como devDependency; el binario nativo sigue siendo el preferido en Linux/CI.
