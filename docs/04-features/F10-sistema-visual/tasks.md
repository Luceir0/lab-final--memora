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
- [x] AC-05: No hay destello al cargar — script en `<head>` antes de `<body>` y estudio SSR (`curl`). **Limitación:** falta navegador real.
- [x] AC-06: theme-color cambia con el tema — `#F6F6FA` / `#0B0F1E` en SSR y test contra `tokens.css`. **Limitación:** falta navegador real.
- [x] AC-07: Funciona con reduced motion — `theme.css`, test y CSS compilado sin `scroll-behavior:smooth`. **Limitación:** falta navegador real.

## Verificación

- [x] `corepack pnpm --filter @memora/ui test` → 5 ficheros, 44 tests, OK.
- [x] `corepack pnpm --filter @memora/web test` → 17 ficheros, 88 tests, OK.
- [x] `corepack pnpm lint` → 6/6 tareas, OK.
- [x] `corepack pnpm typecheck` → 9/9 tareas, OK.
- [x] `corepack pnpm build` → 5/5 tareas, OK; `/help` prerenderizado, `dist/client/fonts` copiado.
- [x] `corepack pnpm docs:check` → 191 archivos, 439 enlaces, 0 rotos, OK.
- [x] `corepack pnpm agents:check` → 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas, OK.
- [ ] Revisar en claro/oscuro en navegador real — pendiente de G4.

## Cierre

- [x] Revisión independiente — primera **no apto** (B-01, M-01, M-03) y segunda **apto con correcciones** (M-02 y menores), aplicadas.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] `apps/web/README.md` y `packages/ui/README.md` actualizados — estructura, tema, contrato de fuentes y tests.
- [ ] Commit propuesto (sin ejecutar).
- [ ] Push, PR, CI y merge.
- [ ] `done`.
