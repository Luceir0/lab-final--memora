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
- El propietario siempre puede.
- Los flags de `Circle.settings` limitan a miembros.
- Invitar, expulsar, cambiar permisos y borrar círculo: solo owner.
- Etiquetar: solo miembros del círculo; si el flag está activo.
- Descargar: si el flag está activo.
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
  | 'photo.upload'
  | 'photo.update'
  | 'photo.delete'
  | 'photo.tag'
  | 'photo.download';

function can(...): boolean
```

Tests unitarios sin mocks para todas las combinaciones rol × flag × acción.

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
