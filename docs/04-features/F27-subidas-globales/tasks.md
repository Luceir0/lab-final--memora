# Tasks — F27 Subidas globales

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F26.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] UploadProvider global
- [ ] Ruta /uploads
- [ ] Panel
- [ ] Subidas recientes
- [ ] Contador en sidebar
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: La cola sigue al navegar.
- [ ] AC-02: Sidebar muestra contador.
- [ ] AC-03: Ruta /uploads accesible.
- [ ] AC-04: Recientes del usuario.
- [ ] AC-05: Sin datos de otros.
- [ ] AC-06: Estado vacío.

## Verificación

- [ ] `pnpm --filter @memora/web test uploads`
- [ ] `pnpm --filter @memora/api test uploads`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
