# Tasks — F03 Scaffold agéntico

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F02.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] AGENTS.md
- [ ] opencode.jsonc
- [ ] CLAUDE.md
- [ ] 10 agentes
- [ ] 10 comandos
- [ ] 6 skills
- [ ] Plantillas de spec/tasks/handoff
- [ ] 43 specs
- [ ] Tablero de estado

## Criterios de aceptación

- [ ] AC-01: opencode.jsonc es JSONC válido.
- [ ] AC-02: Todos los agentes tienen descripción, modo y permisos.
- [ ] AC-03: Todos los comandos tienen plantilla y propósito.
- [ ] AC-04: Las skills tienen descripción y contenido accionable.
- [ ] AC-05: Cada feature tiene spec, tasks y handoff.
- [ ] AC-06: El tablero enlaza las 43 features.
- [ ] AC-07: Un subagente puede trabajar con AGENTS.md + spec + contratos.

## Verificación

- [ ] `node scripts/validate-agents.mjs (se creará en F04)`
- [ ] `find docs/04-features -name spec.md | wc -l`
- [ ] `rg -n "TODO" AGENTS.md .opencode docs/04-features`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
