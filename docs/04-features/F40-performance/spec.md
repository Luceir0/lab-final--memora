---
id: F40
title: "Rendimiento"
milestone: M5
size: S/M
status: draft
spec: complete
depends_on:
  - "F38"
blocks:
  - "F43"
design_refs: []
contracts:
  - "docs/05-quality/performance.md"
decisions: []
---

# F40 — Rendimiento

> **Milestone:** M5 · **Talla:** S/M · **Estado:** draft · **Spec:** completa
> **Depende de:** F38 · **Bloquea:** F43

## Objetivo

Medir y mejorar carga, imágenes, bundle y scroll.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/05-quality/performance.md](../../../docs/05-quality/performance.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- Lighthouse móvil
- Análisis de bundle
- srcset
- Lazy
- Skeletons
- Scroll infinito
- Code splitting

### No incluye

- Optimización prematura
- CDN

## Entregables

- docs/05-quality/performance-report.md
- mejoras

## UX y estados

- No aplica; feature de medición y optimización.

## Criterios de aceptación

- **AC-01.** Lighthouse móvil: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
- **AC-02.** LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms.
- **AC-03.** JS inicial ≤ 250 KB gzip; visor ≤ 400 KB gzip.
- **AC-04.** Thumb ≤ 80 KB; display ≤ 400 KB.
- **AC-05.** Sin saltos de layout y scroll fluido.
- **AC-06.** Informe con antes/después y presupuestos reales.

## Pruebas

- Lighthouse
- Medición manual

## Archivos previstos

- `docs/05-quality/performance-report.md`

## Verificación

- `pnpm build`
- `Lighthouse` (manual, documentado)

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

Documentar resultados reales.
