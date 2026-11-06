# Tasks — F30 Visor de foto

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F29 (`review`, mergeada en local).
- [x] Comprobar Definition of Ready.
- [x] Plan aprobado a nivel de proyecto (3 tracks, sin recortes, sin `reviewer` en nivel B).

## Implementación

- [x] Ruta propia anidada bajo el álbum
- [x] Modal escritorio
- [x] Fullscreen móvil
- [x] Teclado/flechas/Esc
- [x] Swipe con alternativa
- [x] Panel de detalles
- [x] Loading/no disponible
- [x] Restaurar scroll
- [x] **Endpoint que faltaba:** `GET /api/photos/:photoId`

## Criterios de aceptación

- [x] AC-01: Móvil fullscreen; escritorio modal.
- [x] AC-02: Atrás cierra y conserva scroll.
- [x] AC-03: Flechas y Esc.
- [x] AC-04: Swipe con botones.
- [x] AC-05: Foco gestionado.
- [x] AC-06: Detalles con autor/fecha/lugar.
- [x] AC-07: Imagen no disponible.

## Verificación

- [x] `pnpm --filter @memora/web test viewer --maxWorkers=2` → 13 tests.
- [x] `pnpm --filter @memora/web test photos --maxWorkers=2` → 34 tests.
- [x] `pnpm --filter @memora/web test --maxWorkers=2` → suite completa.
- [x] `DATABASE_URL=…memora_test pnpm --filter @memora/api test` → 358 tests.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- [ ] Aceptación del usuario en navegador (G4).

## Cierre

- [x] Sin revisión independiente: nivel B y regla de entrega del 2026-11-06.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.

## Pendiente

- E2E real de atrás/scroll/foco y swipe táctil → F38.
- Vecinos solo desde páginas cacheadas cuando se entra por enlace directo.
- Al abrir desde «Fotos de esta persona», cerrar vuelve al álbum (limitación anotada).
