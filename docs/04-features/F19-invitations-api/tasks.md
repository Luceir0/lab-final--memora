# Tasks — F19 Invitations API

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F17.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Token aleatorio y hash
- [x] Caducidad 7 días
- [x] Revocación
- [x] Aceptación idempotente
- [x] Email adapter
- [x] Listado pendiente
- [x] Tests

## Criterios de aceptación

- [x] AC-01: Token no predecible y hasheado.
- [x] AC-02: Caduca y se puede revocar.
- [x] AC-03: Aceptar dos veces no duplica.
- [x] AC-04: Ya miembro devuelve estado.
- [x] AC-05: Email fallido no rompe la invitación.
- [x] AC-06: Solo owner crea/lista/revoca.
- [x] AC-07: No se exponen datos privados.

## Correcciones de la revisión independiente

- [x] B-01: token redactado en los logs de petición (`serializers.req`) y test de regresión con `loggerStream`.
- [x] B-01: aviso de email fallido sin destinatario, token ni nombre del círculo (verificado en test).
- [x] M-01: `EMAIL_PROVIDER=resend` obligatorio en producción.
- [x] M-02: `nodemailer` y `@types/nodemailer` fijados a versión exacta.
- [x] M-03: `P2003`/`P2025` al crear → `404 NOT_FOUND`, con test de carrera.
- [x] N-02: `private, no-store` en el `201` de creación y el `200` de aceptación.
- [x] N-04: handoff sin contradicción sobre `docs/04-features/README.md`.
- [x] N-05: `DELETE` sin `Origin`, listado sin aceptadas, `from = EMAIL_FROM` y token >256 → `400`.
- [x] N-06: validación de formato de `EMAIL_FROM`.
- [x] N-07: redacción del token generalizada a variantes no canónicas (barra final, `/accept/`, extra, `//accept`, prefijo percent-encoded) con test.
- [x] N-10: producción sin `EMAIL_PROVIDER` rechazada y forma RFC `<email>` aceptada en `EMAIL_FROM`.
- [x] N-11: handoff y tasks precisan el alcance de la redacción de logs y asignan los access logs del proxy a F42.
- [x] N-09: documentado como nit (sin tipos empaquetados en `nodemailer`; `@types/nodemailer@8.0.2` es lo disponible).

## Verificación

- [x] `pnpm --filter @memora/api test invitations` → 30 passed.
- [x] `pnpm --filter @memora/api test` → 200 passed (11 archivos).
- [x] `pnpm --filter @memora/api typecheck`
- [x] `pnpm --filter @memora/api lint`
- [x] `pnpm format:check`

## Cierre

- [x] Revisión independiente ronda 1 (nivel A) → **no apto** por B-01 (token en claro en los logs de petición).
- [x] Revisión independiente ronda 2 (nivel A) → **apto con correcciones**; N-07 cerrado después con test de regresión.
- [x] Aceptación del usuario (2026-11-04, feature de backend sin pantalla).
- [x] `handoff.md` completo, con las dos rondas y la prueba real.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar) y PR.
- [ ] Merge y CI; después, F19 pasa a `done`.
