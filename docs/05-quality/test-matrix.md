# Matriz de pruebas

| Área | Features | Casos prioritarios | Nivel |
| --- | --- | --- | --- |
| Permisos | F06, F17, F21, F23, F28, F32, F33 | owner/member × flags × acciones; `denyUnreachable` (`action: never`); `can()` deniega acciones desconocidas y recursos de otro círculo; borrado y original | Unitario |
| API core: salud y headers | F08 | `/api/health` solo con `status`, `version` y `timestamp`; sin cookie ni configuración; CSP en todos los entornos y HSTS solo en producción; CSP de desarrollo relajada solo para Swagger UI | API (`inject`) |
| API core: validación y 404 | F08 | 400 `VALIDATION_ERROR` con `details` no vacío; 400 con `details: null` para JSON malformado; 404 `NOT_FOUND` con `details: null` | API (`inject`) |
| API core: 413, 415 y 429 | F08 | 413 `PAYLOAD_TOO_LARGE` para body JSON sobredimensionado; 413 `FILE_TOO_LARGE` solo para el límite de archivo multipart; 415 `UNSUPPORTED_MEDIA_TYPE` para content-type no soportado y para el 406 de multipart; 429 `RATE_LIMITED` al superar el techo | API (`inject`) |
| API core: 500 sin stack | F08 | 500 `INTERNAL_ERROR` sin mensaje interno, stack ni rutas `.ts`, también con `NODE_ENV=production` | API (`inject`) |
| API core: multipart | F08 | sin `boundary` → 4xx; `boundary` con cuerpo basura → 400; cuerpo truncado → 400; multipart válido → 200; ningún caso genera log nivel 50 | API (`inject`) + manual |
| API core: OpenAPI | F08 | documento 3.1 generado desde Zod; componente `ErrorResponse` y `securitySchemes.cookieAuth`; `/api/openapi.json` 200; `/api/docs` solo fuera de producción | API (`inject`) |
| API core: redacción de logs | F08 | cookies, `authorization`, `set-cookie`, CSRF, tokens, hashes, `sessionSecret` y `email` censurados en pino real, a tres niveles | Unitario/API |
| API core: config y arranque | F08 | config Zod falla nombrando la variable y sin filtrar valores; producción exige `SESSION_SECRET`, `DATABASE_URL` y servicios `kind: 'real'`; `prisma generate` funciona sin URL y las migraciones no | Unitario + arranque manual |
| API core: harness y fakes | F08 | `inject` sin abrir puerto; fakes de storage, email y geocoding en memoria | Unitario/API |
| Cliente HTTP tipado | F09 | `request<T>()` y atajos `get/post/put/patch/delete`; validación estructural de la respuesta; query params deterministas; `credentials: 'include'`; 204/205 y `Content-Length: 0` resueltos sin parsear | Unitario (`fetch` sustituido) |
| Cliente HTTP: errores | F09 | `ApiError` canónico; `ApiTransportError` con `kind` `network`/`invalid-json`/`invalid-response`/`unexpected-error-response`; mensajes seguros en español sin copiar el cuerpo crudo; guards | Unitario |
| Cliente HTTP: cancelación | F09 | `AbortError` antes y durante la lectura del cuerpo se relanza sin envolver | Unitario |
| Web core: provider de datos | F09 | `QueryClient` nuevo por petición en servidor, sin caché compartida; `staleTime` 30 s; 4xx sin reintento y 5xx/red con máximo 2 | Unitario + smoke SSR |
| Web core: error boundary y 404 | F09 | Reintento desde el boundary, foco y enlace; 404 con foco y enlace a `/`; sin filtrar `Error.message` del servidor | Componente (RTL) |
| Web core: entorno y proxy | F09 | `API_INTERNAL_URL` validado como origen al arrancar (falla con `/api`); `dist/client` sin `API_INTERNAL_URL` ni `127.0.0.1`; proxy `/api` operativo | Unitario + build + smoke HTTP |
| Web core: render modes | F09 | `/login` con `h1` y `<form>` en el HTML inicial; `/circles` sin su componente; `/help` prerenderizado; sin errores de hidratación en navegador real | Smoke HTTP + prueba manual en Firefox (AC-06 verificado el 2026-11-01); automatización en F37/F38 |
| Web core: code-splitting | F09 | Los archivos de `src/routes/` exportan solo `Route`; el componente de `/login` vive en `features/spike/login-page.tsx` | Estático (revisión de exports) + build + 52 tests |
| Zod | F06 | requests válidos/inválidos; DTOs; paginación | Unitario |
| Base de datos | F07 | migración inicial, constraints, cascadas, seed determinista, `resetDb`; guarda `_test`; PostgreSQL real en CI validado en el run `41254603622`, sin skips | Integración |
| Upload reducer | F26 | pending/uploading/done/error/cancelled; retry; cancel; concurrencia | Unitario/hook |
| Auth | F15, F16 | registro, login, logout, sesión expirada, email duplicado genérico | API + componente |
| Acceso | F15–F35 | usuario A no ve círculo B; 404 vs 403; descarga ajena | API + E2E |
| Invitaciones | F19, F20 | token inválido, caducado, revocado, ya miembro, aceptar dos veces | API + E2E |
| Invitación SSR | F20 | OG con nombre; sin datos privados; redirect tras login | E2E |
| Círculos | F17, F18 | crear, editar, borrar, permisos, settings | API + componente |
| Álbumes | F23, F24 | crear, editar, borrar vacío, `ALBUM_NOT_EMPTY`, vaciar, pertenencia | API + componente |
| Subidas | F25 | formato, tamaño, cuota, píxeles, HEIC, idempotencia, fallo S3 | API |
| Subidas UI | F26, F27 | progreso, error, retry, cancel, dropzone, cámara, salida, cola global | Componente/hook/E2E |
| Galería | F29 | paginación, filtro persona, selección, scroll restaurado | Componente + E2E |
| Visor | F30, F31 | teclado, swipe, Escape, foco, imagen no disponible, metadatos | Componente + E2E |
| Etiquetas | F32 | solo miembros, duplicado, quitar, optimista, error | API + componente |
| Descargas | F33 | individual, álbum, selección, límite, expiración, acceso, `membersCanDownload` | API + E2E |
| Perfil y preferencias | F34 | nombre, email inmutable, iniciales, tema, logout | Componente + E2E |
| Actividad | F35 | evento por acción, orden, paginación, privacidad | API + componente |
| Subidas globales | F27 | cola persistente en navegación, contador, recientes | Componente + E2E |
| Tema | F10, F34 | claro/oscuro/sistema, persistencia, sin destello | Componente + E2E |
| UI kit I: controles y datos | F11 | 18 componentes con estados y roles nativos; label/hint/error; loading con `aria-disabled`; `SegmentedControl` por flechas; áreas táctiles de 44 px; contraste sobre tokens; catálogo dev-only fuera del bundle | Componente (RTL) + axe + auditoría en navegador real |
| UI kit II: overlays y feedback | F12 | 12 componentes; `Dialog` con `aria-modal`, trampa de foco, `Esc`, retorno, fondo inerte y scroll bloqueado; apilado por apertura; `BottomSheet` con botón y `Esc` además del arrastre; `ResponsiveDialog` por `matchMedia`; `Menu`/`Tabs`/`Accordion` con flechas y `Home`/`End`; `Toast`/`InlineAlert` con `status`/`alert` y 2.4.11; `Tooltip` con `aria-describedby`; áreas táctiles y contraste; axe en 32 pasadas de navegador real | Componente (RTL) + axe + auditoría en navegador real |
| PWA | F14 | manifest, iconos, instalación Android | Manual |
| Content Island | F36 | snapshot, Help/FAQ/Privacy, build sin snapshot falla | API/build |
| A11y | F10–F39 | formularios, diálogos, foco, contraste, teclado, zoom, 2.4.11 | axe + manual |
| Seguridad | F08–F41 | CSRF, rate limit, headers, uploads maliciosos, logs, redirects | API + revisión |

