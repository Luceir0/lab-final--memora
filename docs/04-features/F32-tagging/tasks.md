# Tasks — F32 Etiquetado

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F22, F30 (`done`).
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (G1 aprobado el 2026-11-07).

## Implementación

- [x] POST/DELETE tags (`apps/api/src/modules/photos/tags.ts` y rutas en `routes.ts`).
- [x] TagPeopleSheet/Dialog (`apps/web/src/features/photos/tags/tag-people-dialog.tsx`).
- [x] Buscador (`member-search.ts`, filtro en cliente con carga de páginas).
- [x] Solo miembros (`404` para objetivos fuera del círculo; lista desde `GET /circles/:id/members`).
- [x] Optimistic update con rollback (`queries.ts` + tests de éxito parcial).
- [x] Filtro por persona en el visor y la galería (sin cambios; regresión en verde).
- [x] Estados (carga, vacío, sin resultados, guardando, error y éxito).
- [x] Cierre de la deuda m-06: lock `Membership → PhotoTag` en alta y expulsión, con tests de concurrencia.

## Criterios de aceptación

- [x] AC-01: Solo miembros del círculo.
- [x] AC-02: No duplicar (`POST` idempotente `200/201`).
- [x] AC-03: Optimista con rollback.
- [x] AC-04: Filtro solo del círculo.
- [x] AC-05: Accesible como lista.
- [x] AC-06: Quitar etiqueta (`DELETE` idempotente y desmarcado en el diálogo).

## Verificación

- [x] `DATABASE_URL=…memora_test pnpm --filter @memora/api test tags` → 15/15.
- [x] `pnpm --filter @memora/web test tags` → 35/35.
- [x] `pnpm --filter @memora/web test viewer` → 23/23.
- [x] `pnpm --filter @memora/web test gallery` → 10/10.
- [x] `pnpm --filter @memora/web test members` → 52/52.
- [x] API completa → 424 passed, 2 skipped.
- [x] Web completa con `--maxWorkers=2 --retry=1` → 910/910.
- [x] `pnpm typecheck` → 9/9.
- [x] `pnpm lint` → 6/6.
- [x] `pnpm build` → 5/5 con 5 rutas prerenderizadas.
- [x] `pnpm format:check`, `pnpm docs:check` y `pnpm agents:check` → OK.

## Cierre

- [x] Revisión independiente de nivel B (API y UI), con M-01/M-02 y menores corregidos.
- [x] Aceptación del usuario el 2026-11-08 («Está todo bien») con el ajuste del botón «Guardar etiquetas» sin contador.
- [x] `handoff.md` completo.
- [x] Tablero actualizado a `done`.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit, push, PR y cierre operativo autorizados por el usuario («todo aprobado, sube estos cambios»).
