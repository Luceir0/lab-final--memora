---
id: F16
title: "Auth web"
milestone: M2
size: M
status: done
spec: complete
depends_on:
  - "F13"
  - "F15"
blocks:
  - "F18"
  - "F20"
  - "F34"
design_refs:
  - "assets/design/screens/acceso-movil.png"
  - "assets/design/screens/acceso-movil-errores.png"
  - "assets/design/screens/acceso-escritorio-enviando.png"
  - "assets/design/screens/registro-movil-teclado-abierto.png"
  - "assets/design/screens/registro-escritorio-errores.png"
contracts:
  - "docs/03-architecture/auth.md"
  - "docs/03-architecture/render-modes.md"
decisions:
  - "ADR-0002"
---

# F16 — Auth web

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F13, F15 · **Bloquea:** F18, F20, F34

## Objetivo

Implementar login y registro con validación compartida, estados y redirección.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/acceso-movil.png](../../../assets/design/screens/acceso-movil.png)
- [assets/design/screens/acceso-movil-errores.png](../../../assets/design/screens/acceso-movil-errores.png)
- [assets/design/screens/acceso-escritorio-enviando.png](../../../assets/design/screens/acceso-escritorio-enviando.png)
- [assets/design/screens/registro-movil-teclado-abierto.png](../../../assets/design/screens/registro-movil-teclado-abierto.png)
- [assets/design/screens/registro-escritorio-errores.png](../../../assets/design/screens/registro-escritorio-errores.png)

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)
- [docs/03-architecture/render-modes.md](../../../docs/03-architecture/render-modes.md)

### Decisiones

- ADR-0002

## Alcance

### Incluye

- LoginForm
- RegisterForm
- AuthLayout
- RHF + Zod
- Errores
- Autocomplete
- Redirect
- Rutas SSR

### No incluye

- Reset
- Verificación
- OAuth

## Entregables

- apps/web/src/routes/login.tsx
- register.tsx
- features/auth/**

## UX y estados

- validación
- error
- enviando
- teclado abierto
- éxito

## Criterios de aceptación

- **AC-01.** Formularios etiquetados y accesibles.
- **AC-02.** Validación cliente y servidor con el mismo schema.
- **AC-03.** Errores comprensibles y no filtran existencia.
- **AC-04.** Autocomplete correcto.
- **AC-05.** Teclado móvil no tapa botón/errores.
- **AC-06.** Tras login vuelve a redirect o /circles.
- **AC-07.** SSR funciona.

## Pruebas

- RTL login/registro
- MSW 401/409/500
- Teclado
- Redirect

## Archivos previstos

- `apps/web/src/routes/login.tsx`
- `apps/web/src/routes/register.tsx`
- `apps/web/src/features/auth/**`

## Verificación

- `pnpm --filter @memora/web test auth`
- `Revisar 390x844`

## Definition of Ready

- [x] Dependencias `done`: F13 y F15, sin necesidad de excepción.
- [x] Decisiones resueltas.
- [x] Contratos congelados.
- [x] Diseño enlazado (si aplica).
- [x] Datos de prueba.
- [x] Sin preguntas bloqueantes.

Cumplida al arrancar el 2026-11-03: F13 y F15 estaban `done`, los contratos de `auth` y de render modes estaban congelados, los cinco diseños estaban enlazados, había seed con `lucia@memora.test` / `memora-demo` y la cookie se gestiona solo desde el servidor (no se toca desde JS), que era la única duda abierta.

## Estado

`done` desde el 2026-11-03, aceptada por el usuario ese mismo día. Las tres rondas de revisión, los pendientes diferidos y la verificación real están en [handoff.md](handoff.md).

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

La cookie no se toca desde JS. **Resuelta:** la sesión la gestiona el servidor y el cliente no lee ni escribe `memora_session`.
