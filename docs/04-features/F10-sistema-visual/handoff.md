# Handoff — F10 Sistema visual y tema

> Fecha: 2026-11-01 · Implementador: `ui-dev` (dos rondas) · Estado: **`review`**
> Revisión independiente: cerrada en dos rondas; primera **no apto** (B-01, M-01, M-03) y
> segunda **apto con correcciones** (M-02 y menores de documentación/guard, aplicados) ·
> Aceptación del usuario (G4): **pendiente** · Commit, PR, CI y merge: **no existen
> todavía**.

## Resultado

Tokens, Tailwind 4 CSS-first, tema claro/oscuro/sistema, fuente self-hosted, iconos,
foco visible y movimiento reducido están implementados y verificados de forma estática.
`packages/ui` expone `tokens.css`, `theme.css` y `fonts.css` con tests de contrato y
contraste (44 tests) y no incorpora React ni componentes. `apps/web` resuelve el tema en
servidor desde la cookie `memora-theme`, pinta `data-theme` y `theme-color` antes del
primer pintado con un script en `<head>` y monta un `ThemeToggle` provisional en
`/circles`.

La revisión independiente cerró sin bloqueantes abiertos. La feature queda en **`review`**:
falta la aceptación del usuario en navegador real y el cierre operativo (commits, push,
PR, CI y merge con autorización). No se marca `accepted` ni `done`.

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
| Revisión visual en navegador | **Pendiente** (G4, la hará el usuario) |

**Deuda preexistente, no imputable a F10:** `pnpm format:check` falla en **13 archivos de
`apps/api`** desde F08 (no modificados en esta rama). CI no ejecuta `format:check`.

## Criterios de aceptación

| AC | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | Los tokens se usan vía utilidades Tailwind | **pasa** | `ThemeToggle` usa `bg-surface-2`, `text-muted`, `border-primary`, `has-[:checked]:*`; `tokens.test.ts` verifica `@theme inline` y utilidades; CSS compilado con `has-[:checked]:border-primary` |
| AC-02 | No hay hex sueltos en componentes | **pasa** | `apps/web/src/styles/no-hex.test.ts` recorre `src` y `packages/ui/src`; `theme.test.ts` comprueba cero hex en `theme.css`; única excepción documentada `lib/theme.ts` (`THEME_COLORS`, con test que la compara con `tokens.css`) |
| AC-03 | El tema persiste en cookie | **pasa** | `serializeThemeCookie` (`Path=/`, `Max-Age` 1 año, `SameSite=Lax`, `Secure` en https) y lectura en servidor; `curl` con cookie `dark` devuelve `data-theme="dark"` y `/circles` resuelve por cookie |
| AC-04 | Sistema sigue `prefers-color-scheme` | **pasa** | `resolveTheme` y listener `matchMedia` solo en modo `system`; script de arranque resuelve `system` antes del pintado; tests de `theme.ts` y `ThemeProvider` |
| AC-05 | No hay destello al cargar | **pasa con limitación: falta navegador real** | Comprobación estática del SSR: script en `<head>` antes de `<body>`, `data-theme` y `theme-color` ya resueltos en el HTML. Sin captura ni playback en navegador |
| AC-06 | `theme-color` cambia con el tema | **pasa con limitación: falta navegador real** | `curl`: `#F6F6FA` en claro y `#0B0F1E` en oscuro; el meta, el script y `ThemeProvider` usan `THEME_COLORS`; test que lo compara con `--memora-bg`. Sin cambio observado en navegador real |
| AC-07 | Funciona con reduced motion | **pasa con limitación: falta navegador real** | `theme.css` anula duraciones, animaciones, transiciones y scroll suave; `theme.test.ts` y CSS compilado sin `scroll-behavior:smooth`. Sin prueba con la preferencia activa en navegador |

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

- **Aceptación del usuario (G4)** con revisión visual en navegador real: móvil y
  escritorio, claro y oscuro, modo «Sistema», sin destello y con `theme-color` correcto.
- **Cierre operativo:** commits convencionales en `feat/F10-sistema-visual`, push, PR, CI
  y merge solo con autorización. No existen todavía hashes, número de PR ni run de CI.
- **`apps/web/README.md` y `packages/ui/README.md`:** actualizados con estructura, tema y contrato de fuentes.
- `ThemeToggle` a Perfil y al shell definitivo en **F11/F34** (hoy provisional en
  `/circles` con `TODO(F11/F34)`).
- **CSP en F42:** el script de arranque es inline y necesita nonce o hash.
- **Bordes de input en F11:** `--color-border-strong` no llega a 3:1 sobre superficie
  (1,96:1 en claro, 1,82:1 en oscuro); candidato claro `#8E8CA6` (3,25:1).
- **`format:check` en F11:** falla en 13 archivos de `apps/api` desde F08; CI no lo
  ejecuta.

## Riesgos y limitaciones

- **Sin navegador real:** AC-05, AC-06 y AC-07 están verificados por SSR, CSS compilado y
  tests, no por observación. La aceptación del usuario es la que puede confirmarlos.
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
- `docs/04-features/F10-sistema-visual/handoff.md`: este documento.
- `docs/04-features/F10-sistema-visual/tasks.md`: implementación y AC con evidencia;
  revisión, aceptación, commit y cierre sin marcar.
- `docs/06-process/ai-log.md`: entrada del 2026-11-01 con decisiones, implementación, dos
  rondas de revisión, comandos reales y deuda.
- `docs/07-curriculum/coverage-map.md`: sección F10 y resumen de estado.
- `docs/00-index.md` y `README.md`: F10 pasa de `draft` a `review`.
- `docs/04-features/README.md`: «Situación actual» alineada con la revisión cerrada.
- `apps/web/README.md` y `packages/ui/README.md`: estructura, tema, contrato de fuentes y tests.

## Siguiente paso propuesto

1. El orquestador aplica N-09/N-10 en los dos README de paquete.
2. El usuario hace la revisión visual (móvil/escritorio, claro/oscuro) y acepta o pide
   cambios (G4).
3. Con la aceptación, commits convencionales, push, PR a `main`, CI en verde y merge con
   autorización; solo entonces F10 pasa a `done`.
4. F11 arranca después, con la deuda de bordes de input y `format:check`.
