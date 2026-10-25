# Handoff — F03 Scaffold agéntico

- **Estado:** review
- **Rama:** `feat/f03-scaffold-agentico`
- **Fecha:** 2026-10-25
- **Implementado por:** orquestador + docs-scribe
- **Revisado por:** pendiente

## Resultado

Estructura completa para trabajar con agentes: constitución, configuración de OpenCode V2, 10 agentes, 10 comandos, 6 skills, plantillas y 43 specs con tasks y handoff.

## Cambios

- `AGENTS.md`, `opencode.jsonc`, `CLAUDE.md`.
- `.opencode/agents/*.md` (10).
- `.opencode/commands/*.md` (10).
- `.opencode/skills/*/SKILL.md` (6).
- `docs/04-features/_template/*`.
- `docs/04-features/F01-…/` … `F43-…/` con `spec.md`, `tasks.md`, `handoff.md`.
- `docs/04-features/README.md` con tablero.
- `docs/06-process/*`.

## Verificación

- `node` parse de `opencode.jsonc` → OK (`default_agent=orchestrator`, 3 instructions).
- `ls .opencode/agents | wc -l` → 10.
- `ls .opencode/commands | wc -l` → 10.
- `find .opencode/skills -name SKILL.md | wc -l` → 6.
- `find docs/04-features -name spec.md | wc -l` → 44 (43 + template).
- Validador de estructura → 43 features, ids únicos, secciones obligatorias presentes.
- Link checker → 0 enlaces locales rotos.

## Criterios de aceptación

| AC | Resultado |
| --- | --- |
| JSONC válido | Pasa |
| Agentes con descripción/modo/permisos | Pasa |
| Comandos con plantilla | Pasa |
| Skills accionables | Pasa |
| Cada feature con 3 archivos | Pasa |
| Tablero enlaza 43 | Pasa |
| Contexto suficiente para subagente | Pasa en revisión de plantilla |

## Riesgos y limitaciones

- Los permisos de agentes deben probarse en una sesión real de OpenCode.
- `subagent_depth` por defecto es 1; el orquestador es el único que delega.
- Las specs son detalladas pero algunas decisiones de implementación se resolverán en F04–F05.
- No se han creado scripts de validación permanentes; se harán en F04.

## Documentación actualizada

- [x] AGENTS.md
- [x] Configuración de agentes
- [x] Tablero
- [x] Specs
- [x] Bitácora general
- [ ] Cobertura del temario (se actualizará al implementar)

## Siguiente paso propuesto

Aceptar F03 y empezar F04 (monorepo, tooling, Docker y CI). No implementar producto todavía.
