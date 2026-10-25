# Workflow

## Ciclo de una feature

```text
draft → ready → in-progress → review → accepted → done
```

| Estado | Significado |
| --- | --- |
| `draft` | Spec en borrador; faltan decisiones |
| `ready` | DoR cumplida; puede empezar |
| `in-progress` | Alguien trabaja en ella |
| `review` | Implementación terminada; revisión independiente |
| `accepted` | Usuario la ha probado y aceptado |
| `done` | Documentación, estado y cobertura actualizados |

## Gates

### G0 — Decisión

- La feature no depende de una pregunta abierta.
- Si cambia arquitectura, hay ADR.

### G1 — Plan

- El agente propone plan, archivos, tests y riesgos.
- El usuario confirma.
- No se escribe código antes.

### G2 — Implementación

- Código + tests + estados + permisos.
- Verificación ejecutada.

### G3 — Revisión

- `reviewer` independiente revisa diff.
- Hallazgos por severidad.
- El implementador corrige.

### G4 — Aceptación

- El usuario prueba el flujo en móvil y escritorio.
- Acepta o pide cambios.

### G5 — Cierre

- `handoff.md` completo.
- Tablero actualizado.
- Bitácora y cobertura.
- Commit propuesto; no ejecutado sin permiso.

## Definition of Ready

- [ ] Dependencias `done`. Excepción: el usuario autoriza explícitamente y se registra en el tablero.
- [ ] Decisiones resueltas.
- [ ] Spec con AC numerados.
- [ ] Contratos congelados.
- [ ] Diseño enlazado (móvil/escritorio, claro/oscuro, estados).
- [ ] Datos de prueba.
- [ ] Sin preguntas bloqueantes.

Si falta algo, la feature vuelve a `draft`.

## Contexto

Cada agente carga:

1. `AGENTS.md`.
2. Su `spec.md`.
3. Documentos enlazados en `contracts`, `decisions`, `design_refs`.
4. Código relacionado.

No se pasa el README completo ni todas las specs.

## Ramas y commits

- Rama `feat/Fxx-nombre-corto`.
- Un commit por unidad lógica; uno final al cerrar.
- Conventional Commits en inglés.
- Sin `push` sin permiso.
- Sin mezclar features en una rama.

## Revisiones

- El implementador no se autoaprueba.
- El reviewer no edita.
- Toda corrección se vuelve a verificar.
- Los fallos se reportan tal cual.

## Paradas

- Decisión ausente.
- Contrato poco claro.
- Migración o dependencia nueva.
- Secreto o servicio externo.
- Test fallando sin causa.
- Cambio de alcance.

## Documentación viva

Al cerrar:

- `docs/04-features/README.md`
- `docs/04-features/Fxx/handoff.md`
- `docs/06-process/ai-log.md`
- `docs/07-curriculum/coverage-map.md`
- README si cambia la estructura.
