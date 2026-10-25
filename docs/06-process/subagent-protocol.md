# Protocolo de subagentes

## Principio

Un subagente recibe **una feature**, contexto suficiente y límites claros. No depende de la conversación del orquestador.

## Entrada mínima

```md
Feature: F25 — Upload pipeline API
Spec: docs/04-features/F25-upload-pipeline-api/spec.md
Rol: api-dev
Objetivo: implementar el pipeline y sus tests
Permitido: apps/api/**, packages/shared/**
Prohibido: apps/web/**, packages/ui/**
Verificación: comandos de la spec
```

Además, el subagente lee `AGENTS.md` y los documentos enlazados.

## Protocolo

1. Leer spec, dependencias y ADRs.
2. Comprobar DoR.
3. Devolver plan breve: pasos, archivos, tests, riesgos.
4. **Esperar confirmación.**
5. Implementar en pasos pequeños.
6. Ejecutar verificación real.
7. Entregar handoff.
8. Parar.

## Handoff

```md
## Resultado
Resumen en 2–4 líneas.

## Cambios
- archivo: qué y por qué

## Verificación
- comando → resultado real

## Criterios de aceptación
- AC-01: pasa / falla / no aplica

## Riesgos y limitaciones
- ...

## Documentación actualizada
- ...

## Siguiente paso propuesto
- ...
```

## Reglas

- No lanzar otros subagentes.
- No editar fuera del ámbito.
- No cambiar contratos.
- No instalar dependencias sin permiso.
- No hacer migraciones sin permiso.
- No hacer commits ni `push`.
- No aprobar su propio trabajo.
- No afirmar que un test pasa sin ejecutarlo.
- Si falta algo, parar y preguntar.

## Contexto

- No cargar el README completo.
- No cargar todas las specs.
- No copiar documentos; enlazarlos.
- Si la spec supera 300 líneas, dividirla.

## Fallos

Si el subagente se bloquea:

- describe el bloqueo;
- indica qué decisión falta;
- propone 2 alternativas con consecuencias;
- no implementa a ciegas.
