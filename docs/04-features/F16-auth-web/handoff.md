# Handoff — F16 Auth web

> Estado: **`done`** (2026-11-03). Nivel de auditoría **A**. Aceptada por el usuario el **2026-11-03** tras probar login, registro, `401`, `409`, redirect y `429` en navegador real a 390×844 y escritorio. Revisión independiente en **tres rondas** (reviewer + accesibilidad + diseño) con tres rondas de corrección del implementador. Cierre operativo: PR #22, merge `dd9d48e` y CI run `41683883983` en verde.

## Resultado

Login y registro funcionan de extremo a extremo con persistencia real: los formularios se pintan en el HTML inicial (`GET /login` y `GET /register` → 200 con `<h1>` y `<form method="post" action=…>`), envían el `POST` desde el navegador contra la API de F15 y traducen cada fallo del contrato a un estado visible. La validación de cliente usa los mismos schemas Zod que valida el servidor (`loginRequestSchema`, `registerRequestSchema` de `@memora/shared`). El `redirect` de la URL se sanea antes de navegar y el formulario de registro no deja el CTA ni los errores bajo el teclado.

El primer intento **no era entregable**: la ronda 1 encontró tres bloqueantes (envío `GET` con la contraseña en la URL, botón deshabilitado sin anuncio ni contraste, y CTA de registro tapado por el teclado). Tras tres rondas de corrección no queda ningún bloqueante ni mayor abierto; solo menores y nits documentados en `Pendiente`.

## Rondas de revisión

| Ronda | Reviewer | Accesibilidad | Diseño | Resultado |
| --- | --- | --- | --- | --- |
| 1 | **No apto**: tres bloqueantes | Veredicto conjunto: **no apto** | Veredicto conjunto: **no apto** | Implementador corrige: `method="post"` y `action` en ambos formularios; `Button loading` (`aria-disabled` + `aria-busy` + guarda de clic, sin `disabled`) en lugar de `disabled`; barra fija del registro con relleno para safe area y desplazamiento del campo enfocado. |
| 2 | **Apto con correcciones**: dos mayores | **No apto**: zoom de texto al 200 % | Apto con menores | Se corrige la regresión del code-splitting (los archivos de ruta exportan solo `Route` y los componentes viven en `features/auth`), la guarda de MSW (`onUnhandledFrame: 'error'` centralizada en `startAuthTestServer`) y el solape del título y de los errores con la barra fija al 200 %. |
| 3 | Cierre sobre lo acordado | Cierre con axe y medición | Cierre con el collage de fotos reales | **Sin bloqueantes ni mayores.** Por protocolo no hay cuarta ronda: el reviewer ya había dado «apto con correcciones» y lo que queda son menores y nits. |

## Cambios (archivos)

### Dependencias (autorizadas por el usuario, versión exacta)

- `apps/web/package.json` + `pnpm-lock.yaml`:
  - `dependencies`: `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.1`.
  - `devDependencies`: `msw@3.0.3`, `@testing-library/user-event@14.6.8`.

### Rutas

- `apps/web/src/routes/login.tsx`, `apps/web/src/routes/register.tsx`: exportan **solo** `Route` (`createFileRoute`), validan `?redirect` como string y declaran el `head` (`Entrar · Memora`, `Crear cuenta · Memora`). El componente se importa desde `features/auth` para no romper el code-splitting por ruta de F09.
- `apps/web/src/features/auth/login-route.tsx`, `register-route.tsx`: leen el `redirect` con `useSearch`, lo sanean y navegan con `router.history.replace` (Atrás no vuelve al formulario).

### Feature

