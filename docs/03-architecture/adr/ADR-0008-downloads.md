# ADR-0008: Jobs ZIP en proceso

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Descargar un álbum completo puede tardar y consumir memoria. No hay infraestructura de colas y el despliegue no es obligatorio.

## Decisión

- `DownloadJob` en BD.
- Generación de ZIP en un worker en proceso con concurrencia 1–2.
- Streaming con `archiver` a archivo temporal/S3.
- Límite 500 fotos o 2 GB; expiración 24 h.
- Polling desde el cliente.

## Alternativas

- ZIP síncrono: simple, pero bloquea y puede agotar memoria.
- Cola externa (BullMQ/Redis): robusta, pero añade infraestructura.
- Lambda: buena para producción, pero fuera del MVP.

## Consecuencias

- Un reinicio pierde jobs en `processing`; se marcan como `error` al arrancar.
- La concurrencia limita el uso de CPU/memoria.
- Si se necesita escala, se sustituye el worker sin cambiar el contrato.
- Limpieza de ZIP y registros expirados.

## Referencias

- `docs/03-architecture/downloads.md`
- `docs/04-features/F33-downloads/spec.md`
