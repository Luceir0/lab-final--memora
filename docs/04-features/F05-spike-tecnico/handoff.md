# Handoff — F05 Spike técnico integrado

- **Estado:** `done` (cerrada tras merge y CI en verde)
- **Rama:** `feat/F05-spike-tecnico`, mergeada en `main`
- **Fecha:** 2026-10-26
- **Implementado por:** orquestador y subagentes de implementación de F05
- **Revisado por:** reviewer independiente — revisión inicial y re-revisión: apto con correcciones; correcciones aplicadas
- **Aceptado por:** usuario (2026-10-26)
- **Merge:** PR #1, merge commit `8dfae5f` (`Merge pull request #1 from Luceir0/feat/F05-spike-tecnico`)
- **CI:** [run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132), completed/success, 2026-10-26

## Resultado

Spike integrado terminado y revisado. Quedan validadas las piezas de riesgo del stack: TanStack Start 1.169.4 sobre Vite 8.3.5 con los tres modos de render (`/login` SSR, `/circles` `ssr: false`, `/help` prerender), Tailwind 4.3.3 CSS-first con tokens de `packages/ui`, Fastify 5.12.7 + Zod 4.6.7 con errores uniformes, Prisma 7.10.1 con migración real sobre PostgreSQL 17.11, `sharp` 0.35.5 para thumb y display WebP sin metadatos, y lectura del snapshot de Content Island en build sin token.

La revisión independiente dio **«apto con correcciones», sin bloqueantes**, y la re-revisión **«apto con correcciones menores»**, sin bloqueantes ni hallazgos mayores nuevos. Se aplicaron las correcciones mayores (mapeo real de 4xx y 413, `globalDependencies`/`globalEnv` de Turbo y pruebas nuevas) y las menores (tareas, tests de contenido y tokens, servidor de contenido, rutas de spike, mensaje genérico de error y documentación de tokens). El usuario aceptó F05 el 2026-10-26. **F05 está cerrada**: PR #1 mergeado en `main` (`8dfae5f`) y CI en verde. F06 es el siguiente paso, pero no se abre sin permiso del usuario.

**Cierre:** merge commit `8dfae5f` con los commits `6730ddc` (`feat: add F05 integrated technical spike`) y `596e516` (`chore: raise agent step budgets and document checkpoints`). CI de `main`: [run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132), completed/success. Los servidores de prueba (API en 3001 y web en 3000/3100) se cerraron al terminar la verificación.

## Cambios (archivos)

### Web

- `apps/web/package.json`: TanStack Start 1.169.4, Tailwind 4.3.3, Content Island 0.26.0, Vitest 5.0.5, Testing Library y configuración de tests.
- `apps/web/vite.config.ts`: plugin de Tailwind, `tanstackStart` con prerender de `/help`, proxy `/api` → `http://127.0.0.1:3001`.
- `apps/web/tsconfig.json` y `apps/web/vitest.config.ts`: tipos y entorno de test (jsdom, setup).
- `apps/web/src/routes/login.tsx`: ruta SSR de prueba con formulario accesible.
- `apps/web/src/routes/circles.tsx`: ruta privada con `ssr: false`.
- `apps/web/src/routes/help.tsx`: ruta prerenderizada que carga el contenido editorial.
- `apps/web/src/routes/login.test.tsx`, `apps/web/src/routes/circles.test.tsx`: smoke tests de las rutas.
- `apps/web/src/routes/__root.tsx` y `apps/web/src/routeTree.gen.ts`: documento base, estilos globales y árbol de rutas generado.
- `apps/web/src/features/spike/circles-page.tsx`: placeholder de la zona privada.
- `apps/web/src/features/spike/content.ts`, `content.server.ts`, `content.test.ts`: server function, lectura server-only del snapshot, validación de `view: published`, error genérico sin ruta absoluta y log de servidor con ruta y error original; ordenación probada.
- `apps/web/src/features/spike/help-content.tsx`, `help-content.test.tsx`: presentación y test del contenido.
- `apps/web/src/styles/app.css`, `apps/web/src/styles/tokens.test.ts`: Tailwind 4, tokens, `@source`, foco visible y comprobación de tokens y configuraciones prohibidas.
- `apps/web/src/test/setup.ts`: setup de Testing Library.

