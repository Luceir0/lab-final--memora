# Informe de seguridad

> **Feature:** F41 · **Nivel de auditoría:** V · **Fecha:** 2026-11-08
> **Alcance:** aplicación local (API Fastify + web TanStack Start) contra PostgreSQL 17.11,
> Silo (S3) y Mailpit. **Sin pentest externo, sin infraestructura real y sin URL pública.**
> **Método:** revisión estática del código, ejecución de la batería de tests con PostgreSQL
> real (`memora_test`) y pruebas HTTP reales contra la API arrancada con la base de
> desarrollo (`memora`).

## Resultado

**No hay hallazgos bloqueantes ni mayores abiertos.** La autorización se comprueba en el
servidor, los negativos principales responden con los códigos esperados, el logging redacta
PII y no hay secretos versionados. Queda **un hallazgo menor abierto** —las dependencias
moderadas de la cadena de Swagger UI— y **una nota informativa** de operación (rate limit en
memoria). Los objetos huérfanos (H-02) y los datos de prueba (H-04) se corrigieron en el
cierre de la sesión. Todo lo que no se ha podido comprobar se declara en «Limitaciones».

## Evidencias ejecutadas

| Prueba | Comando / petición | Resultado |
| --- | --- | --- |
| Suite de API | `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` | **26 archivos y 424 tests passed**, 2 skipped (integraciones de storage sin credenciales) |
| Login correcto | `POST /api/auth/login` con `Origin` y `lucia@memora.test` / `memora-demo` | **200** y `GET /api/me` **200** |
| Login sin `Origin` | misma petición sin cabecera | **403** |
| Credenciales incorrectas | contraseña errónea | **401 `UNAUTHENTICATED`**, mismo mensaje que email inexistente |
| Rate limit de login | 7 intentos seguidos con el mismo email | **401 ×5** y después **429 ×2** |
| Mutación sin CSRF | `POST /api/photos/:id/tags` sin `X-CSRF-Token` | **403** |
| Mutación sin `Origin` | misma petición con CSRF y sin `Origin` | **403** |
| Círculo ajeno | `GET /api/circles/<id de otro owner>` | **404** (no filtra existencia) |
| Descarga `original` de miembro sin permiso | mateo (member) sobre foto de un círculo con `membersCanDownload=false` | **403** |
| Borrado por quien no es autor ni owner | mateo sobre foto de lucia | **403** |
| Etiquetado sin `membersCanTag` | mateo sobre el mismo círculo | **403** |
| Subida sin `membersCanUpload` | mateo sobre el mismo círculo | **403** |
| Descarga sin sesión | `GET /image?size=original` | **401** |
| Pipeline real con sesión | subida **201** → `original` **200** → borrado **204** → `original` **404** | limpio; objetos eliminados de Silo |
| Cabeceras | `curl -i /api/health` | CSP, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` |
| Logs sin PII | 131 líneas del log de desarrollo | **0** apariciones de emails, contraseña, cookies, CSRF o tokens de invitación |
| Secretos | `rg` de claves privadas, `AKIA…`, `ghp_…`, `sk_live_…`, `xox…`; `git ls-files` de `.env` | sin coincidencias; solo `.env.example` versionado |
| Dependencias | `pnpm audit --audit-level=moderate` | **2 moderadas** (ver H-01) |
| Email de invitación | `POST /api/circles/:id/invitations` y API de Mailpit | **201**; correo recibido con el enlace `/invite/<token>`, el nombre del círculo y sin fotos; revocación **204** |
| Mantenimiento periódico | Arranque de la API y 5 tests de `maintenance/cleanup` | Pasada al arrancar con contadores y borrado de sesiones, expiración de jobs con su ZIP y purga con retención de 24 h |

## Verificación por área

### Autenticación y sesión

- Contraseñas con **Argon2id** (hash y verificación en `password.ts`); el seed usa el mismo
  algoritmo.
- Mensajes genéricos: email desconocido y contraseña incorrecta comparten **código, mensaje y
  latencia** (verificación de coste equivalente).
- Cookie de sesión `HttpOnly`, `SameSite=Lax`, `Secure` solo con `NODE_ENV=production`; el
  token es opaco y en base de datos solo se guarda su SHA-256.
- **Rotación de sesión en el login**: la cookie anterior se revoca y hay test específico.
- Logout requiere CSRF, invalida la sesión y limpia cookies.

### CSRF y `Origin`/`Referer`

- Token HMAC con `SESSION_SECRET` (o clave aleatoria por proceso si falta, en desarrollo).
- Todas las mutaciones exigen `X-CSRF-Token`; el header ausente responde **403**, no 400.
- `trustedOrigin` valida `Origin`/`Referer` contra `APP_URL` en login, registro y mutaciones.
- El frontend no guarda tokens en `localStorage` (no hay ningún uso) y la cookie CSRF no es
  `HttpOnly` porque el cliente debe leerla; no es un credential de sesión.

### Rate limiting

- Login: **5/min por IP+email** y **20/min agregado por IP** (anti password spraying).
- Registro: **10/hora por IP**. Subida: **60/min por usuario**.
- Verificado en real el **429** del login.
- Limitación: contador **en memoria**; con varias instancias haría falta un almacén
  compartido (ver «Riesgos aceptados»).

### Autorización y acceso cruzado

- Cada endpoint resuelve sesión y membresía; un recurso de otro círculo responde **404** para
  no revelar existencia.
- Permisos de círculo (`photo.upload`, `photo.download`, `photo.delete`, `photo.tag`,
  `album.create`) se comprueban en el servidor; el owner siempre puede.
- Borrar un álbum no vacío devuelve `ALBUM_NOT_EMPTY`; borrar círculo, expulsar, invitar y
  settings son owner-only.
- Etiquetar exige que el objetivo sea miembro actual del mismo círculo (**404** si no).
- La suite cubre estos casos en `auth`, `circles`, `members`, `albums`, `photos`,
  `downloads`, `invitations` y `tags` (más de 200 referencias a códigos 4xx en los tests).

### Descargas

- `original` reutiliza el permiso `photo.download`: un miembro sin `membersCanDownload`
  recibe **403** (verificado en real).
- ZIP con límites de **500 fotos y 2 GB**, timeout y concurrencia acotada; el job comprueba
  membresía y permisos antes de encolar.
- Las descargas sin sesión responden **401**.

### Subidas y archivos

- **Magic bytes** con `file-type`, no solo `Content-Type`: JPEG/PNG/WebP; SVG, GIF, HEIC y
  AVIF → **415**; archivo corrupto → **422**; >25 MB → **413**; >50 MP → **422**; cuota de
  2 GB por círculo → **413**.
- `sharp` genera `thumb` y `display` desde el binario crudo; el original se guarda sin
  metadatos.
- **EXIF/GPS**: el GPS solo se usa en memoria para `placeName`; nunca se persiste ni se
  registra. `placeName` se trunca a 200 caracteres.
- Claves de storage generadas por el servidor; bucket privado (`mc anonymous get` →
  `private`); borrado de objetos tras el commit, best-effort.

### Cabeceras y CORS

- Helmet activo en todas las rutas; HSTS solo en producción (en local no hay TLS).
- CSP estricta por defecto; en desarrollo se relaja `style-src` y se quita
  `upgrade-insecure-requests` para que funcione Swagger UI y el HTTP local.
- No hay CORS abierto: web y API comparten origen mediante proxy `/api`.

### Logs y datos personales

- `pino` redacta cookies, `authorization`, `X-CSRF-Token`, `email`, `password`, tokens y
  hashes; el token de las rutas `/api/invitations/<token>` se sustituye por `[REDACTED]`
  incluso si llega percent-encoded.
- Comprobado sobre el log real de la sesión: 0 apariciones de PII o credenciales.
- `/api/health` no expone configuración ni datos de conexión.

### Secretos

- `.env` y `.env.*` están en `.gitignore`; solo se versiona `.env.example`, con secretos
  vacíos a propósito.
- Sin claves privadas ni tokens de proveedor en el árbol (`rg` de patrones habituales).
- `SESSION_SECRET`, `RESEND_API_KEY` y `CONTENT_ISLAND_ACCESS_TOKEN` se leen solo en
  servidor; ninguna variable con secreto llega al bundle de la web.

### Frontend

- Sin `dangerouslySetInnerHTML` con contenido de usuario: el único uso es el script estático
  de tema que genera `createThemeInitScript()`.
- Sin `eval` y sin tokens en `localStorage`.
- El `redirect` tras login/registro pasa por una allow-list de rutas internas
  (`normalizeAuthRedirect`), con tests de `//host`, `\`, caracteres de control y rutas de
  auth; no hay open redirect.
