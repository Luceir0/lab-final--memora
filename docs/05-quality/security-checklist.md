# Checklist de seguridad

> Revisado el **2026-11-08** en F41. Evidencia detallada en
> [security-report.md](security-report.md). `[x]` = comprobado con código, test o petición
> real; `[ ]` = no comprobado o abierto.

## Autenticación

- [x] Contraseñas con argon2id.
- [x] Mensajes genéricos; sin enumeración de cuentas.
- [x] Cookie `HttpOnly`, `Secure` en prod, `SameSite=Lax`.
- [x] Rotación de sesión al login.
- [x] Logout invalida sesión.
- [x] Rate limit en login/registro.
- [x] CSRF en mutaciones.
- [x] `Origin`/`Referer` validados.

## Autorización

- [x] Cada endpoint comprueba sesión.
- [x] Cada recurso comprueba pertenencia.
- [x] Cada acción comprueba permiso.
- [x] IDs de otro círculo no filtran datos.
- [x] Descargas y ZIP autorizados.
- [x] `original` requiere `membersCanDownload`.
- [x] Borrar álbum no vacío devuelve `ALBUM_NOT_EMPTY`.
- [x] Etiquetas solo a miembros.
- [x] Owner-only: invitar, expulsar, settings, borrar círculo.

## Archivos

- [x] Magic bytes, no solo MIME.
- [x] Tamaño y píxeles limitados.
- [x] SVG/GIF rechazados.
- [x] Cuota por círculo.
- [x] Bucket privado.
- [x] Claves generadas por servidor.
- [x] Objetos huérfanos limpiados (mantenimiento en proceso cada 15 min, retención de 24 h).
- [x] EXIF sin GPS persistido.

## API

- [x] Validación Zod en todas las entradas.
- [x] Errores uniformes; sin stack en prod (verificado en código; no se ejecutó en prod).
- [x] Rate limits.
- [x] Helmet/cabeceras.
- [x] CORS no abierto innecesariamente.
- [x] OpenAPI no expone secretos (revisado en los schemas: las respuestas no incluyen hashes, tokens ni claves de storage).
- [x] Logs con redacción de PII.
- [x] Redirect tras login solo a rutas internas allow-list (sin open redirect).
- [x] Jobs ZIP con timeout, abort y límite de concurrencia (código; sin prueba de carga).

## Frontend

- [x] Sin secretos en bundle.
- [x] Sin `dangerouslySetInnerHTML` con contenido de usuario.
- [x] Enlaces externos con `rel` (no hay enlaces externos; ningún `target="_blank"`).
- [x] CSP compatible.
- [x] Tokens no en localStorage.
- [x] Errores no muestran datos internos.

## Operación

- [x] `.env` fuera de Git.
- [x] `.env.example` documentado.
- [x] Dependencias auditadas (2 moderadas aceptadas y documentadas, H-01).
- [x] Backups documentados como fuera de MVP.
- [x] Migraciones revisadas.
- [x] Healthcheck sin datos sensibles.