### API

- `apps/api/package.json`: Fastify 5.12.7, `fastify-type-provider-zod` 7.0.0, Zod 4.6.7, Prisma 7.10.1, `@prisma/adapter-pg`, `pg` y `sharp` 0.35.5.
- `apps/api/src/build-server.ts`: mapeo de 4xx reales (400/422, 401, 403, 404, 409, 413, 415, 429), fallback `CLIENT_ERROR`, 413 `PAYLOAD_TOO_LARGE`, 500 `INTERNAL_ERROR` y logs `warn`/`error` sin filtrar detalles.
- `apps/api/src/spike/routes.ts`, `schemas.ts`, `routes.test.ts`: `/api/health`, `/api/spike/echo` con `TODO(F08)` y `/api/spike/boom` solo en `routes.test.ts` sobre la instancia de test; tests de 400/404/413/500.
- `apps/api/src/index.ts`: arranque en `127.0.0.1:3001`, cierre ordenado.
- `apps/api/prisma7.config.ts`: configuración de Prisma 7; la URL vive fuera de `schema.prisma`.
- `apps/api/prisma/schema.prisma`: generador `prisma-client` y modelo temporal `SpikeNote` con `TODO(F07)`.
- `apps/api/prisma/migrations/20261026153600_spike_init/migration.sql`, `migration_lock.toml`: migración inicial del spike.
- `apps/api/src/db.ts`, `db-url.ts`, `db.integration.test.ts`: cliente perezoso con adapter-pg, resolución de URL y test de integración que se salta sin `DATABASE_URL`.
- `apps/api/src/services/images.ts`, `images.test.ts`: `processImage` (thumb 400×400 cover, display ≤1600 px, orientación EXIF, sin EXIF/ICC, límite 50 MP) y tests.
- `apps/api/vitest.config.ts`, `apps/api/tsconfig.json`: configuración de test y tipos.

### UI, shared y configuración

- `packages/ui/src/styles/tokens.css`: variables de runtime `--memora-*`, temas claro/oscuro y `@theme inline` que mapea `--color-*`, `--radius-*`, `--shadow-*`, `--text-*` y `--font-sans` sin autorreferencias.
- `packages/ui/package.json`: export `./tokens.css`.
- `packages/shared/package.json`: Vitest 5.0.5.
- `package.json`: `onlyBuiltDependencies` para `esbuild` y `sharp`.
- `turbo.json`: `globalDependencies: ["content-island-snapshot.json"]` y `globalEnv: ["CONTENT_ISLAND_SNAPSHOT_PATH", "DATABASE_URL"]`.
- `.gitignore`, `.prettierignore`: cliente Prisma generado y snapshot fuera de formato.
- `pnpm-lock.yaml`: dependencias del spike.
- `content-island-snapshot.json`: snapshot editorial en la raíz (6 artículos, 8 FAQs y 1 página legal; `schemaVersion: 1`).
- `nul`: archivo residual de shell en la raíz, **eliminado con permiso del usuario el 2026-10-26**.

### Documentación

- `docs/03-architecture/spike-results.md`: resultados por AC, versiones, limitaciones, plan de salida y reproducción.
- `docs/03-architecture/render-modes.md`: nota de validación de los tres modos en F05.
- `docs/03-architecture/overview.md`: enlace al informe del spike.
- `docs/03-architecture/monorepo.md`: dependencias reales de `apps/web` tras F05.
- `docs/03-architecture/uploads.md`: estado real de HEIC tras la sonda de `sharp`.
- `docs/02-design/tokens.md`: nota de variables runtime `--memora-*` y mapeo `@theme inline`.
- `docs/00-index.md`: estado del proyecto actualizado, F05 en `done`.
- `docs/04-features/F05-spike-tecnico/tasks.md`: tareas y evidencias marcadas.
- `docs/04-features/F05-spike-tecnico/handoff.md`: este documento.
- `docs/04-features/F05-spike-tecnico/spec.md`: `status: done`.
- `docs/04-features/README.md`: F05 → `done`.
- `docs/06-process/ai-log.md`: entradas de F05, revisión y cambio de presupuesto.
- `docs/07-curriculum/coverage-map.md`: sección del spike y evidencias.
- `README.md`: estado, versiones fijadas y nota del snapshot.
- `apps/web/README.md` y `packages/ui/README.md`: actualizados por ui-dev; este agente no escribió en `apps/**` ni `packages/**`.