- `apps/web/src/features/auth/auth-layout.tsx`: marco compartido móvil primero; en acceso, collage a sangre y lámina blanca solapada; en registro, barra superior y formulario sobre superficie; desde `lg` el collage ocupa el 52,7 %. Marca textual sin navegación.
- `apps/web/src/features/auth/{login-screen,register-screen}.tsx`: componen layout, formulario, enlace cruzado y collage.
- `apps/web/src/features/auth/{login-form,register-form}.tsx`: RHF + `zodResolver` con los schemas compartidos; `noValidate`; `role="status"` fuera del formulario como único canal de anuncio del envío; guarda síncrona contra doble `POST`; `AuthFormAlert` para el resumen; desplazamiento del bloque `[data-auth-field]` tras un error de validación.
- `apps/web/src/features/auth/auth-errors.ts`: mapeo canónico `401`/`400`/`409`/`429`/`500` y errores de transporte; `AUTH_RATE_LIMITED_MESSAGE` sin prometer una espera corta.
- `apps/web/src/features/auth/redirect.ts`: `normalizeAuthRedirect`/`resolveAuthRedirect`/`safeAuthRedirect` con destino por defecto `/circles`; rechaza `//host`, esquemas, `\`, caracteres de control, pathname decodificado hacia `/login` o `/register` y URLs de otro origen.
- `apps/web/src/features/auth/{auth-collage,auth-cross-link,auth-form-alert}.tsx`: collage con fotos reales, enlace entre acceso y registro conservando el redirect saneado, y resumen de errores.
- `apps/web/src/features/auth/scroll-offsets.ts`: márgenes de scroll calculados con la altura real de la barra superior y de la barra fija.
- `apps/web/src/features/auth/use-large-text.ts`: detecta texto ampliado midiendo el `font-size` de la raíz (sin media query estándar), con primer render `false` para no leer el DOM en SSR.

### Tests y utilidades de test

- `apps/web/src/features/auth/{login-form,register-form,auth-collage,redirect,auth-errors,scroll-offsets,use-large-text}.test.*`.
- `apps/web/src/routes/{login,register}.test.tsx`: montan la ruta real con router y comprueban SSR/HTML, redirect y flujo.
- `apps/web/src/test/auth-server.ts` + `auth-server.test.ts`: `createAuthTestServer()` y `startAuthTestServer()` con `onUnhandledFrame: 'error'` para que una petición sin handler rompa la prueba.
- `apps/web/src/test/auth-fixtures.ts`: fixtures compartidas de sesión y respuestas de auth.

### Activos

- `apps/web/public/auth/`: 6 fotos para acceso y 7 para registro, 700 px, sin EXIF y con licencia libre. Créditos en `assets/design/credits.md`.

## Verificación (comandos y resultado real)

| Comprobación | Resultado |
| --- | --- |
| `pnpm --filter @memora/web test` | **33 archivos, 207 tests.** |
| `pnpm --filter @memora/web test auth` | **8 archivos, 58 tests.** |
| `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` | **127 tests, 0 skipped** contra PostgreSQL real. |
| `pnpm --filter @memora/web typecheck` / `lint` / `format:check` | Sin errores. |
| `pnpm --filter @memora/web build` | Chunks propios `login-ZbFqBaLo.js` (3,38 kB) y `register-DMCLpfSA.js` (6,76 kB); entrada de 403 kB. |
| SSR real | `GET /login` y `GET /register` → **200** con `<h1>` y `<form method="post" action=…>` en el HTML inicial. |
| Flujo HTTP real con `curl` | Login **200** + cookie; login incorrecto **401** con el mismo mensaje que email inexistente; `GET /api/me` **200**; registro **201**; registro duplicado **409** con `details[0].field = "email"`. |
| axe (página completa, `/login` y `/register`) | **0 violaciones** en 390×844, 320×640 y 1440×900, claro y oscuro. |
| Medición 390×844, 390×500 (teclado simulado) y 1440×900 con texto al 200 % | Campo enfocado y mensaje de error por encima de la barra; sin scroll horizontal. |
| `pnpm docs:check` | OK (191 archivos, 460 enlaces, 0 rotos). |

## Criterios de aceptación

| AC | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | Formularios etiquetados y accesibles | Pasa | axe sin violaciones en página completa (3 anchos × 2 temas); RTL por rol y nombre accesible; foco al primer campo inválido; `role="status"` como único canal de anuncio del envío |
| AC-02 | Validación cliente y servidor con el mismo schema | Pasa | `zodResolver` con `loginRequestSchema`/`registerRequestSchema` de `@memora/shared`; la API valida con los mismos schemas (F15); tests de `login-form` y `register-form` |
| AC-03 | Errores comprensibles y no filtran existencia | Pasa | `curl`: email inexistente y contraseña incorrecta devuelven el mismo **401**; `mapAuthError` mapea `400` con `details`, `409` a `email`, `429` sin marcar campos y `500`/red a mensaje genérico; tests de `auth-errors` |
| AC-04 | Autocomplete correcto | Pasa | `email`, `current-password`, `new-password` (contraseña y repetición), `name`; `inputMode`/`autoCapitalize`/`spellCheck` coherentes |
| AC-05 | Teclado móvil no tapa botón/errores | Pasa | 390×500 con teclado simulado y 200 % de texto: CTA en barra fija con `safe-area` y campo/error visibles por encima; `scroll-offsets` + `ResizeObserver`; tras la corrección de ronda 2 |
| AC-06 | Tras login vuelve a `redirect` o `/circles` | Pasa | `redirect.test.ts` cubre `//host`, `javascript:`, `\`, `%2F%2F`, `/foo/../login`, `/login`, `/%6Cogin` y default; aceptación del usuario con redirect real en navegador; `replace` en el historial |
| AC-07 | SSR funciona | Pasa | `GET /login` y `GET /register` → 200 con `<h1>` y `<form method="post" action=…>` en el HTML inicial; `method="post"` evita el `GET` con la contraseña en la URL |

