# Despliegue

La URL pública **no es obligatoria**. El objetivo es una demo local reproducible y una guía para desplegar si se decide.

## Local

Verificado el **2026-11-08** con Docker Desktop, Node 24.21.0 y pnpm 10.34.8.

```bash
docker compose up -d            # Postgres, Silo (S3) y Mailpit
docker compose ps               # los tres servicios deben estar «healthy»
pnpm install
# Exporta las variables de .env.example en esta shell (ver «Variables»)
pnpm db:migrate
pnpm db:seed
pnpm db:seed:images             # primera vez o si faltan objetos en Silo
pnpm dev                        # API en :3001 y web en :3000
```

Servicios:

| Servicio | Puerto | Uso | Healthcheck |
| --- | --- | --- | --- |
| Web | 3000 | TanStack Start | — (proceso de `pnpm dev`) |
| API | 3001 | Fastify | `GET /api/health` |
| PostgreSQL | 5432 | Datos | `pg_isready` |
| Silo (S3) | 9000/9001 | Fotos (consola en 9001) | `/minio/health/live` |
| Mailpit | 1025/8025 | Email capturado (UI en 8025) | `/mailpit readyz` |

Web y API bajo el mismo origen en desarrollo mediante proxy `/api`.

### Variables: nada carga el `.env` de la raíz

Comprobado en el arranque: la API lee `process.env`, el CLI de Prisma busca `.env` en
`apps/api` y Vite en `apps/web`; **ningún proceso carga el `.env` de la raíz**. Copiar
`.env.example` a `.env` no basta. El flujo verificado es exportar el ejemplo en la shell
actual, sin secretos reales:

```bash
# Git Bash — carga .env.example sin ejecutarlo como script (EMAIL_FROM lleva espacios y <>)
while IFS= read -r line; do
  case "$line" in ""|\#*) continue;; esac
  key="${line%%=*}"; case "$key" in *[!A-Z0-9_]*) continue;; esac
  export "$key=${line#*=}"
done < .env.example
export SESSION_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))")"
```

