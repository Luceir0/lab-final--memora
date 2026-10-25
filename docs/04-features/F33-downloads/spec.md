---
id: F33
title: "Descargas"
milestone: M4
size: L
status: draft
spec: complete
depends_on:
  - "F29"
  - "F30"
blocks:
  - "F38"
  - "F42"
design_refs:
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
  - "assets/design/screens/album-movil-subiendo.png"
contracts:
  - "docs/03-architecture/downloads.md"
decisions:
  - "ADR-0008"
---

# F33 — Descargas

> **Milestone:** M4 · **Talla:** L · **Estado:** draft · **Spec:** completa
> **Depende de:** F29, F30 · **Bloquea:** F38, F42

## Objetivo

Implementar descarga individual, de selección y de álbum con job ZIP.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-escritorio-seleccion-multiple.png](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)
- [assets/design/screens/album-movil-subiendo.png](../../../assets/design/screens/album-movil-subiendo.png)

### Contratos

- [docs/03-architecture/downloads.md](../../../docs/03-architecture/downloads.md)

### Decisiones

- ADR-0008

## Alcance

### Incluye

- GET download individual
- POST download job
- photoIds
- Polling
- Límites
- Expiración
- Limpieza
- Aviso móvil
- Tests

### No incluye

- Descarga en segundo plano
- Compartir ZIP público

## Entregables

- apps/api/src/modules/downloads/**
- apps/web/src/features/photos/downloads/**

## UX y estados

- generando
- listo
- error
- expirado
- aviso tamaño

## Criterios de aceptación

- **AC-01.** Autorización por foto/álbum; `original` y descargas requieren `membersCanDownload`.
- **AC-02.** Límites 500/2 GB.
- **AC-03.** Job expira 24 h.
- **AC-04.** Polling y descarga.
- **AC-05.** Selección solo del álbum.
- **AC-06.** Aviso en móvil.
- **AC-07.** No se expone objectKey.

## Pruebas

- API descarga
- Límites
- Expiración
- Acceso cruzado
- UI polling

## Archivos previstos

- `apps/api/src/modules/downloads/**`
- `apps/web/src/features/photos/downloads/**`

## Verificación

- `pnpm --filter @memora/api test downloads`
- `pnpm --filter @memora/web test downloads`

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

Worker en proceso; documentar reinicio.
