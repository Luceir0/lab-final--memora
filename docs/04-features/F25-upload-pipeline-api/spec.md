---
id: F25
title: "Upload pipeline API"
milestone: M3
size: L
status: draft
spec: complete
depends_on:
  - "F07"
  - "F08"
  - "F23"
blocks:
  - "F26"
  - "F35"
design_refs: []
contracts:
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0007"
---

# F25 — Upload pipeline API

> **Milestone:** M3 · **Talla:** L · **Estado:** draft · **Spec:** completa
> **Depende de:** F07, F08, F23 · **Bloquea:** F26, F35

## Objetivo

Implementar el pipeline completo de subida y procesamiento de imágenes.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- ADR-0007

## Alcance

### Incluye

- Multipart
- Magic bytes
- Límites y cuota
- S3 adapter
- sharp orientación/variantes
- EXIF fecha/GPS transitorio
- Nominatim
- Idempotencia
- Activity
- Tests

### No incluye

- UI de cola (F26)
- HEIC si el spike falla

## Entregables

- apps/api/src/modules/photos/**
- services/storage
- services/geocoding
- tests

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** JPEG/PNG/WebP aceptados; SVG/GIF rechazados.
- **AC-02.** 25 MB y 2 GB respetados.
- **AC-03.** Variantes correctas.
- **AC-04.** Orientación aplicada.
- **AC-05.** Sin GPS persistido.
- **AC-06.** placeName si geocodifica.
- **AC-07.** Idempotencia.
- **AC-08.** Fallo no publica foto.

## Pruebas

- Formatos
- Tamaño
- Cuota
- Píxeles
- Variantes
- EXIF
- Idempotencia
- Fallo S3

## Archivos previstos

- `apps/api/src/modules/photos/**`
- `apps/api/src/services/storage/**`
- `apps/api/src/services/geocoding/**`

## Verificación

- `pnpm --filter @memora/api test photos`
- `Subir fixture real`

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

Si HEIC no es fiable, rechazo 415 claro. Documentar.