### Cambio de proceso fuera del alcance funcional de F05

- `.opencode/agents/**` (10 agentes) y `docs/06-process/subagent-protocol.md`: presupuesto de pasos multiplicado por 5 y protocolo de checkpoint/reserva actualizado.
- Es una decisión de proceso autorizada por el usuario, no un cambio funcional del spike.
- Ya está incluida en el commit `596e516` (`chore: raise agent step budgets and document checkpoints`); no debe mezclarse con commits de producto futuros.

## Revisión y correcciones aplicadas

### Hallazgos mayores

| Hallazgo | Corrección | Evidencia |
| --- | --- | --- |
| Los 4xx reales y el JSON malformado/body grande podían acabar como 500 | `build-server.ts` mapea 400/422, 401, 403, 404, 409, 413, 415 y 429; 500 solo para errores no client; `warn` sin stack para 4xx y `error` para 5xx | `apps/api/src/build-server.ts`; tests de JSON malformado, body >1 MB y `/api/spike/boom`; smoke con logs `warn` |
| Turbo no invalidaba por snapshot ni exponía variables al test de integración | `globalDependencies` con el snapshot y `globalEnv` con `CONTENT_ISLAND_SNAPSHOT_PATH` y `DATABASE_URL` | `turbo.json`; `turbo run test --filter=@memora/api --force` → 15/15 |
| `nul` en la raíz | Eliminado con permiso del usuario el 2026-10-26 | `git status` ya no lo muestra |
| Faltaban pruebas de los caminos de error y de metadatos | Añadidos tests de JSON malformado → 400, body >1 MB → 413, ruta que lanza → 500, ICC real eliminado y límite 50 MP con cabecera SOF parcheada | `apps/api/src/spike/routes.test.ts`, `apps/api/src/services/images.test.ts` |

### Hallazgos menores

- `tasks.md` actualizado con evidencias reales y semántica de revisión corregida: inicial `[x]`, re-revisión cerrada `[ ]` y verificación final `[ ]`.
- Handoff corregido: los READMEs de `apps/web` y `packages/ui` ya están actualizados por ui-dev; no los escribió este agente.
- `content.test.ts`: `sortByOrder` probado con una lista desordenada y sin mutación; aserciones del snapshot relajadas (ya no fija 6/8 ni el primer título); se comprueba el mensaje genérico sin ruta y el log del servidor.
- `tokens.test.ts`: cubre `.mjs`, `.cjs`, `tailwind.config.*` y `postcss.config.*` en raíz, `apps/web` y `packages/ui`.
- `tokens.css`: variables `--memora-*` y mapeo `@theme inline` sin autorreferencia. `docs/02-design/tokens.md` lo explica en una línea.
- `content.server.ts`: ya no lee `CONTENT_ISLAND_ACCESS_TOKEN`; pasa `accessToken: ''`, valida `meta.view === 'published'` y no expone la ruta absoluta en el error que cruza la server function.
- `routes.ts`: `/api/spike/echo` marcado `TODO(F08)`; `/api/spike/boom` solo existe en `routes.test.ts` y no se registra en producción.

### Re-revisión

