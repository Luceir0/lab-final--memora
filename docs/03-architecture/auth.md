# Autenticación y autorización

## Sesión

- Sesión en base de datos (`Session`) con token aleatorio de 32 bytes.
- El cliente recibe el token en cookie `memora_session`.
- En BD se guarda solo `SHA-256(token)`.
- Cookie: `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/`, 30 días.
- Rotación al iniciar sesión; logout borra la sesión.
- `lastUsedAt` se actualiza de forma perezosa (como máximo cada 5 minutos).
- Limpieza de sesiones: al leer una sesión caducada se borra la fila y se responde
  401. La purga programada queda para F42; el MVP no ejecuta un job periódico.
- `Domain` de la cookie: solo si `COOKIE_DOMAIN` está configurada; si no, host-only.

## Contraseñas

- Hash `argon2id` con `@node-rs/argon2`.
- Longitud mínima 8; máximo 128.
- El **login** no revela si el email existe: email desconocido y contraseña
  incorrecta devuelven el mismo `401 UNAUTHENTICATED` con el mensaje «Email o
  contraseña incorrectos.». Además se verifica un hash ficticio cuando la cuenta
  no existe, para que la latencia tampoco lo delate.
- El **registro** sí revela existencia: un email ya registrado devuelve
  `409 CONFLICT` con `details` de campo `email`. Es una decisión de producto
  (2026-11-03) y no afecta a AC-02, que solo cubre login.
- Rate limit por IP y por email: login 5/min por IP+email, registro 10/hora por IP.
  Además, login tiene un techo agregado de 20/min por IP (defensa derivada, no
  está en el contrato) para frenar el password spraying que rota emails.
- El límite de registro era 3/hora en F15 y pasó a 10/hora el 2026-11-03, a
  petición del usuario: al ser por IP, tres altas legítimas desde una misma
  conexión (una casa) bloqueaban a todo el mundo durante una hora. Sigue
  habiendo límite porque no hay verificación de email y cada alta es gratis.
- No se registra la contraseña ni el hash.

## CSRF

- Cookie de sesión `SameSite=Lax` + comprobación de `Origin`/`Referer`.
- Token CSRF atado a la sesión para mutaciones autenticadas:
  - `GET /api/auth/csrf` devuelve `{ csrfToken }` y lo fija en la cookie legible
    `memora_csrf` (sin `HttpOnly`).
  - El cliente envía el token en la cabecera `X-CSRF-Token`.
  - La API verifica el token con HMAC sobre el **token de sesión en claro**; la
    cookie es solo un vehículo de lectura, no la fuente de verdad. Esto es más
    fuerte que comparar cookie y cabecera y no necesita estado.
- `POST /auth/login` y `/auth/register` validan `Origin`/`Referer` y no exigen
  CSRF, porque todavía no hay sesión.
- `POST /auth/logout` y `PATCH /me` exigen sesión válida, `Origin`/`Referer` y
  `X-CSRF-Token`.
- Un `Origin` presente y no permitido, o la ausencia de `Origin` y `Referer`,
  devuelve `403 FORBIDDEN`.
- Implicación para el render en servidor: una llamada servidor-a-servidor no
  lleva `Origin` del navegador. F16 debe mutar desde el navegador o reenviar un
  origen de confianza explícito; no se debe relajar la comprobación en servidor.
- Tras login o registro la cookie `memora_csrf` anterior se limpia: el cliente
  debe pedir `GET /api/auth/csrf` con la sesión nueva antes de mutar.
- `APP_URL` es el origen de confianza. En producción es obligatoria y debe ser
  `https`; fuera de producción por defecto es `http://localhost:3000`.

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
- Borrar álbum: owner o el miembro que lo creó, y solo si está vacío; si tiene fotos, `409 ALBUM_NOT_EMPTY`. No depende de `membersCanCreateAlbums`.
- Vaciar álbum: owner o el miembro que lo creó, sin condición de fotos, con confirmación explícita; elimina las fotos y sus etiquetas en una transacción y, desde F25, también sus objetos de almacenamiento (best-effort tras el commit). No depende de `membersCanCreateAlbums`. Es distinto de borrar el álbum: `album.empty` no exige que esté vacío y devuelve cuántas fotos borró; `album.delete` exige que ya esté vacío. El creador puede deshacer lo que crea aunque el admin revoque después la flag.
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
- `album.delete` es la única excepción a «el owner puede todo»: exige un recurso de tipo álbum con `photosCount` 0. `album.delete` y `album.empty` aceptan además al creador del álbum, sin depender de `Circle.settings`.
- `photo.download` cubre también la imagen `original`; `thumb` y `display` no pasan por esta acción.

Tests unitarios sin mocks para todas las combinaciones rol × flag × acción, incluidos `photo.update`, `photo.delete`, `album.update`, `album.delete`, `album.empty` (owner siempre; creador con o sin fotos y con cualquier flag; no creador nunca), descarga de `original`, `member.invite` (siempre owner), acciones desconocidas y recursos de otro círculo. Evidencia: `packages/shared/src/permissions.test.ts`.

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
