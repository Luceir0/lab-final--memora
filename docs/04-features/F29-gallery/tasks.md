# Tasks — F29 Galería

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F21, F24, F26 (`done`).
- [x] Comprobar Definition of Ready.
- [x] Plan aprobado a nivel de proyecto (3 tracks, sin recortes, sin `reviewer` en nivel B).

## Implementación

- [x] PhotoGrid
- [x] PhotoTile
- [x] TanStack Query infinito
- [x] srcset/sizes
- [x] Lazy
- [x] Selección
- [x] SelectionBar
- [x] PersonFilter
- [x] Scroll restaurado
- [x] Estados
- [x] Página «Fotos de esta persona»: ruta, cabecera con total y álbumes, chips por álbum, estado vacío, enlace de vuelta y entrada «Ver sus fotos»
- [x] **Endpoint que faltaba:** `GET /api/albums/:albumId/photos` (contrato congelado de F24, ruta nunca implementada)

## Criterios de aceptación

- [x] AC-01: Móvil 3 columnas; escritorio 4–7.
- [x] AC-02: Scroll infinito por cursor.
- [x] AC-03: Filtro por persona solo del círculo.
- [x] AC-04: Selección con clic/Shift/Ctrl.
- [x] AC-05: Scroll restaurado.
- [x] AC-06: Imágenes adaptadas.
- [x] AC-07: Página de persona solo con fotos del círculo, cabecera y vuelta.
- [x] AC-08: Chips «Todos» y por álbum con conteo.
- [x] AC-09: Estado vacío de persona.
- [x] AC-10: Scroll infinito y teclado en la página de persona.
- [x] AC-11: F29 añade la entrada «Ver sus fotos» en la fila de miembro o en su cabecera.

## Verificación

- [x] `pnpm --filter @memora/web test photos --maxWorkers=2` → 20 tests.
- [x] `pnpm --filter @memora/web test --maxWorkers=2` → suite completa.
- [x] `DATABASE_URL=…memora_test pnpm --filter @memora/api test` → suite completa.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- [ ] Aceptación del usuario en navegador con datos reales (G4).

## Pendiente

- Verificación visual y de teclado en navegador real; el barrido de anchos se centraliza en F39.
- Contadores por persona y álbum: el contrato no los ofrece, se usan los totales existentes (ver handoff).