- **Veredicto:** apto con correcciones menores, sin bloqueantes ni hallazgos mayores nuevos.
- **`/api/spike/boom`:** ya no se registra en producción; solo se declara en `routes.test.ts` sobre la instancia de test. `rg` confirma que no aparece en `apps/api/src/spike/routes.ts` ni en `apps/api/dist`.
- **Error de Content Island:** el mensaje que cruza la server function es genérico («No se pudo leer el snapshot de Content Island. Revisa CONTENT_ISLAND_SNAPSHOT_PATH o regenera el snapshot.»); la ruta y el error original quedan en el log del servidor. El test comprueba ambos.
- **Conteos:** web pasa a 15 tests; total 30 passed + 1 skipped sin DB y 31 passed con DB.
- **Smoke web:** el smoke propio se hizo en `127.0.0.1` porque el puerto 3000 estaba ocupado por un proceso ajeno; el reviewer usó el puerto 3100 en su prueba. Son entornos distintos, no una contradicción.
- **Cierre:** verificación final completada, aceptación del usuario el 2026-10-26 y servidores de prueba cerrados. F05 cerrada como `done` con el merge `8dfae5f` y CI en verde.

### Observaciones no corregidas

- `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` son códigos de spike; F06 los alineará con el contrato compartido.
- Cobertura parcial de 4xx: 401/403/409/415/422/429 están implementados, pero ninguna ruta de prueba los produce.
- Contraste de bordes de inputs, `duration-150`, `data-theme="light"` fijo y tema oscuro parcial: F10/F11.
- `TIMESTAMP(3)` sin zona horaria: F07.
- Fallback de `DATABASE_URL` local: F08/F42.
- `/api/spike/echo` debe retirarse antes de producto; `/api/spike/boom` ya es solo de test.
- `prisma generate` en paralelo puede fallar con `EEXIST`; ejecutar build/test/typecheck secuenciales.
- Navegación SPA a `/help`, hidratación real, tema oscuro, móvil/escritorio, E2E y axe no probados en navegador real.
- `nul` eliminado con permiso del usuario el 2026-10-26; ya no bloquea `git add .`.
- Tokens de Content Island pendientes de rotar.

## Verificación (comandos y resultado)

Ejecución real del 2026-10-26 desde la raíz. En esta máquina `pnpm` no está en PATH: se usó `corepack pnpm` y un shim temporal para `lint` y `typecheck`.

| Comando | Resultado real |
| --- | --- |
| `corepack pnpm format:check` | OK |
| `corepack pnpm --filter @memora/api test` sin DB | 14 passed + 1 skipped (15) |
| `DATABASE_URL=... corepack pnpm --filter @memora/api test` | 15/15 |
| `corepack pnpm --filter @memora/web test` | 15 tests |
| `corepack pnpm --filter @memora/shared test` | 1 test |
| Total sin DB | 30 passed + 1 skipped |
| Total con DB | 31 passed |
| `corepack pnpm lint` | 6/6 con el shim temporal; sin shim falla por `pnpm` fuera de PATH |
| `corepack pnpm typecheck` | 8/8 con el shim temporal |
| `corepack pnpm build` | OK; 5/5 tareas; `/help` prerenderizado; CSS 14,66 kB |
| `DATABASE_URL=... corepack pnpm exec turbo run test --filter=@memora/api --force` | 15/15; el test de integración no se salta |
| JSON malformado en `/api/spike/echo` | 400 `VALIDATION_ERROR` |
| Body de 1.100.014 bytes en `/api/spike/echo` | 413 `PAYLOAD_TOO_LARGE` |
| `GET /api/health` | 200 |
| `GET /api/no-existe` | 404 `NOT_FOUND` |
| Logs de los 4xx | Nivel `warn`, sin `err` |
| Error de snapshot no disponible | Mensaje genérico sin ruta; ruta y error original en el log del servidor |
| `rg "spike/boom"` en `apps/api/src` y `apps/api/dist` | Solo aparece en `routes.test.ts`; no en `routes.ts` ni en `dist` |
| `apps/web/dist/client/help/index.html` | Contiene «Primeros pasos en Memora» |
| CSS emitido | `.bg-bg{background-color:var(--memora-bg)}`, `--color-bg:var(--memora-bg)`, sin autorreferencias |
| JS cliente | Sin cuerpo del snapshot ni `node:fs` |
| `corepack pnpm docs:check` | OK; 191 archivos, 423 enlaces, 0 rotos |
| `corepack pnpm agents:check` | OK; 10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas |
| `git status` | `main` en `8dfae5f`; cierre documental de F05 sin commitear; sin push |

