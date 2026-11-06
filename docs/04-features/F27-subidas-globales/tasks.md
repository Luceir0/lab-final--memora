# Tasks — F27 Subidas globales («Mis subidas»)

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F26 `done`.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (2026-11-06).
- [x] Registrar talla L y auditoría A en el tablero.

## Documentación y contrato

- [x] Reescribir `spec.md` con el alcance de «Mis subidas».
- [x] Congelar `GET /api/me/uploads`, `GET /api/me/uploads/photos` y `GET /photos/:photoId/image`.
- [x] Anotar el diseño inferido en `docs/02-design/screens.md` y los componentes nuevos.
- [x] Trasladar el endpoint de imágenes de F29 a F27 en la documentación.

## API

- [x] Esquemas Zod y tipos en `packages/shared`.
- [x] `GET /api/me/uploads`: resumen por círculo y álbum, solo mis fotos y mis círculos.
- [x] `GET /api/me/uploads/photos`: listado por álbum con keyset, límite y total.
- [x] `GET /api/photos/:photoId/image`: thumb/display/original con permisos, cabeceras y 304.
- [x] Tests de autorización, acceso cruzado, paginación, previews, imágenes y errores.

## Web

- [x] Página «Mis subidas» en `/uploads` con cabecera y resumen.
- [x] Secciones por círculo y carpetas desplegables con mosaico y conteo.
- [x] Rejilla de fotos con «Ver más» y estados de carga/vacío/error.
- [x] Bloque «En curso» conectado a la cola de F26 y a su panel.
- [x] Insignia de subidas activas en sidebar y barra inferior.
- [x] Etiqueta móvil «Subidas» y nombre accesible con el contador.
- [x] Invalidación del historial al completar una subida.
- [x] Tests RTL/MSW de la página, la navegación y los estados.

## Revisión

- [x] `reviewer` independiente (nivel A, casos negativos 401/403/acceso cruzado).
- [x] `a11y-auditor` (jsdom + código; navegador real pendiente de G4).
- [x] `design-auditor` (diseño inferido y tokens).
- [x] Correcciones verificadas.

## Criterios de aceptación

- [x] AC-01: solo mis fotos, agrupadas y accesibles desde la navegación.
- [x] AC-02: sin fotos de círculos que dejé (`404` en API).
- [x] AC-03: carpetas con título, conteo, mosaico y última subida.
- [x] AC-04: fotos por álbum paginadas, sin duplicados ni saltos.
- [x] AC-05: contador de subidas activas con nombre accesible.
- [x] AC-06: bloque «En curso» sin duplicar la cola.
- [x] AC-07: estados de carga, vacío, error y «Ver más».
- [x] AC-08: imágenes autenticadas con permisos, caché y `ETag`.
- [x] AC-09: responsive, temas, teclado y foco (código y tests; barrido real en G4).
- [x] AC-10: refresco tras completar una subida.
- [x] AC-11: etiqueta móvil «Subidas» sin romper la navegación.

## Verificación

- [x] `pnpm --filter @memora/api test uploads`
- [x] `pnpm --filter @memora/api test image`
- [x] `pnpm --filter @memora/web test uploads --maxWorkers=2`
- [x] `pnpm --filter @memora/web test app-shell --maxWorkers=2`
- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm format:check`
- [x] `pnpm --filter @memora/api test`
- [ ] Prueba manual móvil/escritorio, claro/oscuro y segunda cuenta sin acceso (G4).

## Cierre

- [x] Aceptación del usuario (G4) el 2026-11-06.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas (G5).
- [x] Commit propuesto (sin ejecutar).
