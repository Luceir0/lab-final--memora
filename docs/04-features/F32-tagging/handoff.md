# Handoff — F32 Etiquetado

- **Estado:** done (aceptada el 2026-11-08; cierre operativo en curso)
- **Rama:** `feat/F32-tagging` → PR contra `main`
- **Fecha:** 2026-11-08
- **Implementado por:** api-dev y ui-dev (subagentes)
- **Revisado por:** revisión B aplicada (M-01, n-01 y M-02/menores de UI); **aceptada por el usuario el 2026-11-08**

## Resultado

API y UI de etiquetado implementadas. La API persiste etiquetas con `POST`/`DELETE` idempotentes, autorización `photo.tag` y aislamiento por círculo. La revisión B corrigió la carrera membresía→INSERT: el alta bloquea la membresía con `FOR SHARE` dentro de su transacción y `removeCircleMember` borra primero la membresía y después las etiquetas, fijando el orden de locks `Membership → PhotoTag`. La revisión B de UI corrigió el rollback con éxito parcial (`allSettled`), el falso «sin resultados» durante la paginación, el recuento del botón, la fidelidad al diseño de escritorio, el nombre de círculo vacío y los espacios internos de búsqueda. La UI del visor añade permiso simétrico, buscador en cliente sobre los miembros cargados, diálogo responsive con lista accesible, estados y caché optimista con rollback.

## Cambios

### API (F32)

- `apps/api/src/modules/photos/tags.ts` (nuevo): `toPhotoTagDto`, `addPhotoTag` y `removePhotoTag`. El alta ejecuta en una transacción `SELECT ... FOR SHARE` sobre `Membership`, relee/inserta la etiqueta y, si pierde la carrera `P2002`, relee fuera de la transacción y responde `200`; si la relectura no encuentra la fila responde `409 CONFLICT`. `P2003`/`P2025` se mapean a `404`.
- `apps/api/src/modules/photos/routes.ts`: `POST /api/photos/:photoId/tags` y `DELETE /api/photos/:photoId/tags/:userId` con `trustedOrigin`, sesión, CSRF, `findPhotoUpdateTarget`, `can(..., 'photo.tag', ...)`, esquemas Zod congelados, Swagger y `private, no-store` en el POST.
- `apps/api/src/modules/photos/tags.test.ts` (nuevo): 15 tests de integración, incluidos dos de concurrencia con un segundo cliente Prisma y `Promise.race` de 300 ms.
- `apps/api/src/modules/members/service.ts`: `removeCircleMember` invierte el orden a `Membership → PhotoTag` (solo integridad de F32; contrato y valor devuelto intactos).
- `docs/03-architecture/api-contract.md`: semántica cerrada de etiquetas bajo «Fotos».

### UI

- `apps/web/src/features/photos/tags/permissions.ts` (+ test): `canTagPhoto`.
- `apps/web/src/features/photos/tags/member-search.ts` (+ test): normalización sin acentos/mayúsculas y espacios internos colapsados; filtro por nombre.
- `apps/web/src/features/photos/tags/queries.ts` (+ test): `tagKeys`, mutación de lote con CSRF y `Promise.allSettled` (espera a todo el lote antes del rollback), optimista, rollback e invalidaciones.
- `apps/web/src/features/photos/tags/errors.ts`: copia de errores de etiquetado.
- `apps/web/src/features/photos/tags/tag-people-dialog.tsx` (+ test): diálogo/hoja, búsqueda, recuento vivo, paginación sin «sin resultados» prematuro, miniatura y dos columnas en escritorio, «Volver a la foto», estados, guardado y axe.
- `apps/web/src/features/photos/tags/tag-list.tsx` (+ test): lista semántica de personas etiquetadas.
- `apps/web/src/features/photos/viewer/photo-details-panel.tsx` (+ test): props `canTag`/`circleName`, botón «Etiquetar personas», `TagList` y estado «Etiquetas guardadas.» anunciado en la región viva.
- `apps/web/src/features/photos/viewer/photo-viewer.tsx`: pasa `canTag` y `circleName` al panel.
- `apps/web/src/routes/_app.circles.$circleId.albums.$albumId.photos.$photoId.tsx`: calcula el permiso con `canTagPhoto` y pasa el nombre del círculo.

### Revisión B — UI

