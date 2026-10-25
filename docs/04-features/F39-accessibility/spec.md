---
id: F39
title: "Auditoría de accesibilidad"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F38"
blocks:
  - "F43"
design_refs:
  - "assets/design/screens"
contracts:
  - "docs/02-design/accessibility.md"
  - "docs/05-quality/a11y-checklist.md"
decisions:
  - "ADR-0011"
---

# F39 — Auditoría de accesibilidad

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F38 · **Bloquea:** F43

## Objetivo

Auditar y corregir accesibilidad AA y AAA viable en las pantallas principales.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens](../../../assets/design/screens)

### Contratos

- [docs/02-design/accessibility.md](../../../docs/02-design/accessibility.md)
- [docs/05-quality/a11y-checklist.md](../../../docs/05-quality/a11y-checklist.md)

### Decisiones

- ADR-0011

## Alcance

### Incluye

- axe
- Teclado
- Foco
- Contraste
- Formularios
- Diálogos/hojas
- Gestos
- Zoom
- Reduced motion
- Informe

### No incluye

- Certificación externa
- iOS real

## Entregables

- docs/05-quality/a11y-report.md
- correcciones
- tests axe

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** axe sin errores críticos.
- **AC-02.** Todo operable con teclado.
- **AC-03.** Foco gestionado.
- **AC-04.** Contraste AA; AAA documentado.
- **AC-05.** Zoom 200/400.
- **AC-06.** Informe con excepciones.

## Pruebas

- axe
- Teclado manual
- NVDA/TalkBack

## Archivos previstos

- `docs/05-quality/a11y-report.md`
- `tests axe`

## Verificación

- `pnpm test:a11y`
- `Auditoría manual`

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

No declarar AAA completo si hay excepciones.
