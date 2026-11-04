# Contrato de API

Base: `/api`. Auth por cookie `memora_session`. JSON salvo subidas y descargas.

## Convenciones

- Request/response definidos con Zod en `packages/shared`.
- Errores:

```json
{
  "code": "FORBIDDEN",
  "message": "No tienes acceso a este círculo.",
  "details": null
}
```

- Registro único de errores. La tabla de abajo es la fuente canónica; `packages/shared` define `ErrorCode` y la API lo usa.
- Códigos:

| HTTP | `code` | Uso |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Entrada inválida |
| 401 | `UNAUTHENTICATED` | Sin sesión o expirada |
| 403 | `FORBIDDEN` | Sesión válida sin permiso |
| 404 | `NOT_FOUND` | Recurso inexistente o de otro círculo (no revelar existencia) |
| 409 | `CONFLICT` | Conflicto genérico |
| 409 | `ALBUM_NOT_EMPTY` | Borrar álbum con fotos |
| 413 | `FILE_TOO_LARGE` | Archivo por encima del límite |
| 413 | `PAYLOAD_TOO_LARGE` | Cuerpo de petición por encima del límite |
| 413 | `QUOTA_EXCEEDED` | Cuota del círculo superada |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Formato no permitido |
| 422 | `UNPROCESSABLE_ENTITY` | Imagen válida pero no procesable |
| 422 | `INVALID_IMAGE` | Imagen corrupta o píxeles excesivos |
| 422 | `PROCESSING_FAILED` | Fallo de procesamiento de imagen |
| 429 | `RATE_LIMITED` | Límite de peticiones |
| 500 | `INTERNAL_ERROR` | Error interno sin detalles sensibles |

- `details` es un array **no vacío** o `null`; `[]` se rechaza. Cada elemento incluye al menos uno de `field`, `message`, `resource` o `limit`, nunca datos de otros círculos. `null` significa «sin detalles».
- Paginación por cursor: `?cursor=<opaco>&limit=24`; respuesta `{ items, nextCursor }`. `limit` por defecto 24, mínimo 1 y máximo 100; fuera de rango se rechaza con `400`, no se recorta.
- Fechas ISO 8601 UTC.
- No se exponen `objectKey`, `tokenHash`, `passwordHash` ni datos de otros círculos.
- OpenAPI generado desde Zod.
- Fuente única: `packages/shared/src/schemas/**` (requests, respuestas y DTOs); la API no redefine estos contratos.
- `packages/shared` es la referencia de los tipos; este documento explica la semántica y no duplica cada esquema.

### Límites de entrada

Longitudes en caracteres. Fuente: `packages/shared/src/schemas/**`. Los valores por encima se rechazan con `400 VALIDATION_ERROR`.

| Campo | Límite |
| --- | --- |
| `name` (usuario y círculo) | 1–80 |
| `title` (álbum) | 1–120 |
| Descripción de círculo | 500 |
| Descripción de álbum y de foto | 1000 |
| `placeName` | 200 |
| `clientUploadId` | 128 |
| `cursor` | 512 |
| `id` (params y referencias) | 64 |
| Token de invitación | 256 |
| `password` | 8–128, sin reglas de composición |

## Salud

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | `{ status, version, timestamp }`; sin datos sensibles ni sesión |

## Auth

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/register` | Crear cuenta y sesión |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/csrf` | Token CSRF |
| GET | `/me` | Usuario actual |
| PATCH | `/me` | Nombre y tema; el email es inmutable y el avatar no se edita en el MVP |
| GET | `/me/uploads` | Subidas recientes del usuario |

## Círculos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/circles` | Círculos del usuario |
| POST | `/circles` | Crear; `settings` opcional (si falta, defaults) |
| GET | `/circles/:circleId` | Detalle con stats |
| PATCH | `/circles/:circleId` | Editar nombre, descripción, portada, settings |
| DELETE | `/circles/:circleId` | Borrar (owner) |
| GET | `/circles/:circleId/members` | Miembros |
| DELETE | `/circles/:circleId/members/:userId` | Expulsar (owner) |
| POST | `/circles/:circleId/leave` | Salir (member) |
| GET | `/circles/:circleId/activity` | Actividad del círculo |
| GET | `/activity` | Actividad global de mis círculos |

`GET /circles/:circleId` incluye `stats: { membersCount, albumsCount, photosCount, storageBytes, lastUploadAt }`.

Semántica del CRUD implementada en F17:

