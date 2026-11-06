---
id: F27
title: "Subidas globales"
milestone: M3
size: L
status: accepted
spec: complete
depends_on:
  - "F26"
blocks: []
design_refs:
  - "assets/design/screens/mis-circulos-escritorio.png"
  - "assets/design/screens/album-escritorio-seleccion-multiple.png"
  - "assets/design/screens/fotos-de-una-persona-movil.png"
  - "assets/design/screens/cola-de-subida-movil.png"
contracts:
  - "docs/03-architecture/api-contract.md"
  - "docs/03-architecture/uploads.md"
decisions:
  - "ADR-0006"
  - "ADR-0007"
---

# F27 — Subidas globales («Mis subidas»)

> **Milestone:** M3 · **Talla:** L · **Estado:** in-progress · **Spec:** completa
> **Depende de:** F26 · **Bloquea:** —
> **Auditoría:** **A**, decidida por el usuario el 2026-11-06 al autorizar que esta feature
> adelante el endpoint de imágenes privadas desde F29.

## Objetivo

Convertir `/uploads` en **«Mis subidas»**: todas las fotos que ha subido la persona autenticada,
agrupadas por **círculo** y por **álbum** («carpeta»), con miniaturas reales, el estado de las
subidas en curso y un contador en la navegación.

> **Cambio de alcance (2026-11-06).** La versión anterior de esta spec hablaba de «subidas
> recientes» y de un contador. El usuario pidió **todas** sus imágenes agrupadas por círculo y
> carpeta. Para mostrarlas hace falta adelantar `GET /photos/:photoId/image` (ADR-0006), que
> estaba asignado a F29. **F29 conserva** la galería del álbum, el scroll infinito, la selección,
> el filtro por persona y el `srcset`; solo hereda el endpoint ya construido.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- [Protocolo de revisión](../../06-process/review-protocol.md)
- No cargues el README completo ni otras specs.

### Diseño

