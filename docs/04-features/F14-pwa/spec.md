---
id: F14
title: "PWA e instalación"
milestone: M1
size: S/M
status: draft
spec: complete
depends_on:
  - "F10"
  - "F13"
blocks: []
design_refs:
  - "assets/design/screens/perfil-movil.png"
contracts:
  - "docs/01-product/scope.md"
decisions: []
---

# F14 — PWA e instalación

> **Milestone:** M1 · **Talla:** S/M · **Estado:** draft · **Spec:** completa
> **Depende de:** F10, F13 · **Bloquea:** —

## Objetivo

Hacer la app instalable en Android con manifest, iconos y experiencia de instalación.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/perfil-movil.png](../../../assets/design/screens/perfil-movil.png)

### Contratos

- [docs/01-product/scope.md](../../../docs/01-product/scope.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- manifest.webmanifest
- Iconos 192/512/maskable
- apple-touch-icon
- theme-color
- display standalone
- InstallAppRow
- Detección de beforeinstallprompt
- Decisión sobre service worker

### No incluye

- Offline
- Push
- Subidas en segundo plano

## Entregables

- apps/web/public/manifest.webmanifest
- Iconos 192/512/maskable
- InstallAppRow
- Documentación de instalación

## UX y estados

- instalable
- instalada
- instrucciones iOS
- no soportado

## Criterios de aceptación

- **AC-01.** Manifest válido.
- **AC-02.** Iconos existen y son correctos.
- **AC-03.** Android ofrece instalar.
- **AC-04.** La app instalada abre en /circles.
- **AC-05.** Perfil explica cómo instalar.
- **AC-06.** No se promete offline.

## Pruebas

- Lighthouse PWA
- Instalación manual Android
- Manifest

## Archivos previstos

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/icons/**`
- `apps/web/src/features/profile/InstallAppRow.tsx`

## Verificación

- `Lighthouse`
- `Chrome DevTools > Application > Manifest`

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

Verificar si Chrome exige SW. Si es así, añadir uno mínimo sin caché.