- Los mensajes de error no muestran detalles internos.

### Dependencias

`pnpm audit` deja **2 vulnerabilidades moderadas** en `glob` y `minimatch`, ambas dentro de
`@fastify/swagger-ui` → `@fastify/static`. Swagger UI **solo se registra fuera de producción**
(la API expone `/api/openapi.json` y ninguna UI interactiva), así que no hay entrada de
usuario que alcance esas rutas en producción. No se actualiza el lockfile en esta sesión:
sería una instalación de dependencias que exige permiso y una reverificación aparte.

## Hallazgos

| ID | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- |
| H-01 | Baja | 2 vulnerabilidades moderadas en `glob`/`minimatch` a través de Swagger UI, que no se sirve en producción | **Aceptado y documentado**; pendiente decidir actualización en una rama aparte |
| H-02 | Baja | Objetos huérfanos: ZIP de descargas y sesiones caducadas sin purga programada | **Corregido**: mantenimiento en proceso cada 15 min (sesiones, expiración de jobs y purga de filas `expired` con 24 h de retención), con 5 tests |
| H-03 | Informativa | Turbo no reenviaba `S3_*`/`EMAIL_*` a la API: la subida fallaba cerrada con «StorageService no está configurado» | **Corregido** en F42 (`turbo.json`, `globalEnv`) |
| H-04 | Informativa | La base de desarrollo conservaba usuarios y círculos de pruebas manuales | **Corregido**: datos de prueba y sus objetos de Silo borrados; la BD coincide con el seed |
| H-05 | Informativa | Rate limit en memoria, no compartido entre instancias | **Abierto**; suficiente para una instancia, a revisar si se escala |

