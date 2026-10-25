# Handoff — F02 ADRs y decisiones técnicas

- **Estado:** done
- **Rama:** `feat/f02-adrs`
- **Fecha:** 2026-10-25
- **Implementado por:** architect + docs-scribe
- **Revisado por:** pendiente

## Resultado

Trece ADRs aceptados que fijan metaframework, render modes, Tailwind, Prisma, auth, imágenes, subidas, descargas, actividad, Content Island, accesibilidad, privacidad/EXIF y PWA.

## Cambios

- `docs/03-architecture/adr/README.md`
- `ADR-0001` … `ADR-0013`
- `docs/03-architecture/overview.md` con índice de ADRs.
- `docs/03-architecture/render-modes.md`, `data-model.md`, `api-contract.md`, `auth.md`, `uploads.md`, `downloads.md`, `activity.md`, `external-services.md`.

## Verificación

- `rg -n "Estado: aceptado" docs/03-architecture/adr` → 13 ADRs.
- Link checker → 0 enlaces locales rotos.
- Revisión cruzada manual: no hay contradicciones entre render modes, auth, imágenes, privacidad y subidas.

## Criterios de aceptación

| AC | Resultado |
| --- | --- |
| AC-01 Contexto/decisión/alternativas/consecuencias | Pasa |
| AC-02 Sin contradicciones | Pasa en revisión manual |
| AC-03 Enlaces a features | Pasa |
| AC-04 Versiones fijadas | Pasa |
| AC-05 ADR de accesibilidad y privacidad | Pasa: ADR-0011 y ADR-0012 |

## Riesgos y limitaciones

- Prisma 8 RC puede cambiar; se mantiene 7.10.1 hasta nuevo ADR.
- TanStack Start evoluciona rápido; el spike F05 validará la API concreta.
- La decisión de imágenes por cookie puede revisarse si el rendimiento es un problema.
- ADR-0013 deja el service worker fuera del MVP; si Chrome lo exige para instalar, se añadirá uno mínimo de paso.

## Documentación actualizada

- [x] ADRs
- [x] Arquitectura
- [ ] Bitácora (entrada general ya existe)
- [ ] Cobertura del temario

## Siguiente paso propuesto

F02 aceptada. F04 está ready; empezar cuando el usuario lo pida.