## Evidencia ejecutada (F08, 2026-11-01)

- `pnpm --filter @memora/api test` sin `DATABASE_URL` → **77 passed + 13 skipped** (los 13 son tests de integración que exigen PostgreSQL).
- `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → **90 passed**.
- `pnpm --filter @memora/shared test` → **138 passed**.
- `typecheck`, `lint` y `build` de `@memora/api`; `docs:check` (191 archivos, 431 enlaces, 0 rotos) y `agents:check` en verde.
- F08 quedó `done` el 2026-11-01 (PR #4, merge `ed1f316`, CI run `41261491641`, `completed/success`); estos resultados acreditan la verificación técnica, que precedió a la aceptación.

## Evidencia ejecutada (F09, 2026-11-01)

- `corepack pnpm --filter @memora/api-client test` → **39 passed** (3 archivos), con `fetch` sustituido y sin red real ni MSW.
- `corepack pnpm --filter @memora/web test` → **52 passed** (13 archivos).
- `corepack pnpm --filter @memora/shared test` → **138 passed** (5 archivos).
- `corepack pnpm --filter @memora/api test` sin `DATABASE_URL` → **77 passed + 13 skipped** (7 + 1 archivo).
- `corepack pnpm --filter @memora/web typecheck` y `lint` → OK; `build` → OK con client, SSR y prerender de `/help` (1 página).
- `corepack pnpm -r typecheck` y `corepack pnpm -r lint` → 6 workspaces OK.
- Smoke real con API y web: `/api/health` 200; `/health` directo 404; proxy `localhost:3000/api/health` 200; `/login` con `h1` y `<form>`; `/circles` sin «Tus círculos»; `/help` prerenderizado; ruta inexistente 404 con enlace a `/`; `dist/client` sin `API_INTERNAL_URL` ni `127.0.0.1`; cliente de servidor contra la API real (`GET /health` → 200).
- `API_INTERNAL_URL=/api` + `build` → **exit 1** con mensaje seguro.
- **AC-06 verificado manualmente**: el usuario probó `/login`, `/circles`, `/help` y una ruta inexistente en Firefox real el 2026-11-01 y no hubo errores de hidratación. **No hay prueba automatizada de navegador**; Playwright llega en F37/F38, que deberán cubrir el criterio de forma reproducible.
- **Aviso benigno de Firefox en `/help`** («el diseño se forzó antes de que la página se cargara completamente»): aviso del navegador por layout temprano, no un error de hidratación. Se registra como observación, no como deuda.
- **Corrección de code-splitting**: `apps/web/src/routes/login.tsx` exportaba `LoginPage` además de `Route`; el componente se movió a `apps/web/src/features/spike/login-page.tsx`, la ruta exporta solo `Route` y el test importa de la nueva ubicación. Re-verificado con 52 tests, typecheck, lint y build.
- `docs:check` → 191 archivos, 433 enlaces, 0 rotos; `agents:check` → OK.
- F09 quedó **`done`** el 2026-11-01: estos resultados acreditan la verificación técnica y la aceptación del usuario, y el cierre operativo se completó con la rama `feat/F09-web-core`, los commits `a81dc9a`, `1363e71` y `8c4a963`, la **PR #5**, el CI de la PR en verde (run `41306238454`, `completed/success`), el merge `9fd987e` en `main` y el CI de `main` en verde (run `41306484717`, `completed/success`). Única deuda abierta: AC-06 automatizado en F37/F38.

## Evidencia ejecutada (F10, 2026-11-02)

- `corepack pnpm --filter @memora/ui test` → **44 tests OK** (5 ficheros).
- `corepack pnpm --filter @memora/web test` → **88 tests OK** (17 ficheros).
- `curl` al servidor de desarrollo: `/circles` 200, `/login` 200, `/help` 200 y `/api/health` vía proxy 200; sin cookie `data-theme="light"` con `theme-color #F6F6FA`; con cookie `memora-theme=dark`, `data-theme="dark"` con `theme-color #0B0F1E`.
- **AC-05, AC-06 y AC-07 verificados manualmente**: el usuario revisó `/login`, `/circles` y `/help` en Firefox real el 2026-11-02, alternando claro/oscuro/sistema, recargando en oscuro, en escritorio y en vista móvil; «De momento, todo parece estar bien», sin cambios pedidos.
- **No hay prueba automatizada de navegador** para estos criterios; Playwright queda para F37/F38.
- F10 quedó **`done`** el 2026-11-02. El cierre operativo real: rama `feat/F10-sistema-visual`, commits `517b6eb`, `3c79110` y `d4826df`, **PR #7**, CI de la PR en verde (run `41473542981`, `completed/success`, head `d4826df`), merge `f3b26a5` en `main` y CI de `main` en verde (run `41473996157`, `completed/success`). Única deuda abierta: AC-05, AC-06 y AC-07 automatizados en F37/F38.

