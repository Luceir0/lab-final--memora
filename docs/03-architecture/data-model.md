# Modelo de datos

PostgreSQL + Prisma 7.10.1. Nombres de tablas en PascalCase vía Prisma; columnas en camelCase.

## Entidades

### User

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| name | String | 1–80 |
| email | String @unique | normalizado a minúsculas |
| passwordHash | String | argon2id |
| avatarUrl | String? | URL gestionada o null |
| themePreference | ThemePreference | light/dark/system |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Session

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| userId | String | FK User |
| tokenHash | String @unique | SHA-256 del token |
| expiresAt | DateTime | 30 días |
| lastUsedAt | DateTime | |
| createdAt | DateTime | |

Índice `(userId)`, `(expiresAt)`.

### Circle

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| ownerId | String | FK User |
| name | String | 1–80 |
| description | String? | máx. 500 |
| coverPhotoId | String? | FK Photo, nullable |
| settings | Json | flags de permisos |
| createdAt | DateTime | |
| updatedAt | DateTime | |

`settings`:

```json
{
  "membersCanCreateAlbums": true,
  "membersCanUpload": true,
  "membersCanDownload": true,
  "membersCanTag": true,
  "membersCanInvite": false
}
```

### Membership

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle |
| userId | String | FK User |
| role | Role | owner/member |
| joinedAt | DateTime | |

Único `(circleId, userId)`. Índice `(userId)`.

### Invitation

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle |
| tokenHash | String @unique | SHA-256 |
| createdBy | String | FK User |
| invitedEmail | String? | opcional |
| expiresAt | DateTime | 7 días por defecto |
| revokedAt | DateTime? | |
| acceptedAt | DateTime? | |
| acceptedBy | String? | FK User |
| createdAt | DateTime | |

Índice `(circleId, createdAt)`, `(expiresAt)`.

### Album

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle |
| title | String | 1–120 |
| description | String? | máx. 1000 |
| date | DateTime? | fecha del recuerdo |
| coverPhotoId | String? | FK Photo |
| createdBy | String | FK User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Índice `(circleId, createdAt)`.

### Photo

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle (denormalizado para autorización) |
| albumId | String | FK Album |
| uploaderId | String | FK User |
| clientUploadId | String? | idempotencia |
| originalKey | String | clave S3 privada |
| displayKey | String | |
| thumbKey | String | |
| mimeType | String | image/jpeg, image/png, image/webp |
| size | Int | bytes del original |
| width | Int | |
| height | Int | |
| takenAt | DateTime? | de EXIF o manual |
| placeName | String? | “Lisboa, Portugal” |
| description | String? | máx. 1000 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Único `(uploaderId, clientUploadId)`. Índice `(albumId, createdAt)`, `(circleId)`, `(uploaderId)`.
**No hay latitude/longitude.**

### PhotoTag

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| photoId | String | FK Photo |
| taggedUserId | String | FK User |
| createdBy | String | FK User |
| createdAt | DateTime | |

Único `(photoId, taggedUserId)`. Índice `(taggedUserId)`.

### DownloadJob

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle |
| albumId | String? | FK Album |
| requestedBy | String | FK User |
| kind | DownloadKind | album/selection/single? |
| photoIds | Json? | selección |
| status | DownloadStatus | pending/processing/ready/error/expired |
| objectKey | String? | ZIP privado |
| errorMessage | String? | sin PII |
| createdAt | DateTime | |
| expiresAt | DateTime | 24 h |
| completedAt | DateTime? | |

Índice `(requestedBy, createdAt)`, `(expiresAt)`.

### Activity

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | String cuid | PK |
| circleId | String | FK Circle |
| actorId | String | FK User |
| type | ActivityType | photo.uploaded, album.created, member.joined |
| albumId | String? | FK Album, SetNull |
| photoId | String? | FK Photo, SetNull |
| metadata | Json? | título, contador, etc. sin PII |
| createdAt | DateTime | |

Índice `(circleId, createdAt)`, `(actorId, createdAt)`.

## Enums

```text
ThemePreference: light | dark | system
Role: owner | member
DownloadKind: album | selection
DownloadStatus: pending | processing | ready | error | expired
ActivityType: photo.uploaded | album.created | member.joined
```

## Invariantes

- `Photo.circleId` coincide con `Album.circleId`.
- Un usuario no puede tener dos memberships en el mismo círculo.
- Solo se etiqueta a miembros del círculo.
- Un propietario no puede eliminarse a sí mismo del círculo sin borrarlo o transferir (transfer fuera del MVP).
- `Invitation.tokenHash` nunca se expone.
- `Photo.originalKey` nunca se expone al cliente.
- No se persisten coordenadas GPS.
- Borrar una foto elimina sus tags y su actividad asociada (o deja `photoId` null según la operación).
- Borrar un círculo elimina memberships, invitaciones, álbumes, fotos, tags, jobs y actividad.

## Índices y rendimiento

- Galería: `(albumId, createdAt desc)`.
- Fotos de persona: `(taggedUserId, photoId)` + join a Photo.
- Actividad: `(circleId, createdAt desc)`.
- Invitaciones: `(circleId, createdAt desc)`.
- Búsqueda futura: fuera del MVP.

## Migraciones

- `prisma migrate dev` en local; `prisma migrate deploy` en CI/producción.
- Seed determinista en `apps/api/src/test/fixtures` o `prisma/seed.ts`.
- Tests usan base de datos real separada.
