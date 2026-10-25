# Tasks — F26 Upload queue web

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F24, F25.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] useUploadQueue
- [ ] Reducer con unión discriminada
- [ ] Concurrencia 3
- [ ] Progreso XHR
- [ ] Retry/cancel
- [ ] Dropzone
- [ ] Selector cámara/galería
- [ ] Aviso al salir
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Cada archivo tiene estado discriminado.
- [ ] AC-02: Progreso por archivo y global.
- [ ] AC-03: Reintento individual.
- [ ] AC-04: Cancelación.
- [ ] AC-05: Un error no pierde los demás.
- [ ] AC-06: Drag & drop y selector.
- [ ] AC-07: Aviso al salir.

## Verificación

- [ ] `pnpm --filter @memora/web test uploads`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
