# Subidas de imágenes

## Flujo

```text
Cliente selecciona archivos
  → valida tipo/tamaño en cliente (orientativo)
  → POST multipart /albums/:albumId/photos (una por archivo, concurrencia 3)
  → Fastify valida sesión, Origin, CSRF, pertenencia y permiso
  → valida magic bytes, tamaño y píxeles
  → pre-chequea la cuota con el tamaño crudo
  → extrae EXIF (orientación, fecha, GPS) en memoria
  → geocodifica GPS en memoria (deadline total 3 s)
  → genera original reencodeado + display + thumb con sharp
  → registra claves y guarda original, display y thumb en S3 privado
  → comprueba la cuota con el tamaño procesado (SELECT … FOR UPDATE de Circle)
  → guarda Photo + Activity en una transacción
  → devuelve PhotoDTO
```

Si algo falla después del primer `put`, se borran los objetos ya escritos y no se publica la foto.

## Límites

| Límite | Valor |
| --- | --- |
| Tamaño por archivo | 25 MB |
| Cuota por círculo | 2 GB |
| Archivos por lote | 20 |
| Píxeles máximos | 50 MP |
| Concurrencia cliente | 3 |
| Reintentos | 2 con backoff |
| Formatos | JPEG, PNG, WebP |
| HEIC | No asumido: `sharp@0.35.5` no anuncia `.heic`; ver nota de HEIC en Validación |

## Validación

- `Content-Type` no es suficiente: manda el magic bytes, comprobado con `file-type`.
- Aceptados: JPEG, PNG y WebP. Rechazo con `415 UNSUPPORTED_MEDIA_TYPE` para SVG, GIF, HEIC, HEIF y AVIF.
- **HEIC:** `sharp@0.35.5` anuncia soporte HEIF pero solo lista `.avif`; no se ha probado un `.heic` real, así que F25 lo rechaza con `415` y la pregunta abierta de la spec queda resuelta por la vía del rechazo claro. Lo mismo para HEIF y AVIF, que tampoco están en el alcance.
- Archivo corrupto o no decodificable → `422 INVALID_IMAGE`.
- Imagen válida pero por encima de 50 MP → `422 INVALID_IMAGE`.
- **Desviación consciente (F25):** no hay timeout real de `sharp`. La única defensa frente a una decodificación desproporcionada es el límite de 50 MP. Queda como Menor en el handoff, no como pendiente bloqueante.
- Nombre original solo para mostrar; nunca para la clave S3.
- Cuota comprobada dos veces: pre-chequeo barato con el tamaño crudo antes de procesar, y comprobación autoritativa con el tamaño ya procesado bajo `SELECT … FOR UPDATE` de `Circle`. Si se supera, `413 QUOTA_EXCEEDED`.

## Variantes

| Variante | Tamaño | Formato | Uso |
| --- | --- | --- | --- |
| `thumb` | 400 × 400 cover | WebP | Galería |
| `display` | máx. 1600 px lado mayor | WebP | Visor |
| `original` | sin redimensionar | original | Descarga (requiere `membersCanDownload`) |

- El `original` se reencodea con la orientación aplicada y **sin metadatos**; en JPEG y WebP sale a **calidad 95**, en PNG se mantiene PNG.
- Las variantes se generan desde el **archivo crudo** recibido, no desde el original reencodeado, para evitar una segunda compresión.
- Los tres objetos se sirven siempre desde la API; el bucket nunca es público.

Claves:

```text
circles/{circleId}/photos/{photoId}/original.{ext}
circles/{circleId}/photos/{photoId}/display.webp
circles/{circleId}/photos/{photoId}/thumb.webp
```

## EXIF y privacidad

