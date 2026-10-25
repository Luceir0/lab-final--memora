# ADR-0007: Subidas multipart + sharp + sin GPS

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Las fotos llegan desde móvil y escritorio, con redes inestables, formatos variados y metadatos sensibles. Hay que validar, procesar y servir variantes.

## Decisión

- Subida **multipart a la API**, un archivo por petición, concurrencia 3 en cliente.
- Validación por magic bytes, tamaño (25 MB), píxeles (50 MP) y cuota (2 GB/círculo).
- `sharp` para orientación, thumb 400 y display 1600; original privado.
- `heic-convert` para HEIC si el spike lo valida; si no, rechazo 415 claro.
- EXIF: orientación y fecha; GPS solo en memoria para geocodificar.
- **No se persisten coordenadas**; solo `placeName`. La caché de geocodificación es en memoria.
- Idempotencia con `clientUploadId`.
- Adaptador de almacenamiento y fakes en tests.

## Alternativas

- Subida directa a S3 con URL firmada: menos carga en API, pero validación y procesamiento más complejos.
- Guardar original sin procesar: peor rendimiento y privacidad.
- Guardar GPS: útil para mapas, pero no está en el producto y añade riesgo.

## Consecuencias

- La API hace más trabajo, pero controla validación y seguridad.
- La cola cliente debe gestionar progreso, reintentos y cancelación.
- El procesamiento puede fallar; se borran objetos y no se publica la foto.
- La geocodificación es best-effort.

## Referencias

- `docs/03-architecture/uploads.md`
- `docs/04-features/F25-upload-pipeline-api/spec.md`
- `docs/04-features/F26-upload-queue-web/spec.md`
