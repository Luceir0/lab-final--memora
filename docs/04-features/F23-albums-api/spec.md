---
id: F23
title: "Albums API"
milestone: M3
size: M
status: draft
spec: complete
depends_on:
  - "F17"
blocks:
  - "F24"
  - "F25"
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F23 — Albums API

> **Milestone:** M3 · **Talla:** M · **Estado:** draft · **Spec:** completa
> **Depende de:** F17 · **Bloquea:** F24, F25

## Objetivo

Implementar CRUD de álbumes con permisos y paginación.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- No aplica.

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

## Alcance

### Incluye

- Listar/crear/detalle/editar/borrar
- Pertenencia al círculo
- Portada
- Fecha
- Permisos por flag
- Tests

### No incluye

- Fotos y subidas (F25)
- UI (F24)

## Entregables

- apps/api/src/modules/albums/**

## UX y estados

- No aplica (feature de backend/documentación).

## Criterios de aceptación

- **AC-01.** Álbum pertenece a un círculo.
- **AC-02.** Solo miembros ven.
- **AC-03.** Crear requiere permiso.
- **AC-04.** Editar/borrar requiere owner o permiso.
- **AC-05.** Portada validada.
- **AC-06.** No se filtra información.

## Pruebas

- CRUD
- Permisos
- Acceso cruzado
- Portada inválida

## Archivos previstos

- `apps/api/src/modules/albums/**`

## Verificación

- `pnpm --filter @memora/api test albums`

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

El borrado de álbum se decide con fotos: no borrar fotos sin confirmación.
