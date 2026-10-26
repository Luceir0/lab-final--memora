# ADR-0014: Almacenamiento S3 local con Silo

- Estado: aceptado
- Fecha: 2026-10-26

## Contexto

MinIO dejó de publicar su edición comunitaria: la última release abierta es `RELEASE.2025-10-15T17-29-55Z`, las imágenes oficiales cesaron y el repositorio upstream está archivado. El proyecto usaba `alpine/minio`, un espejo de esa release final, por lo que el entorno local no recibía parches de seguridad.

El fork `pgsty/minio` se renombró a `pgsty/silo` el 2026-08-06. Mantiene una línea con parches, consola web, imágenes multi-arch y compatibilidad con la API S3, las variables `MINIO_*`, las rutas `/minio/*` y el formato de datos.

## Decisión

- Usar `pgsty/silo:RELEASE.2026-10-18T00-00-00Z@sha256:2636fc4155d9a7e41ff58cdb65ddd13ba9304e67184e13c25bc5cb34016269d7` como almacenamiento S3 local.
- Mantener el servicio `minio`, el volumen `minio-data` y las variables `MINIO_ROOT_*` para no romper el entorno ni los datos existentes.
- No usar Silo en producción: allí el almacenamiento es Cloudflare R2 o AWS S3.

## Alternativas

- **Mantener `alpine/minio`:** cero cambios, pero sin parches ni soporte; descartado.
- **Fijar `pgsty/minio:RELEASE.2026-08-04T00-00-00Z`:** última release con el nombre antiguo, congelada tras el renombrado; descartado frente a la línea viva de Silo.
- **R2/S3 también en local:** más fiel a producción, pero exige red, credenciales y coste; peor reproducibilidad para el curso.
- **Otro servidor S3 (Garage, SeaweedFS):** viable, pero implica otra migración y menos compatibilidad probada con el SDK y la consola.

## Consecuencias

- Dependencia de un fork comunitario sin SLA; se fija por tag y digest y se revisa antes de actualizar.
- La licencia es AGPL-3.0. El uso local no cambia obligaciones; si algún día se autoaloja en producción, habrá que revisar las obligaciones de red.
- La compatibilidad S3 debe probarse en F25 (subida, descarga y borrado) contra Silo y contra R2/S3.
- La consola web vuelve a estar disponible en `:9001`, lo que facilita inspeccionar buckets en local.

## Referencias

- `docker-compose.yml`
- `docs/08-delivery/deployment.md`
- `docs/03-architecture/external-services.md`
- https://github.com/pgsty/silo
