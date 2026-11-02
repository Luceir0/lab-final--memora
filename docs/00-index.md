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

F01–F12 están `done`. F05 se cerró el 2026-10-26 con el merge `8dfae5f` y CI en verde. F06 se cerró el 2026-10-31 con la PR #2, merge `b556168` en `main` y CI en verde (run `41246708428`, `completed/success`); `packages/shared` contiene contratos Zod, errores, paginación y permisos con 138 tests. F07 se cerró el 2026-11-01 con la PR #3, merge `bd2769c` en `main` y CI en verde (run `41254603622`, `completed/success`); el run ejecutó por primera vez PostgreSQL 17.11 y los tests de integración contra `memora_test`, sin skips. F08 se cerró el 2026-11-01 con la PR #4, merge `ed1f316` en `main` y CI en verde (run `41261491641`, `completed/success`). F09 está `done` desde el 2026-11-01: base web sobre TanStack Start y `packages/api-client` real, con implementación y revisión independiente cerradas, aceptación del usuario en Firefox real sobre las rutas de humo sin errores de hidratación, PR #5, merge `9fd987e` en `main` y CI en verde en la PR (run `41306238454`) y en `main` (run `41306484717`). AC-06 queda pendiente solo de automatización en F37/F38. **F10 está en `done`** desde el 2026-11-02: sistema visual y tema implementados y revisados (primera revisión no apto, segunda apto con correcciones, sin bloqueantes); 44 tests en `packages/ui` y 88 en `apps/web`; el usuario la aceptó en Firefox real sobre `/login`, `/circles` y `/help`, alternando claro/oscuro/sistema, en escritorio y móvil, sin cambios pedidos; AC-05, AC-06 y AC-07 quedan verificados por el usuario, sin prueba automatizada de navegador (F37/F38). Cierre operativo completado: rama `feat/F10-sistema-visual`, commits `517b6eb`, `3c79110` y `d4826df`, PR #7, CI en verde en la PR (run `41473542981`) y en `main` sobre el merge `f3b26a5` (run `41473996157`). **F11 está en `done`** desde el 2026-11-02: UI kit I con 18 componentes presentacionales en `@memora/ui`, 173 tests en el paquete (95 de componentes con RTL + axe y 78 de estilos) y 88 en `@memora/web`; revisión independiente en dos rondas (primera **no apto** por el hover del primario en oscuro a 4,06:1 y `routeTree.gen.ts` que cambiaba con el modo; segunda **apto con correcciones**, m-07 documental cerrado), auditoría de accesibilidad en navegador real (Chrome/CDP + axe 4.14) con 0 violaciones y 0 `incomplete` tras dos rondas de correcciones y auditoría de diseño en tres pasadas, cerrada en apto; aceptada por el usuario en navegador real el 2026-11-02 sin cambios pedidos. Cierre operativo: rama `feat/F11-ui-kit-i`, commits `0e815e2`, `a1648ce`, `bf22fd4` y `94620ee`, PR #11, CI en verde en la PR (run `41498545493`, head `94620ee`), merge `6d160ce` en `main` y CI en verde sobre el merge (run `41499457291`). F12 está en `done` desde el 2026-11-02: doce componentes de overlays, navegación y feedback, 270 tests en `packages/ui` (172 de componentes + 98 de estilos, 13 archivos), revisión independiente en dos rondas, 0 violaciones de axe en 32 pasadas de navegador real y auditoría de diseño en tres pasadas. El usuario la aceptó en `/ui` con un cambio ya aplicado: estilo único destructivo en rojo suave. Cierre operativo: rama `feat/F12-ui-kit-ii`, commits `d79286e`, `5e5871f` y `eedb652`, PR #13, CI en verde en la PR (run `41537887650`) y en `main` sobre el merge `62d98b9` (run `41538068474`). F13–F43 están en `draft`. Detalle en los handoffs de [F10](04-features/F10-sistema-visual/handoff.md) y [F11](04-features/F11-ui-kit-i/handoff.md).
