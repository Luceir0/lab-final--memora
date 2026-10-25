---
name: Memora Testing
description: Estrategia y patrones de Vitest, RTL, MSW, Playwright y axe.
---

# Testing de Memora

## Niveles

- **Unitario:** funciones puras, Zod, permisos, reducer de subidas.
- **API:** `fastify.inject` + Postgres de test.
- **Componentes:** RTL + `user-event` + MSW.
- **Hooks:** `renderHook`.
- **E2E:** Playwright desktop y Pixel.
- **A11y:** axe + teclado.

## Reglas

- Consulta por rol y texto accesible.
- No testees implementación; testea comportamiento.
- MSW reutiliza contratos compartidos.
- Casos negativos obligatorios: 401, 403, acceso cruzado.
- E2E con seed determinista y datos aislados.
- Un test debe fallar antes de pasar.
- Reporta cobertura real.

## Referencias

- `docs/05-quality/strategy.md`
- `docs/05-quality/test-matrix.md`
- `docs/05-quality/a11y-checklist.md`
