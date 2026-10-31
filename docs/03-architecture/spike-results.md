# Resultados del spike técnico (F05)

- **Feature:** F05 — Spike técnico integrado
- **Rama:** `feat/F05-spike-tecnico`
- **Fecha:** 2026-10-26
- **Estado:** `done`; PR #1 mergeada en `main` (`8dfae5f`) y CI en verde
- **Merge:** PR #1, merge commit `8dfae5f`; commits `6730ddc` y `596e516`
- **CI:** [run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132), completed/success, 2026-10-26
- **Spec:** [spec.md](../04-features/F05-spike-tecnico/spec.md)
- **Handoff:** [handoff.md](../04-features/F05-spike-tecnico/handoff.md)

## Objetivo y alcance

Validar juntas, antes de construir producto, las piezas con más riesgo del stack: los tres modos de render de TanStack Start, Tailwind 4 sin preset JS, Fastify 5 con Zod 4, Prisma 7 sobre PostgreSQL, `sharp` para variantes de imagen y la lectura del snapshot de Content Island en build.

**Incluido:** rutas de prueba SSR, `ssr: false` y prerender; proxy `/api`; endpoints de salud y eco con errores uniformes; migración mínima de Prisma; procesamiento de una imagen; snapshot editorial; este informe y el plan de salida.

**Excluido:** producto real, diseño final, autenticación, pipeline de subida completo, modelo de datos definitivo y batería de tests completa.

## Versiones validadas

| Capa | Herramienta | Versión | Notas |
| --- | --- | --- | --- |
| Runtime | Node.js | 24.21.0 | `engines >=24` |
| Tooling | pnpm | 10.34.8 | vía corepack |
| Tooling | TypeScript | 6.0.3 | `strict` en apps y paquetes |
| Testing | Vitest | 5.0.5 | API, web y shared |
| Datos | PostgreSQL | 17.11 | contenedor local |
| Web | React / React DOM | 19.3.1 | |
| Web | TanStack Start | 1.169.4 | sobre Vite |
| Web | TanStack Router | 1.170.46 | rutas tipadas |
| Web | Vite | 8.3.5 | build cliente + servidor |
| Web | `@vitejs/plugin-react` | 6.1.2 | |
| Estilos | Tailwind CSS | 4.3.3 | CSS-first |
| Estilos | `@tailwindcss/vite` | 4.3.3 | plugin de Vite |
| Contenido | `@content-island/api-client` | 0.26.0 | modo `snapshot` |
| API | Fastify | 5.12.7 | |
| API | `fastify-type-provider-zod` | 7.0.0 | validación y serialización |
| API | Zod | 4.6.7 | |
| API | Prisma CLI / Client | 7.10.1 | |
| API | `@prisma/adapter-pg` | 7.10.1 | driver adapter |
| API | `pg` | 8.23.1 | |
| API | `sharp` | 0.35.5 | variantes WebP |

Prisma 7 se configuró con `apps/api/prisma7.config.ts`, generador `prisma-client` (ESM, salida en `apps/api/src/generated/prisma`) y `@prisma/adapter-pg`. El cliente generado está ignorado por Git y se regenera con `prisma generate` en `build`, `typecheck` y `test`.

**Turbo y variables de entorno:** `turbo.json` declara `globalDependencies: ["content-island-snapshot.json"]` y `globalEnv: ["CONTENT_ISLAND_SNAPSHOT_PATH", "DATABASE_URL"]`. Así la caché se invalida cuando cambia el snapshot y el test de integración recibe `DATABASE_URL`. Verificado con `DATABASE_URL=... corepack pnpm exec turbo run test --filter=@memora/api --force` → 15/15. `prisma generate` en paralelo puede fallar con `EEXIST`; conviene ejecutar build, test y typecheck secuenciales.

## Resultados por criterio

### AC-01 — Las tres rutas se renderizan en el modo esperado

**Resultado:** pasa con limitación de navegador real.

