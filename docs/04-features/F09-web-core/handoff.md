# Handoff — F09 Web core

> Fecha: 2026-11-01 · Implementador: subagente de implementación web · Estado: `done`
> Revisión independiente: cerrada en dos rondas; veredicto final «apto con correcciones», todas aplicadas · Aceptación del usuario (G4): **2026-11-01**, en Firefox real · Cierre operativo: rama `feat/F09-web-core`, PR [#5](https://github.com/Luceir0/lab-final--memora/pull/5), merge `9fd987e` en `main`, CI de la PR run `41306238454` y CI de `main` run `41306484717`, ambos `completed/success`.

## Resultado

`packages/api-client` deja de ser un stub y pasa a ser un cliente HTTP tipado real: `createApiClient({ basePath?, fetch? })` con `request<T>()`, atajos `get/post/put/patch/delete`, validación estructural de la respuesta, `ApiError` (contrato canónico de `@memora/shared`) y `ApiTransportError` con `kind` discriminado, mensajes seguros en español, respuestas vacías (204/205, `Content-Length: 0`), aborto propagado sin envolver y query params deterministas. `apps/web` monta sobre TanStack Start el `QueryClientProvider` con un `QueryClient` por petición en servidor, el error boundary raíz con reintento y foco, el 404 con foco, el cliente de navegador y el de servidor con `API_INTERNAL_URL` validado como origen, y conserva `/login` (SSR), `/circles` (`ssr: false`) y `/help` (prerender) como rutas de humo.

La revisión independiente cerró con veredicto «apto con correcciones» y todas las correcciones están aplicadas y verificadas. El usuario aceptó la feature el 2026-11-01 tras probarla en Firefox real sobre `/login`, `/circles`, `/help` y una ruta inexistente, sin errores de hidratación. El cierre operativo se completó el mismo 2026-11-01: PR #5 con CI en verde, merge `9fd987e` en `main` y CI de `main` en verde. F09 queda en **`done`**; solo permanece el AC-06 automatizado, trasladado a F37/F38.

## Cambios (archivos)

**`packages/api-client` (de stub a paquete real)**

- `packages/api-client/package.json`: dependencia de `@memora/shared`, scripts de build/test/lint/typecheck y `vitest@5.0.5` como devDependency (autorizada por el usuario).
- `packages/api-client/src/index.ts`: superficie pública del paquete.
- `packages/api-client/src/constants.ts`: base por defecto `/api` (`DEFAULT_API_BASE_PATH`).
- `packages/api-client/src/types.ts`: `ApiClient`, `RequestOptions`, `FetchLike` y `StructuralValidator<T>` (solo `parse`, sin `zod` ni React).
- `packages/api-client/src/errors.ts`: `ApiError` y `ApiTransportError` con guards `isApiError`/`isApiTransportError` y mensajes seguros en español; nunca se copia el cuerpo crudo del servidor.
- `packages/api-client/src/url.ts`: normalización de `basePath` (ruta o URL absoluta) y query params deterministas.
- `packages/api-client/src/client.ts`: `createApiClient`, `request<T>()`, atajos por verbo, 204/205 y `Content-Length: 0`, aborto sin envolver, `fetch` inyectable.
- `packages/api-client/src/*.test.ts`: 39 tests en 3 archivos (`client`, `errors`, `url`) con `fetch` sustituido.
- `packages/api-client/README.md`: contrato del paquete; deja explícito que solo habla JSON y que multipart/binario llegan en F25/F33.

**`apps/web`**

- `apps/web/package.json` + `pnpm-lock.yaml`: `@tanstack/react-query@5.105.1` exacto y `@memora/api-client` como dependencia (autorizado por el usuario).
- `apps/web/src/lib/query-client.ts` (+ test): `QueryClient` con `staleTime` 30 s y política de reintentos (4xx no; 5xx y red sí, máximo 2).
- `apps/web/src/router.tsx`: `QueryClientProvider` en el contexto del router; un `QueryClient` por petición en servidor, sin caché compartida entre peticiones.
- `apps/web/src/lib/env.ts` y `apps/web/src/lib/env.server.ts` (+ tests): `VITE_API_BASE_URL` (default `/api`), `API_INTERNAL_URL` validado como **origen** absoluto al arrancar (default `http://127.0.0.1:3001`); base final `${origen}/api`.
- `apps/web/src/lib/api-client.ts` y `apps/web/src/lib/api-client.server.ts` (+ tests): instancias de navegador y servidor; la de servidor es la que compone `${API_INTERNAL_URL}/api`.
- `apps/web/src/lib/error-message.ts` (+ test): traducción de errores a mensaje de UI sin filtrar `Error.message` del servidor.
- `apps/web/src/components/route-error.tsx` y `apps/web/src/components/not-found.tsx` (+ tests): error boundary raíz con reintento, foco y enlace; 404 con foco.
- `apps/web/src/routes/__root.tsx`: boundary raíz y 404 conectados al router.
- `apps/web/src/vite-env.d.ts` y `apps/web/src/test/setup.ts`: tipos de `import.meta.env` y setup de tests.
- `apps/web/vite.config.ts`: proxy `/api` con target leído de `API_INTERNAL_URL`.
- `apps/web/tsconfig.json`: tipos y rutas del paquete.
- `apps/web/README.md`: variables de entorno, proxy, cliente API y rutas de humo.
- `.env.example`: `VITE_API_BASE_URL` y `API_INTERNAL_URL` con defaults documentados y sin secretos.

**Rutas de humo (spike F05 conservado)**

- `apps/web/src/routes/login.tsx` (SSR), `apps/web/src/routes/circles.tsx` (`ssr: false`) y `apps/web/src/routes/help.tsx` (prerender). Se anotan como placeholders hasta F16/F18/F36.

**Corrección posterior a la revisión (code-splitting de `/login`)**

- `apps/web/src/features/spike/login-page.tsx`: nueva ubicación del componente `LoginPage`, antes exportado desde el archivo de ruta.
- `apps/web/src/routes/login.tsx`: exporta **solo** `Route`; deja de exportar `LoginPage` y con ello de romper el code-splitting que exige TanStack Router.
- `apps/web/src/routes/login.test.tsx`: importa `LoginPage` desde la nueva ubicación.
- Todos los archivos de `apps/web/src/routes/` exportan ya únicamente `Route`.

## Verificación (comando → resultado real)

**Tests**

- `corepack pnpm --filter @memora/shared test` → **138 passed** (5 archivos).
- `corepack pnpm --filter @memora/api test` → **77 passed + 13 skipped** sin `DATABASE_URL` (7 + 1 archivo).
- `corepack pnpm --filter @memora/api-client test` → **39 passed** (3 archivos).
- `corepack pnpm --filter @memora/web test` → **52 passed** (13 archivos).

**Estática y build**

- `corepack pnpm --filter @memora/web typecheck` → OK.
- `corepack pnpm --filter @memora/web lint` → OK.
- `corepack pnpm --filter @memora/web build` → OK; genera `dist/client`, `dist/server` y prerenderiza `/help` (1 página).
- `corepack pnpm -r typecheck` → 6 workspaces OK.
- `corepack pnpm -r lint` → 6 workspaces OK.
- `corepack pnpm docs:check` → 191 archivos, 433 enlaces, 0 rotos.
- `corepack pnpm agents:check` → OK (10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas).

**Smoke real con API y web levantadas**

- `/api/health` directo → **200**.
- `/health` directo → **404** (el prefijo `/api` no se duplica ni se pierde).
- Proxy `localhost:3000/api/health` → **200**.
- `/login` → HTML inicial con `h1` y `<form>`.
- `/circles` → HTML inicial **sin** el componente: no aparece «Tus círculos».
- `/help` → `dist/client/help/index.html` prerenderizado con «Primeros pasos en Memora».
- Ruta inexistente → **404** con «Página no encontrada» y enlace a `/`.
- `dist/client` → sin `API_INTERNAL_URL` ni `127.0.0.1`.
- Composición del cliente de servidor contra la API real: base `http://127.0.0.1:3001/api`, `GET /health` → **200**.
- `API_INTERNAL_URL=/api` + `build` → **exit 1** con mensaje seguro de validación.

## Aceptación del usuario (G4, 2026-11-01)

- **Prueba manual en navegador real (Firefox)** sobre `/login`, `/circles`, `/help` y una ruta inexistente.
- **Resultado:** todo funciona y **no hay errores de hidratación**. AC-06 pasa de «parcial» a **verificado en navegador por el usuario**.
- **Limitación:** la comprobación es manual; no existe prueba automatizada de navegador. Playwright llega en F37 (infraestructura de tests) y F38 (E2E), que deberán convertir esta evidencia en un test reproducible.
- **Aviso benigno observado y descartado:** en `/help`, Firefox muestra «El diseño se forzó antes de que la página se cargara completamente…». Es un aviso del navegador por cálculo de layout temprano; el único código propio que toca scroll es `scrollRestoration: true` del router. **No es un error, no afecta a la hidratación y no se corrige.** Queda registrado como observación, no como deuda.
- **Decisión:** el usuario acepta la feature sin cambios solicitados. Estado → `accepted` (y `done` tras el cierre operativo).

## Cierre operativo (2026-11-01)

| Elemento | Valor real |
| --- | --- |
| Rama | `feat/F09-web-core` |
| Commits | `a81dc9a` `feat(api-client): add typed HTTP client with canonical errors`; `1363e71` `feat(web): add web core with query provider and route states`; `8c4a963` `docs: record F09 implementation, review and acceptance` |
| PR | [#5](https://github.com/Luceir0/lab-final--memora/pull/5) |
| CI de la PR (head `8c4a963`) | run `41306238454` → `completed/success` |
| Merge en `main` | `9fd987e` (`Merge pull request #5 from Luceir0/feat/F09-web-core`) |
| CI de `main` sobre el merge | run `41306484717` → `completed/success` |
| Rama remota | `feat/F09-web-core` sigue existiendo tras el merge |

Verificación local final antes del merge: web **52 tests**, `api-client` **39**, `shared` **138**, `api` **77 + 13 skipped** sin `DATABASE_URL`; `-r typecheck` y `-r lint` OK; `build` con prerender de `/help`; `docs:check` **191 archivos / 433 enlaces / 0 rotos**; `agents:check` OK. AC-06 sigue verificado manualmente por el usuario en Firefox; la automatización corresponde a F37/F38.

## Criterios de aceptación

| AC | Criterio | Estado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | La app arranca en desarrollo | **pasa** | Dev real levantado; `/login` sirve HTML |
| AC-02 | El proxy /api funciona | **pasa** | `localhost:3000/api/health` → 200; `/health` directo → 404 |
| AC-03 | Una ruta SSR renderiza en servidor | **pasa** | `/login` con `h1` y `<form>` en el HTML inicial |
| AC-04 | Una ruta `ssr: false` no renderiza su componente en servidor | **pasa** | `/circles` sin «Tus círculos» en el HTML inicial |
| AC-05 | Una ruta prerenderizada genera HTML | **pasa** | `dist/client/help/index.html` con «Primeros pasos en Memora» |
| AC-06 | No hay errores de hidratación en las rutas de humo | **pasa** | Prueba manual del usuario en Firefox real el 2026-11-01 sobre `/login`, `/circles`, `/help` y ruta inexistente, sin errores de hidratación. Sin test automatizado de navegador: Playwright llega en F37/F38 |

AC-06 pasa con evidencia **manual en navegador real del usuario**; no hay prueba automatizada de hidratación. F37 (infraestructura de tests) y F38 (E2E) deben aportar la cobertura automatizada, no reabrir el criterio.

## Hallazgos de revisión y estado

### Primera revisión — no apto

| # | Hallazgo | Estado |
| --- | --- | --- |
| B-01 | El cliente de servidor apuntaba al origen sin `/api`: `serverApiClient.get('/health')` daba 404 | **Corregido.** La base de servidor se compone como `${API_INTERNAL_URL}/api`; verificado contra la API real (200) y con `/health` directo 404. |
| M-01 | `API_INTERNAL_URL` no se validaba al arrancar | **Corregido.** `env.server.ts` exige URL absoluta y falla al arrancar con mensaje seguro; `API_INTERNAL_URL=/api` + `build` → exit 1. |
| m-01 | Posible fuga de `Error.message` del servidor a la UI | **Corregido.** `error-message.ts` traduce a mensajes propios; no se propaga el mensaje crudo. |
| m-02 | El 404 no gestionaba el foco | **Corregido.** `not-found.tsx` mueve el foco; cubierto con test. |
| m-03 | El aborto durante la lectura del cuerpo no se propagaba | **Corregido.** `AbortError` se relanza sin envolver también en la fase de lectura; test añadido. |
| m-04 | READMEs contra el contrato | **Corregido.** `packages/api-client/README.md` y `apps/web/README.md` alineados con el código (solo JSON, 204, errores, variables). |
| m-05 | Cierre documental pendiente | **Corregido.** Este handoff y la documentación viva. |
| S-01 | Falta test de integración del router | **Aceptado como deuda.** Sin navegador real en esta feature; se cubre en F37/F38. |
| S-02 | Frontera de módulos entre cliente de navegador y de servidor | **Corregido.** Separación `api-client.ts` / `api-client.server.ts` y guarda `server-only`. |
| S-03 | Cookies en SSR con `fetch` de Node | **Documentado.** `credentials: 'include'` no reenvía cookies en Node; F10/F22 deben pasar la cabecera `cookie`. |
| S-04 | AC-06 sin evidencia en navegador | **Resuelto por aceptación manual.** El usuario verificó en Firefox real el 2026-11-01 sin errores de hidratación; la cobertura automatizada sigue pendiente en F37/F38. |

### Segunda revisión — apto con correcciones

| # | Hallazgo | Estado |
| --- | --- | --- |
| B-01, M-01, m-01, m-02, m-03, S-02 | Ya corregidos en la ronda anterior | **Verificados** por el reviewer |
| N-01 | Dos comentarios/ejemplos documentales desalineados | **Corregido** |
| N-02 | `basePath` se evaluaba de forma no perezosa | **Corregido** |
| N-03 | Mensaje de validación incompleto | **Corregido** |

Tras N-01, N-02 y N-03 **todos los hallazgos están aplicados**. No hubo una tercera ronda formal: el orquestador re-ejecutó la batería completa en verde (tests de los cuatro paquetes, typecheck y lint por workspace y globales, build y validadores documentales).

### Corrección posterior a las revisiones — code-splitting de `/login`

| # | Hallazgo | Estado |
| --- | --- | --- |
| C-01 | `apps/web/src/routes/login.tsx` exportaba `LoginPage` además de `Route`, lo que impedía el code-splitting de TanStack Router | **Corregido.** El componente se movió a `apps/web/src/features/spike/login-page.tsx`; la ruta exporta solo `Route` y el test importa de la nueva ubicación. Todos los archivos de `src/routes/` exportan ya únicamente `Route`. Verificado con 52 tests, typecheck, lint, build y `-r` en verde. |

## Pendiente

- **AC-06 con prueba automatizada de navegador** en F37 (infraestructura de tests) y F38 (E2E). Es lo único que queda abierto de F09; la verificación manual en Firefox ya está hecha y el cierre operativo está completo.

## Riesgos y limitaciones

- **AC-06 verificado manualmente, sin automatizar**: el usuario comprobó en Firefox real que no hay errores de hidratación, pero no existe un test de navegador que lo garantice en el futuro. Cualquier regresión de hidratación no se detectará hasta que F37/F38 aporten Playwright.
- **Aviso benigno de Firefox en `/help`** («el diseño se forzó antes de que la página se cargara completamente»): procede del navegador por cálculo de layout temprano y no afecta a la hidratación. No se corrige; si en F37/F38 aparece ruido en consola, debe tratarse como ruido conocido.
- El cliente de servidor **no tiene todavía consumidor de producto** (F10+); su protección `server-only` no se ejercita en el bundle actual.
- El proxy `/api` es **solo de desarrollo**. En producción el servidor web o el reverse proxy (F42) debe enrutar `/api`.
- `credentials: 'include'` **no reenvía cookies en `fetch` de Node**: las server functions autenticadas deberán pasar la cabecera `cookie` (F10/F22).
- El cliente **solo habla JSON**: multipart y binarios llegan en F25/F33 en una capa aparte.
- `apps/web/scripts/no-tests.mjs` sigue huérfano y sin borrar: falta permiso explícito para eliminar archivos.
- `turbo lint` y `turbo typecheck` siguen fallando por el PATH del runner; `pnpm -r lint` y `pnpm -r typecheck` pasan.
- Las rutas `/login`, `/circles` y `/help` son **placeholders** del spike: F16, F18 y F36 las sustituirán.

## Documentación actualizada

- `docs/04-features/F09-web-core/handoff.md`: este documento (sustituye la plantilla), con el apartado de cierre operativo.
- `docs/04-features/F09-web-core/spec.md`: `status: done` en frontmatter y encabezado; alcance y AC intactos.
- `docs/04-features/F09-web-core/tasks.md`: implementación, revisión, aceptación y cierre operativo marcados (commit, push, PR/CI, merge y `done`).
- `docs/04-features/README.md`: fila F09 → `done` y «Situación actual» con la PR #5, el merge `9fd987e`, el CI `41306484717` y AC-06 verificado manualmente.
- `README.md`: estado del proyecto (`F01–F09 done`), tabla de elementos, próximos pasos con F10 en `draft` y párrafo histórico con PR/merge/CI de F09.
- `docs/06-process/ai-log.md`: entrada de cierre de F09 con los datos reales del cierre, el arreglo de code-splitting, el aviso benigno de Firefox y la decisión final.
- `docs/07-curriculum/coverage-map.md`: F09 → `done`.
- `docs/05-quality/test-matrix.md`: nota de cierre de F09 con PR/merge/CI reales.
- `docs/00-index.md`: resumen de estado de F09 alineado con `done`.

## Siguiente paso propuesto

1. **F10 — Sistema visual y tema**, que depende de F09 (ya `done`). Sigue en `draft` y **no se abre sin permiso explícito**.
2. F37 y F38 deben convertir el AC-06 manual de F09 en una prueba automatizada de navegador.