## Evidencia ejecutada (F11, 2026-11-02)

- `corepack pnpm --filter @memora/ui test` → **158 tests OK** en la primera entrega (10 ficheros): 80 de componentes con RTL y axe + 78 de estilos (44 preexistentes de F10 + 13 de la primera entrega + 12 de la segunda + 9 de accesibilidad/diseño). **Tras la cuarta tanda: 173** (95 de componentes + 78 de estilos).
- `corepack pnpm --filter @memora/web test` → **88 tests OK** (17 ficheros), incluido el guard anti-hex sobre `packages/ui/src`.
- `corepack pnpm --filter @memora/ui typecheck` y `lint` → OK; `build` → OK (tsc, sin `src/test` en `dist`).
- `corepack pnpm --filter @memora/web typecheck` y `lint` → OK.
- `corepack pnpm build` → OK; `dist/` **sin rastro del catálogo de `/ui`** (`rg` sobre `apps/web/dist` sin coincidencias para `Solo desarrollo`, `Catálogo de los componentes` y `showcase-`), pero **sí con el chunk stub de la ruta** `ui-iE__YnrP.js` (103 B, solo exporta un componente `null` y el `notFound`). El CSS compilado contiene `border-border-strong`, `bg-accent-violet`, `text-on-primary-soft`, `sr-only`, `animate-pulse` y `bg-viewer-bg`.
- axe-core **4.14.0** sobre cada familia de componentes, con `color-contrast` desactivado en jsdom (sin layout) y cubierto por `contrast.test.ts` con los hex reales.
- Limitación honesta: jsdom no aplica `:focus-visible` ni activa controles nativos con `Space`/flechas; los tests comprueban foco programático, `tabIndex`, roles y que las flechas de `SegmentedControl` cambien selección y foco. La verificación visual en navegador real queda para la aceptación del usuario.
- En la primera entrega F11 quedó en **`review`**; después se completaron la revisión independiente, las auditorías, la aceptación y el cierre operativo (ver los dos apartados siguientes).

