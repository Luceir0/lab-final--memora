---
id: F41
title: "Revisión de seguridad"
milestone: M5
size: M
status: draft
spec: complete
depends_on:
  - "F38"
blocks:
  - "F43"
design_refs: []
contracts:
  - "docs/05-quality/security-checklist.md"
decisions:
  - "ADR-0005"
  - "ADR-0006"
  - "ADR-0007"
---

# F41 — Revisión de seguridad

> **Milestone:** M5 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F38 · **Bloquea:** F43

## Objetivo

Revisar y probar seguridad de auth, autorización, subidas, descargas y logs.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/05-quality/security-checklist.md](../../../docs/05-quality/security-checklist.md)

### Decisiones

- ADR-0005
- ADR-0006
- ADR-0007

## Alcance

### Incluye

- Tests negativos
- CSRF
- Rate limit
- Headers
- Uploads maliciosos
- Acceso cruzado
- Secretos
- Logs
- Dependencias

### No incluye

- Pentest externo
- Infraestructura real

## Entregables

- docs/05-quality/security-report.md
- tests negativos
- correcciones

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Checklist completo.
- **AC-02.** Tests negativos pasan.
- **AC-03.** Sin secretos en repo.
- **AC-04.** Logs redactados.
- **AC-05.** Headers correctos.
- **AC-06.** Informe con riesgos.

## Pruebas

- API negativos
- Uploads
- CSRF
- Rate limit

## Archivos previstos

- `docs/05-quality/security-report.md`
- `tests negativos`

## Verificación

- `pnpm test`
- `pnpm audit`

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

No ocultar hallazgos.