- `sharp().rotate()` aplica orientación y elimina la orientación.
- Se leen `DateTimeOriginal` y GPS **en memoria**; nada de EXIF se escribe en los objetos de salida.
- `takenAt`: si el formulario lo envía, manda; si no, `DateTimeOriginal` interpretado como **UTC**; si no hay, `null`.
- El GPS se usa solo para Nominatim; **no se guarda ni se loguea**. No hay columnas de latitud/longitud.
- `placeName` se guarda si la geocodificación funciona y se trunca a 200 caracteres.
- Se eliminan metadatos del original, `display` y `thumb`.
- No se muestran datos EXIF al cliente.

## Geocodificación

- Nominatim con `User-Agent` identificable.
- Caché en memoria por coordenadas redondeadas (3 decimales) y límite de frecuencia de 1 req/s.
- **Deadline total de 3 s**, contando la espera en la cola, no solo la petición; cota de cola de 32 y `maxAttempts` acotado. Si se agota, la foto se guarda sin lugar y la subida responde `201`.
- No se persiste la caché.
- Se puede editar `placeName` manualmente.
- Nunca se llama a Nominatim desde el navegador.

## Contrato

- Los campos de texto (`clientUploadId`, `takenAt?`, `description?`) se validan con Zod en `packages/shared` (`uploadPhotoFieldsSchema`).
- El binario `file` queda fuera del contrato Zod: no se puede representar como JSON. Lo valida el pipeline (MIME por magic bytes, tamaño y píxeles), según [api-contract.md](api-contract.md#subidas).
- La respuesta `PhotoDto` devuelve `clientUploadId` para que la cola del cliente reconcilie el archivo tras un reintento. Es `null` en fotos subidas fuera de la cola.

## Idempotencia

- `clientUploadId` generado en cliente.
- Único por `(uploaderId, clientUploadId)`.
- Si se repite, se devuelve la foto existente con `200`.
- **Cross-álbum:** repetir el mismo par desde otro álbum del mismo círculo también devuelve `200` con la foto ya creada; no se mueve ni se duplica.
- Si el usuario ya no pertenece al círculo de la foto existente → `409 CONFLICT`.
- La carrera de dos peticiones simultáneas con el mismo par está cubierta por la unique y `P2002`: queda una fila y no quedan objetos huérfanos.
- Evita duplicados por reintentos de red.

## Errores

| Código | Cuándo |
| --- | --- |
| `UNSUPPORTED_MEDIA_TYPE` | Formato no permitido (SVG, GIF, HEIC, HEIF, AVIF) |
| `FILE_TOO_LARGE` | Más de 25 MB |
| `QUOTA_EXCEEDED` | Cuota del círculo superada |
| `INVALID_IMAGE` | Corrupta o por encima de 50 MP |
| `VALIDATION_ERROR` | Campos de texto inválidos o más de un archivo (400) |
| `FORBIDDEN` | Sin permiso de subida |
| `NOT_FOUND` | Álbum inexistente o de otro círculo |
| `CONFLICT` | Repetición de una subida cuya foto ya no es accesible para el usuario |
| `PROCESSING_FAILED` | Fallo de `sharp` o de storage; el archivo no queda publicado |

## Cola cliente

- `useUploadQueue` con reducer y unión discriminada:
  `pending | uploading | done | error | cancelled`.
- Progreso por archivo y global.
- Retry individual; cancelación con `AbortController`.
- Aviso al salir con subidas en curso.
- La cola sobrevive a la navegación, no a la recarga.
- Sin subidas en segundo plano.

## Limpieza

- Las claves se registran **antes** del `put`, para poder borrarlas si algo falla después.
- Si falla la creación de la foto después de subir los objetos, se borran los tres (best-effort).
- **Vaciar un álbum ya borra los objetos (F25):** el servicio devuelve las claves, la ruta las elimina tras el commit con un pool de 8 y responde `200` aunque el storage falle, con aviso en el log. Cierra la deuda que F23 dejó abierta.
- Al borrar una foto, borrar sus tres objetos.
- Job periódico para huérfanos (futuro; documentado). Mientras no exista, un fallo de storage durante el vaciado puede dejar objetos sin referencia.
