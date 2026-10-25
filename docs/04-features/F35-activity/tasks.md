# Tasks — F35 Actividad

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F21, F23, F25, F28.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Tabla Activity
- [ ] Escritura en transacción
- [ ] GET global/círculo
- [ ] Agrupación de subidas
- [ ] Panel
- [ ] Página
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: Cada acción relevante crea evento.
- [ ] AC-02: Solo círculos del usuario.
- [ ] AC-03: Agrupación correcta.
- [ ] AC-04: Paginación por cursor.
- [ ] AC-05: Panel y página.
- [ ] AC-06: No PII.
- [ ] AC-07: El diseño inferido se documenta y se revisa con `design-auditor`.

## Verificación

- [ ] `pnpm --filter @memora/api test activity`
- [ ] `pnpm --filter @memora/web test activity`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