No hay PNG canónico de esta pantalla. El diseño es **inferido** y se documenta en
[docs/02-design/screens.md](../../../docs/02-design/screens.md#diseño-inferido):

- [Mis círculos · escritorio](../../../assets/design/screens/mis-circulos-escritorio.png) como
  patrón de cabecera, secciones y enlaces.
- [Álbum · escritorio · selección múltiple](../../../assets/design/screens/album-escritorio-seleccion-multiple.png)
  como patrón de rejilla de fotos.
- [Fotos de una persona · móvil](../../../assets/design/screens/fotos-de-una-persona-movil.png)
  como patrón de rejilla de 3 columnas y cabecera compacta.
- [Cola de subida · móvil](../../../assets/design/screens/cola-de-subida-movil.png) para el
  bloque «En curso».

### Contratos

- [docs/03-architecture/api-contract.md](../../../docs/03-architecture/api-contract.md)
- [docs/03-architecture/uploads.md](../../../docs/03-architecture/uploads.md)

### Decisiones

- [ADR-0006](../../../docs/03-architecture/adr/ADR-0006-image-delivery.md) — imágenes vía API.
- [ADR-0007](../../../docs/03-architecture/adr/ADR-0007-uploads.md) — subidas y variantes.

## Decisiones de producto (2026-11-06)

1. **Solo mis fotos.** Se filtra por `Photo.uploaderId = usuario autenticado`. Las fotos de otros
   miembros de los mismos álbumes no aparecen.
2. **Solo círculos donde sigo siendo miembro.** Si salí del círculo o me expulsaron, mis fotos de
   ese círculo dejan de listarse y la API responde `404` si se piden. La autoría se conserva en la
   base de datos, pero el acceso manda.
3. **«Carpetas» = álbumes.** La jerarquía es círculo → álbum → fotos.
4. **Miniaturas reales.** Se adelanta `GET /photos/:photoId/image` desde F29 y F27 pasa a nivel A.
5. **Contador** = archivos **pendientes + subiendo** de la cola de F26. Desaparece en 0.
6. **Pestaña móvil** «Subir» → «Subidas». La ruta `/uploads` no cambia.
7. **Sin visor.** Las miniaturas no abren nada: el visor es F30. La carpeta ofrece «Abrir álbum».

## Alcance

### Incluye

- Ruta `/uploads` real («Mis subidas») con cabecera, resumen y estados.
- `GET /api/me/uploads`: resumen agrupado por círculo y álbum con conteos y 4 previews.
- `GET /api/me/uploads/photos?albumId=&cursor=&limit=`: mis fotos de un álbum, paginadas.
- `GET /api/photos/:photoId/image?size=thumb|display|original`: entrega autenticada.
- Carpetas desplegables con rejilla y «Ver más».
- Bloque «En curso» que reutiliza la cola de F26 y abre su panel.
- Insignia de subidas activas en sidebar y barra inferior móvil.
- Renombrado de la etiqueta móvil de navegación.
- Invalidación del historial al completar una subida.
- Tests de API, componentes, autorización, accesibilidad y estados.

### No incluye

- Panel global, barra y cola global (F26, ya entregados): no se reimplementan.
- Visor de foto (F30).
- Galería de álbum, scroll infinito, selección y filtro por persona (F29).
- Descargas y ZIP (F33).
- Subidas en segundo plano ni persistencia tras recarga.
- Subir desde `/uploads`: se sigue subiendo desde el álbum.
- Búsqueda o filtros dentro de la página.

## Contrato (congelado el 2026-11-06)

### `GET /api/me/uploads`

Resumen agrupado de mis subidas visibles. Sin paginación: una fila por álbum.

```json
{
  "total": 23,
  "circles": [
    {
      "circle": { "id": "c_1", "name": "Familia" },
      "photosCount": 12,
      "albums": [
        {
          "album": { "id": "a_1", "title": "Costa Brava" },
          "photosCount": 5,
          "lastUploadAt": "2025-04-05T18:55:00.000Z",
          "preview": [
            { "id": "p_1", "thumbUrl": "/api/photos/p_1/image?size=thumb", "width": 3024, "height": 4032 }
          ]
        }
      ]
    }
  ]
}
```

- `preview` contiene como máximo **4** fotos, las más recientes del álbum
  (`createdAt desc, id desc`). Es decorativo en la UI.
- `total` es la suma de `photosCount` de todos los círculos.
- Orden: círculos por su `lastUploadAt` más reciente descendente y desempate por `circle.id`
  ascendente; álbumes por `lastUploadAt` descendente y desempate por `album.id` ascendente.
- Solo incluye círculos y álbumes con al menos una foto mía visible.
- Autorización: sesión (`401`). No hay parámetros.
- `Cache-Control: private, no-store`.

### `GET /api/me/uploads/photos?albumId=&cursor=&limit=`

```json
{ "items": ["PhotoDto"], "nextCursor": null, "total": 5 }
```

- `albumId` obligatorio (`400` si falta o no es válido).
- `cursor` opaco (máx. 512) y `limit` de 1 a 100 (defecto 24), como el resto de listados.
- Orden `createdAt desc, id desc`; keyset sobre `(createdAt, id)`.
- Solo fotos mías **de ese álbum**. `total` cuenta mis fotos visibles del álbum.
- Autorización: sesión y membresía en el círculo del álbum. Álbum inexistente, de otro círculo o
  sin membresía → `404 NOT_FOUND`, nunca `403`.
- `PhotoDto` completo (incluye `uploader`, `tags`, `thumbUrl` y `displayUrl`).
- `Cache-Control: private, no-store`.

### `GET /api/photos/:photoId/image?size=thumb|display|original`

Adelantado desde F29. Implementa ADR-0006.

- `size` es obligatorio. `thumb` y `display` para miembros; `original` exige `photo.download`
  (`403` si el círculo lo desactiva).
- Sin sesión → `401`. Foto inexistente, de un círculo sin membresía u objeto ausente en storage →
  `404`, sin distinguir casos.
- Respuesta: binario con `Content-Type` real (`image/webp` en `thumb`/`display`; `mimeType` de la
  foto en `original`), `Content-Length`, `Content-Disposition: inline`,
  `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=3600`, `Vary: Cookie` y
  `ETag` débil estable (`photoId`, `size` y `updatedAt`). `If-None-Match` coincidente → `304` sin
  cuerpo, **resuelto antes de leer el objeto**: el validador gana a un objeto ausente de forma
  intencional, porque el cliente ya tiene la representación y no se descarga el binario. Sin
  `If-None-Match`, un objeto ausente sigue siendo `404`.
- La clave del objeto se elige en servidor a partir de `size`; nunca llega del cliente ni se
  devuelve.
- Un fallo de storage en lectura → `500 INTERNAL_ERROR` con log sin datos personales.
- Sin límite de peticiones propio: el límite de descargas de 10/min es de F33 y se aplicará al
  endpoint compartido cuando exista.

## UX y estados

- **Cabecera:** `h1` «Subidas» y resumen «N fotos en M círculos». Si solo hay un círculo, se
  nombra el círculo.
- **En curso:** bloque sobre la lista, solo si hay archivos pendientes, subiendo o con error.
  Reutiliza los datos de la cola de F26, muestra nombre, álbum y estado, y un botón «Abrir cola»
  que abre el panel existente. No duplica la cola ni permite reintentar desde aquí.
- **Sección de círculo:** `h2` con el nombre, contador y enlace «Ver círculo».
- **Carpeta:** botón de divulgación con mosaico 2×2 decorativo, título, «N fotos» y «Última
  subida…». `aria-expanded` y `aria-controls`; al abrir carga la rejilla de ese álbum.
- **Rejilla:** 3 columnas en móvil y 4–6 en escritorio; miniaturas con `alt` útil, `loading="lazy"`,
  `decoding="async"`, `width`/`height` y sin salto de layout. «Ver más» si hay cursor.
- **Abrir álbum:** enlace secundario al álbum para subir más o ver lo de los demás. Hasta F29 el
  álbum muestra su estado vacío de galería.
- **Estados:** carga con esqueletos (`aria-busy`), vacío propio, error con «Reintentar», carga de
  «Ver más» y error de página. El vacío enlaza a «Mis círculos» para subir desde un álbum.
- **Contador:** insignia con las subidas activas. Nombre accesible del enlace: «Subidas, N en curso». Se
  oculta en 0. **No crea una región viva propia:** los cambios de estado ya se anuncian por el
  `UploadAnnouncer` de F26 y duplicarlo diría lo mismo dos veces; la cifra forma parte del nombre
  accesible del enlace y se lee al enfocarlo.
- **Móvil/escritorio y claro/oscuro:** con tokens; sin hover como única señal.

## Criterios de aceptación

- **AC-01.** `/uploads` muestra solo fotos subidas por la persona autenticada, agrupadas por
  círculo y álbum, y se llega desde el sidebar y desde la barra inferior.
- **AC-02.** Las fotos de círculos de los que ya no soy miembro no aparecen, ni en el resumen ni
  en el listado (`404` al pedirlas por API).
- **AC-03.** Cada círculo muestra sus carpetas con título, contador de mis fotos, mosaico de hasta
  4 miniaturas y última subida, ordenadas por actividad reciente.
- **AC-04.** Al abrir una carpeta se cargan mis fotos de ese álbum, paginadas por cursor, sin
  duplicados ni saltos, con «Ver más».
- **AC-05.** El contador de la navegación muestra pendientes + subiendo y desaparece al terminar,
  con nombre accesible que lo anuncia.
- **AC-06.** El bloque «En curso» refleja la cola de F26 y abre su panel, sin duplicar la cola.
- **AC-07.** La página tiene estados de carga, vacío, error con reintento y carga de «Ver más».
- **AC-08.** Las imágenes se sirven autenticadas: `thumb`/`display` para miembros, `original` solo
  con `photo.download`, con caché privada, `ETag` y `304`.
- **AC-09.** Móvil (320–375) y escritorio (1024–1440), claro y oscuro, con teclado, foco,
  encabezados y alternativas textuales; sin errores de consola ni de hidratación.
- **AC-10.** Al completar una subida, el historial se refresca sin recargar la página.
- **AC-11.** La etiqueta móvil pasa a «Subidas» sin cambiar rutas ni el número de destinos de la
  barra inferior.

## Pruebas

- **API:** resumen (solo mías, orden, conteos, 4 previews, exclusión de círculos sin membresía,
  vacío), listado (cursor, límite, total, 404 de álbum ajeno, 404 sin membresía) e imágenes
  (401, 404, 403 de `original`, 200 con cabeceras, 304, objeto ausente, `size` inválido).
- **Web:** render de secciones y carpetas, expansión con «Ver más», estados de carga/vacío/error,
  bloque «En curso», insignia, etiqueta móvil, invalidación tras subida.
- **Accesibilidad:** axe en navegador real, recorrido con teclado, foco tras expandir, anchos
  320/375/768/1024/1440 y ambos temas.

## Archivos previstos

- `packages/shared/src/schemas/my-uploads.ts` (o equivalente) y sus exports.
- `apps/api/src/modules/photos/uploads-routes.ts`, `uploads-service.ts`, `uploads-cursor.ts`,
  `image.ts` y tests.
- `apps/web/src/routes/_app.uploads.tsx`.
- `apps/web/src/features/uploads/history/**` (página, secciones, carpeta, rejilla, queries).
- `apps/web/src/components/layout/navigation.ts`, `primary-nav.tsx`, `app-shell.tsx` y tests.
- `apps/web/src/features/uploads/album-refresh.ts` (invalidación adicional del historial).

## Verificación

```bash
pnpm --filter @memora/api test uploads
pnpm --filter @memora/api test image
pnpm --filter @memora/web test uploads
pnpm --filter @memora/web test app-shell
pnpm typecheck
pnpm lint
pnpm format:check
pnpm --filter @memora/api test
```

## Riesgos y deudas conscientes

- **Sin migración.** El índice único `(uploaderId, clientUploadId)` cubre el filtro por autor. El
  resumen usa `groupBy` para conteos y una consulta con `ROW_NUMBER()` para las previews, sin N+1.
  Si el volumen lo exige, se propondrá un índice `(uploaderId, createdAt, id)` en otra feature.
- **`original` sin límite de descargas** hasta F33. Se documenta y F33 lo añadirá al endpoint
  compartido.
- **Sin visor** hasta F30; las miniaturas no son interactivas.
- **Enlace «Abrir álbum»** lleva a un álbum cuya galería llega en F29; el destino es honesto pero
  incompleto hasta entonces.
- **Seed sin cambios.** Añadir fotos o círculos rompería tests que cuentan datos. La agrupación por
  círculos se prueba con fixtures y, en la aceptación, creando un segundo círculo y subiendo fotos.

## Definition of Ready

- [x] Dependencias `done`: F26 (2026-11-06).
- [x] Decisiones resueltas: siete decisiones de producto del 2026-11-06.
- [x] Contratos congelados: tres endpoints y sus DTO.
- [x] Diseño inferido documentado; no hay PNG canónico y se revisa con `design-auditor`.
- [x] Datos de prueba: fixtures de API y seed existente más un círculo creado en la aceptación.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.
