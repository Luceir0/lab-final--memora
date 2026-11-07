# F44 — Handoff

> **Estado:** `review` · **Nivel:** B · **Rama:** `feat/F44-covers` · **Fecha:** 2026-11-07

## Resultado

La portada del álbum ya se elige entre sus fotos dentro del formulario de edición, con
«Quitar portada» y una nota dinámica según haya 0 o más fotos. La portada del círculo
es editable por el owner desde Ajustes: el selector navega por los álbumes del círculo y
después por las fotos de cada álbum, sin endpoint nuevo. El member ve la portada en solo
lectura. Ambas portadas se guardan con los `PATCH` existentes (`coverPhotoId` o `null`) y
respetan el modelo de guardado de cada pantalla: el formulario del álbum y el lote de
Ajustes con «Guardar cambios».

## Decisiones registradas

1. **Foto del círculo:** navegar por álbumes dentro del selector. Se reutilizan
   `GET /circles/:circleId/albums` y `GET /albums/:albumId/photos`; **no se añade**
   `GET /circles/:circleId/photos` ni se cambia ningún contrato.
2. **Acción del álbum:** en `AlbumFormDialog`, sustituyendo el bloque deshabilitado. El
   selector se incrusta en el mismo diálogo para no anidar overlays.
3. **Patrón del selector:** no hay PNG canónico. Se deriva de `PhotoGrid` (selección
   única, casillas y scroll infinito) + `ResponsiveDialog` (hoja en móvil, diálogo desde
   768 px). El álbum usa la rejilla inline y el círculo el diálogo.
4. **Guardado:** con el formulario del álbum y con el borrador de Ajustes. No hay un
   guardado inmediato paralelo.

## Cambios (archivos)

- `apps/web/src/features/covers/cover-photo.ts`: recorte `PhotoDto → PhotoSummary`.
- `apps/web/src/features/covers/use-cover-album-photos.ts`: fotos de un álbum con la
  misma clave de caché que la galería.
- `apps/web/src/features/covers/cover-photo-picker.tsx`: rejilla de selección única sobre
  `PhotoGrid`, con desmarcado.
- `apps/web/src/features/covers/cover-preview.tsx`: hueco/miniatura de portada con
  `onError` y tokens.
- `apps/web/src/features/covers/circle-cover-picker-dialog.tsx`: selector del círculo con
  navegación álbum → fotos, paginación, foco entre pasos, selección visible y estados.
- `apps/web/src/features/albums/album-form-dialog.tsx`: bloque de portada real, nota
  dinámica, selector inline, `coverPhotoId` solo si cambió, error específico de portada,
  `aria-busy` y `canEditCover` seguro por defecto.
- `apps/web/src/features/albums/album-detail-page.tsx`: pasa `canEditAlbum(...)` como
  `canEditCover`.
- `apps/web/src/features/albums/queries.ts`: invalida `circleKeys.list` solo cuando el
  `PATCH` incluye `coverPhotoId` (AC-09).
- `apps/web/src/features/circles/settings/owner-settings.tsx`: portada en el borrador,
  «Elegir/Quitar portada», resumen «portada», 404 de portada sin perder el borrador e
  iniciales con el nombre en edición.
- `apps/web/src/features/circles/settings/member-settings.tsx`: portada de solo lectura.
- Tests: `features/covers/covers-picker.test.tsx`,
  `features/circles/settings/circle-settings-covers.test.tsx` y ampliación de
  `features/albums/albums-form.test.tsx`.
- Documentación: esta carpeta, tablero, `remaining-plan.md`, bitácora y cobertura.

## Verificación (comandos y resultado real)

