# Tasks — F18 Circles web

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F16, F17.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## API y contrato

- [x] `createCircleRequestSchema` acepta `settings` opcional.
- [x] `POST /circles` persiste los settings recibidos y aplica defaults.
- [x] Tests de contrato y de API de creación con settings.
- [x] `docs/03-architecture/api-contract.md` documenta el campo.

## Implementación

- [x] Guard de sesión en `_app` y `401` → limpiar caché y `/login?redirect=…`
- [x] Sidebar: lista de círculos, usuario de `/me` y subnav del círculo activo
- [x] Lista y destacado (N+1 con caché compartida)
- [x] Crear círculo en `/circles/new` con `ResponsiveDialog` y toast de éxito
- [x] Detalle con pestañas (Álbumes activo; Personas/Ajustes deshabilitadas)
- [x] Cabecera compacta al hacer scroll
- [x] Estados vacío/carga/error/guardando
- [x] Sin acceso (`404`)
- [x] Stats

## Corrección 2026-11-04

- [x] Alta sin portada: se retiran la etiqueta «Portada», `CircleCover`, el contenedor discontinuo y el texto «Se usará una imagen genérica hasta que añadas fotos.» (`POST /circles` no acepta `coverPhotoId`; la portada se edita en F28).
- [x] Campos de nombre y descripción en una sola columna en todos los tamaños; `ResponsiveDialog` sigue en `size="lg"`.
- [x] Corrección posterior del usuario: los permisos siguen en una columna con `max-w-md` centrada con `mx-auto` por debajo de `lg` y pasan a 2+2 con separador vertical `border-border` desde `lg`; el atajo `Esc` se alinea abajo a la izquierda del pie con `md:self-end`.
- [x] Test de layout en `create-circle-dialog.test.tsx`: una sola rejilla `lg:grid-cols-2`, cuatro `switch` y dos columnas directas con 2 cada una, la segunda con `lg:border-l`.
- [x] Imports y variables sin uso eliminados (`CircleCover`, `nameValue`) y espaciado ajustado.
- [x] Test de regresión en `create-circle-dialog.test.tsx`: el alta no muestra portada ni acción de foto.
- [x] Ajuste de espaciado posterior: `mt-2` → `mt-4` entre el párrafo de permisos y el bloque de switches (16 px, +8 px); sin más cambios de layout.
- [x] Revisión independiente (nivel B) y auditoría de diseño: **apto con correcciones, sin bloqueantes**; aplicados el borde del `fieldset` en contenedor (verificado correcto por la auditoría), `max-w-md` en permisos y el test endurecido (imagen, `/portada/i` y `grid-cols`).
- [ ] `[Menor]` M-03: la portada editable se delega a F28, pero su spec no la menciona; no tocar F28 sin permiso.
- [ ] `[Nit]` CTA por debajo del pliegue en 1440×800 por la columna única; pendiente de decisión de kit o aceptación.

## Criterios de aceptación

- [x] AC-01: Móvil una columna; escritorio rejilla en lista y detalle. Alta: campos en una columna en todos los tamaños; permisos en una columna hasta `lg` y 2+2 con separador desde `lg`. **Aceptado por el usuario el 2026-11-04** tras la revisión visual 375/1440.
- [x] AC-02: Estado vacío guía a crear.
- [x] AC-03: Crear valida y guarda (nombre, descripción, permisos).
- [x] AC-04: Detalle muestra miembros/stats (miembros = `stats.membersCount`).
- [x] AC-05: Cabecera compacta al hacer scroll.
- [x] AC-06: Sin acceso no filtra datos.
- [x] AC-07: Todo con teclado. **Aceptado por el usuario el 2026-11-04** tras la revisión manual de teclado.

## Verificación

Verificación completa del orquestador (2026-11-04), tras la aceptación:

- [x] `DATABASE_URL=…/memora_test pnpm test` → **8 tareas OK**: `@memora/shared` **143**, `@memora/ui` **270**, `@memora/api-client` **39**, `apps/web` **276** en 43 archivos (circles: **64** en 10 archivos) y API **158** en 10 archivos (circles: **31**).
- [x] `pnpm typecheck` → OK.
- [x] `pnpm lint` → OK.
- [x] `pnpm format:check` → OK.
- [x] `pnpm docs:check` → 191 archivos, **470** enlaces (463 en la verificación previa), 0 rotos.
- [x] `pnpm agents:check` → 43 specs, 43 filas.
- [x] `pnpm build` → OK; chunks propios de lista, alta y detalle y **5 rutas prerenderizadas**.
- [x] `pnpm --filter @memora/web test circles` → 10 archivos, 64 tests.
- [x] `DATABASE_URL=…/memora_test pnpm --filter @memora/api test circles` → 31 tests.
- [x] Revisar 375/1440 en claro y oscuro → **aceptado por el usuario el 2026-11-04**.

## Cierre

- [x] Revisión independiente (nivel B): aprobada en segunda pasada.
- [x] Aceptación del usuario (2026-11-04, «todo aprobado»).
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
- [ ] PR, merge y CI (pendientes; el estado pasa a `done` tras el merge).
