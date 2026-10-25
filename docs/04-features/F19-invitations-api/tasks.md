# Tasks — F19 Invitations API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F17.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Token aleatorio y hash
- [ ] Caducidad 7 días
- [ ] Revocación
- [ ] Aceptación idempotente
- [ ] Email adapter
- [ ] Listado pendiente
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Token no predecible y hasheado.
- [ ] AC-02: Caduca y se puede revocar.
- [ ] AC-03: Aceptar dos veces no duplica.
- [ ] AC-04: Ya miembro devuelve estado.
- [ ] AC-05: Email fallido no rompe la invitación.
- [ ] AC-06: Solo owner crea/lista/revoca.
- [ ] AC-07: No se exponen datos privados.

## Verificación

- [ ] `pnpm --filter @memora/api test invitations`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
