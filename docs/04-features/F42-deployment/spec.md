---
id: F42
title: "Despliegue y observabilidad"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F33"
  - "F36"
blocks:
  - "F43"
design_refs: []
contracts:
  - "docs/08-delivery/deployment.md"
decisions: []
---

# F42 — Despliegue y observabilidad

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F33, F36 · **Bloquea:** F43

## Objetivo

Preparar una demo local reproducible y una guía de despliegue opcional.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/08-delivery/deployment.md](../../../docs/08-delivery/deployment.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Docker Compose prod-like
- Healthchecks
- Migraciones
- Logs
- Variables
- Seed demo
- Guía VPS/Render
- Checklist

### No incluye

- URL pública obligatoria
- Backups

## Entregables

- docker-compose.prod.yml
- docs/08-delivery/deployment.md
- healthchecks

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Demo local arranca desde cero.
- **AC-02.** Migraciones y seed funcionan.
- **AC-03.** Healthchecks.
- **AC-04.** Logs sin PII.
- **AC-05.** Guía de despliegue.
- **AC-06.** Checklist completo.

## Pruebas

- Arranque limpio
- Migración
- Healthcheck

## Archivos previstos

- `docker-compose.prod.yml`
- `docs/08-delivery/deployment.md`

## Verificación

- `docker compose up`
- `curl /api/health`

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

No se exige URL pública.
