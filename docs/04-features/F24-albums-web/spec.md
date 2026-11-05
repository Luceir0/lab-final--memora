---
id: F24
title: "Albums web"
milestone: M3
size: M
status: done
spec: complete
depends_on:
  - "F18"
  - "F23"
blocks:
  - "F26"
  - "F29"
design_refs:
  - "assets/design/screens/album-movil-vacio.png"
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
  - "assets/design/screens/crear-album-movil-guardando.png"
  - "assets/design/screens/crear-album-escritorio-validacion-y-error.png"
  - "assets/design/screens/circulo-movil.png"
contracts:
  - "docs/02-design/screens.md"
  - "docs/03-architecture/api-contract.md"
decisions: []
---

# F24 — Albums web

> **Milestone:** M3 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F18, F23 · **Bloquea:** F26, F29
> **Aceptación:** usuario, 2026-11-05 · **Cierre:** 2026-11-05

## Objetivo

Construir creación, detalle y cabecera de álbum con estados.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/album-movil-vacio.png](../../../assets/design/screens/album-movil-vacio.png)
- [assets/design/screens/album-escritorio-seleccion-multiple.png](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)
- [assets/design/screens/crear-album-movil-guardando.png](../../../assets/design/screens/crear-album-movil-guardando.png)
- [assets/design/screens/crear-album-escritorio-validacion-y-error.png](../../../assets/design/screens/crear-album-escritorio-validacion-y-error.png)
- [assets/design/screens/circulo-movil.png](../../../assets/design/screens/circulo-movil.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

Decisiones cerradas en G1 el 2026-11-05:

- **D1 — Acciones.** Se incluyen crear, editar (título, descripción y fecha), vaciar y eliminar. Vaciar y eliminar permiten al owner o al creador del álbum, sin depender de `membersCanCreateAlbums`; eliminar sigue exigiendo que el álbum esté vacío. Editar sigue la regla de `can()` (owner o creador con `membersCanCreateAlbums`).
- **D2 — Portada.** El bloque de portada se muestra deshabilitado con una nota. El contrato no acepta portada al crear y el `PATCH` solo admite fotos del propio álbum; se elegirá en F29, cuando exista galería. La portada no es un objeto aparte: **F26 sube la imagen como una foto más del álbum y F29 la elige entre las fotos del álbum y la marca como `coverPhotoId`**.
- **D3 — Fecha.** Selector de mes (`type=month`). Se persiste el día 1 a las 00:00 UTC y se muestra «agosto 2026»; el formateo usa UTC para no desplazar el mes. El alta precarga el mes actual (`currentMonthInput`, fecha local) y lo guarda si el usuario no lo cambia; la edición conserva la fecha del álbum o queda vacía si no tenía. El campo muestra el hint «Se guardará como el primer día del mes.».
- **D4 — Detalle con fotos.** Cabecera y metadatos, más un panel neutro que explica que la galería llega en F29. El estado vacío solo se pinta con `photosCount = 0`.
- **D5 — Subidas.** El CTA «Subir fotos» del vacío y de la cabecera se muestra deshabilitado con nota (F26). Las descargas de la cabecera también (F33).
- **D6 — Orden.** Se omite el control «Más recientes» del diseño; la API solo ofrece creación descendente.
- **D7 — Detalle.** Página propia con migas y cabecera, sin héroe ni pestañas del círculo. La ruta se anida en el layout del círculo, pero este detecta el detalle y no pinta el chrome.
- **D8 — Móvil.** Una columna (AC-03), aunque el PNG `circulo-movil.png` muestre dos. Se registra como desviación del diseño.
- **D9 — Cabecera.** «Subir fotos» y «Descargar álbum» visibles pero deshabilitados con razón accesible.

> **Decisión del usuario (2026-11-05).** El creador de un álbum puede vaciarlo y eliminarlo siempre, aunque el admin revoque después `membersCanCreateAlbums`; el owner sigue pudiendo todo. Eliminar sigue exigiendo que el álbum esté vacío (`409 ALBUM_NOT_EMPTY`). Es un cambio de contrato autorizado sobre F23: vive en `can()` y la UI debe mostrar vaciar/eliminar al owner y al creador.

Desviaciones del diseño registradas: una columna en móvil (D8), portada deshabilitada (D2), acciones de subida/descarga deshabilitadas (D5), ausencia del desplegable de orden (D6), orden móvil Título → Fecha → Descripción para que el foco coincida con el orden visual (WCAG 2.4.3) y, en el vacío del álbum, un único CTA «Subir fotos» deshabilitado con nota: la acción secundaria «Cámara» del PNG se difiere a F26.

Nota de accesibilidad (Menor): el resumen de validación (`InlineAlert` danger, `role="alert"`) y el error de campo (`FieldMessages`, `role="alert"`) pueden anunciarse dos veces al lector. Se deja para una revisión del kit de formularios; no se cambia el kit en F24.

Nota de orden del formulario: en móvil el orden es Título → Fecha → Descripción, no el del PNG (Título → Descripción → Fecha). Se prioriza que el orden de foco coincida con el orden visual en todos los breakpoints (WCAG 2.4.3); en escritorio Título y Fecha comparten la primera fila y la Descripción ocupa la segunda a ancho completo.

Nota sobre la píldora de fotos: usa el token `inverse` y es tema-relativa; en tema oscuro se invierte a chip claro con contraste correcto. Si el diseño oscuro exigiera un scrim fijo, se decide en una revisión de tokens, no en F24.

Nota de fecha (D3): el formulario mantiene el mes como `YYYY-MM` y valida el formato en el fallback de texto con el mensaje «Indica un mes válido.»; al enviar convierte al día 1 a las 00:00 UTC o `null`. El payload de la API sigue siendo ISO o `null`.

Decisión 2026-11-05 (portada): cuando F26 permita subir portada, esa imagen se persistirá como una foto más del álbum y se marcará como `coverPhotoId`; no será un objeto aparte. F24 solo registra la invariante: la subida es de F26 y la elección entre las fotos del álbum, de F29.

Nota de rejilla (cambio de aceptación, 2026-11-05): las cards de álbum tienen altura uniforme. La rejilla usa `auto-rows-fr`; cada `li` y cada enlace son `h-full`, y el bloque de texto es `flex-1`, de modo que las cards de una misma fila igualan altura aunque el título o la descripción ocupen distinto número de líneas.

Nota de permisos en la UI (cambio de aceptación, 2026-11-05): vaciar y eliminar se ofrecen al owner y al creador del álbum, sin mirar `membersCanCreateAlbums`; editar sigue la regla de `can()`. Eliminar sigue exigiendo un álbum vacío (`409 ALBUM_NOT_EMPTY`). El 403 de vaciar o eliminar usa la copia «Solo quien creó el círculo o el álbum puede vaciar o eliminar álbumes.».

Nota de recuperación del 409 (cambio de aceptación, 2026-11-05): si el borrado devuelve `ALBUM_NOT_EMPTY` con un recuento cacheado obsoleto (`photosCount = 0`), el detalle refresca la consulta y ofrece el atajo «Vaciar» con el recuento real, sin abrir un modal sobre datos viejos.

Nota de visibilidad del vaciado (cambio de aceptación, 2026-11-05): «Vaciar álbum» solo aparece en el menú si `photosCount > 0`; con 0 fotos no hay ítem ni modal de vaciado.

## Alcance

### Incluye

- AlbumForm (crear y editar)
- AlbumHeader
- AlbumGrid base
- Estados vacío/carga/error
- Guardando
- Validación
- Acción «Vaciar álbum» para owner o creador, con confirmación
- Acción «Eliminar álbum» para owner o creador, con `ALBUM_NOT_EMPTY` y guía a vaciar
- Ruta de detalle `/circles/:circleId/albums/:albumId`

### No incluye

- Visor (F30)
- Subidas (F26)
- Descargas (F33)
- Galería de fotos y elección de portada (F29)
- Ordenación distinta de la creación descendente (D6)

## Entregables

- `apps/web/src/routes/_app.circles.$circleId.albums.$albumId.tsx`
- `apps/web/src/features/albums/**`

## UX y estados

- vacío
- cargando
- error
- guardando
- validación

## Criterios de aceptación

- **AC-01.** Crear álbum valida y guarda.
- **AC-02.** Detalle muestra metadatos.
- **AC-03.** Móvil una columna; escritorio rejilla.
- **AC-04.** Estado vacío guía a subir.
- **AC-05.** Errores comprensibles.
- **AC-06.** Teclado y foco.
- **AC-07.** Borrar álbum no vacío muestra `ALBUM_NOT_EMPTY` y guía a vaciarlo.
- **AC-08.** “Vaciar álbum” pide confirmación y actualiza la galería.

## Pruebas

- RTL formulario
- Detalle
- Estados
- Responsive

## Archivos previstos

- `apps/web/src/routes/_app.circles.$circleId.albums.$albumId.tsx`
- `apps/web/src/features/albums/**`
- `apps/web/src/features/circles/circle-detail-{page,hero,layout,context}.tsx`
- `packages/ui/src/components/text-field.tsx` (solo el tipo `month`)

## Verificación

- `pnpm --filter @memora/web test albums`

## Definition of Ready

- [x] Dependencias `done`. F18 y F23 cerradas.
- [x] Decisiones resueltas (D1–D9).
- [x] Contratos congelados (F23).
- [x] Diseño enlazado.
- [x] Datos de prueba (seed con dos álbumes con fotos y un círculo de solo lectura).
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna bloqueante. La galería real y la elección de portada llegan en F29; las subidas en F26 y las descargas en F33.

## Cierre (G5, 2026-11-05)

- **Estado:** `done`. La aceptación es de la web, no de backend: se probó el flujo real sobre la API de F23.
- **Aceptación:** el usuario aceptó F24 el **2026-11-05**, tras aplicar los cinco cambios de aceptación (altura uniforme de cards, vaciar/eliminar para owner o creador, «Vaciar álbum» solo con fotos, portada como foto en F26/F29 y mes actual por defecto en el alta). Pidió expresamente cerrar la feature.
- **Revisión independiente (nivel B):** aprobada en la ronda de cambios, con Menores/Nits; corregidos los de código (403 y 409).
- **Auditorías del delta:** diseño **apto con correcciones menores** (alturas idénticas a 1440/1024/768/375 en claro y oscuro) y accesibilidad **apta** (0 violaciones de axe, teclado y foco correctos).
- **Verificación final:** `pnpm --filter @memora/web test albums` → **7 archivos y 113 tests**; web **491**; shared **150**; API **246**; api-client **39**; ui **281**; suite completa **8/8 tareas**; `typecheck` 9/9; `lint` 6/6; `format:check` OK; build con **5 rutas prerenderizadas**; `docs:check` 191 archivos, 538 enlaces y 0 rotos; `agents:check` 43 specs y 43 filas.
- **Login:** la API estaba en un bucle de `node --watch` y devolvía 500; se reinició limpia (`node src/index.ts` con `DATABASE_URL=…/memora`) y `health`, `login` y la web respondieron 200. El usuario debe recargar con `Ctrl+Shift+R` o en incógnito.
- **Datos de prueba:** con autorización del usuario se borraron cuatro álbumes de prueba («Álbum de prueba», «Un título larguísimo…», «Auditoría vacío» y «Auditoría creada»); quedan solo los dos de seed, «Verano en la costa» y «Lisboa en primavera».
- **Cierre operativo:** PR #38 y PR de documentación #39, merge `8c04be8d5a60ec6d93e8fc3a816f37b60c67acda`, CI PR `42072093665` y `main` `42072660244` en verde. **Pendiente:** los pendientes técnicos del handoff (lector de pantalla real, zoom solo-texto, portada F26/F29, subidas F26, descargas F33, doble anuncio de validación, cuerpo genérico del 403 en la API, Mateo creador con fotos, paginación >24 y cursor inválido).