- **M-02 corregido:** `Promise.allSettled`; el lote espera a todas las peticiones y solo entonces lanza el primer error, de modo que `onError` restaura e invalida sin peticiones en vuelo. Test con un `POST` 201 y otro 403 en el mismo lote.
- **m-01 corregido:** «Nadie se llama…» solo aparece con la búsqueda completa; mientras se cargan páginas se anuncia «Cargando más miembros…». Al alcanzar el tope de 20 páginas con miembros pendientes se muestra la nota de límite y no el estado vacío.
- **m-02 corregido:** el botón usa `pendingCount` («Guardar etiquetas (n)»), no el total seleccionado.
- **m-03 corregido:** descripción completa, miniatura de la foto junto al buscador desde `md`, lista en dos columnas desde `md`, «Volver a la foto» en el pie de escritorio y test con `matchMedia` simulado.
- **n-02 corregido:** `circleName` vacío cae en «este círculo».
- **n-04 corregido:** espacios internos colapsados; «  lucas   vidal  » encuentra «Lucas Vidal».
- **m-07 corregido:** tests de permiso del panel, anuncio de «Etiquetas guardadas.» y paginación del diálogo.

## Verificación

### API (ejecutada en este worktree)

- `DATABASE_URL="postgresql://memora:memora@localhost:5432/memora_test?schema=public" pnpm --filter @memora/api test tags` → **1 archivo, 15 tests pasan** (ninguno omitido).
- `DATABASE_URL="postgresql://memora:memora@localhost:5432/memora_test?schema=public" pnpm --filter @memora/api test members` → **1 archivo, 18 tests pasan**.
- `DATABASE_URL="postgresql://memora:memora@localhost:5432/memora_test?schema=public" pnpm --filter @memora/api test` → **26 archivos pasan, 2 omitidos; 424 tests pasan, 2 omitidos** (los omitidos son suites sin base de datos, no las de tags).
- `pnpm --filter @memora/api typecheck` → sin errores.
- `pnpm --filter @memora/api lint` → sin errores ni avisos.
- `pnpm exec prettier --check` sobre `tags.ts`, `tags.test.ts`, `routes.ts` y `members/service.ts` → sin diferencias.
- Nota: `packages/shared/dist` no existía en el worktree; se generó con `pnpm --filter @memora/shared build` (sin cambiar fuentes ni dependencias).
- Nota operativa: las suites con `DATABASE_URL` comparten `memora_test` y hacen `TRUNCATE`; deben ejecutarse **en serie**, nunca en paralelo, o se pisan entre sí.

### UI (revisión B, ejecutada en este worktree)

- `pnpm --filter @memora/web test tags` → 5 archivos, **35 tests pasan**.
- `pnpm --filter @memora/web test viewer` → 3 archivos, **23 tests pasan**.
- `pnpm --filter @memora/web test gallery` → 1 archivo, **10 tests pasan**.
- `pnpm --filter @memora/web test members` → 3 archivos, **52 tests pasan**.
- `pnpm --filter @memora/web test --maxWorkers=2 --retry=1` → 110 archivos, **910 tests pasan**.
- `pnpm --filter @memora/web typecheck` → sin errores.
- `pnpm --filter @memora/web lint` → sin errores ni avisos.
- `pnpm exec prettier --check apps/web/src/features/photos/tags` → todos los archivos formateados.
- Nota: `packages/api-client/dist` y `packages/ui/dist` no existían en el worktree; se generaron con `pnpm --filter @memora/api-client build` y `pnpm --filter @memora/ui build` (sin cambiar fuentes ni dependencias).

### Batería final (orquestador, 2026-11-07, sobre el diff corregido)

