# Índice de documentación

Memora se documenta en capas pequeñas para que un agente pueda cargar solo lo necesario.

## Orden de lectura

1. [AGENTS.md](../AGENTS.md) — reglas de trabajo.
2. [Producto](01-product/vision.md) — qué es y para quién.
3. [Alcance](01-product/scope.md) — qué entra y qué no.
4. [Diseño](02-design/principles.md) — sistema visual y pantallas.
5. [Arquitectura](03-architecture/overview.md) — cómo se construye.
6. [Features](04-features/README.md) — tablero y specs.
7. [Calidad](05-quality/definition-of-done.md) — cuándo está terminado.
8. [Proceso](06-process/workflow.md) — cómo se trabaja.
9. [Temario](07-curriculum/coverage-map.md) — evidencias.
10. [Entrega](08-delivery/defense.md) — demo y defensa.

## Mapa

| Carpeta | Contenido |
| --- | --- |
| `01-product` | visión, alcance, personas, glosario, decisiones |
| `02-design` | principios, tokens, componentes, pantallas, responsive, a11y |
| `03-architecture` | overview, monorepo, render, datos, API, auth, uploads, downloads, activity, servicios, ADRs |
| `04-features` | 43 features con spec, tasks y handoff |
| `05-quality` | estrategia, matriz de tests, checklists, rendimiento, DoD, auditorías |
| `06-process` | workflow, subagentes, revisión, git, bitácora |
| `07-curriculum` | cobertura del temario |
| `08-delivery` | despliegue, demo, defensa, checklist |
| `archive` | especificación v1 y material histórico |

## Convenciones

- Una feature = una carpeta `Fxx-slug`.
- Los estados son `draft`, `ready`, `in-progress`, `review`, `accepted`, `done`.
- Los criterios de aceptación se numeran `AC-01`, `AC-02`…
- Las decisiones se registran en ADRs.
- Las evidencias se enlazan; no se describen de memoria.
- `rg` para buscar; nunca `grep`.

## Estado

F01–F05 están `done`. F05 se cerró el 2026-10-26 con el merge `8dfae5f` y CI en verde; F06 es el siguiente paso y está en `draft`, sin abrir. F07–F43 también están en `draft`.