- `GET /circles` ordena por `updatedAt desc` con desempate `id desc`; el cursor es keyset opaco sobre `(updatedAt, id)` y `limit` va de 1 a 100 (defecto 24).
- `POST /circles` acepta `settings` opcional. Si no viene, se aplican los valores por defecto (`membersCanCreateAlbums`, `membersCanUpload`, `membersCanDownload` y `membersCanTag` en `true`). Si viene, debe ser el objeto completo: falta una flag o llega una desconocida → `400 VALIDATION_ERROR`, nunca un merge con los defaults.
- `coverPhotoId` inexistente o de otro círculo → `404 NOT_FOUND`; `null` limpia la portada.
- `DELETE /circles/:circleId` responde `204`; un círculo ya inexistente → `404 NOT_FOUND`.
- Sin sesión → `401`; sin membresía → `404` (nunca `403`, para no revelar existencia); miembro sin permiso en `PATCH`/`DELETE` → `403`.

Semántica de miembros cerrada en F21:

- `GET /circles/:circleId/members` está disponible para **cualquier miembro**. Orden estable `joinedAt asc` con desempate `id asc`, de modo que el propietario queda primero porque su membresía se crea junto con el círculo. Keyset opaco sobre `(joinedAt, id)` y `limit` de 1 a 100 (defecto 24).
- `MemberDto` es `{ user, role, joinedAt, photosCount }`. `photosCount` es el número de fotos **de ese círculo** en las que la persona está etiquetada (columna «Aparece en»); no cuenta fotos subidas ni etiquetas de otros círculos, y es `0` si no aparece en ninguna. Se calcula con una consulta agrupada por página, nunca una por miembro.
- **Ningún payload de miembros incluye `email`.** Es una desviación consciente del mock de escritorio por minimización de datos; `UserDto` sigue sin email.
- `DELETE /circles/:circleId/members/:userId` es **solo del propietario**, decidido por `Circle.ownerId` y no por el `role` de la fila: un miembro recibe `403 FORBIDDEN`, un extraño `404 NOT_FOUND`. Un objetivo que no está en el círculo → `404`. El propietario no se puede expulsar, ni a sí mismo → `409 CONFLICT` con mensaje genérico.
- `POST /circles/:circleId/leave` responde `204` al miembro; el propietario → `409 CONFLICT` porque debe borrar el círculo; sin membresía → `404`.
- Expulsión y salida borran, **en una transacción**, los `PhotoTag` de esa persona en fotos de ese círculo y su `Membership`. Las fotos permanecen con su autoría, las etiquetas que creó para otras personas se conservan, las etiquetas suyas en otros círculos no se tocan y `Activity` no se borra.


## Invitaciones

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/circles/:circleId/invitations` | Crear enlace; email opcional |
| GET | `/circles/:circleId/invitations` | Pendientes (owner) |
| DELETE | `/circles/:circleId/invitations/:invitationId` | Revocar |
| GET | `/invitations/:token` | Datos mínimos para la preview |
| POST | `/invitations/:token/accept` | Unirse |

`GET /invitations/:token` solo devuelve `{ circleName, inviterName, expiresAt, state }`, con `state: valid | expired | revoked | already_member`. Nunca miembros, fotos ni álbumes.

`POST /invitations/:token/accept` devuelve `{ circle, state }`: el `CircleDto` ya con el rol del usuario y `state: valid` al unirse o `already_member` si ya lo era. Es idempotente y no añade un booleano paralelo.

Semántica cerrada en F19:

- `POST /circles/:circleId/invitations` responde `201` y **el token en claro aparece una sola vez**, en esa respuesta; no se vuelve a exponer en el listado ni en la preview. `Cache-Control: private, no-store`. En producción el email exige `EMAIL_PROVIDER=resend`; el fallo de envío no revierte la invitación.
- `GET /circles/:circleId/invitations` lista solo las **pendientes**: excluye revocadas, aceptadas y caducadas.
- `DELETE /circles/:circleId/invitations/:invitationId` responde `204` y es **idempotente**. Revocar una invitación ya aceptada es un **no-op**: no expulsa al miembro y el enlace sigue siendo reutilizable hasta caducar (decisión a confirmar en F20).
- `GET /invitations/:token` resuelve `state` con precedencia **`revoked` > `expired` > `already_member` > `valid`**.
- `POST /invitations/:token/accept` con invitación caducada o revocada → `409 CONFLICT` con mensaje genérico, sin revelar el motivo ni datos del círculo. Una aceptación correcta escribe membresía y `Activity` `member.joined` en una transacción y es idempotente.
- Rate limit de invitaciones: **10/hora por usuario**.
- El token viaja en el path por contrato: la API lo redacta en sus logs de petición; los access logs del proxy inverso se redactan en **F42**.

## Álbumes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/circles/:circleId/albums` | Lista |
| POST | `/circles/:circleId/albums` | Crear |
| GET | `/albums/:albumId` | Detalle |
| PATCH | `/albums/:albumId` | Editar |
| DELETE | `/albums/:albumId` | Borrar solo owner y solo si está vacío; si no, `409 ALBUM_NOT_EMPTY` |
| DELETE | `/albums/:albumId/photos` | Vaciar álbum (owner, confirmación; borra fotos y objetos) |

