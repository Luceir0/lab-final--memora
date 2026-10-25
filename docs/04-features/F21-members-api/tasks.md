# Tasks — F21 Members API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F17.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] GET members
- [ ] DELETE member
- [ ] POST leave
- [ ] Contadores
- [ ] Invitaciones pendientes
- [ ] Reglas de owner
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Miembros solo del círculo.
- [ ] AC-02: Owner puede expulsar; member no.
- [ ] AC-03: Member puede salir; owner no sin borrar.
- [ ] AC-04: Fotos permanecen; tags del expulsado se eliminan.
- [ ] AC-05: Contadores correctos.
- [ ] AC-06: No se filtra información.

## Verificación

- [ ] `pnpm --filter @memora/api test members`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
