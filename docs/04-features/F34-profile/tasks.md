# Tasks — F34 Perfil y preferencias

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F16.
- [x] Comprobar Definition of Ready.
- [x] Plan aprobado en `docs/06-process/remaining-plan.md` (sesión S1).

## Implementación

- [x] ProfileCard
- [x] Edición de nombre (email inmutable; avatar con iniciales)
- [x] ThemeToggle
- [x] InstallAppRow
- [x] Logout
- [x] Estados
- [x] Sin medidor de almacenamiento (dato falso; retirado el 2026-11-07)

## Criterios de aceptación

- [x] AC-01: Editar nombre valida y guarda.
- [x] AC-02: El email se muestra pero no se edita en el MVP.
- [x] AC-03: El avatar usa iniciales; no hay subida en el MVP.
- [x] AC-04: Tema persiste.
- [x] AC-05: Instalar explica iOS/Android.
- [x] AC-06: No aplica (medidor de almacenamiento retirado del MVP).
- [x] AC-07: Logout redirige.

## Verificación

- [x] `pnpm --filter @memora/web test profile` → **27 tests**.
- [x] `pnpm --filter @memora/web test provisional` → **2 tests**.
- [x] `pnpm --filter @memora/web test` (suite completa).
- [x] `pnpm typecheck` → **9/9**.
- [x] `pnpm lint` → **6/6**.
- [x] `pnpm build` → **5/5**.
- [x] `pnpm format:check`.

## Cierre

- [x] Revisión independiente (nivel C: no aplica; gates automáticos + axe jsdom).
- [x] Aceptación del usuario (2026-11-07).
- [x] `handoff.md` completo.
- [x] Tablero actualizado a `done`.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit, PR #53 y merge `9ad61a0`.