## Pendiente

Fuera de alcance de F16 o diferido por decisión del usuario. Nada de esto bloquea el cierre.

- **«¿La has olvidado?»**: sin enlace. El reset de contraseña no está en el alcance de F16 ni existe en la API.
- **`/terms`**: la ruta no existe; el texto legal enlaza a `/privacy`.
- **Exceso de `role="alert"` simultáneos** (hallazgo de accesibilidad): asignado a **F39** por decisión del usuario, porque exige tocar `packages/ui`.
- **Enlace «Inicia sesión» dentro del `409`**: requiere que `FieldMessages` acepte un nodo React; queda en el kit.
- **Icono de error alineado con el mensaje** y **check verde del hint**: mejoras del kit, no de la feature.
- **Cierre operativo**: PR #22 (`feat/F16-auth-web`), merge `dd9d48e` en `main`, CI run `41683883983` en `completed/success`. Tres commits: web, API/contrato y documentación.

## Riesgos y limitaciones

- Las medidas de teclado y de zoom al 200 % se hicieron en navegador con teclado simulado (390×500) y con el zoom de texto del navegador; **no** hay prueba automatizada de navegador en el repo. La cobertura E2E/Playwright corresponde a **F37/F38**.
- axe en página completa no detecta problemas que dependen de layout real, ni sustituye a un lector de pantalla (NVDA/VoiceOver/TalkBack → **F39**).
- El envío real depende del `Origin` permitido por la API: el formulario siempre hace `POST` desde el navegador, así que no hay llamada servidor-a-servidor y SSR solo pinta el formulario.
- El límite de registro es de **10/hora por IP** (subido desde 3/hora el 2026-11-03). Con el límite agotado, el formulario muestra el `429` pero no indica cuándo se libera: no hay cabecera de reintento expuesta al usuario.
- Las fotos del collage son de Pexels y sustituyen a las de los diseños canónicos; el encuadre verificado es el de los diseños, no el de las fotos originales.

## Documentación actualizada

- [x] `docs/04-features/F16-auth-web/handoff.md` (este archivo)
- [x] `docs/04-features/F16-auth-web/tasks.md`
- [x] `docs/04-features/F16-auth-web/spec.md` (`status: done`)
- [x] `docs/04-features/README.md` (fila `done` y «Situación actual»)
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/03-architecture/auth.md`, `docs/03-architecture/api-contract.md` y `assets/design/credits.md` (límite de registro, mensaje del `429` y créditos de las fotos; ya actualizados por el orquestador)
- [ ] README raíz: **sin cambios**, la estructura del proyecto no cambia.

## Siguiente paso propuesto

1. ~~Revisar el árbol, commitear y abrir la PR.~~ Hecho: PR #22, merge `dd9d48e`, CI en verde.
2. Abrir **F17 — Circles API**, cuya DoR depende de F15 y F08, ya `done`. Alternativa en paralelo: **F16 no bloquea F17**, así que puede abordarse sin esperar a nada.
