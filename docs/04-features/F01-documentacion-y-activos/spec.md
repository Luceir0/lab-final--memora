---
id: F01
title: "Documentación, activos y alcance v2"
milestone: M0
size: M
status: review
spec: complete
depends_on: []
blocks:
  - "F02"
design_refs:
  - "assets/design/indice-de-pantallas.png"
contracts:
  - "docs/01-product/scope.md"
  - "docs/02-design/screens.md"
decisions: []
---

# F01 — Documentación, activos y alcance v2

> **Milestone:** M0 · **Talla:** M · **Estado:** review · **Spec:** completa
> **Depende de:** — · **Bloquea:** F02

## Objetivo

Cerrar la verdad documental del proyecto: README v2, activos de diseño normalizados, alcance, glosario y archivo de la especificación original.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/indice-de-pantallas.png](../../../assets/design/indice-de-pantallas.png)

### Contratos

- [docs/01-product/scope.md](../../../docs/01-product/scope.md)
- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

- No aplica.

## Alcance

### Incluye

- README v2 como índice
- Archivar la especificación v1
- Normalizar los dos sets de diseño a ASCII kebab-case
- Conservar la segunda iteración como canónica y la primera como histórico
- Crear manifest de nombres originales
- Crear índice de pantallas
- Definir alcance, glosario y decisiones cerradas
- Dejar preparado el espacio de fotos demo

### No incluye

- Código de aplicación
- Dependencias
- ADRs (F02)
- Configuración de agentes (F03)

## Entregables

- README.md navegable
- docs/01-product/*
- docs/02-design/screens.md
- assets/design/screens/*
- assets/archive/design-v1/*
- assets/design/manifest.json

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Todos los enlaces del README resuelven a archivos existentes.
- **AC-02.** La segunda iteración está en assets/design/screens con 54 vistas.
- **AC-03.** La primera iteración está archivada y no se usa como fuente canónica.
- **AC-04.** No quedan rutas antiguas de imágenes (assets/design/<archivo>.png); las nuevas viven en assets/design/screens/.
- **AC-05.** El alcance distingue MVP, extras y fuera de MVP.
- **AC-06.** El glosario cubre los términos usados por las specs.
- **AC-07.** No se ha creado código de aplicación.

## Pruebas

- Comprobar enlaces con un script de documentación
- Revisar inventario de 54 pantallas
- Revisar que no hay rutas rotas

## Archivos previstos

- `README.md`
- `docs/00-index.md`
- `docs/01-product/vision.md`
- `docs/01-product/scope.md`
- `docs/01-product/personas.md`
- `docs/01-product/glossary.md`
- `docs/01-product/open-questions.md`
- `docs/02-design/screens.md`
- `assets/design/manifest.json`

## Verificación

- `node scripts/check-docs.mjs (se creará en F04)`
- `rg -n "assets/design/(m|d)[0-9]" README.md docs`
- `ls assets/design/screens | wc -l`

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

La especificación original se conserva en docs/archive/spec-v1.md. No se borra historia.
