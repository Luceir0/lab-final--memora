# Handoff — F02 ADRs y decisiones técnicas

- **Estado:** review
- **Rama:** `feat/f02-adrs`
- **Fecha:** 2026-10-25
- **Implementado por:** architect + docs-scribe
- **Revisado por:** pendiente

## Resultado

Once ADRs aceptados que fijan metaframework, render modes, Tailwind, Prisma, auth, imágenes, subidas, descargas, actividad, Content Island y accesibilidad.

## Cambios

- `docs/03-architecture/adr/README.md`
- `ADR-0001` … `ADR-0011`
- `docs/03-architecture/overview.md` con índice de ADRs.
- `docs/03-architecture/render-modes.md`, `data-model.md`, `api-contract.md`, `auth.md`, `uploads.md`, `downloads.md`, `activity.md`, `external-services.md`.

## Verificación

- `rg -n "Estado: aceptado" docs/03-architecture/adr` → 11 ADRs.
- Link checker → 0 enlaces locales rotos.
- Revisión cruzada manual: no hay contradicciones entre render modes, auth, imágenes y subidas.

## Criterios de aceptación

| AC | Resultado |
| --- | --- |
| Contexto/decisión/alternativas/consecuencias | Pasa |
| Sin contradicciones | Pasa en revisión manual |
| Enlaces a features | Pasa |
| Versiones fijadas | Pasa |
| ADR de accesibilidad y privacidad | Pasa |

## Riesgos y limitaciones

- Prisma 8 RC puede cambiar; se mantiene 7.10.1 hasta nuevo ADR.
- TanStack Start evoluciona rápido; el spike F05 validará la API concreta.
- La decisión de imágenes por cookie puede revisarse si el rendimiento es un problema.

## Documentación actualizada

- [x] ADRs
- [x] Arquitectura
- [ ] Bitácora (entrada general ya existe)
- [ ] Cobertura del temario

## Siguiente paso propuesto

Aceptar F02 y continuar con F03 o F04.
