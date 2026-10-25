# Actividad

## Decisión

Tabla `Activity` con eventos explícitos, no feed derivado. Permite añadir tipos y consultar de forma sencilla.

## Eventos

| Tipo | Cuándo | metadata |
| --- | --- | --- |
| `photo.uploaded` | Se publica una foto | `{ count?: number }` |
| `album.created` | Se crea un álbum | `{ albumTitle }` |
| `member.joined` | Se acepta una invitación o se añade un miembro | `{}` |

No se registran eventos privados de invitaciones (crear/revocar) para no filtrar datos.

## Escritura

- En la misma transacción que la acción.
- `actorId` es quien realiza la acción.
- `circleId` siempre presente.
- `photoId`/`albumId` con `SetNull` si se borra el recurso.
- `metadata` sin PII.

## Lectura

- `GET /api/circles/:circleId/activity?cursor=` — solo miembros.
- `GET /api/activity?cursor=` — une los círculos del usuario.
- Orden `createdAt desc`, paginación por cursor.
- Límite 20–30.
- La API agrupa subidas por actor/álbum/intervalo y devuelve `count`.
- El cliente muestra “Lucas subió 18 fotos a Verano en Mallorca”.

## UI

- Panel “Actividad reciente” en `/circles` (escritorio y móvil).
- Página `/circles/:id/activity` con “Ver toda la actividad”.
- Avatar, acción, álbum, tiempo relativo y enlace.
- Estados vacío, carga y error.
- Accesible como lista; tiempos con `<time datetime>`.

## Privacidad

- Solo miembros del círculo.
- No se muestra actividad de círculos a los que no perteneces.
- No se muestran emails ni tokens.
- Si un miembro es expulsado, su actividad histórica permanece (autoría), pero no puede acceder.
