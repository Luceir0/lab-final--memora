---
id: F02
title: "ADRs y decisiones técnicas"
milestone: M0
size: M
status: done
spec: complete
depends_on:
  - "F01"
blocks:
  - "F03"
design_refs: []
contracts:
  - "docs/03-architecture/"
decisions:
  - "ADR-0001"
  - "ADR-0002"
  - "ADR-0003"
  - "ADR-0004"
  - "ADR-0005"
  - "ADR-0006"
  - "ADR-0007"
  - "ADR-0008"
  - "ADR-0009"
  - "ADR-0010"
  - "ADR-0011"
  - "ADR-0012"
  - "ADR-0013"
---

# F02 — ADRs y decisiones técnicas

> **Milestone:** M0 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F01 · **Bloquea:** F03

## Objetivo

Registrar las decisiones que condicionan la arquitectura para que ningún agente tenga que improvisarlas.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/](../../../docs/03-architecture/)

### Decisiones

- ADR-0001
- ADR-0002
- ADR-0003
- ADR-0004
- ADR-0005
- ADR-0006
- ADR-0007
- ADR-0008
- ADR-0009
- ADR-0010
- ADR-0011
- ADR-0012
- ADR-0013

## Alcance

### Incluye

- ADR de TanStack Start vs Next.js
- ADR de render modes
- ADR de Tailwind 4
- ADR de Prisma 7
- ADR de auth
- ADR de entrega de imágenes
- ADR de subidas
- ADR de descargas
- ADR de actividad
- ADR de Content Island
- ADR de accesibilidad
- ADR de privacidad y EXIF
- ADR de PWA y service worker

### No incluye

- Implementación
- Cambios de alcance

## Entregables

- docs/03-architecture/adr/README.md
- 13 ADRs aceptados

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Cada ADR tiene contexto, decisión, alternativas y consecuencias.
- **AC-02.** No hay contradicciones entre ADRs.
- **AC-03.** Cada ADR enlaza la feature afectada.
- **AC-04.** Las decisiones de versiones están fijadas.
- **AC-05.** La accesibilidad y la privacidad tienen ADR propio.

## Pruebas

- Revisión cruzada de ADRs
- Comprobar que cada feature referencia su ADR

## Archivos previstos

- `docs/03-architecture/adr/*.md`
- `docs/03-architecture/overview.md`

## Verificación

- `rg -n "Estado: aceptado" docs/03-architecture/adr`
- `Revisar enlaces internos`

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

Los ADRs se actualizan si cambia una decisión; no se reescribe la historia sin marcar el anterior como reemplazado.
