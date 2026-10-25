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

## Variables

`.env.example` documentará:

```text
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
```

Nunca se commitea `.env`.

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
