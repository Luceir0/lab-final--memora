# Tasks — F07 Modelo de datos, migraciones y seed

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F06.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Modelos User, Session, Circle, Membership, Invitation, Album, Photo, PhotoTag, DownloadJob, Activity
- [ ] Enums
- [ ] Índices y unique constraints
- [ ] Migración inicial
- [ ] Seed determinista
- [ ] Base de datos de test
- [ ] Factories

## Criterios de aceptación

- [ ] AC-01: prisma migrate dev aplica sin errores.
- [ ] AC-02: Las relaciones y cascadas son correctas.
- [ ] AC-03: No existen latitude/longitude en Photo.
- [ ] AC-04: Activity tiene índices por círculo/fecha.
- [ ] AC-05: El seed es idempotente.
- [ ] AC-06: La BD de test se crea y limpia.

## Verificación

- [ ] `pnpm --filter @memora/api db:migrate`
- [ ] `pnpm --filter @memora/api db:seed`
- [ ] `pnpm --filter @memora/api test`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
