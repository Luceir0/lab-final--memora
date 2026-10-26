# Servicios externos

Todos se acceden desde el servidor o desde el build, nunca desde el navegador. Cada uno tiene un adaptador y una implementación fake para tests.

## Almacenamiento S3

| Entorno | Implementación |
| --- | --- |
| Local | Silo (fork mantenido de MinIO) en Docker |
| Producción | Cloudflare R2 o AWS S3 |
| Tests | Fake en memoria o Silo de test |

Variables: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`.

- Bucket privado.
- La API sirve las imágenes; no hay URLs públicas.
- Claves generadas por el servidor.
- Borrado de objetos al borrar fotos.

En local se usa **Silo** (`pgsty/silo`), fork mantenido de MinIO tras el cierre de la edición comunitaria upstream. Conserva la API S3, las variables `MINIO_*` y el formato de datos; la imagen va fijada por tag y digest (ver [ADR-0014](adr/ADR-0014-local-storage.md) y `docs/08-delivery/deployment.md`). En producción no se usa: el bucket es R2/S3 gestionado.

## Email

| Entorno | Implementación |
| --- | --- |
| Local | Mailpit |
| Producción | Resend (opcional) |
| Tests | Fake que captura mensajes |

Variables: `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`.

- La invitación existe aunque falle el email.
- Plantilla HTML + texto.
- No se envía email a quien no lo pidió.
- Enlace con token; sin datos privados en el asunto.

## Geocodificación

| Entorno | Implementación |
| --- | --- |
| Local/producción | Nominatim (OpenStreetMap) |
| Tests | Fake con respuestas fijas |

Variables: `GEOCODING_PROVIDER`, `GEOCODING_BASE_URL`, `GEOCODING_USER_AGENT`.

- Reverse geocoding desde GPS transitorio.
- Caché y rate limit.
- Si falla, `placeName` null.
- No se persisten coordenadas.

## Content Island

| Entorno | Implementación |
| --- | --- |
| Build | Cliente `@content-island/api-client` en modo snapshot |
| Tests | Snapshot fixture |

Variables: `CONTENT_ISLAND_ACCESS_TOKEN`, `CONTENT_ISLAND_PROJECT_ID` (si aplica).

- Solo Ayuda, FAQ y Privacidad.
- Token de lectura; nunca en cliente.
- Snapshot versionado.
- Si falla el build, falla con mensaje claro.

## Reglas

- Secretos en `.env` local; `.env.example` documentado.
- Nunca en logs ni en el bundle.
- Timeouts y reintentos acotados.
- Errores externos se traducen a errores de dominio.
- Tests no llaman a servicios reales.
