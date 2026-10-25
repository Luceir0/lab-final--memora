# Tasks — F33 Descargas

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F29, F30.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] GET download individual
- [ ] POST download job
- [ ] photoIds
- [ ] Polling
- [ ] Límites
- [ ] Expiración
- [ ] Limpieza
- [ ] Aviso móvil
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Autorización por foto/álbum.
- [ ] AC-02: Límites 500/2 GB.
- [ ] AC-03: Job expira 24 h.
- [ ] AC-04: Polling y descarga.
- [ ] AC-05: Selección solo del álbum.
- [ ] AC-06: Aviso en móvil.
- [ ] AC-07: No se expone objectKey.

## Verificación

- [ ] `pnpm --filter @memora/api test downloads`
- [ ] `pnpm --filter @memora/web test downloads`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
