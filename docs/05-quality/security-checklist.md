# Checklist de seguridad

## Autenticación

- [ ] Contraseñas con argon2id.
- [ ] Mensajes genéricos; sin enumeración de cuentas.
- [ ] Cookie `HttpOnly`, `Secure` en prod, `SameSite=Lax`.
- [ ] Rotación de sesión al login.
- [ ] Logout invalida sesión.
- [ ] Rate limit en login/registro.
- [ ] CSRF en mutaciones.
- [ ] `Origin`/`Referer` validados.

## Autorización

- [ ] Cada endpoint comprueba sesión.
- [ ] Cada recurso comprueba pertenencia.
- [ ] Cada acción comprueba permiso.
- [ ] IDs de otro círculo no filtran datos.
- [ ] Descargas y ZIP autorizados.
- [ ] `original` requiere `membersCanDownload`.
- [ ] Borrar álbum no vacío devuelve `ALBUM_NOT_EMPTY`.
- [ ] Etiquetas solo a miembros.
- [ ] Owner-only: invitar, expulsar, settings, borrar círculo.

## Archivos

- [ ] Magic bytes, no solo MIME.
- [ ] Tamaño y píxeles limitados.
- [ ] SVG/GIF rechazados.
- [ ] Cuota por círculo.
- [ ] Bucket privado.
- [ ] Claves generadas por servidor.
- [ ] Objetos huérfanos limpiados.
- [ ] EXIF sin GPS persistido.

## API

- [ ] Validación Zod en todas las entradas.
- [ ] Errores uniformes; sin stack en prod.
- [ ] Rate limits.
- [ ] Helmet/cabeceras.
- [ ] CORS no abierto innecesariamente.
- [ ] OpenAPI no expone secretos.
- [ ] Logs con redacción de PII.
- [ ] Redirect tras login solo a rutas internas allow-list (sin open redirect).
- [ ] Jobs ZIP con timeout, abort y límite de concurrencia.

## Frontend

- [ ] Sin secretos en bundle.
- [ ] Sin `dangerouslySetInnerHTML` con contenido de usuario.
- [ ] Enlaces externos con `rel`.
- [ ] CSP compatible.
- [ ] Tokens no en localStorage.
- [ ] Errores no muestran datos internos.

## Operación

- [ ] `.env` fuera de Git.
- [ ] `.env.example` documentado.
- [ ] Dependencias auditadas.
- [ ] Backups documentados como fuera de MVP.
- [ ] Migraciones revisadas.
- [ ] Healthcheck sin datos sensibles.
