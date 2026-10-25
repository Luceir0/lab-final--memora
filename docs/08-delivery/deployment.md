# Despliegue

La URL pública **no es obligatoria**. El objetivo es una demo local reproducible y una guía para desplegar si se decide.

## Local

```bash
docker compose up -d        # Postgres, MinIO, Mailpit
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Servicios:

| Servicio | Puerto | Uso |
| --- | --- | --- |
| Web | 3000 | TanStack Start |
| API | 3001 | Fastify |
| PostgreSQL | 5432 | Datos |
| MinIO | 9000/9001 | Fotos |
| Mailpit | 8025 | Email capturado |

Web y API bajo el mismo origen en desarrollo mediante proxy `/api`.

### MinIO en local

Las imágenes oficiales de MinIO dejaron de publicarse, así que la infraestructura local usa el mirror `alpine/minio`, fijado por **tag y digest** (`RELEASE.2025-10-15T17-29-55Z@sha256:cf23643a…`) para que `docker compose up -d` sea reproducible y no dependa de un tag movido. Ese contenedor es **solo para local**: el volumen lo crea Docker como root y la imagen no ajusta permisos, por lo que arranca con `user: '0:0'`. En producción **no** se usa: el almacenamiento es R2/S3 gestionado.

## Variables

`.env.example` es la **fuente de verdad**: copia el archivo a `.env`, rellena los secretos y no commitees nunca `.env`. Las variables son:

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

## Producción opcional

### Opción A — VPS único

- Docker Compose: web, api, postgres, minio/r2, caddy.
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

- `GET /api/health` sin datos sensibles.
- Logs JSON con redacción de PII.
- Sin stack traces en producción.
- Healthchecks en Docker.

## Checklist

- [ ] Variables configuradas.
- [ ] Migraciones aplicadas.
- [ ] Bucket privado.
- [ ] Email probado.
- [ ] Cookies `Secure` y mismo dominio.
- [ ] HTTPS.
- [ ] Seed demo.
- [ ] Flujo completo probado.
- [ ] Vídeo de respaldo.