| Ruta | Modo | Evidencia observada |
| --- | --- | --- |
| `/login` | SSR | `200`; el HTML inicial contiene el `h1` y el formulario |
| `/circles` | `ssr: false` | `200`; el HTML inicial **no** contiene «Tus círculos» |
| `/help` | prerender | `200`; el HTML inicial contiene «Primeros pasos en Memora» |

- El build deja `apps/web/dist/client/help/index.html` con el contenido editorial.
- El smoke se hizo por HTTP y por inspección del build, no en un navegador real. El smoke propio usó `127.0.0.1` porque el puerto 3000 estaba ocupado; el reviewer usó el puerto 3100.
- La navegación SPA a `/help` no se ha probado en navegador. Para que el `loader` funcione también en cliente, la ruta usa `createServerFn({ method: 'GET' })` y el contenido se sirve por RPC sin meter `node:fs` en el bundle.

### AC-02 — Tailwind 4 aplica tokens sin preset JS

**Resultado:** pasa.

- No existe `tailwind.config.*` ni preset JavaScript, y `tokens.test.ts` comprueba que tampoco hay `postcss.config.*` en raíz, `apps/web` ni `packages/ui`.
- `packages/ui/src/styles/tokens.css` define las variables de runtime `--memora-*` en `:root` y `[data-theme='dark']`, y las expone con `@theme inline` a `--color-*`, `--radius-*`, `--shadow-*`, `--text-*` y `--font-sans`.
- `apps/web/src/styles/app.css` importa `tailwindcss`, importa `@memora/ui/tokens.css` y declara `@source` hacia `packages/ui/src`.
- El CSS emitido contiene `--color-bg:var(--memora-bg)` y `.bg-bg{background-color:var(--memora-bg)}`, sin autorreferencias.
- El tema oscuro solo cambia `--shadow-lg` en sombras, siguiendo [tokens.md](../02-design/tokens.md); el resto del tema y la tipografía se completan en F10.

### AC-03 — Fastify valida con Zod 4 y devuelve errores uniformes

**Resultado:** pasa con limitación de cobertura 4xx.

- `GET /api/health` → `{ status: 'ok', version: '0.0.0', timestamp }`.
- `POST /api/spike/echo` temporal, con body `{ message: string }` (1–280 caracteres, `trim`) y respuesta tipada; marcado `TODO(F08)`.
- `GET /api/spike/boom` es una ruta solo de test: se declara en `routes.test.ts` sobre la instancia de test y no se registra en producción. `rg` confirma que no aparece en `routes.ts` ni en `dist`.
- Formato único de error: `{ code, message, details }`, con `details` como array de `{ field, message }`.
- **Nota (2026-10-31, F06):** el contrato compartido vigente define cada detalle con al menos uno de `field`, `message`, `resource` o `limit`, y exige `details` como array **no vacío** o `null`; ver [api-contract.md](api-contract.md). La descripción anterior se conserva como resultado histórico del spike.
- `build-server.ts` mapea los 4xx reales: 400/422 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 429 `RATE_LIMITED` y un fallback `CLIENT_ERROR`. Solo los 5xx se convierten en 500 `INTERNAL_ERROR`.
- Los 4xx se registran como `warn` sin stack (`err`); los 5xx como `error`.
- Pruebas y smoke:
  - `POST /api/spike/echo` con `{"message":"hola"}` → `200`.
  - `POST` con `{}` → `400 VALIDATION_ERROR` y `details[0].field === "message"`.
  - JSON malformado → `400 VALIDATION_ERROR` con `details: []`.
  - **Nota (2026-10-31, F06):** desde F06 `details` es un array **no vacío** o `null`, y `[]` se rechaza. La API del spike sigue emitiendo `[]`; F08 debe alinearla con el contrato compartido. Se conserva el resultado histórico de arriba.
  - Body de 1.100.014 bytes → `413 PAYLOAD_TOO_LARGE`.
  - `GET /api/spike/boom` en la instancia de test → `500 INTERNAL_ERROR` sin filtrar el mensaje original.
  - `GET /api/no-existe` → `404 NOT_FOUND`.
