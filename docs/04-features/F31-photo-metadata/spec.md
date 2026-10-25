---
id: F31
title: "Metadatos y lugar"
milestone: M4
size: S/M
status: draft
spec: complete
depends_on:
  - "F30"
blocks: []
design_refs:
  - "assets/design/screens/foto-movil.png"
  - "assets/design/screens/foto-escritorio-modal.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F31 — Metadatos y lugar

> **Milestone:** M4 · **Talla:** S/M · **Estado:** draft · **Spec:** completa
> **Depende de:** F30 · **Bloquea:** —

## Objetivo

Permitir editar descripción, fecha y lugar, y mostrar el lugar geocodificado.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/foto-movil.png](../../../assets/design/screens/foto-movil.png)
- [assets/design/screens/foto-escritorio-modal.png](../../../assets/design/screens/foto-escritorio-modal.png)

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Alcance

### Incluye

- Formulario de metadatos
- PATCH photo
- Permisos
- placeName editable
- Fecha
- Estados

### No incluye

- GPS/mapa
- Búsqueda por lugar

## Entregables

- apps/web/src/features/photos/metadata/**
- api PATCH

## UX y estados

- edición
- guardando
- error
- éxito

## Criterios de aceptación

- **AC-01.** Solo autor/owner/permiso edita.
- **AC-02.** Validación compartida.
- **AC-03.** placeName se muestra y edita.
- **AC-04.** No se guardan coordenadas.
- **AC-05.** Cambios persisten.
- **AC-06.** Cancelar restaura.

## Pruebas

- RTL formulario
- API PATCH
- Permisos
- Validación

## Archivos previstos

- `apps/web/src/features/photos/metadata/**`
- `apps/api/src/modules/photos/update.ts`

## Verificación

- `pnpm --filter @memora/web test metadata`
- `pnpm --filter @memora/api test photos`

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

La geocodificación ya ocurrió en la subida; aquí solo se edita el texto.
