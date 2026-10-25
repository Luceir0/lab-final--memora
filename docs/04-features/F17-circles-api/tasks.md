# Tasks — F17 Circles API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F08, F15.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] GET/POST /circles
- [ ] GET/PATCH/DELETE /circles/:id
- [ ] Membership owner
- [ ] Settings flags
- [ ] Stats
- [ ] Autorización
- [ ] Tests de acceso cruzado

## Criterios de aceptación

- [ ] AC-01: Crear círculo añade owner membership.
- [ ] AC-02: Solo miembros ven el círculo.
- [ ] AC-03: Solo owner edita settings/borra.
- [ ] AC-04: Un extraño recibe 404.
- [ ] AC-05: settings valida flags.
- [ ] AC-06: Stats no filtran otros círculos.
- [ ] AC-07: Tests negativos.

## Verificación

- [ ] `pnpm --filter @memora/api test circles`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
