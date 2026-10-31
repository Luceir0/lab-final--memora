# Autenticación y autorización

## Sesión

- Sesión en base de datos (`Session`) con token aleatorio de 32 bytes.
- El cliente recibe el token en cookie `memora_session`.
- En BD se guarda solo `SHA-256(token)`.
- Cookie: `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/`, 30 días.
- Rotación al iniciar sesión; logout borra la sesión.
- `lastUsedAt` se actualiza de forma perezosa.
- Sesiones expiradas se limpian periódicamente.

## Contraseñas

- Hash `argon2id` con `@node-rs/argon2`.
- Longitud mínima 8; máximo 128.
- Sin mensajes que revelen si el email existe.
- Rate limit por IP y por email.
- No se registra la contraseña ni el hash.

## CSRF

- Cookie de sesión `SameSite=Lax` + comprobación de `Origin`/`Referer`.
- Token CSRF de doble envío para mutaciones autenticadas:
  - `GET /api/auth/csrf` devuelve un token y lo fija en cookie legible.
  - El cliente envía `X-CSRF-Token`.
- `POST /auth/login` y `/auth/register` también validan `Origin`.

## Autorización

Cada endpoint:

1. Identifica usuario por sesión.
2. Carga el recurso.
3. Comprueba pertenencia al círculo.
4. Comprueba permiso con `can(user, action, circle, resource)`.
5. Ejecuta o devuelve 403/404.

Reglas:

- Un recurso de otro círculo devuelve 404, no 403, cuando revelar existencia sería una fuga.
- El propietario se decide por `Circle.ownerId`, nunca por el `role` de la fila de membresía: un `role: 'owner'` que no coincide con `ownerId` no eleva permisos.
- El propietario puede todo, salvo borrar un álbum que todavía tiene fotos (ver abajo).
- Los flags de `Circle.settings` limitan a miembros; al owner no le afectan.
- Invitar, expulsar, cambiar permisos y borrar círculo: solo owner. No existe flag `membersCanInvite`.
- Editar álbum: owner, o el miembro que lo creó mientras `membersCanCreateAlbums` esté activo.
- Etiquetar: solo miembros del círculo; si el flag `membersCanTag` está activo.
- Descargar: si el flag `membersCanDownload` está activo. Ese mismo flag controla el acceso a `original`; `display` y `thumb` están disponibles para miembros.
- Editar foto: quien la subió o el owner. Ningún otro miembro.
- Borrar foto: quien la subió o el owner. Ningún otro miembro.
- Borrar álbum: solo owner y solo si está vacío; si tiene fotos, `409 ALBUM_NOT_EMPTY`.
- Vaciar álbum: solo owner y sin condición de fotos, con confirmación explícita; elimina todas las fotos y sus objetos. Es distinto de borrar el álbum: `album.empty` no exige que esté vacío y devuelve cuántas fotos borró; `album.delete` exige que ya esté vacío.
- No se confía en IDs del cliente.

## Permisos puros

`packages/shared/src/permissions.ts`:

```ts
type Action =
  | 'circle.view'
  | 'circle.update'
  | 'circle.delete'
  | 'member.invite'
  | 'member.remove'
  | 'album.create'
  | 'album.update'
  | 'album.delete'
  | 'album.empty'
  | 'photo.upload'
  | 'photo.update'
  | 'photo.delete'
  | 'photo.tag'
  | 'photo.download';

function can(...): boolean
```

`can()` es pura: no consulta sesión, base de datos ni HTTP; el llamador resuelve actor, círculo y recurso. Falla cerrado:

- Deniega acciones desconocidas (aunque el actor sea owner) y entradas ausentes.
- Deniega recursos cuyo `circleId` no coincide con el círculo, incluso para el owner.
- `album.delete` es la única excepción a «el owner puede todo»: exige un recurso de tipo álbum con `photosCount` 0.
- `photo.download` cubre también la imagen `original`; `thumb` y `display` no pasan por esta acción.

Tests unitarios sin mocks para todas las combinaciones rol × flag × acción, incluidos `photo.update`, `photo.delete`, `album.update`, `album.delete`, `album.empty` (owner siempre; member nunca, con o sin fotos), descarga de `original`, `member.invite` (siempre owner), acciones desconocidas y recursos de otro círculo. Evidencia: `packages/shared/src/permissions.test.ts`.

## Rutas protegidas

- `_app` layout con `beforeLoad`/guard en cliente.
- La API vuelve a autorizar siempre.
- Si la API devuelve 401, el cliente limpia caché y redirige a `/login` conservando `redirect`.
- Tras login, se vuelve a la ruta original o a la invitación.

## Invitaciones

- Token aleatorio de 32 bytes; en BD solo hash.
- Caducidad 7 días; revocable; reutilizable hasta caducar.
- Aceptar es idempotente: si ya es miembro, devuelve estado `already_member`.
- No se muestran datos privados antes de aceptar.
- El enlace se comparte con Web Share API o se copia.
- Email opcional; si falla, la invitación sigue existiendo.

## Limitaciones del MVP

- Sin verificación de email.
- Sin recuperación de contraseña.
- Sin 2FA.
- Sin sesiones múltiples visibles al usuario.
- Se documentan en README y defensa.

## Seguridad de cabeceras

- `@fastify/helmet`.
- HSTS en producción.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- CSP compatible con imágenes propias y estilos de Tailwind.
