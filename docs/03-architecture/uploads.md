# Subidas de imágenes

## Flujo

```text
Cliente selecciona archivos
  → valida tipo/tamaño en cliente (orientativo)
  → POST multipart /albums/:albumId/photos (una por archivo, concurrencia 3)
  → Fastify valida sesión, pertenencia y permiso
  → valida magic bytes, tamaño, píxeles
  → guarda original en S3 privado
  → extrae EXIF (orientación, fecha, GPS)
  → geocodifica GPS en memoria
  → genera thumb/display con sharp
  → guarda Photo + Activity
  → devuelve PhotoDTO
```

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

- `Content-Type` no es suficiente: usar `file-type` sobre los bytes.
- Rechazar SVG, GIF animado y archivos corruptos.
- `sharp` con límite de píxeles y timeout.
- **HEIC:** `sharp@0.35.5` anuncia soporte HEIF pero solo lista `.avif`; no anuncia `.heic`. No se ha probado un `.heic` real. F25 debe rechazarlo con `415 UNSUPPORTED_MEDIA_TYPE` o añadir una conversión validada con muestras reales; no se asume soporte.
- Nombre original solo para mostrar; nunca para la clave S3.
- Cuota comprobada antes de aceptar; si se supera, 413 con código `QUOTA_EXCEEDED`.

## Variantes

| Variante | Tamaño | Formato | Uso |
| --- | --- | --- | --- |
| `thumb` | 400 × 400 cover | WebP | Galería |
| `display` | máx. 1600 px lado mayor | WebP | Visor |
| `original` | sin redimensionar | original | Descarga (requiere `membersCanDownload`) |

Claves:

```text
circles/{circleId}/photos/{photoId}/original.{ext}
circles/{circleId}/photos/{photoId}/display.webp
circles/{circleId}/photos/{photoId}/thumb.webp
```

## EXIF y privacidad

- `sharp().rotate()` aplica orientación y elimina la orientación.
- Se leen `DateTimeOriginal` y GPS **en memoria**.
- El GPS se usa solo para Nominatim; **no se guarda**.
- `placeName` se guarda si la geocodificación funciona.
- Se eliminan metadatos de original, display y thumb.
- No se muestran datos EXIF al cliente.

## Geocodificación

- Nominatim con `User-Agent` identificable.
- Caché en memoria por coordenadas redondeadas (3 decimales) y límite de frecuencia. No se persiste.
- Timeout 3 s; si falla, la foto se guarda sin lugar.
- Se puede editar `placeName` manualmente.
- Nunca se llama a Nominatim desde el navegador.

## Contrato

- Los campos de texto (`clientUploadId`, `takenAt?`, `description?`) se validan con Zod en `packages/shared` (`uploadPhotoFieldsSchema`).
- El binario `file` queda fuera del contrato Zod: no se puede representar como JSON. Lo valida el pipeline (MIME por magic bytes, tamaño y píxeles), según [api-contract.md](api-contract.md#subidas).
- La respuesta `PhotoDto` devuelve `clientUploadId` para que la cola del cliente reconcilie el archivo tras un reintento. Es `null` en fotos subidas fuera de la cola.

## Idempotencia

- `clientUploadId` generado en cliente.
- Único por `(uploaderId, clientUploadId)`.
- Si se repite, se devuelve la foto existente con 200.
- Evita duplicados por reintentos de red.

## Errores

| Código | Cuándo |
| --- | --- |
| `UNSUPPORTED_MEDIA_TYPE` | Formato no permitido o HEIC no convertible |
| `FILE_TOO_LARGE` | > 25 MB |
| `QUOTA_EXCEEDED` | Cuota del círculo |
| `INVALID_IMAGE` | Corrupta o píxeles excesivos |
| `FORBIDDEN` | Sin permiso de subida |
| `NOT_FOUND` | Álbum inexistente o de otro círculo |
| `PROCESSING_FAILED` | Fallo de sharp/S3; el archivo no queda publicado |

## Cola cliente

- `useUploadQueue` con reducer y unión discriminada:
  `pending | uploading | done | error | cancelled`.
- Progreso por archivo y global.
- Retry individual; cancelación con `AbortController`.
- Aviso al salir con subidas en curso.
- La cola sobrevive a la navegación, no a la recarga.
- Sin subidas en segundo plano.

## Limpieza

- Si falla la creación de la foto después de subir el original, borrar objetos.
- Job periódico para huérfanos (futuro; documentado).
- Al borrar una foto, borrar sus tres objetos.