## Revisión de accesibilidad y diseño (F11, 2026-11-02)

- `corepack pnpm --filter @memora/ui test` → **173 tests OK** (95 componentes + 78 estilos).
- `corepack pnpm --filter @memora/web test` → **88 tests OK** (17 ficheros).
- `corepack pnpm -r typecheck` → OK; `corepack pnpm lint` → 6/6.
- `corepack pnpm build` → 5/5; `corepack pnpm typecheck` después del build → 9/9.
- `rg` del catálogo en `apps/web/dist` → sin textos (`Solo desarrollo`, `Filtro con ambos handlers`, `Estados simulados`) ni chunk `showcase-*`; CSS con `bg-surface-active`, `control-knob-border`, `not-disabled`, `group-has-[:enabled]`, `has-[:enabled]`, `after:h-11` y `after:w-11`; sin `after:-inset-y-1` ni `after:-inset-1.5`.
- axe en jsdom pasa a fallar también con `incomplete` no dependiente de layout; la cobertura de navegador real queda en F37.
- **Áreas táctiles medidas en Chromium headless sobre `/ui`**: `getComputedStyle(el, '::after').height` = 44 px en 29 controles (mínimo y máximo 44), incluidas las variantes con borde `secondary`, `outline` y todos los segmentos. El quitar del `Chip` mide 44 × 44 y su hit empieza 2 px después del cuerpo.
- **Hit-test del `Chip` con `onClick` + `onRemove`**: `elementFromPoint` a 0,5 px del borde derecho del cuerpo devuelve el cuerpo; a 0,5 px después, el hueco; el clic real en el borde alterna `aria-pressed` y no elimina el chip.
- **Hover de deshabilitados**: borde del `Switch`, color del segmento y fondo del `Chip` idénticos antes/después del ratón. **Hover del `Avatar`**: `box-shadow` con `rgb(91,71,224)` a 2 px. **`Button` loading**: `cursor: progress` y fondo sin cambio al hacer hover.
- Limitación honesta: jsdom no calcula layout; la medición anterior es una comprobación CDP puntual, no un test de navegador del repo. Queda para F37/F38.
- La cuarta tanda cerró la revisión con F11 aún en **`review`**, pendiente de aceptación y cierre operativo; ambos se completaron el mismo 2026-11-02 (ver el apartado siguiente).

## Revisión, auditorías, aceptación y cierre (F11, 2026-11-02)