- `corepack pnpm --filter @memora/api test` sin base → 14 passed + 1 skipped (15). La suite cubre salud, eco, validación, JSON malformado, 413, 500, 404, imágenes y la integración de Prisma.
- Cobertura parcial: 401/403/409/415/422/429 están implementados, pero ninguna ruta de prueba los produce.

### AC-04 — Prisma 7 migra y consulta

**Resultado:** pasa con la limitación de que el test de integración se salta sin base de datos.

- Migración `20261026153600_spike_init` aplicada contra PostgreSQL 17.11.
- Modelo temporal `SpikeNote` (`id`, `message`, `createdAt`) marcado con `TODO(F07)`.
- `getPrismaClient()` crea el cliente de forma perezosa; `/api/health` sigue funcionando sin `DATABASE_URL`.
- `db.integration.test.ts` crea, lee y borra una nota. Sin `DATABASE_URL` se salta; con una base migrada pasa.
- `DATABASE_URL=... corepack pnpm --filter @memora/api test` → 15/15 pruebas pasadas.
- `DATABASE_URL=... corepack pnpm exec turbo run test --filter=@memora/api --force` → 15/15; Turbo inyecta la variable por `globalEnv` aunque no esté en la caché.

### AC-05 — sharp genera thumb y display sin perder orientación

**Resultado:** pasa para JPEG y PNG; WebP no se probó como entrada y HEIC no queda validado.

- `processImage` genera:
  - `thumb`: 400 × 400, `fit: 'cover'`, WebP.
  - `display`: lado mayor ≤ 1600 px, `fit: 'inside'`, sin ampliar, WebP.
- Aplica la orientación EXIF con `.rotate()` y elimina EXIF, orientación e ICC al no llamar a `withMetadata()`.
- Límite de decodificación: 50 MP (`limitInputPixels`).
- `images.test.ts` comprueba orientación EXIF 6, ausencia de metadatos, tope de 1600 px, que no se amplían imágenes pequeñas, que un ICC real se elimina y que una cabecera SOF parcheada a 10.000 × 6.000 px se rechaza por el límite de 50 MP.
- Sonda real: `sharp.format.heif.input` es *truthy*, pero solo anuncia `.avif`; no anuncia `.heic`. No se probó un `.heic` real.
- **Decisión para F25:** rechazar HEIC con `415 UNSUPPORTED_MEDIA_TYPE` y mensaje claro, o añadir una estrategia de conversión validada con muestras reales. No se asume soporte de `sharp`.

### AC-06 — El snapshot de Content Island se lee en build

**Resultado:** pasa.

- Proyecto `memora` (id `6adf6cf7e2ac3d2c68f8c4d1`), idiomas `en` y `es`.
- Tipos creados: `helpArticle`, `faqItem` y `legalPage`.
- Contenido publicado en español: 6 artículos de ayuda, 8 preguntas frecuentes y 1 página legal (`privacidad`).
- `content-island-snapshot.json` en la raíz, exportado el 2026-10-26, `schemaVersion: 1`, 15 contenidos.
- `readHelpContent` usa `@content-island/api-client` en modo `snapshot`, `language: 'es'`, ordena por `order` y valida que `getSnapshotInfo().view === 'published'`.
- `content.server.ts` ya no lee `CONTENT_ISLAND_ACCESS_TOKEN`: pasa `accessToken: ''` porque el modo snapshot no lo usa. El build no depende de un token.
- `sortByOrder` se prueba con una lista desordenada y sin mutar la original. Las aserciones del snapshot ya no fijan 6/8 ni el primer título; comprueban que hay contenido y que el orden es monótono.
- Si el snapshot falta o no está publicado, el mensaje que cruza la server function es genérico y no incluye la ruta absoluta: «No se pudo leer el snapshot de Content Island. Revisa CONTENT_ISLAND_SNAPSHOT_PATH o regenera el snapshot.». La ruta esperada y el error original se registran en el log del servidor. El test comprueba ambos.
- El JS cliente no contiene el cuerpo del snapshot ni `node:fs`.
- `legalPage` está en el snapshot, pero F05 solo lee artículos y FAQs; `/privacy` llega con F36.

