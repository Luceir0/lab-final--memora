# Tasks — F14 PWA e instalación

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F10, F13.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación (2026-11-03).

## Parte A — PWA

- [x] `manifest.webmanifest` (nombre, `start_url` `/circles`, `display: standalone`, colores, iconos).
- [x] Script `scripts/generate-app-icons.mjs` sin dependencias e iconos 192/512/maskable.
- [x] `apple-touch-icon` de 180 px y metas de iOS.
- [x] `theme-color` coherente con los tokens.
- [x] `InstallAppRow` con sus cuatro estados, solo por debajo de `lg`.
- [x] Detección de `beforeinstallprompt`, `appinstalled`, `display-mode: standalone` e iOS.
- [x] Decisión sobre service worker: sin SW (ADR-0013), verificado con Chrome.
- [x] Tests de manifiesto, iconos y estados con axe.

## Parte B — Pendientes de F13

- [x] `PageContainer` de máximo 80rem centrado con gutters 24/32 px.
- [x] Filas de Ayuda y Privacidad en el Perfil provisional.
- [x] Nombre del `<aside>` válido en móvil y escritorio.
- [x] Logotipo con navegación SPA (`router.navigate` en el clic primario) y `aria-current` neutralizado, con test de router real.
- [x] Barrido de medición a 375/1024/1440, claro y oscuro.

## Criterios de aceptación

- [x] AC-01: Manifest válido.
- [x] AC-02: Iconos existen y son correctos.
- [x] AC-03: Android ofrece instalar. **Estructural en Chrome local** (`Page.getInstallabilityErrors` → `[]`); Android físico con HTTPS en F42.
- [ ] AC-04: La app instalada abre en /circles. `start_url` verificado en el manifiesto y en Chrome; **la instalación real no se ha podido probar** y queda para F42.
- [x] AC-05: Perfil explica cómo instalar.
- [x] AC-06: No se promete offline.
- [x] AC-07: Contenedor de escritorio de 80rem con gutters.
- [x] AC-08: Ayuda y Privacidad alcanzables en móvil desde Perfil.
- [x] AC-09: `<aside>` con nombre válido en ambos breakpoints.
- [x] AC-10: Logotipo SPA sin `aria-current`.

## Verificación

- [x] `pnpm --filter @memora/web test` → 24 archivos, 141 tests, todos en verde.
- [x] `pnpm --filter @memora/web lint` → sin hallazgos.
- [x] `pnpm --filter @memora/web typecheck` → sin hallazgos.
- [x] `pnpm --filter @memora/web build` → build correcto y 5 rutas prerenderizadas.
- [x] `pnpm typecheck` → 9/9; `pnpm lint` → 6/6; `pnpm lint:root` → OK.
- [x] `pnpm docs:check` → 191 archivos, 456 enlaces, 0 rotos.
- [x] `pnpm agents:check` → 43 specs y 43 filas.
- [x] `pnpm format:check` → OK.
- [x] Chrome: `Page.getAppManifest` con `errors: []` y `Page.getInstallabilityErrors` con `[]`.
- [x] Medición 375/1024/1440, claro y oscuro; tope de 1280 a 1920.
- [x] AX y clic del logotipo con CDP: `navigations: 1` y `aria-current="false"`.

## Correcciones de navegador

- [x] `rel="icon"` reutiliza `/icons/icon-192.png`: Chrome ya no pide `/favicon.ico`.
- [x] `mobile-web-app-capable` junto a la meta de Apple: sin aviso de deprecación.
- [x] Barra inferior: «Subir» ya no lleva círculo sólido; misma píldora suave que el resto al estar activo.

## Correcciones de aceptación (2026-11-03)

- [x] «Subir» con icono de 20 px en `muted` y sin fondo en reposo; activo con píldora `primary-soft`. Medido a 375: inactivo `#5E5D78` en claro y `#A3A9C2` en oscuro; activo `#4A37C9` con `#EEEBFE` en claro y `#A99CFF` con `#241F4D` en oscuro; área táctil de 44 × 44 px y barra de 72 px.

## Cierre

- [x] Revisión independiente: no aplica (nivel C).
- [x] Aceptación del usuario (2026-11-03), con un cambio pedido en «Subir» ya aplicado.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [ ] Commit, PR y CI: **no ejecutados**; pendientes de autorización sobre `feat/F14-pwa`.
