# Handoff — F10 Sistema visual y tema

> Fecha: 2026-11-01 · Implementador: `ui-dev` (dos rondas) · Estado: **`done`**
> (G4 aceptación: 2026-11-02 · G5 cierre: 2026-11-02)
> Revisión independiente: cerrada en dos rondas; primera **no apto** (B-01, M-01, M-03) y
> segunda **apto con correcciones** (M-02 y menores de documentación/guard, aplicados) ·
> Aceptación del usuario (G4): **2026-11-02**, revisión visual en Firefox real sobre
> `/login`, `/circles` y `/help`, en claro/oscuro/sistema, escritorio y móvil, sin cambios
> pedidos · Cierre operativo (G5): rama `feat/F10-sistema-visual`, commits `517b6eb`,
> `3c79110` y `d4826df`, PR [#7](https://github.com/Luceir0/lab-final--memora/pull/7),
> CI de la PR run `41473542981` `completed/success` (head `d4826df`), merge `f3b26a5` en
> `main` y CI de `main` run `41473996157` `completed/success`.

## Resultado

Tokens, Tailwind 4 CSS-first, tema claro/oscuro/sistema, fuente self-hosted, iconos,
foco visible y movimiento reducido están implementados y verificados de forma estática.
`packages/ui` expone `tokens.css`, `theme.css` y `fonts.css` con tests de contrato y
contraste (44 tests) y no incorpora React ni componentes. `apps/web` resuelve el tema en
servidor desde la cookie `memora-theme`, pinta `data-theme` y `theme-color` antes del
primer pintado con un script en `<head>` y monta un `ThemeToggle` provisional en
`/circles`.

La revisión independiente cerró sin bloqueantes abiertos. **El usuario aceptó la feature
el 2026-11-02** tras revisarla en Firefox real sobre el servidor de desarrollo
(`localhost:3000`) en `/login`, `/circles` y `/help`, alternando Claro / Oscuro / Sistema,
recargando en oscuro, en escritorio y en vista móvil. Su valoración fue «De momento, todo
parece estar bien» y no pidió cambios. **F10 está en `done`**: el cierre operativo se
completó el 2026-11-02 con la rama `feat/F10-sistema-visual`, la PR #7, CI en verde en la
PR y en `main`, y el merge `f3b26a5` (ver «Cierre operativo»).

## Cambios (archivos)

**`packages/ui` (sistema visual como CSS)**

- `packages/ui/src/styles/tokens.css`: tokens `--memora-success-text`,
  `--memora-warning-text` y `--memora-info-text` (claro y oscuro); capas
  `--memora-z-nav|sheet|modal|toast`; breakpoints `sm/md/lg/xl` 30/48/64/80 rem con `2xl`
  anulado; `h1` móvil 26/32 px por debajo de 480 px; mapeo de `--z-index-*` en
  `@theme inline`.
- `packages/ui/src/styles/theme.css` (nuevo): base de `html`/`body`, selección, foco
  visible global y `prefers-reduced-motion` (duraciones a 0 y scroll instantáneo).
- `packages/ui/src/styles/fonts.css` (nuevo): `@font-face` de Plus Jakarta Sans (latin y
  latin-ext, pesos 200–800, `font-display: swap`, rutas `/fonts/*.woff2`).
- `packages/ui/src/styles/{tokens,contrast,theme,fonts,package}.test.ts` y
  `packages/ui/vitest.config.ts`: 5 archivos y 44 tests de contrato (tokens,
  breakpoints, capas, contraste WCAG sobre los hex reales, `theme.css`, fuentes y
  exports).
- `packages/ui/src/vite-assets.d.ts`: tipado de imports `?raw` de CSS en tests.
- `packages/ui/package.json`: exports `./theme.css` y `./fonts.css`, script `test` y
  `vitest` como devDependency (aprobado en la decisión 6).
- `packages/ui/README.md`: documentación del paquete, contrato de fuentes, comandos y tests.

**`apps/web` (resolución de tema)**

- `apps/web/src/lib/theme.ts` (+ `theme.test.ts`): `ThemeMode`/`ResolvedTheme`,
  `parseThemeMode`, `resolveTheme`, `resolveDocumentTheme`, cookie
  (`serializeThemeCookie`, lectura sin `document`), `THEME_COLORS`, `FONT_PRELOAD` y
  `createThemeInitScript`.
- `apps/web/src/components/theme-provider.tsx` (+ test): aplica `data-theme` y
  `color-scheme`, escribe la cookie, actualiza `theme-color` y escucha al sistema solo en
  modo `system`.
- `apps/web/src/components/theme-toggle.tsx` (+ test): `radiogroup` nativo con Claro,
  Oscuro y Sistema, etiquetas visibles, iconos decorativos y 44 px de área táctil.
- `apps/web/src/routes/__root.tsx`: cookie en servidor, `data-theme`, `theme-color`,
  `preload` del subset latin y script `data-memora-theme-init` en `<head>` antes de
  `<body>`; `ThemeProvider` en el shell.
- `apps/web/src/features/spike/circles-page.tsx`: monta `ThemeToggle` con
  `TODO(F11/F34)`.
- `apps/web/src/styles/app.css`: importa `tokens.css`, `theme.css` y `fonts.css`; sin
  foco duplicado.
- `apps/web/src/styles/{tokens,no-hex}.test.ts`: contrato del CSS global, exports del
  paquete y guard anti-hex en `src` y `packages/ui/src` (única excepción `lib/theme.ts`).
- `apps/web/src/test/setup.ts`: limpia `data-theme`, `color-scheme` y la cookie entre
  tests y añade un stub de `matchMedia`.
- `apps/web/src/routes/circles.test.tsx`: renderiza `CirclesPage` dentro de
  `ThemeProvider`.
- `apps/web/public/fonts/`: dos `.woff2` vendorizados y `OFL.txt`.
- `apps/web/package.json` + `pnpm-lock.yaml`: `lucide-react@1.66.0` en `apps/web`
  (decisión 3).
- `apps/web/README.md`: documentación de tema, estructura real y contrato de fuentes.

## Verificación (comando → resultado real)

| Comando | Resultado |
| --- | --- |
| `corepack pnpm --filter @memora/ui test` | 5 ficheros, **44 tests**, OK |
| `corepack pnpm --filter @memora/web test` | 17 ficheros, **88 tests**, OK |
| `corepack pnpm lint` | 6/6 tareas, OK |
| `corepack pnpm typecheck` | 9/9 tareas, OK |
| `corepack pnpm build` | 5/5 tareas, OK; `/help` prerenderizado; `dist/client/fonts` copiado; CSS cliente 18,8 kB |
| `corepack pnpm docs:check` | 191 archivos, 439 enlaces, 0 rotos, OK |
| `corepack pnpm agents:check` | 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas, OK |
| `corepack pnpm install --frozen-lockfile` | «Lockfile is up to date» |
| SSR con dev en 3000 (`curl`) | sin cookie/`light` → `data-theme="light"` + `theme-color #F6F6FA`; `dark` → `data-theme="dark"` + `#0B0F1E`; `/circles` (`ssr:false`) resuelve por cookie; script `data-memora-theme-init` en `<head>` antes de `<body>`; un solo `preload` (subset latin) |
| CSS compilado | `@media (width>=30/48/64/80rem)`, `(width<=29.99rem)` con `--memora-text-h1:1.625rem`, `has-[:checked]:border-primary`, `--color-scheme` 1+1, sin `96rem`, sin `scroll-behavior:smooth` |
| Revisión visual en navegador | **Aceptada el 2026-11-02** (G4, ver abajo) |

### Aceptación del usuario (G4, 2026-11-02)

El usuario revisó la app en **Firefox real** sobre el servidor de desarrollo en
`localhost:3000`, en `/login`, `/circles` y `/help`, alternando **Claro / Oscuro /
Sistema**, recargando en oscuro, en escritorio y en vista móvil. Valoración textual: «De
momento, todo parece estar bien». **No pidió cambios.**

Verificación del orquestador justo antes, con peticiones reales (`curl`) al servidor de
desarrollo:

- `/circles` → **200**, `/login` → **200**, `/help` → **200**, `/api/health` vía proxy →
  **200**.
- Sin cookie: `data-theme="light"` y `theme-color #F6F6FA`.
- Con cookie `memora-theme=dark`: `data-theme="dark"` y `theme-color #0B0F1E`.

Tests re-ejecutados el 2026-11-02: `corepack pnpm --filter @memora/ui test` → **5 ficheros
/ 44 tests OK**; `corepack pnpm --filter @memora/web test` → **17 ficheros / 88 tests OK**.

**Limitación honesta:** sigue sin existir prueba automatizada de navegador. La aceptación
es manual y la cobertura reproducible queda para **F37/F38**.

**Deuda preexistente, no imputable a F10:** `pnpm format:check` falla en **13 archivos de
`apps/api`** desde F08 (no modificados en esta rama). CI no ejecuta `format:check`.

## Cierre operativo (G5, 2026-11-02)

| Elemento | Valor real |
| --- | --- |
| Rama | `feat/F10-sistema-visual` |
| Commits | `517b6eb` `feat(ui): add visual theme system with tokens, fonts and theme switch (F10)`; `3c79110` `docs: record F10 implementation, review and handoff`; `d4826df` `docs: record F10 acceptance` |
| PR | [#7](https://github.com/Luceir0/lab-final--memora/pull/7) `feat: F10 visual system and theme` |
| CI de la PR | run `41473542981` `CI` `completed/success`, head `d4826df` |
| Merge en `main` | `f3b26a5` `Merge pull request #7 from Luceir0/feat/F10-sistema-visual` |
| CI de `main` | run `41473996157` `CI` `completed/success` sobre el merge |
| Rama remota | `feat/F10-sistema-visual` sigue existiendo tras el merge |

La aceptación (G4) del usuario es la del 2026-11-02 descrita arriba. No se ejecutó ningún
paso de este cierre operativo desde este rol de documentación: los identificadores son los
del cierre ya ejecutado y se registran sin reinterpretarlos.

## Criterios de aceptación

| AC | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | Los tokens se usan vía utilidades Tailwind | **pasa** | `ThemeToggle` usa `bg-surface-2`, `text-muted`, `border-primary`, `has-[:checked]:*`; `tokens.test.ts` verifica `@theme inline` y utilidades; CSS compilado con `has-[:checked]:border-primary` |
| AC-02 | No hay hex sueltos en componentes | **pasa** | `apps/web/src/styles/no-hex.test.ts` recorre `src` y `packages/ui/src`; `theme.test.ts` comprueba cero hex en `theme.css`; única excepción documentada `lib/theme.ts` (`THEME_COLORS`, con test que la compara con `tokens.css`) |
| AC-03 | El tema persiste en cookie | **pasa** | `serializeThemeCookie` (`Path=/`, `Max-Age` 1 año, `SameSite=Lax`, `Secure` en https) y lectura en servidor; `curl` con cookie `dark` devuelve `data-theme="dark"` y `/circles` resuelve por cookie |
| AC-04 | Sistema sigue `prefers-color-scheme` | **pasa** | `resolveTheme` y listener `matchMedia` solo en modo `system`; script de arranque resuelve `system` antes del pintado; tests de `theme.ts` y `ThemeProvider` |
| AC-05 | No hay destello al cargar | **pasa (verificado por el usuario)** | El usuario revisó `/login`, `/circles` y `/help` en Firefox real el 2026-11-02, recargando en oscuro, sin destello observado; se suma la comprobación estática del SSR (script en `<head>` antes de `<body>`, `data-theme` y `theme-color` resueltos en el HTML). **Sin prueba automatizada de navegador:** queda para F37/F38 |
| AC-06 | `theme-color` cambia con el tema | **pasa (verificado por el usuario)** | `curl` del 2026-11-02: `#F6F6FA` en claro y `#0B0F1E` en oscuro; el usuario alternó claro/oscuro/sistema en Firefox real sin incidencias; meta, script y `ThemeProvider` usan `THEME_COLORS`, con test que lo compara con `--memora-bg`. **Sin prueba automatizada de navegador:** queda para F37/F38 |
| AC-07 | Funciona con reduced motion | **pasa (verificado por el usuario)** | `theme.css` anula duraciones, animaciones, transiciones y scroll suave; `theme.test.ts` y CSS compilado sin `scroll-behavior:smooth`; la sesión de navegador del 2026-11-02 se aceptó sin cambios. La preferencia `prefers-reduced-motion` no se activó de forma explícita en esa sesión y **no hay prueba automatizada**: F37/F38 |

## Historia de revisión

### Primera ronda — no apto

| # | Hallazgo | Estado |
| --- | --- | --- |
| B-01 | `data-theme` divergía de `resolvedTheme` (documento y estado de React podían mostrar temas distintos) | **Corregido.** `resolvedTheme` parte del `data-theme` ya pintado (`resolveDocumentTheme`) y el layout effect aplica siempre el valor resuelto; tests de `theme.ts` y `ThemeProvider` |
| M-01 | `packages/ui` importaba los `.woff2` de `apps/web` en sus tests, rompiendo la frontera del paquete | **Corregido.** Los tests de `packages/ui` solo leen su propio CSS; la existencia de los archivos, la cabecera `wOF2` y el `OFL.txt` se comprueban desde `apps/web` |
| M-03 | El estado seleccionado se distinguía solo por color | **Corregido.** El control añade borde, fondo, peso y sombra con `has-[:checked]:*`, además de semántica de radio nativo |

### Segunda ronda — apto con correcciones

| # | Hallazgo | Estado |
| --- | --- | --- |
| M-02 | Contrato de tokens desalineado con lo implementado (`*-text`, capas `z-index`, `h1` móvil) | **Corregido** en `docs/02-design/tokens.md` |
| Menores | Documentación de `apps/web` y `packages/ui`, guard de colores y contraste del borde seleccionado | **Aplicado.** READMEs, guard ampliado a `packages/ui` y `rgb/hsl/oklch`, par de contraste `primary`/`surface-2` y comentarios de intención |

No quedan bloqueantes ni mayores abiertos.

## Pendiente

No queda nada pendiente del cierre de F10: implementación, revisión, aceptación, commits,
PR, CI y merge están cerrados con los identificadores de «Cierre operativo». Las únicas
deudas abiertas son las trasladadas a otras features:

- `ThemeToggle` al shell definitivo y a Perfil en **F11/F34** (hoy provisional en
  `/circles` con `TODO(F11/F34)`).
- **CSP** con nonce o hash para el script de arranque en **F42**: hoy es inline y sin CSP
  activa.
- `--color-border-strong` por debajo de 3:1 sobre superficie (1,96:1 en claro, 1,82:1 en
  oscuro; candidato claro `#8E8CA6`, 3,25:1) en **F11**.
- `format:check` falla en **13 archivos de `apps/api`** desde F08 (deuda preexistente, no
  imputable a F10; CI no lo ejecuta) → **F11**.
- **Cobertura automatizada de navegador** de AC-05, AC-06 y AC-07 → **F37/F38**; la
  verificación actual es manual en Firefox real y está documentada arriba.

## Riesgos y limitaciones

- **Sin prueba automatizada de navegador:** AC-05, AC-06 y AC-07 se verificaron con SSR,
  CSS compilado, tests y la revisión manual del usuario en Firefox (2026-11-02). No hay
  evidencia reproducible en CI; F37/F38 deben cubrirlo con Playwright.
- **`suppressHydrationWarning` en `<html>`:** necesario por el ajuste del script en modo
  «sistema», pero enmascara un desajuste de `data-theme`. Mitigado porque
  `resolveDocumentTheme` lee el valor ya pintado; F37/F38 deben cubrirlo con Playwright.
- **Script inline:** requiere nonce/hash cuando F42 active CSP. Sin CSP, el riesgo es el
  habitual de un inline controlado (contenido constante, sin entrada de usuario).
- **Duplicación controlada de hex:** `THEME_COLORS` repite `--color-bg` porque el meta y
  el script no pueden leer variables CSS; un test lo compara con `tokens.css`.
- **Cookie `Secure` solo en https:** en desarrollo por http no se marca, así que no se
  puede probar esa rama en local sin TLS.
- **Peso de CSS:** 18,8 kB en cliente; razonable, pero F11/F12 lo vigilan al añadir el
  kit.
- **Fuente vendorizada:** si `apps/web/public/fonts` no se sirve, cae a `system-ui` sin
  fallo visible; el contrato está documentado en `packages/ui/README.md`.

## Documentación actualizada

- `docs/02-design/tokens.md`: tokens `*-text` y su justificación de contraste, capas
  `--z-index-*`, `h1` móvil 26/32, implementación real de tema, fuente, cookie y
  `theme-color`, y deuda de `--color-border-strong` para F11.
- `docs/04-features/F10-sistema-visual/handoff.md`: este documento, con la aceptación del
  2026-11-02, el cierre operativo (PR #7, commits, runs y merge) y el estado `done`.
- `docs/04-features/F10-sistema-visual/tasks.md`: implementación, AC y cierre marcados con
  evidencia; deuda trasladada separada y Definition of Done con lo que se cumple y lo que
  no.
- `docs/04-features/F10-sistema-visual/spec.md`: estado de la cabecera a `done`.
- `docs/06-process/ai-log.md`: entradas del 2026-11-01 (decisiones, implementación y dos
  rondas de revisión), del 2026-11-02 (revisión visual, aceptación y nota de proceso sobre
  PRs sin `gh`) y la nueva entrada del 2026-11-02 sobre el cierre operativo y el paso a
  `done`.
- `docs/07-curriculum/coverage-map.md`: sección F10 y resumen de estado con el cierre real.
- `docs/00-index.md` y `README.md`: F10 pasa de `accepted` a `done` con PR, merge y runs.
- `docs/04-features/README.md`: «Situación actual» y fila de F10 alineadas con `done`.
- `docs/05-quality/test-matrix.md`: evidencia ejecutada de F10, límite de navegador y cierre
  operativo.
- `apps/web/README.md` y `packages/ui/README.md`: estructura, tema, contrato de fuentes y tests.

## Siguiente paso propuesto

1. Abrir **F11 (UI kit I: controles y datos)** con la deuda trasladada: `ThemeToggle` al
   shell/Perfil (F11/F34), `--color-border-strong` por debajo de 3:1 y `format:check` en 13
   archivos de `apps/api`.
2. Mantener en F37/F38 la cobertura automatizada de navegador de AC-05, AC-06 y AC-07, y en
   F42 la CSP con nonce/hash.
3. No encadenar ninguna feature nueva sin permiso explícito del usuario (G1).
