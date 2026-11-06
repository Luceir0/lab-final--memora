# Tasks — F28 Ajustes del círculo

> **Estado:** `review` · **Implementación:** completa · **Correcciones:** pendientes
> Detalle de revisión y auditorías: [review.md](review.md).

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F18 `done`.
- [x] Comprobar Definition of Ready.
- [x] Decisiones de G1 registradas en `spec.md` (2026-11-06).
- [x] Proponer plan y esperar confirmación.

## Implementación

### Ruta y chrome

- [x] Ruta `_app.circles.$circleId.settings.tsx` (SPA).
- [x] `paths.ts`: helper de la ruta de ajustes.
- [x] `circle-section-nav.tsx`: Ajustes como enlace real y `activeValue="settings"`.
- [x] `circle-sidebar-nav.tsx`: Ajustes en el subnav del círculo.
- [x] `circle-detail-layout.tsx`: sin héroe en `/settings`, miga «Ajustes», H1 «Ajustes de X», foco en el título.

### Owner

- [x] `CircleForm`: nombre, descripción (200 en UI) y portada de solo lectura.
- [x] `CirclePermissions`: cuatro `Switch` con los flags de `Circle.settings`.
- [x] Barra fija de guardado por lote con resumen, «Descartar» y «Guardando…».
- [x] `useUpdateCircleMutation`: CSRF, `PATCH`, caché e invalidaciones.
- [x] Errores 400 por campo, 403, 404, 429 y red.
- [x] Toast de éxito.

### Zona de peligro

- [x] `DangerZone` con conteos reales de álbumes, fotos, personas e invitaciones.
- [x] `ConfirmDialog` con `confirmPhrase="ELIMINAR"`.
- [x] `useDeleteCircleMutation`: `DELETE`, limpieza de caché y navegación a `/circles`.
- [x] Estado de error del borrado.

### Miembro

- [x] Vista de solo lectura «Lo que puedes hacer aquí» con Permitido/No permitido.
- [x] Nombre real del owner desde `GET /circles/:circleId/members`.
- [x] `useLeaveCircleMutation` y confirmación de salida.
- [x] Navegación a `/circles` y toast tras salir.

### Tests

- [x] RTL owner: valores, cambios, guardado, descarte, error.
- [x] RTL permisos: cuatro flags y persistencia.
- [x] RTL borrado: `ELIMINAR`, teclado, foco y navegación.
- [x] RTL miembro: solo lectura, owner, salida.
- [x] MSW: `PATCH`, `DELETE` y `leave`.
- [x] Actualizar tests que esperan Ajustes deshabilitado.
- [x] Axe de owner y member en estado base.
- [x] Tests del toast de borrado/salida y limpieza de `?deleted`/`?left`.
- [x] Tests de 401, 404, 429, error de red, «Guardando…» y carga.
- [x] Axe de los diálogos, del error de guardado y de «Guardando…».

## Criterios de aceptación

- [x] AC-01: solo owner edita y borra; miembro en lectura.
- [x] AC-02: los settings guardados afectan a permisos reales.
- [x] AC-03: borrar exige escribir `ELIMINAR`.
- [x] AC-04: confirmación responsive y no accidental.
- [x] AC-05: miembro ve estado, permisos y owner.
- [x] AC-06: teclado y foco. El foco ya no queda bajo la barra (B1) y el error se anuncia dentro de la barra (M2).
- [x] AC-07: guardado explícito por lote y descarte.
- [x] AC-08: miembro puede salir; owner no ve la acción.
- [x] AC-09: portada solo lectura, sin acción muerta.
- [x] AC-10: Ajustes como enlace real con `aria-current` único por navegación y foco en el título (M-02).

## Verificación

- [x] `pnpm --filter @memora/web test settings` → 36 tests OK (2 archivos).
- [x] `pnpm --filter @memora/web test --maxWorkers=2` → 88 archivos, 724 tests OK.
- [x] `pnpm typecheck` → 9/9.
- [x] `pnpm lint` → 6/6.
- [x] `pnpm format:check` → OK.
- [x] `pnpm docs:check` → 192 archivos, 601 enlaces, 0 rotos.
- [x] `pnpm agents:check` → 43 specs, 43 filas.
- [x] `pnpm build` → 5/5, 5 rutas prerenderizadas.
- [ ] Navegador real sin bloqueantes: 375/768/1024/1440, claro/oscuro, teclado y axe. **Pendiente de la segunda auditoría.**

## Correcciones pendientes

### Bloqueantes (a11y)

- [x] **B1.** El foco de teclado queda oculto bajo la barra de guardado. Altura medida con `ResizeObserver` en `scroll-padding-bottom` y en el espaciador.
- [x] **B2.** La barra de subidas de F26 tapa «Descartar» y «Guardar cambios». La barra de guardado se desplaza cuando `html[data-upload-bar='visible']`.

### Mayores

- [x] **M-02.** El sidebar no mueve el foco al H1; pasa `sectionNavigationState`.
- [x] **M1 (a11y).** A 200 % de zoom la barra tapa el último control; altura medida, no `h-28` fijo.
- [x] **M2 (a11y).** El error de guardado se pinta dentro de la barra fija, sin duplicar regiones vivas.

### Menores y nits

- [x] Tests de toasts y limpieza de URL.
- [x] Tests de 401/404/429/red, «Guardando…» y carga.
- [x] `removeQueries` antes de navegar; navegar primero o cancelar.
- [x] Los campos siguen editables durante el `PATCH`; evitar pérdida de cambios.
- [ ] «Cancelar» habilitado pero inerte durante `loading` en `ConfirmDialog` (**fuera de alcance**: `packages/ui`, decisión aparte).
- [x] `aria-live` en el resumen de cambios.
- [x] `<legend>` de permisos como `heading`.
- [x] Contador `46/200` asociado al textarea.
- [x] Concordancia «1 invitación pendiente dejará».
- [ ] Unificar `ToastViewport` y `parseFlag` (nit no aplicado).
- [ ] Revisar con diseño: copy de permisos, CTA de borrado, píldora del subnav, contador (auditoría de diseño pendiente).
- [ ] Mover `CIRCLE_DESCRIPTION_MAX_LENGTH` a constantes compartidas (nit no aplicado).
- [x] Precisar en AC-10 «`aria-current` único por navegación».

## Cierre

- [x] Revisión independiente (nivel A): **apto con correcciones**, sin bloqueantes.
- [x] Auditoría de accesibilidad: **no apto**; 2 bloqueantes.
- [ ] Auditoría de diseño: pendiente de relanzar.
- [ ] Correcciones y segunda verificación.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado a `review`.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