### AC-07 — Se documentan limitaciones y plan de salida

**Resultado:** pasa.

- Este documento recoge resultados, limitaciones, deudas y plan de salida.
- [render-modes.md](render-modes.md) deja constancia de la validación de los tres modos.
- La revisión independiente fue «apto con correcciones», sin bloqueantes; la re-revisión fue «apto con correcciones menores», sin bloqueantes ni hallazgos mayores nuevos. Las correcciones están aplicadas y verificadas. F05 fue aceptada por el usuario el 2026-10-26 y cerrada como `done` tras el merge `8dfae5f` y CI en verde.
- El [handoff](../04-features/F05-spike-tecnico/handoff.md) detalla ambas revisiones, las correcciones y el cierre.

### Resumen de pruebas y build

- Sin base de datos: 30 passed + 1 skipped (shared 1, API 14 passed + 1 skipped, web 15).
- Con `DATABASE_URL`: 31 passed (API 15/15).
- `lint` 6/6 y `typecheck` 8/8 con el shim temporal de pnpm; sin shim, los comandos raíz fallan por `pnpm` fuera de PATH.
- `build` 5/5, `/help` prerenderizado y CSS de 14,66 kB.
- `format:check`, `docs:check` y `agents:check` verdes.

## Limitaciones y deudas

| Deuda | Detalle | Cuándo se cierra |
| --- | --- | --- |
| `SpikeNote` temporal | Modelo y migración de prueba; F07 puede resetear la base local y sustituir `spike_init` por la migración inicial definitiva | F07 |
| `TIMESTAMP(3)` sin zona | La migración usa `TIMESTAMP(3)` sin zona horaria; revisar en el modelo definitivo | F07 |
| `API_VERSION` duplicada | Vive en `apps/api/src/spike/schemas.ts` y en `package.json` | F06/F08 |
| `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` | Códigos de spike que no están en el contrato compartido; alinear en F06 sin romper los códigos reales | F06 |
| Rutas de spike | `/api/spike/echo` es temporal; `/api/spike/boom` solo existe en `routes.test.ts` y no se registra en producción | F08/F05 |
| Cobertura parcial de 4xx | 401/403/409/415/422/429 están implementados, pero ninguna ruta de prueba los produce | F06/F08 |
| `node --watch` | Vigila `node_modules` y provoca reinicios espurios | F06 |
| `HelpContent` en web | Vive en `apps/web/src/features/spike/`; F11/F12 decidirán si pasa a `packages/ui` | F11/F12 |
| Tema oscuro y contraste | Solo cambia `--shadow-lg`; `data-theme="light"` fijo, bordes de inputs y `duration-150` pendientes | F10/F11 |
| Navegación SPA a `/help` | No probada en navegador real; ahora usa server function | F09/F36 |
| Ruta del snapshot | Se resuelve desde el `cwd` de `apps/web` hacia la raíz; `CONTENT_ISLAND_SNAPSHOT_PATH` permite override | F36 |
| HEIC | `sharp` no anuncia `.heic`; no se probó un archivo real | F25 |
| `/privacy` | El tipo `legalPage` y el contenido existen, pero no hay ruta en F05 | F36 |
| Fallback de `DATABASE_URL` | El fallback local no está decidido para producción | F08/F42 |
| `prisma generate` en paralelo | Puede fallar con `EEXIST`; ejecutar build/test/typecheck secuenciales | F06/F37 |
| `pnpm` fuera de PATH | Usar `corepack pnpm`, `corepack enable pnpm` o `corepack pnpm -r run <script>` | Entorno local |
| `nul` residual | Archivo de shell en la raíz; eliminado con permiso del usuario el 2026-10-26; ya no bloquea `git add` | Cerrado |
| Test de base de datos | Se salta sin `DATABASE_URL`; CI no levanta PostgreSQL en F05 | F37/F42 |
| Tests de navegador | Sin E2E ni prueba real de hidratación en F05 | F37/F38 |
| Tokens de Content Island | Se compartieron por chat para crear contenido; deben rotarse | Seguridad |
| Commit, merge y CI | Cerrados: commits `6730ddc` y `596e516`, merge `8dfae5f` y CI en verde | Cerrado |