- **Revisión independiente, dos rondas:** primera **no apto** por el hover del primario en oscuro a **4,06:1** (por debajo de 4,5:1) y por `routeTree.gen.ts`, que cambiaba con el modo; segunda **apto con correcciones**, con **m-07** (documental) cerrado.
- **Auditoría de accesibilidad en navegador real** (Chrome/CDP + axe 4.14) sobre `/ui`: **0 violaciones y 0 `incomplete`** tras dos rondas de correcciones.
- **Auditoría de diseño:** tres pasadas, cerrada en **apto**.
- **Aceptación del usuario (G4):** 2026-11-02, tras revisión en navegador real, **sin cambios pedidos**.
- **Verificación del orquestador:** `@memora/ui` **173 tests** (95 de componentes + 78 de estilos, 10 archivos); `@memora/web` **88 tests** (17 archivos); `build` forzado sin caché **5/5** en **9,54 s**; `typecheck` **9/9** después del build; `format:check`, `docs:check` y `agents:check` OK; `routeTree.gen.ts` con **SHA idéntico** antes y después del build; catálogo ausente de `apps/web/dist` con chunk stub de **103 B**.
- **Cierre operativo:** rama `feat/F11-ui-kit-i`, commits `0e815e2`, `a1648ce`, `bf22fd4` y `94620ee`, **PR #11**, CI de la PR en verde (run `41498545493`, `completed/success`, head `94620ee`), merge `6d160ce` en `main` y CI de `main` en verde (run `41499457291`, `completed/success`).
- **F11 queda `done`** el 2026-11-02. Deudas abiertas: axe en navegador real y medición automática de 44 px (**F37**); CSP con nonce/hash (**F42**); `ThemeToggle` al shell/Perfil (**F13/F34**); chips con cuerpo y quitar en producto (**F13/F14**).

## Evidencia ejecutada (F12, 2026-11-02)

- `corepack pnpm --filter @memora/ui test` → **270 tests OK en 13 archivos**: 172 de componentes + 98 de estilos.
- Desglose por archivo: `overlays.test.tsx` 36, `feedback-ii.test.tsx` 27, `data.test.tsx` 23, `selection.test.tsx` 21, `button.test.tsx` 21, `navigation.test.tsx` 17, `fields.test.tsx` 14, `feedback.test.tsx` 13; `contrast.test.ts` 76, `tokens.test.ts` 11, `theme.test.ts` 6, `fonts.test.ts` 3 y `package.test.ts` 2.
- `corepack pnpm --filter @memora/web test` → **88 tests OK** (17 archivos).
- `corepack pnpm lint` → **6/6 tareas**; `corepack pnpm typecheck` → **9/9 tareas**, también después del build; `corepack pnpm build` → **5/5 tareas** en **8,78 s** con `/help` prerenderizado.
- `corepack pnpm format:check` OK; `docs:check` → 191 archivos y 452 enlaces, 0 rotos; `agents:check` → 43 specs y 43 filas. `git status` → 10 modificados y 18 nuevos; `routeTree.gen.ts` sin cambios.
- Catálogo en `apps/web/dist`: **sin textos**; queda el chunk stub `ui-BGGNz8zQ.js` (103 B).
- **axe en navegador real** (chrome-headless-shell 156 + CDP + axe 4.14) sobre `/ui`: **32 pasadas** (8 estados × 2 anchos × 2 temas) con **0 violaciones**. Es una comprobación puntual fuera del repo; la suite automatizada queda en F37/F38.
- **Limitación honesta:** jsdom no calcula layout, así que áreas táctiles, zoom, colisión del tooltip y apilado visual no se miden en los tests. El gate de puntero del `Tooltip` (`hover: hover`) tampoco se puede comprobar en jsdom.
- **Revisión y auditorías:** revisión independiente en dos rondas (primera **apto con correcciones** por M-01 a M-05 y N-01 a N-03; segunda **apto**) y auditoría de diseño en tres pasadas (primera **no apto** con cinco mayores y 14 menores; segunda **apto con correcciones**; tercera **apto**). Detalle en el [handoff de F12](../04-features/F12-ui-kit-ii/handoff.md).
- **F12 queda en `accepted`** (2026-11-02): el usuario la aceptó en `/ui` con el estilo destructivo unificado. Falta el cierre operativo (commit, PR y CI con permiso); no existen todavía hash, PR ni run.

## Flujo E2E principal

1. Usuario A se registra.
2. Crea un círculo.
3. Invita por enlace; Usuario B se registra desde el enlace y acepta.
4. A crea un álbum; B sube una foto.
5. A etiqueta a B; B ve “Fotos de esta persona”.
6. A descarga el álbum.
7. A y B no ven el círculo de un tercer usuario.
8. Repetir en móvil (Pixel) y escritorio, claro y oscuro.

## Casos negativos imprescindibles

- Cambiar `circleId`/`albumId`/`photoId` en la URL no filtra datos.
- Sin sesión no se descarga nada.
- No se etiqueta a un no miembro.
- Un error de subida no pierde las demás.
- El tema persiste sin destello.
- La preview de invitación no expone datos privados.
- Borrar un álbum no vacío devuelve `ALBUM_NOT_EMPTY`.
- Un miembro sin `membersCanDownload` no obtiene `original`.
