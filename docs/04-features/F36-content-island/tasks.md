# Tasks — F36 Content Island

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F09, F10.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (alcance reducido confirmado por el orquestador).

## Implementación

- [x] Tipos helpArticle/faqItem/legalPage.
- [x] Cliente con snapshot.
- [x] Export de snapshot (snapshot versionado en la raíz del repo).
- [x] Rutas /help y /privacy.
- [x] Accordion FAQ con `details`/`summary` nativos.
- [x] Build falla si falta el snapshot o la página legal.
- [x] MCP/skills.
- [x] `LegalPage` y `readLegalPage()`/`loadLegalPage()` para el slug `privacidad`.
- [x] `/privacy` real con `PageContainer`, un único `h1` y párrafos sin HTML crudo.
- [x] `/privacy` añadida al prerender de `apps/web/vite.config.ts`.

## Criterios de aceptación

- [x] AC-01: Tipos tipados y validados (`LegalPage` incluido).
- [x] AC-02: Snapshot versionado.
- [x] AC-03: SSG genera HTML (`dist/client/privacy/index.html` verificado).
- [x] AC-04: FAQ accesible (implementación existente con `details`/`summary`).
- [x] AC-05: Privacidad con slug `legalPage` `privacidad`.
- [x] AC-06: Token solo en build (modo snapshot, `accessToken` vacío).
- [x] AC-07: Build falla sin snapshot o sin página legal (tests de error).

## Verificación

- [x] `pnpm --filter @memora/web test content` → 2 archivos, 10 tests.
- [x] `pnpm --filter @memora/web test privacy` → 1 archivo, 3 tests.
- [x] `pnpm --filter @memora/web test provisional` → 1 archivo, 3 tests.
- [x] `pnpm --filter @memora/web typecheck` → sin errores.
- [x] `pnpm --filter @memora/web lint` → sin errores.
- [x] `pnpm --filter @memora/web build` → 5 páginas prerenderizadas, incluida `/privacy`.
- [x] Build con `CONTENT_ISLAND_SNAPSHOT_PATH` inexistente → exit 1; falla el prerender de `/privacy`.
- [x] `pnpm exec prettier --check <archivos tocados>` → sin cambios pendientes.

## Cierre

- [x] Revisión independiente — no aplica (nivel C; gates automáticos y aceptación del usuario).
- [ ] Aceptación del usuario en móvil/escritorio y claro/oscuro.
- [x] `handoff.md` completo.
- [ ] Tablero actualizado (prohibido en este encargo; no se tocó `docs/04-features/README.md`).
- [ ] Bitácora y cobertura actualizadas (fuera del alcance permitido).
- [ ] Commit propuesto (sin ejecutar).