| Comando | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test covers --maxWorkers=2 --retry=1` | **2 archivos, 28 tests** |
| `pnpm --filter @memora/web test albums --maxWorkers=2 --retry=1` | **9 archivos, 139 tests** |
| `pnpm --filter @memora/web test circle-settings --maxWorkers=2 --retry=1` | **1 archivo, 9 tests** |
| `pnpm --filter @memora/web test '_app.circles.$circleId.settings' --maxWorkers=2 --retry=1` | **1 archivo, 34 tests** (regresión real de F28) |
| `pnpm --filter @memora/web test --maxWorkers=2 --retry=1` | **105 archivos, 864 tests** |
| `pnpm typecheck` | **9/9 tareas** |
| `pnpm lint` | **6/6 tareas** |
| `pnpm build` | **5/5 tareas**, 5 rutas prerenderizadas |
| `pnpm format:check` | OK |
| `pnpm docs:check` | **197 archivos, 641 enlaces, 0 rotos** |
| `pnpm agents:check` | **44 specs, 44 filas** |

Sin cambios en `apps/api` ni en `packages/shared`: no hay tests de API nuevos porque no
se añadió endpoint ni se modificó contrato.

**Nota de estabilidad:** ejecutar varios filtros de Vitest en paralelo produce falsos
negativos por contención de MSW/tiempos en tests ajenos (observado en `albums`). Toda la
verificación se hizo en secuencia y con `--maxWorkers=2 --retry=1`.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01 | Pasa | Nota 0/N fotos y acción deshabilitada; tests de alta y edición. |
| AC-02 | Pasa | Rejilla inline con carga, vacío, error, reintento y selección única. |
| AC-03 | Pasa | `coverPhotoId` en el PATCH de edición y detalle actualizado. |
| AC-04 | Pasa | `coverPhotoId: null` con «Quitar portada»; nota «Se quitará al guardar». |
| AC-05 | Pasa | `canEditCover` espejo de `canEditAlbum`; solo lectura sin permiso. |
| AC-06 | Pasa | Owner edita; selector álbum → fotos con «Cargar más álbumes». |
| AC-07 | Pasa | `MemberSettings` muestra la portada sin acciones. |
| AC-08 | Pasa | Portada en el borrador, resumen «portada», PATCH y «Descartar». |
| AC-09 | Pasa | Invalidación de detalle, lista de álbumes, detalle del círculo y lista de círculos al cambiar portada; fotos intactas. |
| AC-10 | Pasa | Teclado, foco inicial/retorno, foco entre pasos, regiones vivas y axe en los estados tocados. |
| AC-11 | **Pendiente de G4** | Responsive y tokens revisados en código y jsdom; falta la prueba visual real a 375/1280 px en claro y oscuro. |

## Pendiente

- Prueba visual del usuario en móvil (375 px) y escritorio (1280+), tema claro y oscuro
  (AC-11 y G4).
- Aceptación del usuario y merge de la PR.
- `[Limitación]` El 404 de portada es ambiguo en la API (mismo código para recurso
  inexistente y foto ajena). La UI solo lo trata como error de foto cuando el id es no
  nulo y conserva el borrador; si el círculo desapareció en ese instante, el aviso será
  el de portada hasta reintentar sin portada.
- `[Menor]` El foco tras «Cargar más álbumes» va al encabezado, no al primer álbum nuevo.
- `[Nit]` El anillo de foco de los encabezados depende de `:focus-visible` del navegador.

## Riesgos y limitaciones

- El selector del círculo hace dos pasos (álbum → fotos) por no existir un endpoint de
  fotos por círculo. Es la opción sin contrato nuevo y con coste bajo.
- Círculos con más de 24 álbumes requieren «Cargar más álbumes»; está implementado y
  testeado, pero no se probó con un volumen real grande.
- La portada se guarda con el resto del formulario/ajustes: no hay guardado inmediato.
  Es deliberado para mantener un único mecanismo por pantalla.
- Sin verificación con lector de pantalla real ni axe en navegador; queda para F38/F39.

## Revisión independiente

Dos rondas de `reviewer` de nivel B:

1. **No apto:** B-01 (el member no veía la portada en Ajustes) y B-02 (un 404 de portada
   navegaba fuera y perdía el borrador), más M-01 (paginación de álbumes), M-02 (foco
   entre pasos) y M-03 (`coverPhotoId` siempre). Corregidos.
2. **No apto:** N-01 (el alta mostraba el mensaje de solo lectura) y N-02 (el 404 con
   `coverPhotoId: null` se trataba como error de foto). Corregidos y verificados por el
   orquestador con la batería completa. Los nits restantes están arriba.

## Documentación actualizada

- `docs/04-features/F44-covers/{spec,tasks,handoff,review}.md`
- `docs/04-features/README.md` (fila F44 y contador 44)
- `scripts/validate-agents.mjs` (`FEATURE_COUNT = 44`)
- `docs/06-process/remaining-plan.md` (sesión S1.5)
- `docs/06-process/ai-log.md`
- `docs/07-curriculum/coverage-map.md`

## Siguiente paso propuesto

Aceptación visual del usuario (G4) y merge de la PR. Después, **S2: F32 completa**, sin
iniciarla sin permiso.
