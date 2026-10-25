---
id: F34
title: "Perfil y preferencias"
milestone: M4
size: S/M
status: draft
spec: complete
depends_on:
  - "F16"
blocks: []
design_refs:
  - "assets/design/screens/perfil-movil.png"
  - "assets/design/screens/perfil-escritorio-edicion-con-error.png"
contracts:
  - "docs/03-architecture/auth.md"
decisions:
  - "ADR-0005"
---

# F34 — Perfil y preferencias

> **Milestone:** M4 · **Talla:** S/M · **Estado:** draft · **Spec:** completa
> **Depende de:** F16 · **Bloquea:** —

## Objetivo

Construir perfil, edición, tema, instalación, almacenamiento demo y logout.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/perfil-movil.png](../../../assets/design/screens/perfil-movil.png)
- [assets/design/screens/perfil-escritorio-edicion-con-error.png](../../../assets/design/screens/perfil-escritorio-edicion-con-error.png)

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- ProfileCard
- Edición nombre/email/avatar
- ThemeToggle
- InstallAppRow
- StorageMeter demo
- Logout
- Estados

### No incluye

- Borrado de cuenta
- Planes reales

## Entregables

- apps/web/src/routes/_app/profile.tsx
- features/profile/**

## UX y estados

- edición
- guardando
- error
- éxito

## Criterios de aceptación

- **AC-01.** Editar valida y guarda.
- **AC-02.** Email duplicado con error claro.
- **AC-03.** Tema persiste.
- **AC-04.** Instalar explica iOS/Android.
- **AC-05.** Almacenamiento marcado demo.
- **AC-06.** Logout redirige.

## Pruebas

- RTL perfil
- Tema
- Error email
- Logout

## Archivos previstos

- `apps/web/src/routes/_app/profile.tsx`
- `apps/web/src/features/profile/**`

## Verificación

- `pnpm --filter @memora/web test profile`

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

No prometer plan de pago.
