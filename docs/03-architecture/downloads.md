# Descargas

## Foto individual

- `GET /api/photos/:photoId/download`
- Autoriza sesión, pertenencia y permiso de descarga (`membersCanDownload`).
- Sirve el original con `Content-Disposition: attachment`.
- Nombre seguro: `memora-{album}-{fecha}-{id}.{ext}`.
- `Cache-Control: private, no-store`.

## Selección y álbum

- `POST /api/albums/:albumId/downloads` con `{ photoIds? }`.
- Sin `photoIds`: álbum completo.
- Con `photoIds`: solo esas fotos, todas del álbum.
- Límite: 500 fotos o 2 GB.
- Crea `DownloadJob` `pending` y responde `202`.

## Job

```text
pending → processing → ready
                    ↘ error
ready → expired (24 h)
```

- Worker en proceso con concurrencia limitada (1–2 ZIP a la vez).
- Genera ZIP con `archiver` en streaming a un archivo temporal/S3.
- Nombres de archivo saneados; incluye `README.txt` con álbum y fecha.
- `GET /downloads/:jobId` devuelve estado y `progress`.
- `progress` es un entero 0–100 o `null`. Es **derivado**: la API lo calcula al leer el job y no se persiste en `DownloadJob`. Es `null` mientras el job no ha empezado (`pending`) y cuando ya ha terminado (`ready`, `error`, `expired`); solo aporta información mientras está `processing`.
- `GET /downloads/:jobId/file` sirve el ZIP si `ready` y no expirado.
- Expiración 24 h; limpieza de objetos y registros.
- Si falla, `errorMessage` sin PII y se puede reintentar creando otro job.

## Móvil

- Antes de generar, si el ZIP estimado supera 100 MB, avisar.
- En iOS/Android, explicar que el archivo se guarda en Descargas/Archivos.
- Siempre ofrecer descarga individual como alternativa.

## Seguridad

- Solo el solicitante (o un owner del círculo) puede ver el job.
- No se expone `objectKey`.
- No se sirve el ZIP desde el bucket directamente.
- No se permite descargar fotos de otro círculo cambiando IDs.
- Rate limit 10/min por usuario.

## Fuera del MVP

- Descarga en segundo plano.
- Reanudación de ZIP.
- Compartir ZIP con enlace público.
- Exportación integral del círculo.
