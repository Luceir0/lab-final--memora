# Estrategia de pruebas

## Niveles

| Nivel | Herramienta | Qué cubre |
| --- | --- | --- |
| Unitario | Vitest | Funciones puras, Zod, permisos, reducer de subidas, formatos |
| API | Vitest + `fastify.inject` + Postgres real | Auth, permisos, acceso cruzado, uploads, downloads, activity |
| Componentes | Vitest + RTL + `user-event` | Formularios, galería, visor, tema, diálogos, estados |
| Hooks | Vitest + `renderHook` | `useUploadQueue`, `useMediaQuery`, `useTheme`, `useShare` |
| Integración frontend | MSW | Login, crear círculo, subida con fallo y reintento, 401/403/500 |
| E2E | Playwright | Flujo completo móvil/escritorio |
| Accesibilidad | axe + manual | WCAG 2.2 AA; AAA viable |
| Manual | Android | Subida desde cámara/galería, instalar, descargar, teclado |

## Cobertura

Objetivo, no gate global:

- `packages/shared`: 80 %.
- `apps/api`: 75 %.
- `apps/web`: 60 %.
- E2E de flujos críticos.

La cobertura no sustituye casos negativos ni revisión.

## Datos

- Postgres de test real.
- Migraciones antes de la suite.
- Seed determinista y factories.
- Bucket MinIO de test o fake.
- MSW con contratos compartidos.
- E2E con base de datos limpia y usuarios únicos.

## CI

GitHub Actions:

1. `pnpm install --frozen-lockfile`.
2. lint.
3. typecheck.
4. test unitarios/API/componentes.
5. build.
6. Playwright.
7. axe.
8. `pnpm docs:check` y `pnpm agents:check`.
9. cache de Turborepo.

Servicios: Postgres y MinIO.

## Reglas

- Un test debe fallar antes de pasar.
- No se testea implementación; se testea comportamiento.
- Consultas por rol/texto accesible.
- Casos negativos obligatorios: 401, 403, acceso cruzado, validación, límites.
- No se ocultan fallos; se reportan.
- No se cambia producción para que pase un test.

## Fuera del MVP

- Pruebas de carga.
- Chaos engineering.
- Tests en iOS real.
- Tests visuales automatizados (se pueden añadir si sobra tiempo).
