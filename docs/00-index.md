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

F01–F09 están `done`. F05 se cerró el 2026-10-26 con el merge `8dfae5f` y CI en verde. F06 se cerró el 2026-10-31 con la PR #2, merge `b556168` en `main` y CI en verde (run `41246708428`, `completed/success`); `packages/shared` contiene contratos Zod, errores, paginación y permisos con 138 tests. F07 se cerró el 2026-11-01 con la PR #3, merge `bd2769c` en `main` y CI en verde (run `41254603622`, `completed/success`); el run ejecutó por primera vez PostgreSQL 17.11 y los tests de integración contra `memora_test`, sin skips. F08 se cerró el 2026-11-01 con la PR #4, merge `ed1f316` en `main` y CI en verde (run `41261491641`, `completed/success`). F09 está `done` desde el 2026-11-01: base web sobre TanStack Start y `packages/api-client` real, con implementación y revisión independiente cerradas, aceptación del usuario en Firefox real sobre las rutas de humo sin errores de hidratación, PR #5, merge `9fd987e` en `main` y CI en verde en la PR (run `41306238454`) y en `main` (run `41306484717`). AC-06 queda pendiente solo de automatización en F37/F38. **F10 está en `review`** desde el 2026-11-01: sistema visual y tema implementados y revisados (primera revisión no apto, segunda apto con correcciones, sin bloqueantes); 44 tests en `packages/ui` y 88 en `apps/web`. Faltan la aceptación del usuario en navegador real y el cierre operativo, así que no se anuncia PR ni CI. F11–F43 están en `draft`. Detalle en el [handoff de F10](04-features/F10-sistema-visual/handoff.md).