```powershell
# PowerShell
Get-Content .env.example | Where-Object { $_ -match '^[A-Z0-9_]+=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2; Set-Item -Path "env:$name" -Value $value
}
$env:SESSION_SECRET = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

- `.env.example` deja `SESSION_SECRET` vacío a propósito. Sin él la API arranca y el login
  funciona (clave HMAC aleatoria por proceso para CSRF), pero los tokens CSRF dejan de
  valer al reiniciar. Genera uno para la demo.
- Turbo 2 solo reenvía a las tareas las variables declaradas en `globalEnv` de
  `turbo.json`. Ya están todas las de `.env.example`; **si añades una nueva, declárala** o
  la API arrancará con storage o email «no configurados» y la subida fallará con `422`.
  Esto se detectó en esta sesión: sin el cambio, `pnpm dev` arrancaba y el login funcionaba,
  pero `POST /api/albums/:albumId/photos` devolvía `422 PROCESSING_FAILED`.

### Silo en local

MinIO dejó de publicar su edición comunitaria: la última release abierta es `RELEASE.2025-10-15T17-29-55Z` y el repositorio upstream está archivado. La infraestructura local usa **Silo** (`pgsty/silo`), un fork comunitario mantenido que conserva la API S3, las variables `MINIO_*`, las rutas `/minio/*`, la consola web y el formato de datos.

La imagen está fijada por **tag y digest** (`RELEASE.2026-10-18T00-00-00Z@sha256:2636fc41…`) para que `docker compose up -d` sea reproducible y no dependa de un tag movido. Es **solo para local**: no se despliega en producción, donde el almacenamiento es R2/S3 gestionado. El contenedor arranca como root porque Docker crea el volumen como root; por eso Compose no fija `user`. Al actualizar la imagen, revisa las notas de release y vuelve a fijar el digest.

**El bucket no se autogenera.** La API no lo crea y `pnpm db:seed:images` falla si no
existe. Créalo una vez; el contenedor incluye `mc` y el bucket debe quedar privado:

```bash
docker compose exec -T minio mc alias set local http://127.0.0.1:9000 memora memora123
docker compose exec -T minio mc mb --ignore-existing local/memora
docker compose exec -T minio mc anonymous get local/memora   # -> private
```

### Migraciones y seed

- `pnpm db:migrate` (`prisma migrate dev`) aplica las migraciones pendientes. En el arranque
  verificado faltaba `20261105190000_f25_photo_membership_indexes` en la base `memora` y se
  aplicó sin conflicto; `memora_test` ya estaba al día.
- `pnpm db:seed` es **determinista e idempotente** (upserts con ids fijos, sin `deleteMany`):
  2 usuarios, 2 círculos, 2 álbumes, 6 fotos, 2 etiquetas, 1 invitación y 4 actividades.
  Repetirlo no duplica ni borra nada.
- `pnpm db:seed:images` escribe en Silo los 18 objetos del seed (6 fotos × original, display
  y thumb) y es idempotente: informa de las generadas y de las que ya tenían objeto.
- **La base de desarrollo conserva residuos de pruebas manuales**: el círculo «hola», los
  usuarios `prueba.f16@memora.test` y `asdkjahsdkasd@correo.com`, y 12 fotos extra en
  «Verano en la costa». El seed no los limpia. Para una demo limpia hay que borrarlos con
  permiso explícito, no con un `deleteMany` del seed.

## Variables

`.env.example` es la **fuente de verdad** del listado y de los valores locales. No commitees nunca un `.env` real. La aplicación **no lee** el `.env` de la raíz: exporta estas variables en la shell antes de `pnpm dev`, `pnpm db:migrate` y `pnpm db:seed` (ver «Variables: nada carga el `.env` de la raíz»). Las variables son:

```text
NODE_ENV=development
APP_URL=http://localhost:3000
API_PORT=3001
COOKIE_DOMAIN=localhost
DATABASE_URL=
SESSION_SECRET=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=true
EMAIL_PROVIDER=mailpit
EMAIL_FROM=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
GEOCODING_PROVIDER=nominatim
GEOCODING_BASE_URL=
GEOCODING_USER_AGENT=
CONTENT_ISLAND_ACCESS_TOKEN=
# Opcional, solo si el proyecto de Content Island lo requiere.
CONTENT_ISLAND_PROJECT_ID=

# Infraestructura local (solo docker compose; la aplicación no las lee)
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_PORT=
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
MINIO_PORT=
MINIO_CONSOLE_PORT=
MAILPIT_UI_PORT=
```

`APP_URL` se usa para enlaces de invitación y Open Graph. `COOKIE_DOMAIN` debe ser el dominio común de web y API. `SESSION_SECRET`, `RESEND_API_KEY` y `CONTENT_ISLAND_ACCESS_TOKEN` van vacíos a propósito. `CONTENT_ISLAND_PROJECT_ID` es opcional. Cambiar las variables de infraestructura local obliga a actualizar `DATABASE_URL` y `S3_*` en consecuencia.

**Storage y geocodificación son obligatorios en producción.** `buildApp()` rechaza el arranque con `NODE_ENV=production` si `S3_*` o `GEOCODING_*` están incompletos, porque el pipeline de subida de F25 necesita adaptadores reales y falla cerrado con los fakes. En local se mantienen los valores de `.env.example` contra Silo y Nominatim; no se cambian aquí.

## Producción opcional

### Opción A — VPS único

- Docker Compose: web, api, postgres, silo (S3) o R2, caddy.
- Caddy para TLS y proxy.
- Volúmenes persistentes.
- Backup documentado como fuera de MVP.

### Opción B — Servicios gestionados

- Web/API en Render o Fly.io.
- Postgres en Neon.
- Fotos en Cloudflare R2.
- Email en Resend.
- Content Island en build.
- **La web y la API deben compartir origen** (proxy `/api`) o configurar `COOKIE_DOMAIN` y CORS con credenciales; con `SameSite=Lax` no sirve separar dominios sin proxy.

## Migraciones

- `prisma migrate deploy` al desplegar.
- Nunca `migrate dev` en producción.
- Revisar migraciones en CI.
- Seed solo en demo, nunca en producción real.

## Salud y logs

- `GET /api/health` sin datos sensibles: `{"status":"ok","version":"0.0.0","timestamp":…}`.
- Logs JSON con redacción de PII (cookies, `authorization`, `X-CSRF-Token`, `email`,
  `password`, tokens y hashes; y el token de las rutas `/api/invitations/<token>`).
- Sin stack traces en producción; en desarrollo `request.log.error` incluye el stack.
- Healthchecks en Docker para los tres servicios.

### Verificación real (2026-11-08)

| Comprobación | Resultado |
| --- | --- |
| `docker compose config -q` | OK |
| `docker compose ps` | `postgres`, `minio` y `mailpit` **healthy** |
| `curl -i localhost:3001/api/health` | **200**, con CSP, `Referrer-Policy`, `X-Content-Type-Options` y `X-Frame-Options` |
| `curl localhost:3000/api/health` (proxy web) | **200** |
| Login `lucia@memora.test` / `memora-demo` con `Origin: http://localhost:3000` | **200** y `GET /api/me` **200** |
| Login sin `Origin` | **403** |
| Login con contraseña incorrecta | **401 `UNAUTHENTICATED`** |
| Círculo ajeno (`/api/circles/<id de otro usuario>`) | **404** |
| Pipeline real: subida **201** → `original` con sesión **200** → `original` sin sesión **401** → borrado **204** → `original` **404** | OK; los objetos se borraron de Silo |
| `pnpm db:migrate` | aplicó la migración pendiente en `memora` |
| `pnpm db:seed` | idempotente; 2 usuarios, 2 círculos, 2 álbumes, 6 fotos, 2 etiquetas, 1 invitación, 4 actividades |
| `pnpm db:seed:images` | `6 generadas, 12 ya tenían objeto` |

### Limitaciones conocidas de la demo

- **`docker-compose.prod.yml` no se entrega**: queda fuera de la recutura de S4. La guía de
  producción de abajo es orientativa y **no se ha desplegado ni probado** en VPS, Render,
  Fly.io, Neon, R2, Resend ni Nominatim real.
- `SESSION_SECRET` vacío en `.env.example`: CSRF con clave por proceso, invalidado al
  reiniciar. El ejemplo es público y no puede traer un secreto.
- El bucket de Silo y los objetos del seed **no se crean solos**; requieren los dos comandos
  documentados arriba.
- La base `memora` conserva residuos de pruebas manuales (ver «Migraciones y seed»).
- Rate limit en memoria: con varias instancias de la API habría que compartir el contador.
- No hay purga programada de sesiones caducadas ni de ZIPs de descarga antiguos; los
  objetos antiguos de `downloads/` se quedan en el bucket.
- Las cookies llevan `Secure` solo con `NODE_ENV=production`; en local viajan por HTTP.

## Checklist

Marcado lo verificado en local el 2026-11-08; lo de producción queda pendiente y así se
declara.

- [x] Variables configuradas (exportadas desde `.env.example`; `SESSION_SECRET` generado).
- [x] Migraciones aplicadas (`memora` y `memora_test` al día).
- [x] Bucket privado (`mc anonymous get` → `private`).
- [ ] Email probado de extremo a extremo (Mailpit arriba; no se envió una invitación real
      en esta sesión).
- [ ] Cookies `Secure` (solo en producción) y mismo dominio (verificado `COOKIE_DOMAIN`
      en `.env.example`, no en navegador).
- [ ] HTTPS (fuera de la demo local).
- [x] Seed demo (`pnpm db:seed` y `pnpm db:seed:images`).
- [x] Flujo completo probado (login, `/me`, subida, descarga `original`, borrado y
      negativos 401/403/404).
- [ ] Vídeo de respaldo (F43).