- `DATABASE_URL=…memora_test pnpm --filter @memora/api test tags` → **15/15**.
- `DATABASE_URL=…memora_test pnpm --filter @memora/api test members` → **18/18**.
- `DATABASE_URL=…memora_test pnpm --filter @memora/api test` → **26 archivos, 424 tests pasan y 2 se omiten**.
- `pnpm --filter @memora/web test tags` → **35/35**.
- `pnpm --filter @memora/web test viewer` → **23/23**.
- `pnpm --filter @memora/web test gallery` → **10/10**.
- `pnpm --filter @memora/web test --maxWorkers=2 --retry=1` → **110 archivos, 910 tests pasan**.
- `pnpm typecheck` → **9/9**.
- `pnpm lint` → **6/6**.
- `pnpm build` → **5/5** con 5 rutas prerenderizadas.
- `pnpm format:check` → todos los archivos formateados.
- `pnpm docs:check` → 197 archivos, 646 enlaces, 0 rotos.
- `pnpm agents:check` → 44 specs y 44 filas, OK.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01 Solo miembros del círculo | Pasa | API: llamante y objetivo deben ser miembros actuales (`404` si no); owner por `Circle.ownerId`, member por `membersCanTag`. UI: lista desde `GET /circles/:id/members`. |
| AC-02 No duplicar | Pasa | API: `POST` idempotente `200/201`, único `(photoId, taggedUserId)` y carrera `P2002` resuelta; UI evita duplicados con `applyTagChanges`. |
| AC-03 Optimista con rollback | Pasa | Tests de añadir/quitar con respuesta diferida y restauración de snapshots. |
| AC-04 Filtro solo del círculo | No aplica cambio | Filtro por persona preexistente intacto; suite de galería en verde. |
| AC-05 Accesible como lista | Pasa | `<ul>/<li>`, checkboxes nativos y axe en lista, sin resultados y guardando. |
| AC-06 Quitar etiqueta | Pasa | API: `DELETE` idempotente `204`, permisos y expulsión limpian la etiqueta; UI: desmarcar + `DELETE` con rollback probado. |

## Pendiente

- Commit y PR: propuestos, **no ejecutados**. El merge espera autorización expresa.
- Revisión B: aprobada con M-01/M-02 corregidos. Quedan como menores/nits documentados: la rama `CONFLICT` de relectura nula tras `P2002` no tiene test propio; la comprobación visual real de contraste y layout no se mide en jsdom; el diálogo limita la búsqueda a 20 páginas (480 miembros).

## Ajuste de aceptación (2026-11-08)

- El usuario aceptó F32 («Está todo bien») tras probarla en el entorno local.
- Ajuste solicitado: el botón principal del diálogo muestra **«Guardar etiquetas»** sin el número entre paréntesis. Se mantienen el deshabilitado por cambios pendientes, el `loading`, «Guardando…» y el estado de escritorio «Guardando {n} etiquetas…».
- Verificación tras el ajuste: `pnpm --filter @memora/web test tags` → **35/35**; `pnpm --filter @memora/web test viewer` → **23/23**; typecheck y lint OK.

## Cierre operativo (2026-11-08)

- Commit `d7efe2d` — `feat: add photo tagging with optimistic updates (F32)`.
- [PR #59](https://github.com/Luceir0/lab-final--memora/pull/59) mergeada en `main` con merge commit `4b5e54b`.
- CI en verde en la PR y sobre el merge en `main` (check run `install · docs · agents · lint · typecheck · test · build`).
- `main` local y remoto sincronizados en `4b5e54b`.

## Riesgos y limitaciones

- El lock `FOR SHARE` de la membresía se mantiene mientras dura la transacción del alta (lectura + insert): en un pico de etiquetado sobre el mismo miembro puede haber contención, pero el orden de locks es consistente con la expulsión y no hay deadlock con `removeCircleMember`.
- `DELETE` no comprueba la membresía del objetivo por diseño idempotente; solo exige `photo.tag` al llamante y membresía vigente en el círculo de la foto.
- El diálogo carga hasta 20 páginas (480 miembros); si se alcanza el tope con más páginas pendientes, muestra una nota y la búsqueda en cliente no verá el resto.
- El recuento «Aparece en» es optimista; si otra persona etiqueta a la vez, la invalidación reconcilia al terminar.
- La comprobación visual real de contraste y layout queda para la aceptación; los tests cubren jsdom y tokens.

## Documentación actualizada

- [x] `docs/04-features/F32-tagging/handoff.md`
- [x] `docs/04-features/README.md` (fila F32 en `review`)
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/06-process/remaining-plan.md` (S2 implementada, pendiente de aceptación)
- [ ] README raíz: no aplica, no cambia la estructura

## Siguiente paso propuesto

Cierre operativo: commit `feat: add photo tagging with optimistic updates (F32)`, push de `feat/F32-tagging`, PR contra `main` y merge tras CI. No se inicia ninguna otra sesión.