## Plan de salida si TanStack Start bloqueara

**No fue necesario activarlo.** Se documenta como contingencia, no como decisión tomada.

Disparadores: un bloqueo sin workaround en SSR selectivo, prerender o server functions; regresiones de build no acotables; o una API que obligue a reescribir componentes.

1. Congelar la evidencia de F05 y abrir una decisión nueva antes de tocar código de producto.
2. Aplicar el plan de [ADR-0001](adr/ADR-0001-metaframework.md): las rutas privadas pasan a SPA pura sobre Vite, conservando React, TanStack Query, componentes, hooks y API.
3. Mantener SSR y SSG en una entrada Node mínima; si el problema está en el servidor de Start, evaluar React Router framework como sustituto directo.
4. Dejar Next.js App Router como última alternativa, con ADR nuevo y migración planificada.
5. No cambiar contratos de API ni rehacer UI por el cambio de capa de rutas.

## Comandos de reproducción

Requisitos: Node 24, corepack y Docker para PostgreSQL. En esta máquina `pnpm` no está en PATH; los comandos se ejecutaron como `corepack pnpm ...`. Alternativas: `corepack enable pnpm` o `corepack pnpm -r run <script>`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm docs:check
corepack pnpm agents:check
```

Base de datos y migración:

```bash
docker compose up -d postgres
export DATABASE_URL="postgresql://<usuario>:<clave>@localhost:5432/memora?schema=public"
corepack pnpm --filter @memora/api db:migrate
corepack pnpm --filter @memora/api test
```

API en vivo:

```bash
corepack pnpm --filter @memora/api dev
curl -i http://127.0.0.1:3001/api/health
curl -i -X POST http://127.0.0.1:3001/api/spike/echo \
  -H "content-type: application/json" \
  -d '{"message":"hola"}'
curl -i -X POST http://127.0.0.1:3001/api/spike/echo \
  -H "content-type: application/json" \
  -d '{}'
curl -i -X POST http://127.0.0.1:3001/api/spike/echo \
  -H "content-type: application/json" \
  -d '{"message":'
curl -i http://127.0.0.1:3001/api/spike/boom
curl -i http://127.0.0.1:3001/api/no-existe
```

Web y build:

```bash
corepack pnpm --filter @memora/web dev -- --host 127.0.0.1
curl -i http://127.0.0.1:3000/login
curl -i http://127.0.0.1:3000/circles
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/help
```

Inspección del build:

```bash
rg -n "Primeros pasos en Memora" apps/web/dist/client/help/index.html
rg -n -- "--memora-bg|--color-bg|\\.bg-bg" apps/web/dist/client/assets/*.css
rg -n "content-island-snapshot|node:fs" apps/web/dist/client/assets/*.js
```

Regenerar el snapshot (requiere token; no se versiona):

```bash
npx content-island export --access-token <token>
```

## Referencias

- [Spec de F05](../04-features/F05-spike-tecnico/spec.md)
- [Handoff de F05](../04-features/F05-spike-tecnico/handoff.md)
- [Render modes](render-modes.md)
- [Tokens](../02-design/tokens.md)
- [ADR-0001 Metaframework](adr/ADR-0001-metaframework.md)
- [ADR-0003 Tailwind](adr/ADR-0003-tailwind.md)
- [ADR-0004 Prisma](adr/ADR-0004-prisma.md)
- [ADR-0007 Uploads](adr/ADR-0007-uploads.md)
- [ADR-0010 Content Island](adr/ADR-0010-content-island.md)
