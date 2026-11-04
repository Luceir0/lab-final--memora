# Tasks — F20 Invitación SSR + compartir

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F16, F19.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Ruta SSR: `apps/web/src/routes/invite.$token.tsx` con preview pedida a la API y cookie reenviada.
- [x] Open Graph: `og:title` con el nombre del círculo, `og:description`, `og:image` genérica 1200×630, `og:url`, `og:type`, `twitter:card` y `meta robots noindex`.
- [x] Preview mínima: nombre del círculo e imagen genérica; sin fotos ni miembros.
- [x] Web Share/copy: helper de compartir implementado y probado; el botón visible llega en F22 (D4).
- [x] Estados inválida/caducada/ya miembro: tarjeta de estado y `status` único.
- [x] Redirect tras login: CTA «Entrar para aceptar» a `/login?redirect=/invite/<token>`.
- [x] Aceptar: server function con CSRF contra `POST /invitations/:token/accept`.

## Criterios de aceptación

- [x] AC-01: SSR genera OG con nombre del círculo. Evidencia: test de la ruta SSR y `curl -s /invite/<token>` con `og:title`, `og:description`, `og:image` 1200×630, `og:url`, `og:type`, `twitter:card` y `meta robots noindex`.
- [x] AC-02: No muestra fotos/miembros. Evidencia: preview mínima y tests de la tarjeta y del HTML.
- [x] AC-03: Compartir/copiar funciona. Evidencia: helper probado; el botón visible llega en F22 por decisión D4.
- [x] AC-04: Login conserva token. Evidencia: `redirect=/invite/<token>` y test de la ruta.
- [x] AC-05: Aceptar une al círculo. Evidencia: server function con CSRF y tests de aceptación.
- [x] AC-06: Estados caducada/revocada/ya miembro. Evidencia: tarjeta de estado y tests; aceptación real de los estados inválido y ya miembro en navegador.
- [x] AC-07: Open Graph validado. Evidencia: test automatizado del HTML del servidor y `curl` local; los validadores externos (Facebook Sharing Debugger, LinkedIn Post Inspector) quedan para F42 por decisión D3.

## Verificación

- [x] `pnpm --filter @memora/web test invite` → **5 archivos, 35 tests**.
- [x] `pnpm --filter @memora/web test -- --maxWorkers=8` → **48 archivos, 311 tests**.
- [x] `pnpm --filter @memora/web lint`, `typecheck` y `build` limpios, con **5 rutas prerenderizadas**.
- [x] `curl -sI /invite/<token>` → `cache-control: private, no-store` y `vary: Cookie`.
- [x] `curl -s /invite/<token>` → metadatos Open Graph y `meta robots noindex` descritos en AC-01 y AC-07.

## Cierre

- [x] Revisión independiente: `reviewer` nivel A **apto con correcciones** (M-01 corregido y menores/nits aplicables); `a11y-auditor` en dos rondas y `design-auditor` en dos pasadas, ambas cerradas tras correcciones.
- [x] Aceptación del usuario el 2026-11-04 en escritorio y móvil, con y sin sesión; pidió un ajuste de espaciado, ya corregido y revalidado.
- [x] `handoff.md` completo.
- [x] Tablero actualizado: F20 en `done`.
- [x] Bitácora y cobertura actualizadas.
- [x] Cierre operativo ejecutado el 2026-11-04: rama `feat/F20-invitation-ssr`, commits `ab5159c` y `74e30ec`, PR #30, merge `19a8485` en `main`, CI de la PR run #67 y CI de `main` run #68, ambos `completed/success`.
