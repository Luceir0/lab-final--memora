# Tasks — F32 Etiquetado

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F22, F30.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] POST/DELETE tags
- [ ] TagPeopleSheet/Dialog
- [ ] Buscador
- [ ] Solo miembros
- [ ] Optimistic update
- [ ] Fotos de persona
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: Solo miembros del círculo.
- [ ] AC-02: No duplicar.
- [ ] AC-03: Optimista con rollback.
- [ ] AC-04: Filtro solo del círculo.
- [ ] AC-05: Accesible como lista.
- [ ] AC-06: Quitar etiqueta.

## Verificación

- [ ] `pnpm --filter @memora/api test tags`
- [ ] `pnpm --filter @memora/web test tags`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