## Riesgos aceptados

- **Sin pentest ni infraestructura real**: no se han probado TLS, HSTS, cookies `Secure`,
  R2/S3 gestionado, Resend ni Nominatim real.
- **Sin pruebas de navegador automatizadas** (F37/F38 no se ejecutan): la evidencia de
  frontend es estática y de tests de componentes.
- **Fuerza bruta distribuida**: el rate limit por IP+email y el agregado por IP frenan el
  password spraying desde una IP, no un ataque distribuido.
- **Rate limit en memoria**: con varias instancias el contador no se comparte (H-05).

## Limitaciones de esta revisión

- No se ha auditado el código de dependencias de terceros más allá de `pnpm audit`.
- No se ha revisado el contenido de los objetos de Silo más allá de su existencia y de la
  respuesta autenticada.
- El email se probó con Mailpit, no con Resend ni con un proveedor real.
- Las integraciones de storage que requieren credenciales propias quedaron **skipped** (2),
  como en las sesiones anteriores; el pipeline sí se verificó contra Silo local.

## Recomendaciones

1. Decidir en una rama aparte si se actualizan `@fastify/swagger-ui`/`@fastify/static` para
   cerrar H-01; si no, registrar la excepción en la entrega.
2. Si la API se despliega con más de una instancia, mover el rate limit a un almacén
   compartido (H-05).
