# ADR-0006: Imágenes vía API con cookie

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Las fotos son privadas. Hay que servirlas en `<img>`, en SSR, en el visor y en descargas, sin exponer el bucket.

## Decisión

Servir las imágenes a través de la API con la cookie de sesión:

- `GET /api/photos/:photoId/image?size=thumb|display|original`
- La API comprueba identidad, pertenencia y permiso.
- `display` y `thumb` para miembros; `original` solo con `membersCanDownload`.
- Bucket privado; sin URLs públicas.
- `Cache-Control: private, max-age=3600`, `ETag`.

## Alternativas

- URLs firmadas de S3: mejor rendimiento, pero más complejidad y URLs compartibles mientras viven.
- Bucket público: inaceptable por privacidad.
- CDN con URLs firmadas: buena para producción a escala, pero fuera del MVP.

## Consecuencias

- La API consume ancho de banda al servir imágenes.
- La caché es privada; no se puede compartir entre usuarios.
- Es sencillo de razonar y seguro.
- Si el rendimiento se vuelve un problema, se añaden URLs firmadas sin cambiar el contrato de `PhotoDTO` (solo las URLs).

## Referencias

- `docs/03-architecture/api-contract.md`
- `docs/04-features/F33-downloads/spec.md`