**Histórico de la implementación inicial:** `lint` 6/6, `typecheck` 8/8 y `build` 5/5. Los conteos de tests anteriores quedaron sustituidos por los de arriba tras las correcciones. `lint` y `typecheck` se repitieron con el shim temporal.

`format:check` de Prettier no cubre Markdown; la validación de los documentos es `docs:check` (estructura y enlaces) y `git diff --check` (espacios).

**Nota de entorno:** el smoke web propio se hizo en `127.0.0.1` porque el puerto 3000 estaba ocupado por un proceso ajeno. El reviewer usó el puerto 3100 en su propia prueba; son entornos distintos.

## Criterios de aceptación

| AC | Criterio | Resultado | Evidencia |
| --- | --- | --- | --- |
| AC-01 | Las tres rutas se renderizan en el modo esperado | Pasa con limitación | `/login` SSR, `/circles` `ssr: false` y `/help` prerender; smoke HTTP y `dist/client/help/index.html`. Navegación SPA real sin probar |
| AC-02 | Tailwind 4 aplica tokens sin preset JS | Pasa | `tokens.css` con `--memora-*` y `@theme inline`; CSS con `--color-bg:var(--memora-bg)` y `.bg-bg`; sin `tailwind.config` ni PostCSS |
| AC-03 | Fastify valida con Zod 4 y devuelve errores uniformes | Pasa con limitación | 400/401/403/404/409/413/415/422/429 implementados; las rutas de prueba producen 400/404/413/500. `/api/spike/boom` solo existe en test. 14 tests + 1 de integración |
| AC-04 | Prisma 7 migra y consulta | Pasa con limitación | Migración aplicada en PostgreSQL 17.11; 15/15 con `DATABASE_URL`; 1 test se salta sin base |
| AC-05 | sharp genera thumb y display sin perder orientación | Pasa con limitación | Tests de EXIF, ICC eliminado, 400×400 cover, 1600 px y límite 50 MP con SOF parcheada; HEIC no validado |
| AC-06 | El snapshot de Content Island se lee en build | Pasa | `view: published` validado; `accessToken: ''`; build sin token; error genérico sin ruta y detalle solo en el log del servidor; cliente sin snapshot ni `node:fs` |
| AC-07 | Se documentan limitaciones y plan de salida | Pasa | `docs/03-architecture/spike-results.md`, este handoff, `render-modes.md` y la nota de tokens |

## Pendiente

- **Códigos de spike.** `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` se alinean con el contrato en F06.
- **Cobertura parcial de 4xx.** 401/403/409/415/422/429 están implementados, pero ninguna ruta de prueba los produce.
- **Rutas de spike.** `/api/spike/echo` debe retirarse antes de producto; `/api/spike/boom` ya es solo de test.
- **`SpikeNote` y `spike_init`.** F07 decide si resetea la base local y sustituye la migración por la inicial definitiva.
- **`API_VERSION` duplicada.** Unificar con `package.json` en F06/F08.
- **`node --watch`.** Acotar la vigilancia para que no reinicie por `node_modules` en F06.
- **`TIMESTAMP(3)` sin zona.** F07.
- **Fallback de `DATABASE_URL` local.** F08/F42.
- **`prisma generate` en paralelo.** Ejecutar build/test/typecheck secuenciales para evitar `EEXIST`.
- **`HelpContent`.** F11/F12 deciden si se mueve de `apps/web/src/features/spike/` a `packages/ui`.
- **Tema y contraste.** F10/F11 completan tema oscuro, `data-theme`, contraste de bordes y `duration-150`.
- **HEIC.** F25 debe rechazar con 415 o añadir conversión; falta probar un `.heic` real.
- **`/privacy`.** F36 monta la ruta que consumirá `legalPage`.
- **Navegación SPA a `/help`.** Probar en navegador real, con hidratación y consola limpia.
- **Tests de base de datos en CI.** F37/F42 deciden si CI levanta PostgreSQL.
- **E2E y accesibilidad.** F37–F39.
- **Rotar tokens de Content Island.** Se compartieron por chat para crear contenido; el build no usa token.

