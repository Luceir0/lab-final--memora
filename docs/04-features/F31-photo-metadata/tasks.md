# Tasks — F31 Metadatos y lugar

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F30 (`review`, mergeada en local).
- [x] Comprobar Definition of Ready.
- [x] Plan aprobado a nivel de proyecto.

## Implementación

- [x] Formulario de metadatos
- [x] PATCH photo (endpoint nuevo)
- [x] Permisos: autor u owner en servidor; espejo en la UI
- [x] placeName editable
- [x] Fecha
- [x] Estados de edición, guardado, error y éxito
- [x] Cancelar restaura

## Criterios de aceptación

- [x] AC-01: Solo autor/owner edita.
- [x] AC-02: Validación compartida.
- [x] AC-03: placeName se muestra y edita.
- [x] AC-04: No se guardan coordenadas.
- [x] AC-05: Cambios persisten.
- [x] AC-06: Cancelar restaura.

## Verificación

- [x] `pnpm --filter @memora/web test metadata --maxWorkers=2` → 21 tests.
- [x] `pnpm --filter @memora/web test photos --maxWorkers=2` → 55 tests.
- [x] `pnpm --filter @memora/web test --maxWorkers=2` → 781 tests.
- [x] `DATABASE_URL=…memora_test pnpm --filter @memora/api test` → suite completa.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- [ ] Aceptación del usuario en navegador (G4).

## Cierre

- [x] Sin revisión independiente: nivel B y regla de entrega del 2026-11-06.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
