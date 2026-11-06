# Handoff — F27 Subidas globales («Mis subidas»)

- **Estado:** `done` (aceptación G4 el 2026-11-06, PR #44 mergeada en `main` y cierre documental completado)
- **Rama:** `feat/f27-subidas-globales` (2026-11-06)
- **Fecha:** 2026-11-06
- **Aceptación:** 2026-11-06, tras la prueba del usuario y la incidencia de API resuelta
- **PR:** [#44](https://github.com/Luceir0/lab-final--memora/pull/44) · **Merge en `main`:** `a848c93a82f7d7e83910e5d1fefb7cf38c759750`
- **Commits:** `784df87` (`feat: add my uploads page with grouped history and image delivery (F27)`) y `944e2ab` (`docs: record F27 implementation, review and acceptance`)
- **CI:** run `42224616978` en la PR (primer intento fallido por un flake preexistente de F26 en `upload-exit-guard.test.tsx`; reintento `success`) y run `42225410112` en `main` sobre el merge, `success`
- **Implementado por:** `api-dev` (2 sesiones), `ui-dev` (2 sesiones), orquestador (documentación y contrato)
- **Revisado por:** `reviewer` (nivel A), `a11y-auditor`, `design-auditor`
- **Nivel de auditoría:** A · **Talla:** L

## Resultado

`/uploads` es ahora **«Mis subidas»**: todas las fotos que ha subido la persona autenticada, agrupadas por **círculo → álbum («carpeta»)**, con miniaturas reales, el bloque «En curso» conectado a la cola de F26, contador en la navegación y etiqueta móvil «Subidas».

La feature se adelantó respecto a la spec original de «subidas recientes» por decisión del usuario (2026-11-06). Eso obligó a adelantar `GET /api/photos/:photoId/image` desde F29 y a subir la feature de **S/M a L** y de **auditoría C a A**. F29 conserva la galería, el scroll infinito, la selección, el filtro por persona y el `srcset`; reutilizará el endpoint de imágenes ya construido.

Se entrega con datos reales, autorización por membresía, paginación por cursor, caché privada con `ETag`/`304`, estados completos, teclado y foco, y las tres auditorías cerradas con sus correcciones aplicadas. La prueba en navegador real (G4) se cerró el 2026-11-06 y el cierre operativo con la PR #44 y el merge en `main` también: la feature queda `done`.

## Aceptación (G4, 2026-11-06)

El usuario probó la página y la aceptó. En la primera prueba apareció el error «No hemos podido cargar tus subidas»; el diagnóstico fue una **API local lanzada sin watcher** que no conocía las rutas nuevas (`404 Route not found`), no un fallo de código ni de la galería. Se reinició con `node --watch src/index.ts` y se verificó con datos reales:

- `GET /api/me/uploads` → `200` con 16 fotos en «Familia Ferrer» (5 en «Verano en la costa», 11 en «Lisboa en primavera»).
- `GET /api/me/uploads/photos?albumId=…` → `200` con `total` y `nextCursor`.
- `GET /api/photos/:id/image?size=thumb` → `200 image/webp` de 3.952 bytes con `ETag`, `Cache-Control`, `Vary`, `nosniff` e `inline`.
- El usuario confirmó que la veía bien y pidió cerrar la feature y subirla a `main`.

Queda registrada como aceptada. El usuario probó la página y confirmó que la veía bien.

## Cierre operativo (2026-11-06)

- **Rama:** `feat/f27-subidas-globales`.
- **Commits:** `784df87` (`feat: add my uploads page with grouped history and image delivery (F27)`) y
  `944e2ab` (`docs: record F27 implementation, review and acceptance`).
- **PR:** [#44](https://github.com/Luceir0/lab-final--memora/pull/44), mergeada en `main` con
  `a848c93a82f7d7e83910e5d1fefb7cf38c759750`.
- **CI de la PR:** run `42224616978`. El primer intento **falló** por un flake preexistente de F26
  en `upload-exit-guard.test.tsx`, ajeno a los cambios de F27; el reintento terminó en `success`.
- **CI de `main`:** run `42225410112` sobre el merge, `success`.
- **Cierre documental:** tablero, `ai-log.md`, `coverage-map.md`, `test-matrix.md` y esta
  actualización del handoff. Sin cambios de código.

## Cambios (archivos)

### Contrato compartido

- `packages/shared/src/schemas/my-uploads.ts` **(nuevo)**: `myUploadsSummarySchema`, `myUploadsPhotosQuerySchema`, `myUploadsPhotosResponseSchema`, refs de círculo/álbum y `MY_UPLOADS_PREVIEW_LIMIT`.
- `packages/shared/src/schemas/my-uploads.test.ts` **(nuevo)**: límites, `albumId`, cursor y tope de 4 previews.
- `packages/shared/src/schemas/photos.ts`: `photoImageQuerySchema` exige `size` (antes tenía `default('display')`).
- `packages/shared/src/schemas/auth.ts`: eliminados `meUploadsQuerySchema`/`meUploadsResponseSchema`, el contrato muerto de «subidas recientes».
- `packages/shared/src/schemas/contracts.test.ts`: tabla de endpoints actualizada (43 endpoints) y nuevo fixture de subidas.
- `packages/shared/src/schemas/index.ts`: exporta `my-uploads`.

### API

- `apps/api/src/modules/photos/uploads-routes.ts` **(nuevo)**: `GET /api/me/uploads` y `GET /api/me/uploads/photos`.
- `apps/api/src/modules/photos/uploads-service.ts` **(nuevo)**: resumen con `groupBy` + `ROW_NUMBER()` (3 consultas, sin N+1), previews con `MY_UPLOADS_PREVIEW_LIMIT`, listado keyset y comprobación de álbum accesible.
- `apps/api/src/modules/photos/uploads-cursor.ts` **(nuevo)**: cursor base64url `(createdAt, id)`.
- `apps/api/src/modules/photos/uploads.test.ts` **(nuevo)**: 13 tests de autorización, acceso cruzado, orden, previews, paginación, cursores y totales.
- `apps/api/src/modules/photos/image.ts` **(nuevo)**: `GET /api/photos/:photoId/image?size=thumb|display|original`; membresía, `photo.download` para `original`, clave elegida en servidor, `ETag` débil, `304` **antes** de leer storage, caché privada, `nosniff`, `Vary: Cookie` y `Content-Type` validado.
- `apps/api/src/modules/photos/image.test.ts` **(nuevo)**: 21 tests (401, 403, 404, 200, 304 sin lectura de storage, objeto ausente, `size` inválido, MIME no válido y no fuga de claves).
- `apps/api/src/modules/members/dto.ts`: `toPhotoSummary()` y `photoImageUrl()` exportados; comentario de F29 corregido.
- `apps/api/src/app.ts`: registra `registerUploadRoutes` y `registerPhotoImageRoutes`.

### Web

- `apps/web/src/features/uploads/history/{ids,queries,format,uploads-history-page,album-folder,photo-thumbnail,index}.ts|tsx` **(nuevos)**: página, resumen, carpetas desplegables, mosaico, rejilla, paginación, estados, foco de ruta, anuncio de «Ver más», fecha con año y `alt` con hora.
- `apps/web/src/features/uploads/history/uploads-history.test.tsx` **(nuevo)**: 19 tests RTL/MSW, axe, teclado, foco, paginación y fallback de imagen.
- `apps/web/src/features/uploads/uploads-in-progress.tsx` + test **(nuevos)**: bloque «En curso» con «Abrir cola» (`openPanel({ focus: true })`, `aria-haspopup`/`aria-expanded`), progreso solo en `uploading` y foco al título si el bloque desaparece con el foco dentro.
- `apps/web/src/features/uploads/upload-nav-badge.tsx` + test **(nuevos)**: contador `pending + active`, oculto en 0, «99+» visible y accesible, píldora neutra alineada a la derecha en escritorio.
- `apps/web/src/features/uploads/history-refresh.ts` + test **(nuevos)**: invalidación de `['me','uploads']` tras una subida.
- `apps/web/src/features/uploads/upload-provider.tsx`: invalida el historial junto al álbum.
- `apps/web/src/features/uploads/use-upload-queue.test.tsx`: cubre la invalidación desde el provider.
- `apps/web/src/test/fixtures/upload-queue-fixtures.ts` **(nuevo)**: factorías de items y API falsa de la cola.
- `apps/web/src/components/layout/navigation.ts`, `primary-nav.tsx`, `sidebar.tsx`, `app-shell.tsx`: etiqueta móvil «Subidas», slot `uploadsBadge` y separación `lg:flex-1`/`lg:ml-auto`.
- `apps/web/src/components/layout/app-shell.test.tsx`: etiquetas, nombre accesible, 3 destinos móviles y slot.
- `apps/web/src/routes/_app.tsx`: pasa `<UploadNavBadge />` dentro de `UploadProvider`.
- `apps/web/src/routes/_app.uploads.tsx`: monta `UploadHistoryPage`.
- `apps/web/src/routes/_app.provisional.test.tsx`: retira `/uploads` de los placeholders.

### Documentación

- `docs/04-features/F27-subidas-globales/{spec.md,tasks.md,handoff.md}`.
- `docs/04-features/README.md`: F27 documentada con talla L, auditoría A y alcance revisado; al cerrar, fila y situación en `done`.
- `docs/03-architecture/api-contract.md`: contrato de los tres endpoints, semántica del `304` y de los listados.
- `docs/03-architecture/uploads.md`: nota del endpoint de imágenes desde F27.
- `docs/02-design/screens.md`: `/uploads` como diseño inferido.
- `docs/02-design/components.md`: componentes reales de la página.
- `docs/02-design/responsive.md`: barra inferior «Círculos · Subidas · Perfil».
- `docs/04-features/F29-gallery/spec.md`: el endpoint de imágenes ya no llega con F29.
- `docs/06-process/review-protocol.md`: F27 pasa a la lista de nivel A.

## Verificación (comandos y resultado real)

| Comando | Resultado |
| --- | --- |
| `DATABASE_URL=… pnpm --filter @memora/api test uploads image` | **3 archivos, 34 tests, 0 fallos** |
| `DATABASE_URL=… pnpm --filter @memora/api test` | **22 archivos, 347 tests; 2 archivos skipped** (`storage-s3.integration` y `photos-silo.integration`, por entorno) |
| `pnpm --filter @memora/web test uploads --maxWorkers=2` | **23 archivos, 178 tests, 0 fallos** |
| `pnpm --filter @memora/web test app-shell --maxWorkers=2` | **2 archivos, 29 tests, 0 fallos** |
| `pnpm --filter @memora/web exec vitest run --maxWorkers=2` | **86 archivos, 687 tests, 0 fallos** |
| `pnpm typecheck` | **9/9 tareas** |
| `pnpm lint` | **6/6 tareas** |
| `pnpm format:check` | **OK** |
| `pnpm docs:check` | **191 archivos, 581 enlaces, 0 rotos** (592 tras este cierre documental) |
| `pnpm agents:check` | **10 comandos, 6 skills, 43 specs, 43 filas, OK** |

Nota de entorno: la suite web completa **sin** `--maxWorkers=2` sufre timeouts de jsdom en esta máquina Windows (83–86 archivos en paralelo); con 2 workers pasa entera. No es un fallo del código y CI (Linux) ejecuta `pnpm test`. Los comandos dirigidos son los que se usaron como gate.

### Incidencia de aceptación (2026-11-06)

Durante la prueba del usuario, `/uploads` mostraba el error de carga aunque las subidas funcionaban. La API local estaba lanzada con `node src/index.ts` **sin watcher** desde antes de F27, así que no conocía `/api/me/uploads` y Fastify devolvía `404 Route not found`; la página lo mostraba como error genérico. **No era un fallo del código ni de la galería (F29).** Se reinició la API con `node --watch src/index.ts` y la misma configuración de desarrollo. Comprobación con datos reales y sesión de `lucia@memora.test`:

- `POST /api/auth/login` → `200`.
- `GET /api/me/uploads` → `200` con **16 fotos** en «Familia Ferrer» («Verano en la costa» 5, «Lisboa en primavera» 11).
- `GET /api/me/uploads/photos?albumId=…&limit=3` → `200`, 3 items, `total: 5`, `nextCursor` presente.
- `GET /api/photos/:id/image?size=thumb` → `200 image/webp`, 3.952 bytes, `ETag`, `Cache-Control: private, max-age=3600`, `Vary: Cookie`, `nosniff` y `Content-Disposition: inline`.

Tras recargar la página, el resumen debe renderizar las carpetas y las miniaturas de las fotos subidas. Las del seed que no tengan objeto en storage seguirán cayendo al bloque de reserva, por diseño.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01 | **Pasa** | Resumen/listado filtran por `uploaderId`; ruta y navegación con `/uploads`; tests de API y web. |
| AC-02 | **Pasa** | `uploads.test.ts` excluye círculos abandonados y responde `404`; `image.test.ts` también. |
| AC-03 | **Pasa** | Conteos, `lastUploadAt`, hasta 4 previews y orden por actividad, cubiertos en API y UI. |
| AC-04 | **Pasa** | Keyset `(createdAt, id)`, `total`, dedupe y «Ver más» con anuncio y foco. |
| AC-05 | **Pasa** | Insignia `pending + active`, oculta en 0, «Subidas, N en curso» y «99+». |
| AC-06 | **Pasa** | Bloque «En curso» con la cola real, `openPanel({ focus: true })`, sin acciones ni región viva duplicadas. |
| AC-07 | **Pasa** | Esqueletos, vacío, error de página, error de paginación y reintento. |
| AC-08 | **Pasa** | Permisos, `original` con `photo.download`, caché privada, `ETag`, `304` sin leer storage y objeto ausente `404`. |
| AC-09 | **Parcial** | Código, tests, axe jsdom, teclado y foco cubiertos; G4 aceptada el 2026-11-06, pero no queda evidencia documentada del barrido 320/375/768/1024/1440, claro/oscuro y lector de pantalla (no hay Playwright en el repo todavía). |
| AC-10 | **Pasa** | `invalidateUploadHistoryAfterUpload` + test del provider. |
| AC-11 | **Pasa** | «Subidas» en móvil y escritorio, 3 destinos, `aria-current` intacto. |

## Pendiente

- **`[AC-09]` Barrido real incompleto**: no queda evidencia documentada de 320/375/768/1024/1440,
  claro/oscuro y lector de pantalla, pese a la aceptación del usuario. Pasa a **F37/F38/F39**.
- `[Menor]` **A11Y-06**: al cerrar la cola el foco vuelve a la barra global, no al botón «Abrir cola» de `/uploads`. Comportamiento de F26; se puede mejorar recordando el disparador.
- `[Nit]` **A11Y-08**: las filas truncadas de «En curso» usan `title` como única vía visual del texto completo.
- `[Nit]` **A11Y-10**: `aside` «Navegación» contiene un `nav` «Navegación principal»; nombres de landmark heredados de F13.
- `[Nit]` **A11Y-13**: axe cubre carga y vacío, no error ni error de paginación.
- `[Nit]` **DES-10**: `buttonStyles` no se exporta; el CTA del vacío reimplementa el botón primario.
- `[Nit]` **DES-11**: el selector `[data-theme='dark']` de la barra de F26 sigue fuera de tokens.
- `[Deuda]` **Índice**: no se añade `(uploaderId, createdAt, id)`; la spec lo prohíbe en esta feature. Si el volumen lo exige, se propone migración aparte.
- `[Deuda]` **`original` sin el límite de 10/min** hasta F33, que lo añadirá al endpoint compartido.
- `[Deuda]` **Seed sin objetos en storage**: en una base de desarrollo recién sembrada las miniaturas pueden devolver `404`; la UI cae al bloque de reserva. Para ver fotos reales hay que subirlas.
- `[Deuda]` **Sin integración real de lectura S3/Silo** para el endpoint de imagen (los tests usan el fake de storage); las integraciones de F25 cubren la subida.
- `[Menor]` **Resumen sin paginación**: una fila por álbum; con cientos de álbumes el payload crece. Aceptable para el MVP, revisar con datos reales.
- `[Menor]` **`304` gana a objeto ausente**: decisión documentada y testeada; el cliente ya tiene la representación.

## Riesgos y limitaciones

- **L grande**: se dividió en cuatro sesiones (API ×2, UI ×2) y aun así el diff es amplio; cualquier cambio posterior debe volver a pasar los comandos dirigidos.
- **Flakiness del entorno**: la suite web completa en Windows necesita `--maxWorkers=2`; no se cambió la configuración de Vitest.
- **Sin navegador real**: todas las validaciones de layout, contraste renderizado y lector son de código, jsdom o cálculo sobre tokens. G4 es obligatorio para AC-09.
- **`304` sin comprobar el objeto**: si el objeto desaparece y el cliente tiene un validador válido, recibe `304`. Es intencional para no leer el binario; queda documentado en contrato y spec.
- **Memoria en imágenes**: el `StorageService` devuelve `Buffer`; un `original` de hasta 25 MB ocupa memoria durante la respuesta. Es la arquitectura actual de F25.
- **Caché**: `private, max-age=3600` + `Vary: Cookie`; no hay CDN ni URLs firmadas (ADR-0006).

## Documentación actualizada

- [x] `docs/04-features/F27-subidas-globales/spec.md`
- [x] `docs/04-features/F27-subidas-globales/tasks.md`
- [x] `docs/04-features/F27-subidas-globales/handoff.md` (este documento)
- [x] `docs/04-features/README.md`
- [x] `docs/03-architecture/api-contract.md`
- [x] `docs/03-architecture/uploads.md`
- [x] `docs/02-design/screens.md`
- [x] `docs/02-design/components.md`
- [x] `docs/02-design/responsive.md`
- [x] `docs/04-features/F29-gallery/spec.md`
- [x] `docs/06-process/review-protocol.md`
- [x] `docs/06-process/ai-log.md` (G5)
- [x] `docs/07-curriculum/coverage-map.md` (G5)
- [x] `docs/05-quality/test-matrix.md` (evidencia y comandos de F27)

## Siguiente paso propuesto

1. **F27 queda cerrada en `done`** el 2026-11-06. No hay trabajo pendiente de esta feature.
2. La siguiente **recomendada por el tablero** es **F28 (Ajustes del círculo)**, pero **no se inicia
   sin permiso del usuario**. No se decide aquí.
3. Si el usuario autoriza F28, primero se comprueba su Definition of Ready, se carga solo su
   `spec.md` y se propone plan antes de escribir código.
4. **Parar.** No encadenar F28/F29 ni hacer commit o `push` sin permiso.
