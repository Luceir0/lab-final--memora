# Handoff — F24 Albums web

- **Estado:** `done` (aceptada por el usuario el 2026-11-05; PR #38 en curso)
- **Rama:** `feat/F24-albums-web`
- **Fecha:** 2026-11-05
- **Nivel de auditoría:** B
- **Aceptación:** usuario, 2026-11-05, tras los cinco cambios de aceptación; pidió expresamente cerrar
- **Cierre:** 2026-11-05 (PR #38; commits `1a40ca3`, `b964e16` y `4ce5043`; CI en curso)
- **Implementado por:** sesión de implementación de F24 (`web` y `shared`), commits `1a40ca3`, `b964e16` y `4ce5043`; PR #38
- **Revisado por:** revisión independiente de nivel B; auditorías de diseño y accesibilidad del delta

## Resultado

Creación, detalle y cabecera de álbum sobre la API real de F23: formulario de alta y edición con RHF y los schemas compartidos, rejilla de álbumes, detalle con metadatos, estados vacío/carga/error/guardando/validación, y acciones de vaciar y eliminar con confirmación. **113 tests en 7 archivos** de álbumes y **491 tests** en `apps/web`; **27 tests** de álbumes en la API, **150** en `shared` y **246** en la API. Revisión independiente de nivel B **aprobada** en la ronda de cambios, con Menores/Nits; auditorías de diseño y accesibilidad del delta **aptas**. El usuario probó la feature, pidió cinco cambios —altura uniforme de cards, permisos de creador, vaciado solo con fotos, portada F26/F29 y mes actual en el alta—, todos aplicados y verificados, y **aceptó y pidió cerrar F24 el 2026-11-05**. Queda pendiente el merge y CI de la PR #38; los commits son `1a40ca3` (feature), `b964e16` y `4ce5043` (documentación).

## Cambios

- `apps/web/src/features/albums/album-form-dialog.tsx`: alta y edición con `zodResolver` y los schemas de `@memora/shared`; el alta precarga `currentMonthInput()` y la edición usa `isoToMonthInput(album.date)`; hint «Se guardará como el primer día del mes.».
- `apps/web/src/features/albums/album-grid.tsx`: rejilla `auto-rows-fr` de 1 a 4 columnas; estados vacío, carga y error.
- `apps/web/src/features/albums/album-card.tsx`: `h-full` en `li` y enlace, bloque de texto `flex-1` para altura uniforme.
- `apps/web/src/features/albums/album-detail-page.tsx`: cabecera, metadatos, panel de galería futura; menú con «Vaciar álbum» solo si `photosCount > 0`; recuperación del `409 ALBUM_NOT_EMPTY` con refetch y atajo «Vaciar».
- `apps/web/src/features/albums/permissions.ts`: vaciar y eliminar para owner o creador del álbum, sin `membersCanCreateAlbums`.
- `apps/web/src/features/albums/errors.ts`: copia del 403 «Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.» y mapeo de `ALBUM_NOT_EMPTY`.
- `apps/web/src/features/albums/{queries,format,paths}.ts`: claves y consultas de TanStack Query, formato de mes en UTC y rutas del detalle.
- `apps/web/src/routes/_app.circles.$circleId.albums.$albumId.tsx`: ruta de detalle anidada en el layout del círculo.
- `packages/shared/src/permissions.ts` y `packages/shared/src/permissions.test.ts`: `album.empty` y `album.delete` aceptan owner o creador; eliminar exige `photosCount = 0`.
- `apps/api/src/modules/albums/albums.test.ts`: **27 tests**; incluyen el creador sin flag al vaciar y eliminar, y el `409` del creador con fotos.
- Documentación: `docs/04-features/F24-albums-web/{spec,tasks,handoff}.md`, `docs/04-features/F23-albums-api/{spec,tasks,handoff}.md`, `docs/03-architecture/{auth,api-contract}.md`, `docs/04-features/README.md`, `docs/00-index.md`, `docs/06-process/ai-log.md`, `docs/07-curriculum/coverage-map.md`, `README.md` y las specs de F25/F26/F29.

## Verificación

Ejecutada el 2026-11-05:

```text
pnpm --filter @memora/web test albums
→ 7 archivos, 113 tests, todos pasan

pnpm --filter @memora/web test
→ 61 archivos, 491 tests, todos pasan

pnpm --filter @memora/shared test
→ 150 tests, todos pasan

pnpm --filter @memora/api test albums
→ 27 tests, todos pasan

DATABASE_URL=postgresql://…/memora_test pnpm test
→ 8/8 tareas: shared 150, api-client 39, ui 281, web 491, api 246

pnpm typecheck → 9/9
pnpm lint → 6/6
pnpm format:check → OK
pnpm --filter @memora/web build → OK, 5 rutas prerenderizadas
```

Verificación documental de este cierre:

```text
pnpm docs:check → OK (191 archivos, 538 enlaces, 0 rotos; 532 antes de añadir los enlaces de este cierre)
pnpm agents:check → OK (43 specs, 43 filas)
```

## Criterios de aceptación

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 Crear álbum valida y guarda | Pasa | `albums-form.test.tsx`: validación con Zod, error de campo y de resumen, alta con el mes precargado y guardado. |
| AC-02 Detalle muestra metadatos | Pasa | `albums-detail.test.tsx`: título, descripción, fecha formateada en UTC, creador y contador de fotos. |
| AC-03 Móvil una columna; escritorio rejilla | Pasa | `album-grid.tsx` (`grid-cols-1 md:2 lg:3 xl:4`), `albums-grid.test.tsx` y auditoría de diseño a 375/768/1024/1440. |
| AC-04 Estado vacío guía a subir | Pasa | `albums-detail.test.tsx`: con 0 fotos pinta el vacío y deshabilita «Subir fotos» con nota de F26; `albums-grid.test.tsx` cubre el vacío de la lista. |
| AC-05 Errores comprensibles | Pasa | `errors.test.ts`: 400/401/403/404/409/429/500 con copia propia; 403 de vaciar/eliminar y 409 con atajo «Vaciar». |
| AC-06 Teclado y foco | Pasa | `albums-detail.test.tsx` y `albums-form.test.tsx`; auditoría de accesibilidad del delta con 0 violaciones de axe y foco correcto. |
| AC-07 Borrar no vacío → `ALBUM_NOT_EMPTY` y guía | Pasa | `albums-detail.test.tsx`: el 409 refresca el detalle y abre el vaciado con el recuento real. |
| AC-08 «Vaciar álbum» pide confirmación y actualiza | Pasa | `albums-detail.test.tsx`: confirmación, invalidación de queries y menú sin «Vaciar» con 0 fotos. |

## Revisión independiente (nivel B)

- **Ronda de cambios: aprobada**, sin bloqueantes.
- **Menores/Nits** de código corregidos: copia visible del 403 de vaciar/eliminar y recuperación del 409 con refetch del detalle y atajo «Vaciar».
- **Menores/Nits documentales** resueltos en este cierre: D1 con owner o creador, D3 solo alta, altura uniforme de cards, hint de fecha, desviación del orden móvil y aclaración de portada F26/F29.

## Auditorías

- **Diseño (delta):** apta con correcciones menores. Alturas de card idénticas a 1440, 1024, 768 y 375, en claro y oscuro; menús correctos con y sin fotos; hint de fecha corregido.
- **Accesibilidad (delta):** apta. 0 violaciones de axe, navegación por teclado y foco correctos en el menú, los diálogos y el formulario.

## Aceptación y cierre (2026-11-05)

- **Aceptación:** el usuario aceptó F24 el **2026-11-05**, tras los cinco cambios de aceptación, y pidió expresamente cerrar la feature.
- **Login:** la API estaba en un bucle de `node --watch` y devolvía 500; se reinició limpia (`node src/index.ts` con `DATABASE_URL=…/memora`) y `health`, `login` y la web respondieron 200. El usuario debe recargar con `Ctrl+Shift+R` o en incógnito para evitar la sesión o los assets cacheados.
- **Datos de prueba:** con autorización del usuario se borraron cuatro álbumes de prueba («Álbum de prueba», «Un título larguísimo…», «Auditoría vacío» y «Auditoría creada»). Quedan solo los dos de seed: «Verano en la costa» y «Lisboa en primavera».
- **Cierre operativo:** PR #38 abierta desde `feat/F24-albums-web`; commits `1a40ca3` (feature), `b964e16` y `4ce5043` (documentación). CI en curso; merge pendiente de verde.

## Pendiente

- Cierre operativo: merge y CI de la PR #38.
- Lector de pantalla real (NVDA/VoiceOver): no probado; axe y teclado no lo sustituyen.
- Zoom solo-texto al 200 %: medido el reflow, no el zoom de texto aislado.
- Portada: F26 sube la imagen como foto del álbum y F29 la elige entre sus fotos y marca `coverPhotoId`.
- Subidas reales: F26.
- Descargas del álbum: F33.
- Doble anuncio de validación: `InlineAlert` y `FieldMessages` pueden anunciarse dos veces; se revisa en el kit de formularios.
- Cuerpo genérico del 403 en la API: la UI da la copia específica; el `message` del servidor sigue siendo genérico.
- Mateo como creador con fotos: el `409` está cubierto por test, no verificado visualmente en navegador con ese usuario.
- Paginación real con más de 24 álbumes: no probada en navegador.
- Cursor inválido en la lista de álbumes: cubierto en la API, no ejercitado desde la UI.

## Riesgos y limitaciones

- El permiso de vaciar/eliminar cambió respecto a F23: el creador puede deshacer lo que crea aunque el admin revoque `membersCanCreateAlbums`. Es una decisión del usuario del 2026-11-05 y está registrada en el contrato y en la spec de F23.
- La UI oculta acciones por permisos, pero la autorización real vive en la API; un cliente manipulado recibe `403` o `404`.
- El `403` de la API mantiene un cuerpo genérico; la copia específica es de la web.
- Sin lector de pantalla real ni zoom solo-texto, la cobertura de accesibilidad es axe + teclado + foco.
- La lista no se ha probado con más de 24 álbumes ni con cursores manipulados desde la UI.
- La portada sigue deshabilitada hasta F26/F29; no hay imagen real que auditar.

## Documentación actualizada

- [x] `docs/04-features/F24-albums-web/spec.md` — D1–D9, aceptación y cierre.
- [x] `docs/04-features/F24-albums-web/tasks.md` — implementación, AC, verificación, revisión, auditorías y cierre.
- [x] `docs/04-features/F24-albums-web/handoff.md` — este documento.
- [x] `docs/04-features/F23-albums-api/{spec,tasks,handoff}.md` — nota de cambio posterior a owner o creador.
- [x] `docs/03-architecture/auth.md` — reglas de `album.empty`/`album.delete` y objetos diferidos a F25.
- [x] `docs/03-architecture/api-contract.md` — semántica de álbumes con owner o creador.
- [x] `docs/04-features/README.md` — fila F24 y «Situación actual».
- [x] `docs/00-index.md` — bloque «Estado».
- [x] `docs/06-process/ai-log.md` — entrada del 2026-11-05.
- [x] `docs/07-curriculum/coverage-map.md` — evidencias de F24.
- [x] `docs/04-features/F25-upload-pipeline-api/spec.md`, `F26-upload-queue-web/spec.md` y `F29-gallery/spec.md` — invariante de portada.
- [x] `README.md` — estado y próximos pasos.

## Siguiente paso propuesto

1. Merge de la PR #38 cuando CI esté en verde; después, F25/F26.
2. Abrir **F25 — Upload pipeline API**, que recoge además los objetos de storage, los índices y el orden de locks.
3. Trasladar a F26 la subida de la portada como foto del álbum y a F29 su elección con `coverPhotoId`.