## Fotos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/albums/:albumId/photos?cursor=&limit=&personId=` | Galería paginada |
| POST | `/albums/:albumId/photos` | Subida multipart |
| GET | `/photos/:photoId` | Detalle |
| PATCH | `/photos/:photoId` | Descripción, fecha, lugar |
| DELETE | `/photos/:photoId` | Borrar: uploader o owner |
| GET | `/photos/:photoId/image?size=thumb\|display\|original` | Imagen autenticada |
| POST | `/photos/:photoId/tags` | Etiquetar miembro |
| DELETE | `/photos/:photoId/tags/:userId` | Quitar etiqueta |
| GET | `/circles/:circleId/members/:userId/photos` | Fotos de esta persona |

`PhotoDto` incluye `clientUploadId` (string o `null`) para que el cliente reconcilie su cola tras un reintento. No incluye claves de almacenamiento ni coordenadas: solo `placeName`.

`GET /circles/:circleId/members/:userId/photos` (F21) lista solo fotos de **ese círculo** en las que el miembro indicado está etiquetado, con `PhotoDto` completo (`uploader`, `tags`, `thumbUrl` y `displayUrl`). Orden `createdAt desc` con desempate `id desc`, keyset opaco y `limit` 1–100 (defecto 24). Tanto el llamante como el objetivo deben pertenecer al círculo; si cualquiera de los dos no es miembro, la respuesta es `404 NOT_FOUND`, para no revelar usuarios de otros círculos. Las URLs apuntan a `GET /photos/:photoId/image?size=thumb|display`; ese endpoint llega en **F29**, así que en F21 solo se construyen las URLs.


## Descargas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/photos/:photoId/download` | Original como adjunto |
| POST | `/albums/:albumId/downloads` | Crear job de álbum o selección |
| GET | `/downloads/:jobId` | Estado y `progress` |
| GET | `/downloads/:jobId/file` | Descargar ZIP listo |

Body de creación:

```json
{ "photoIds": ["..."] }
```

Si `photoIds` no viene, se descarga el álbum completo. Límite 500 fotos / 2 GB.

`DownloadJobDto.progress` es un entero 0–100 o `null`. Es derivado: la API lo calcula al leer el job y no se persiste. Detalle en [downloads.md](downloads.md).

## Actividad

`GET /circles/:circleId/activity?cursor=` devuelve:

```json
{
  "items": [
    {
      "id": "...",
      "type": "photo.uploaded",
      "actor": { "id": "...", "name": "Lucas" },
      "album": { "id": "...", "title": "Verano en Mallorca" },
      "count": 18,
      "createdAt": "2026-10-25T10:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

La API puede agrupar eventos de subida por actor/álbum/intervalo; el contrato devuelve `count`.

## Subidas

- `multipart/form-data`: `file`, `clientUploadId`, `takenAt?`, `description?`.
- El `file` no se modela en Zod: el contrato compartido valida solo los campos de texto y el binario lo valida F25 (MIME por magic bytes, tamaño y píxeles). La respuesta `201` es un `PhotoDto`.
- Un archivo por petición; el cliente controla concurrencia.
- Errores por archivo con `code` y `message`.
- Idempotencia por `(uploaderId, clientUploadId)`: si se repite, se devuelve la foto existente con `200`.

## Imágenes

- Cookie obligatoria; sin acceso anónimo.
- `Cache-Control: private, max-age=3600`.
- `ETag` y `Content-Type` correctos.
- `original` solo si `membersCanDownload` está activo; `display` y `thumb` para miembros.
- Nunca se sirve el bucket directamente.

## OpenAPI

- Generado en `/api/openapi.json`.
- UI de documentación solo en desarrollo o protegida.
- Cada endpoint tiene descripción, permisos y errores.

## Rate limits

| Acción | Límite orientativo |
| --- | --- |
| Login | 5/min por IP + email |
| Registro | 10/hora por IP |
| Invitaciones | 10/hora por usuario |
| Subidas | 60/min por usuario |
| Descargas | 10/min por usuario |
