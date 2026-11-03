# ADR-0005: Sesiones en BD + cookie + CSRF

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

La app necesita sesión persistente, segura y compatible con SSR. Web y API comparten dominio.

## Decisión

Sesiones en PostgreSQL, token aleatorio en cookie `HttpOnly` y hash en BD. `SameSite=Lax`, `Secure` en producción, 30 días. CSRF de doble envío y comprobación de `Origin`. Rate limiting. Invitar, expulsar y cambiar permisos es solo del propietario; no hay flag de invitación.

## Alternativas

- JWT en localStorage: fácil, pero expuesto a XSS y sin revocación sencilla.
- JWT en cookie: mejor, pero la revocación requiere lista negra.
- Sesión en memoria: no persiste ni escala.

## Consecuencias

- Se puede revocar sesión y cerrar todas.
- Requiere tabla y limpieza.
- El SSR reenvía la cookie a la API.
- Sin verificación de email ni reset en el MVP; documentado.

## Referencias

- `docs/03-architecture/auth.md`
- `docs/04-features/F15-auth-api/spec.md`

## Nota de implementación (2026-11-03, F15)

- El CSRF se implementa con un token HMAC atado al token de sesión y una cookie
  legible `memora_csrf`; no se compara cookie contra cabecera. Es más fuerte que
  el doble envío literal y no cambia la decisión de fondo.
- La limpieza de sesiones es perezosa al leer; la purga programada se difiere a
  F42.
- El registro responde `409` ante un email duplicado (decisión de producto).
  El login mantiene un único `401` genérico.
- Login añade un techo agregado de 20/min por IP además del límite por IP+email.
