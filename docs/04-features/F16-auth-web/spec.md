---
id: F16
title: "Auth web"
milestone: M2
size: M
status: draft
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

> **Milestone:** M2 · **Talla:** M · **Estado:** draft · **Spec:** completa
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

- [ ] Dependencias `done`. Excepción autorizada por el usuario y registrada en el tablero.
- [ ] Decisiones resueltas.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (si aplica).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

La cookie no se toca desde JS.