## Riesgos y limitaciones

1. **TanStack Start sigue siendo joven.** F05 valida SSR, `ssr: false`, prerender y server functions, pero la navegación SPA a `/help` no se ha probado en navegador real. El plan de salida está en [spike-results.md](../../03-architecture/spike-results.md) y en ADR-0001; no se activó.
2. **Catálogo de errores de spike y cobertura parcial.** `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` no son todavía el contrato compartido; además, 401/403/409/415/422/429 están implementados pero ninguna ruta de prueba los produce.
3. **HEIC no está resuelto.** `sharp` 0.35.5 anuncia `.avif`, no `.heic`. Aceptar HEIC sin probarlo produciría fallos en producción; F25 debe rechazar 415 o convertir con una estrategia validada.
4. **Tema oscuro y contraste incompletos.** Solo cambia `--shadow-lg`; `data-theme="light"` fijo, bordes de inputs y `duration-150` quedan para F10/F11.
5. **Snapshot dependiente del `cwd`.** La ruta por defecto se resuelve desde `apps/web` hacia la raíz. `CONTENT_ISLAND_SNAPSHOT_PATH` permite override, pero un cambio de directorio de build puede romperlo. El error que cruza la server function ya no expone la ruta; el log de servidor sí la conserva.
6. **Secretos de Content Island.** El token de escritura se usó solo para crear contenido y no está en el repo; aun así, se compartió por chat y debe rotarse.
7. **`nul` en Windows.** El archivo `nul` de la raíz era residual y se eliminó con permiso del usuario el 2026-10-26. Si vuelve a aparecer por una redirección de shell, hay que borrarlo antes de `git add .`.
8. **`prisma generate` en paralelo.** Puede fallar con `EEXIST`; el pipeline debe ejecutar build, test y typecheck sin solaparse.
9. **`pnpm` fuera de PATH.** El entorno local necesitó `corepack pnpm` y un shim temporal para `lint`/`typecheck`. Alternativas: `corepack enable pnpm` o `corepack pnpm -r run <script>`.
10. **Puerto 3000 ocupado.** El smoke propio se hizo en `127.0.0.1`; el reviewer usó el puerto 3100. No se investigó el proceso ajeno.
11. **Cobertura de tests limitada.** Son smoke tests del spike: 30 passed + 1 skipped sin DB y 31 passed con DB. No hay E2E ni prueba real de hidratación.
12. **Cliente Prisma generado.** `apps/api/src/generated/` está ignorado. Un clon limpio depende de `prisma generate`, ya incluido en `build`, `typecheck` y `test`.
13. **Cambio de proceso x5.** Ya está incluido en el commit `596e516`; no debe mezclarse con commits de producto futuros.
14. **Cierre documental.** F05 ya está en `main` con CI verde; este cierre documental será commiteado por el orquestador después.

## Documentación actualizada

- [x] `docs/03-architecture/spike-results.md`
- [x] `docs/03-architecture/render-modes.md`
- [x] `docs/03-architecture/overview.md`
- [x] `docs/03-architecture/monorepo.md`
- [x] `docs/03-architecture/uploads.md` (nota HEIC de F05)
- [x] `docs/02-design/tokens.md` (variables `--memora-*` y `@theme inline`)
- [x] `docs/00-index.md` (estado F01–F05, F05 en `done`)
- [x] `docs/04-features/F05-spike-tecnico/tasks.md`
- [x] `docs/04-features/F05-spike-tecnico/handoff.md`
- [x] `docs/04-features/F05-spike-tecnico/spec.md` (`status: done`)
- [x] `docs/04-features/README.md` (F05 → `done`)
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `README.md`
- [x] `apps/web/README.md` — actualizado por ui-dev
- [x] `packages/ui/README.md` — actualizado por ui-dev

## Siguiente paso propuesto

1. El orquestador commiteará y pusheará este cierre documental; no hay push pendiente de F05.
2. F06 (contratos compartidos y permisos) es el siguiente paso, pero no se abre sin permiso del usuario.
3. Mantener las deudas documentadas en sus features: F06/F07/F10/F11/F25/F36/F37/F42.
