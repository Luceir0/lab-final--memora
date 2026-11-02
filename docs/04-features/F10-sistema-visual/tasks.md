# Tasks — F10 Sistema visual y tema

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F09 (`done`, PR #5, merge `9fd987e`).
- [x] Comprobar Definition of Ready: cumplida el 2026-11-01 con las siete decisiones de arranque.
- [x] Proponer plan y esperar confirmación: aprobado por el usuario el 2026-11-01.

## Implementación

- [x] tokens.css — tokens `*-text` de estado, capas `--memora-z-*`, breakpoints y `h1` móvil.
- [x] @theme de Tailwind 4 — `@theme inline` + `@theme` de breakpoints (`2xl` anulado).
- [x] data-theme — `resolveDocumentTheme` y `ThemeProvider` con `data-theme` y `color-scheme`.
- [x] Resolución de sistema en servidor — cookie + `prefers-color-scheme` para modo `system`.
- [x] Cookie de tema — `memora-theme` con `Path=/`, `Max-Age` 1 año, `SameSite=Lax` y `Secure` en https.
- [x] theme-color — meta en SSR, script previo al pintado y actualización desde el provider.
- [x] Plus Jakarta Sans — vendorizada en `apps/web/public/fonts`, `fonts.css` y `preload` solo latin.
- [x] Lucide — `lucide-react@1.66.0` en `apps/web` y `ThemeToggle` provisional.
- [x] Focus visible — regla global en `theme.css` con token de foco.
- [x] prefers-reduced-motion — duraciones a 0 y scroll instantáneo en `theme.css`.

## Criterios de aceptación

- [x] AC-01: Los tokens se usan vía utilidades Tailwind — `ThemeToggle` y tests de contrato de `packages/ui`.
- [x] AC-02: No hay hex sueltos en componentes — `apps/web/src/styles/no-hex.test.ts` y `theme.test.ts`.
- [x] AC-03: El tema persiste en cookie — `theme.test.ts`, `ThemeProvider` y `curl` con cookie `dark`.
- [x] AC-04: Sistema sigue prefers-color-scheme — `resolveTheme`, listener de `matchMedia` y script de arranque.
- [x] AC-05: No hay destello al cargar — script en `<head>` antes de `<body>`, estudio SSR (`curl`) y recarga en oscuro en Firefox real el 2026-11-02. **Limitación:** sin prueba automatizada de navegador (F37/F38).
- [x] AC-06: theme-color cambia con el tema — `#F6F6FA` / `#0B0F1E` en SSR, test contra `tokens.css` y cambio observado al alternar temas en Firefox real el 2026-11-02. **Limitación:** sin prueba automatizada de navegador (F37/F38).
- [x] AC-07: Funciona con reduced motion — `theme.css`, test y CSS compilado sin `scroll-behavior:smooth`; sesión de navegador aceptada el 2026-11-02 (preferencia no activada explícitamente). **Limitación:** sin prueba automatizada con la preferencia activa (F37/F38).

## Verificación

- [x] `corepack pnpm --filter @memora/ui test` → 5 ficheros, 44 tests, OK.
- [x] `corepack pnpm --filter @memora/web test` → 17 ficheros, 88 tests, OK.
- [x] `corepack pnpm lint` → 6/6 tareas, OK.
- [x] `corepack pnpm typecheck` → 9/9 tareas, OK.
- [x] `corepack pnpm build` → 5/5 tareas, OK; `/help` prerenderizado, `dist/client/fonts` copiado.
- [x] `corepack pnpm docs:check` → 191 archivos, 439 enlaces, 0 rotos, OK.
- [x] `corepack pnpm agents:check` → 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas, OK.
- [x] Revisar en claro/oscuro en navegador real — **aceptado el 2026-11-02** en Firefox sobre `/login`, `/circles` y `/help`, escritorio y móvil.
- [x] `corepack pnpm --filter @memora/ui test` (re-ejecución 2026-11-02) → 5 ficheros, 44 tests, OK.
- [x] `corepack pnpm --filter @memora/web test` (re-ejecución 2026-11-02) → 17 ficheros, 88 tests, OK.

## Cierre

- [x] Revisión independiente — primera **no apto** (B-01, M-01, M-03) y segunda **apto con correcciones** (M-02 y menores), aplicadas.
- [x] Aceptación del usuario — **2026-11-02**, Firefox real sobre `/login`, `/circles` y `/help`; «De momento, todo parece estar bien», sin cambios pedidos.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] `apps/web/README.md` y `packages/ui/README.md` actualizados — estructura, tema, contrato de fuentes y tests.
- [x] Commits en `feat/F10-sistema-visual`: `517b6eb` `feat(ui): add visual theme system with tokens, fonts and theme switch (F10)`, `3c79110` `docs: record F10 implementation, review and handoff` y `d4826df` `docs: record F10 acceptance`.
- [x] Push y PR: [#7](https://github.com/Luceir0/lab-final--memora/pull/7) `feat: F10 visual system and theme`.
- [x] CI de la PR (head `d4826df`): run `41473542981`, `completed/success`. CI de `main` sobre el merge: run `41473996157`, `completed/success`.
- [x] Merge `f3b26a5` en `main` (`Merge pull request #7 from Luceir0/feat/F10-sistema-visual`) y paso a **`done`** (2026-11-02).

> La rama remota `feat/F10-sistema-visual` sigue existiendo tras el merge; no se eliminó en el cierre.

## Definition of Done (F10)

Marcado solo lo que tiene evidencia real; lo que no aplica o no se verificó queda sin marcar.

**Producto**

- [x] Cumple todos sus criterios de aceptación — AC-01 a AC-07 con evidencia en el handoff.
- [ ] Tiene estados de vacío, carga, éxito y error — no aplica: F10 no entrega pantallas de producto.
- [ ] Funciona con datos persistidos, no mocks — no aplica: F10 no consume datos de producto.
- [ ] Respeta permisos y autorización en servidor — no aplica: F10 no añade endpoints ni datos privados.

**Diseño**

- [ ] Coincide con la pantalla de referencia — no aplica todavía: F10 no implementa pantallas de producto (F11+); el contrato visual sí coincide con `docs/02-design/tokens.md`.
- [x] Usa solo tokens y componentes del sistema — guard anti-hex en `apps/web/src` y `packages/ui/src`, tokens vía utilidades Tailwind.
- [x] Funciona en móvil y escritorio — revisión del usuario el 2026-11-02 en escritorio y vista móvil.
- [x] Funciona en claro y oscuro — revisión del usuario el 2026-11-02 alternando Claro / Oscuro / Sistema.
- [ ] Revisada en 320, 375, 768, 1024 y 1440 px — no se verificaron esos anchos exactos; solo escritorio y vista móvil.

**Accesibilidad**

- [ ] Teclado y foco — regla global de `:focus-visible` y radios nativos implementados y testeados, pero sin sesión explícita de teclado; revisión completa en F39.
- [x] Etiquetas y errores — `ThemeToggle` usa `radiogroup` nativo con etiquetas visibles; F10 no tiene errores de formulario.
- [x] Contraste — `contrast.test.ts` sobre los hex reales (4,5:1 texto, 3:1 foco/componentes); `--color-border-strong` queda como deuda de F11.
- [x] Alternativa a gestos — no hay gestos: el único control es un grupo de radios nativo.
- [ ] axe sin errores críticos — no se ejecutó axe; auditoría en F39.

**Código**

- [x] TypeScript estricto; sin `any` — `pnpm typecheck` 9/9.
- [x] Lint y typecheck limpios — `pnpm lint` 6/6 y `pnpm typecheck` 9/9.
- [ ] Sin errores de consola ni hidratación — la sesión en Firefox real no mostró incidencias, pero no se comprobó la consola de forma explícita y `suppressHydrationWarning` sigue documentado como riesgo; F37/F38.
- [x] Contratos compartidos; sin duplicar DTOs — F10 no añade DTOs ni toca `packages/shared`.
- [x] Sin secretos ni PII en logs — F10 no añade logging y la cookie de tema no contiene datos personales.
- [x] Sin dependencias innecesarias — solo `lucide-react` en `apps/web` y `vitest` en `packages/ui`, ambas autorizadas; fuentes vendorizadas.

**Tests**

- [x] Unitarios de lógica nueva — `packages/ui` 44 tests y `apps/web` 88 tests.
- [ ] API de endpoints y permisos — no aplica: F10 no añade endpoints.
- [x] Componentes de interacción — `theme-toggle.test.tsx` y `theme-provider.test.tsx`.
- [x] Casos negativos — `theme.test.ts` cubre valores desconocidos de cookie y el guard anti-hex detecta literales de color.
- [ ] E2E si es flujo crítico — no hay E2E; AC-05, AC-06 y AC-07 automatizados pasan a F37/F38.
- [x] Resultados ejecutados y reportados — tabla de verificación del handoff.

**Documentación**

- [x] Spec actualizada si cambió algo — el alcance no cambió; el contrato de tokens se actualizó en `docs/02-design/tokens.md`.
- [x] `handoff.md` completo.
- [x] Estado en `docs/04-features/README.md`.
- [x] Bitácora de IA.
- [x] Cobertura del temario con evidencia.
- [x] ADR si hubo decisión — las siete decisiones de arranque quedaron en la spec y el handoff; no hubo cambio de arquitectura que exigiera ADR.

**Entrega**

- [x] Usuario ha probado el flujo — 2026-11-02, Firefox real.
- [x] Usuario ha aceptado — 2026-11-02, sin cambios pedidos.
- [x] Commit propuesto (no ejecutado sin permiso) — tres commits ejecutados con autorización.

## Deuda trasladada

- `ThemeToggle` al shell definitivo y a Perfil: **F11/F34**.
- CSP con nonce o hash para el script de arranque: **F42**.
- `--color-border-strong` por debajo de 3:1 sobre superficie: **F11**.
- `format:check` en **13 archivos de `apps/api`** (deuda desde F08, CI no lo ejecuta): **F11**.
- Cobertura automatizada de navegador de AC-05, AC-06 y AC-07: **F37/F38**.
