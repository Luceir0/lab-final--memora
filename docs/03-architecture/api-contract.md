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

- Códigos: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422 UNPROCESSABLE_ENTITY`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`.
- Paginación por cursor: `?cursor=<id>&limit=24`; respuesta `{ items, nextCursor }`.
- Fechas ISO 8601 UTC.
- No se exponen `objectKey`, `tokenHash`, `passwordHash` ni datos de otros círculos.
- OpenAPI generado desde Zod.

## Auth

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/register` | Crear cuenta y sesión |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/csrf` | Token CSRF |
| GET | `/me` | Usuario actual |
| PATCH | `/me` | Nombre, avatar, tema |
| GET | `/me/uploads` | Subidas recientes del usuario |

## Círculos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/circles` | Círculos del usuario |
| POST | `/circles` | Crear |
| GET | `/circles/:circleId` | Detalle con stats |
| PATCH | `/circles/:circleId` | Editar nombre, descripción, portada, settings |
| DELETE | `/circles/:circleId` | Borrar (owner) |
| GET | `/circles/:circleId/members` | Miembros |
| DELETE | `/circles/:circleId/members/:userId` | Expulsar (owner) |
| POST | `/circles/:circleId/leave` | Salir (member) |
| GET | `/circles/:circleId/activity` | Actividad del círculo |
| GET | `/activity` | Actividad global de mis círculos |

## Invitaciones

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/circles/:circleId/invitations` | Crear enlace; email opcional |
| GET | `/circles/:circleId/invitations` | Pendientes (owner) |
| DELETE | `/circles/:circleId/invitations/:invitationId` | Revocar |
| GET | `/invitations/:token` | Datos mínimos para la preview |
| POST | `/invitations/:token/accept` | Unirse |

`GET /invitations/:token` solo devuelve `{ circleName, inviterName, expiresAt, state }`. Nunca miembros, fotos ni álbumes.

## Álbumes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/circles/:circleId/albums` | Lista |
| POST | `/circles/:circleId/albums` | Crear |
| GET | `/albums/:albumId` | Detalle |
| PATCH | `/albums/:albumId` | Editar |
| DELETE | `/albums/:albumId` | Borrar (permiso) |

## Fotos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/albums/:albumId/photos?cursor=&limit=&personId=` | Galería paginada |
| POST | `/albums/:albumId/photos` | Subida multipart |
| GET | `/photos/:photoId` | Detalle |
| PATCH | `/photos/:photoId` | Descripción, fecha, lugar |
| DELETE | `/photos/:photoId` | Borrar con permiso |
| GET | `/photos/:photoId/image?size=thumb\|display\|original` | Imagen autenticada |
| POST | `/photos/:photoId/tags` | Etiquetar miembro |
| DELETE | `/photos/:photoId/tags/:userId` | Quitar etiqueta |
| GET | `/circles/:circleId/members/:userId/photos` | Fotos de una persona |

## Descargas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/photos/:photoId/download` | Original como adjunto |
| POST | `/albums/:albumId/downloads` | Crear job de álbum o selección |
| GET | `/downloads/:jobId` | Estado |
| GET | `/downloads/:jobId/file` | Descargar ZIP listo |

Body de creación:

```json
{ "photoIds": ["..."] }
```

Si `photoIds` no viene, se descarga el álbum completo. Límite 500 fotos / 2 GB.

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
- Un archivo por petición; el cliente controla concurrencia.
- Respuesta `201` con `PhotoDTO`.
- Errores por archivo con `code` y `message`.
- Idempotencia por `(uploaderId, clientUploadId)`.

## Imágenes

- Cookie obligatoria; sin acceso anónimo.
- `Cache-Control: private, max-age=3600`.
- `ETag` y `Content-Type` correctos.
- `original` solo para descarga o visor autorizado.
- Nunca se sirve el bucket directamente.

## OpenAPI

- Generado en `/api/openapi.json`.
- UI de documentación solo en desarrollo o protegida.
- Cada endpoint tiene descripción, permisos y errores.

## Rate limits

| Acción | Límite orientativo |
| --- | --- |
| Login | 5/min por IP + email |
| Registro | 3/hora por IP |
| Invitaciones | 10/hora por usuario |
| Subidas | 60/min por usuario |
| Descargas | 10/min por usuario |
