# Tasks — F28 Ajustes del círculo

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F18.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] CircleForm
- [ ] CirclePermissions
- [ ] DangerZone
- [ ] Confirmación por nombre
- [ ] Owner-only
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: Solo owner accede.
- [ ] AC-02: Guardar settings afecta a permisos reales.
- [ ] AC-03: Borrar exige escribir nombre.
- [ ] AC-04: Confirmación en sheet/dialog.
- [ ] AC-05: Miembro sin permisos ve estado.
- [ ] AC-06: Teclado y foco.

## Verificación

- [ ] `pnpm --filter @memora/web test settings`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
