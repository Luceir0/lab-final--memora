---
id: F43
title: "Paquete de entrega y defensa"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F39"
  - "F40"
  - "F41"
  - "F42"
blocks: []
design_refs:
  - "assets/design/screens"
contracts:
  - "docs/08-delivery/defense.md"
  - "docs/08-delivery/checklist.md"
decisions: []
---

# F43 — Paquete de entrega y defensa

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F39, F40, F41, F42 · **Bloquea:** —

## Objetivo

Cerrar la entrega: datos demo, documentación, evidencias, diapositivas, vídeo y ensayo.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens](../../../assets/design/screens)

### Contratos

- [docs/08-delivery/defense.md](../../../docs/08-delivery/defense.md)
- [docs/08-delivery/checklist.md](../../../docs/08-delivery/checklist.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Seed demo
- README final
- ADRs
- OpenAPI
- Bitácora
- Cobertura
- Informes
- Diapositivas
- Vídeo
- Ensayo

### No incluye

- Nuevas features

## Entregables

- docs/08-delivery/**
- assets/demo/**
- presentación
- vídeo

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Checklist de entrega completo.
- **AC-02.** Demo con dos usuarios.
- **AC-03.** Vídeo de respaldo.
- **AC-04.** Diapositivas.
- **AC-05.** Mapa del temario con evidencias.
- **AC-06.** Limitaciones explícitas.
- **AC-07.** Ensayo cronometrado.

## Pruebas

- Ensayo de demo
- Revisión de enlaces
- Checklist

## Archivos previstos

- `docs/08-delivery/**`
- `assets/demo/**`

## Verificación

- `Revisar checklist`
- `Ensayo 15–20 min`

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

La defensa es presencial, 15–20 minutos.
