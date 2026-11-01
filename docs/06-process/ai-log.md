# Bitácora de IA

Registro de usos relevantes de IA. No es un chat completo: es evidencia para el temario y para la defensa.

## Formato

```md
## YYYY-MM-DD — Fxx / tarea

- **Prompt representativo:** ...
- **Propuesta de la IA:** ...
- **Qué se corrigió:** ...
- **Decisión final:** ...
- **Tema del temario:** ...
- **Evidencia:** enlace a archivo/test/ADR
```

## Entradas

### 2026-10-25 — Definición del proyecto

- **Prompt representativo:** auditoría del README, detección de contradicciones y propuesta de estructura agéntica.
- **Propuesta de la IA:** segunda iteración canónica, 43 features, agentes especializados, ADRs y reglas de trabajo.
- **Qué se corrigió:** el README original tenía enlaces rotos, dos iteraciones sin fuente de verdad y decisiones pendientes; se separó en documentos pequeños y se cerró el alcance.
- **Decisión final:** alcance completo del MVP + Subidas + Actividad + Content Island para Ayuda/FAQ/Privacidad; fuera de MVP documentado.
- **Tema del temario:** organización, documentación, IA agente.
- **Evidencia:** `README.md`, `docs/00-index.md`, `docs/04-features/README.md`.

### 2026-10-25 — Estructura agéntica

- **Prompt representativo:** diseñar agentes, comandos y skills para que cada feature sea ejecutable por un subagente.
- **Propuesta de la IA:** orquestador + agentes de API/UI/tests/revisión/a11y/diseño/docs/release; specs autocontenidas.
- **Qué se corrigió:** se evitó cargar el README completo y se añadieron stop conditions y handoff obligatorio.
- **Decisión final:** OpenCode V2 + `AGENTS.md` portable + `CLAUDE.md`.
- **Tema del temario:** IA agente, organización, revisión.
- **Evidencia:** `AGENTS.md`, `.opencode/`, `docs/06-process/`.

### 2026-10-25 — F01–F03 Scaffold

- **Prompt representativo:** aplicar la estructura documental y agéntica acordada sin empezar el desarrollo de la app.
- **Propuesta de la IA:** normalizar assets, archivar la v1, escribir 11 ADRs, 43 specs, 10 agentes, 10 comandos y 6 skills.
- **Qué se corrigió:** los nombres de las capturas se normalizaron a ASCII; se detectaron y corrigieron enlaces rotos y rutas duplicadas `-png.png`; se ordenaron las reglas de permisos para que las excepciones funcionen.
- **Decisión final:** F01–F03 quedan en `review`; no se crea código de aplicación hasta F04.
- **Tema del temario:** organización, documentación, IA agente, revisión.
- **Evidencia:** `README.md`, `AGENTS.md`, `.opencode/`, `docs/04-features/`.

### 2026-10-25 — Correcciones de auditoría (R1–R4)

- **Prompt representativo:** aplicar las correcciones de la auditoría sin empezar el desarrollo.
- **Propuesta de la IA:** commit de protección, ADR-0012/0013, contrato único de errores, reglas de borrado, F34 sin email/avatar, diseño inferido y presupuestos de rendimiento.
- **Qué se corrigió:** `membersCanInvite`, códigos duplicados, borrado de álbum, health endpoint, `:circleId`, F22→F20, F32 ADR, F35 diseño, terminología y documentación de calidad.
- **Decisión final:** se mantiene el alcance; se documentan las vistas inferidas y los presupuestos.
- **Tema del temario:** organización, documentación, IA agente, revisión.
- **Evidencia:** `docs/05-quality/audits/2026-10-25-audit.md`, ADR-0012, ADR-0013, `docs/03-architecture/api-contract.md`.

### 2026-10-25 — F04 Monorepo, tooling, Docker y CI

- **Prompt representativo:** montar la base reproducible del monorepo (pnpm + Turborepo, TypeScript estricto, ESLint/Prettier, Docker Compose local y CI) sin implementar todavía lógica de producto.
- **Propuesta de la IA:** pnpm 10.34.8 con corepack y 7 proyectos de workspace; apps `web` (TanStack Start sobre Vite) y `api` (Fastify); paquetes `shared`, `api-client`, `ui` y `config`; pipeline Turbo; Postgres, MinIO y Mailpit con healthchecks; validadores documentales con `--root` para pruebas negativas; CI que ejecuta install, docs, agents, lint, typecheck, test y build.
- **Qué se corrigió:** se ajustaron los permisos de los agentes web/ui (incluida la lectura de `.env`), se fijó MinIO por tag y digest ante la retirada de las imágenes oficiales, se añadió `lint:root` para `scripts/` y `eslint.config.mjs`, se limitó Prettier a código (la documentación no se formatea), y CI pasó a ejecutar `docs:check` y `agents:check`.
- **Decisión final:** F04 queda en `done`. Aceptación del usuario el 2026-10-25, revisión independiente «apto con correcciones» sin bloqueantes, seis correcciones aplicadas, merge en `main` (`ff6c6d7`) y CI en verde ([run 40220950230](https://github.com/Luceir0/lab-final--memora/actions/runs/40220950230)).
- **Tema del temario:** entorno y tooling, TypeScript, monorepo, Docker, CI, validación documental, IA agente.
- **Evidencia:** `package.json`, `turbo.json`, `docker-compose.yml`, `.github/workflows/ci.yml`, `scripts/check-docs.mjs`, `scripts/validate-agents.mjs`, `docs/04-features/F04-monorepo-tooling/handoff.md`.

### 2026-10-26 — Mantenimiento de infraestructura: MinIO → Silo

- **Prompt representativo:** comprobar si MinIO sigue teniendo soporte y valorar el fork `pgsty/minio` para el almacenamiento local.
- **Propuesta de la IA:** verificar el estado upstream, comparar el espejo actual con el fork mantenido y proponer el cambio de imagen con verificación real.
- **Qué se corrigió:** se confirmó que `minio/minio` está archivado y que `alpine/minio` es un espejo sin parches; se detectó que `pgsty/minio` se renombró a `pgsty/silo`; se sustituyó la imagen por `pgsty/silo:RELEASE.2026-10-18T00-00-00Z` fijada por digest, se cambió el healthcheck a `curl` y se eliminó el `user: '0:0'` innecesario.
- **Decisión final:** Silo solo para local, manteniendo servicio `minio`, volumen `minio-data` y variables `MINIO_ROOT_*`; producción sigue en R2/S3. Registrado en ADR-0014.
- **Tema del temario:** entorno y tooling, Docker, seguridad de dependencias, documentación.
- **Evidencia:** `docker-compose.yml`, `docs/08-delivery/deployment.md`, `docs/03-architecture/adr/ADR-0014-local-storage.md`, `docs/04-features/F04-monorepo-tooling/handoff.md`.

### 2026-10-26 — F05 Spike técnico integrado

- **Prompt representativo:** validar juntas las piezas de riesgo del stack (TanStack Start, Tailwind 4, Fastify 5, Zod 4, Prisma 7, sharp y el snapshot de Content Island) antes de construir producto, con evidencia real de cada criterio de aceptación y sin cerrar la feature sin revisión.
- **Propuesta de la IA:** tres rutas de prueba (`/login` SSR, `/circles` `ssr: false`, `/help` prerender), proxy `/api`, endpoints de salud y eco con errores uniformes, migración mínima de Prisma, `processImage` con thumb y display WebP, lectura del snapshot en build, informe `spike-results.md` y handoff con resultados reales.
- **Qué se corrigió:** Tailwind 4 se resolvió CSS-first con tokens en `packages/ui` y `@source`, sin preset JS ni `tailwind.config`; Prisma 7 exigió `prisma7.config.ts`, generador `prisma-client` y `@prisma/adapter-pg`; `/help` pasó a `createServerFn` para que el `loader` funcione en navegación cliente sin filtrar `node:fs`; el smoke web se movió a `127.0.0.1` porque el puerto 3000 estaba ocupado por un proceso ajeno; se usó `corepack pnpm` porque `pnpm` no está en PATH; la sonda de `sharp` desmintió el soporte de HEIC (solo anuncia `.avif`); se detectaron la duplicación de `API_VERSION` y los reinicios espurios de `node --watch`.
- **Decisión final:** en ese momento F05 quedó en `review`, no en `done`: implementación y verificación reales, pero la revisión independiente y la aceptación aún no se habían hecho. `SpikeNote` y la migración `spike_init` son temporales y F07 puede resetear la base local. F25 debe rechazar HEIC con 415 o añadir conversión validada. El build no usa token de Content Island. No se hizo commit ni push. *(Actualización: la revisión inicial se completó el mismo día; ver la entrada siguiente.)*
- **Tema del temario:** bundlers y render modes, frameworks, API REST, validación con Zod, Prisma y PostgreSQL, procesamiento de imágenes, CMS y SSG, testing, seguridad de secretos, documentación y trabajo agéntico.
- **Evidencia:** `docs/03-architecture/spike-results.md`, `docs/04-features/F05-spike-tecnico/handoff.md`, `apps/web/vite.config.ts`, `apps/api/src/build-server.ts`, `apps/api/src/services/images.ts`, `apps/web/src/features/spike/content.server.ts`, `apps/api/prisma/migrations/20261026153600_spike_init/migration.sql`, `content-island-snapshot.json`.

### 2026-10-26 — F05 revisión independiente y correcciones

- **Prompt representativo:** revisar F05 de forma independiente, clasificar hallazgos por severidad y aplicar las correcciones sin cerrar la feature ni tocar producto.
- **Propuesta de la IA:** veredicto «apto con correcciones», sin bloqueantes; priorizar el tratamiento de 4xx/413, la invalidación de caché de Turbo y pruebas que cubran los caminos de error y metadatos.
- **Qué se corrigió:** `build-server.ts` mapea 4xx reales y ya no convierte JSON malformado o body >1 MB en 500; los 4xx se registran como `warn` sin stack y los 5xx como `error`. `turbo.json` declara `globalDependencies` del snapshot y `globalEnv` con `DATABASE_URL` y `CONTENT_ISLAND_SNAPSHOT_PATH`; el test forzado pasa 15/15. Se añadieron pruebas de JSON malformado → 400, body >1 MB → 413, ruta que lanza → 500, ICC real eliminado y límite 50 MP con cabecera SOF parcheada. Se corrigieron además `tasks.md`, las aserciones de contenido, los tests de tokens, el mapeo `--memora-*` sin autorreferencias, la validación `view: published` y los `TODO` de las rutas de spike.
- **Decisión final:** en ese momento F05 siguió en `review`; la revisión inicial estaba hecha y faltaba la re-revisión y la aceptación. `nul` estaba pendiente de borrar con permiso y se eliminó después. `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` se alinearán con el contrato en F06; `/api/spike/echo` se retiraría antes de producto y `/api/spike/boom` quedaría como ruta solo de test. No se hizo commit ni push. *(Actualización: la re-revisión se completó el mismo día; ver la entrada siguiente.)*
- **Tema del temario:** API REST y códigos HTTP, validación, testing de errores, procesamiento de imágenes, caché y entorno de Turborepo, CSS/tokens, revisión de código.
- **Evidencia:** `apps/api/src/build-server.ts`, `apps/api/src/spike/routes.test.ts`, `apps/api/src/services/images.test.ts`, `turbo.json`, `apps/web/src/styles/tokens.test.ts`, `apps/web/src/features/spike/content.server.ts`, `docs/04-features/F05-spike-tecnico/handoff.md`.

### 2026-10-26 — F05 re-revisión y correcciones menores

- **Prompt representativo:** re-revisar F05 tras las correcciones, comprobar que no quedan bloqueantes ni hallazgos mayores y cerrar la documentación con los conteos reales.
- **Propuesta de la IA:** veredicto «apto con correcciones menores»; revisar aislamiento de rutas de test, no filtrar rutas absolutas en errores que cruzan server functions y corregir la semántica de las tareas.
- **Qué se corrigió:** `/api/spike/boom` pasó a declararse solo en `routes.test.ts`, fuera del registro de producción; `content.server.ts` lanza un mensaje genérico sin ruta y deja la ruta y el error original en el log del servidor; `tasks.md` separa revisión inicial, re-revisión cerrada y verificación final; `tokens.md` explica el mapeo `--memora-*` → `@theme inline`; se aclaró que el smoke propio usó `127.0.0.1` y el reviewer el puerto 3100. Conteos actualizados: web 15 tests, total 30 passed + 1 skipped sin DB y 31 passed con DB.
- **Decisión final:** en ese momento F05 siguió en `review`: re-revisión «apto con correcciones menores», sin bloqueantes ni mayores nuevos; verificación final del orquestador/reviewer y aceptación pendientes. `nul` fue eliminado con permiso del usuario el 2026-10-26 y ya no bloquea `git add .`; tokens de Content Island pendientes de rotar. No se hizo commit ni push. *(Actualización: el usuario aceptó F05 el mismo día; ver la entrada siguiente.)*
- **Tema del temario:** seguridad de mensajes de error, aislamiento de tests, códigos HTTP, documentación de tokens, verificación y control de alcance.
- **Evidencia:** `apps/api/src/spike/routes.test.ts`, `apps/web/src/features/spike/content.server.ts`, `apps/web/src/features/spike/content.test.ts`, `docs/02-design/tokens.md`, `docs/04-features/F05-spike-tecnico/tasks.md`, `docs/04-features/F05-spike-tecnico/handoff.md`.

### 2026-10-26 — F05 aceptación del usuario

- **Prompt representativo:** el usuario acepta F05 tras la re-revisión y pide cerrar la documentación en `accepted`, sin marcar `done` hasta el merge/CI.
- **Propuesta de la IA:** actualizar tablero, spec, handoff, resultados, cobertura y bitácora; mantener `nul` como eliminado; dejar el commit como paso inmediato y `done` a la espera de merge/CI.
- **Qué se corrigió:** F05 pasa de `review` a `accepted`; el handoff registra la aceptación del 2026-10-26 y la verificación final completada; los servidores de prueba se cerraron; `tasks.md` marca revisión, verificación, aceptación y handoff, y deja commit y `done` pendientes; `nul` figura como eliminado; no se inventa ningún commit.
- **Decisión final:** F05 `accepted`; `done` se decidirá después del merge y CI, como en F04. El commit local está pendiente de ejecución inmediata y no se ha hecho `push`. *(Actualización: merge y CI completados; ver la entrada siguiente.)*
- **Tema del temario:** cierre de features, trazabilidad documental, control de estado, verificación y trabajo agéntico.
- **Evidencia:** `docs/04-features/F05-spike-tecnico/spec.md`, `docs/04-features/README.md`, `docs/04-features/F05-spike-tecnico/handoff.md`, `docs/00-index.md`, `README.md`.

### 2026-10-26 — Cierre de F05: merge y CI

- **Prompt representativo:** F05 ya está mergeada en `main` y el CI está en verde; cerrar la feature como `done` sin abrir F06.
- **Propuesta de la IA:** actualizar tablero, spec, handoff, tareas, resultados, cobertura y bitácora con el PR, el merge commit y el run de CI; mantener F06 en `draft`.
- **Qué se corrigió:** F05 pasa de `accepted` a `done`; se registran PR #1, merge commit `8dfae5f`, commits `6730ddc` y `596e516`, y CI [run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132) `completed/success`; se cierran las casillas de commit, merge, CI y `done`; el cierre documental queda pendiente de commit por el orquestador.
- **Decisión final:** F05 `done`; F06 sigue en `draft` y no se abre sin permiso del usuario. No hay push pendiente de F05; este cierre documental se commiteará y pusheará después.
- **Tema del temario:** cierre de features, trazabilidad de PR/merge/CI, documentación viva y control de alcance.
- **Evidencia:** `docs/04-features/F05-spike-tecnico/handoff.md`, `docs/04-features/F05-spike-tecnico/tasks.md`, `docs/04-features/README.md`, `README.md`, `docs/03-architecture/spike-results.md`, `docs/07-curriculum/coverage-map.md`.

### 2026-10-26 — Proceso: presupuesto de pasos x5

- **Prompt representativo:** el presupuesto de pasos se agotaba antes de cerrar tareas con documentación y verificación; valorar un cambio de proceso.
- **Propuesta de la IA:** multiplicar por 5 el presupuesto de los 10 agentes y sustituir la reserva fija de 5 pasos por un checkpoint al 50 % y una reserva del 10 % (mínimo 8 pasos).
- **Qué se corrigió:** `.opencode/agents/**` pasa de 20–50 a 100–250 pasos según el rol; `docs/06-process/subagent-protocol.md` documenta el checkpoint, la reserva y que un presupuesto alto es un techo, no una cuota.
- **Decisión final:** cambio de proceso autorizado por el usuario, **fuera del alcance funcional de F05**. Quedó incluido en el commit separado `596e516` (`chore: raise agent step budgets and document checkpoints`), sin mezclarse con el commit funcional de F05.
- **Tema del temario:** IA agente, protocolo de subagentes, planificación y control de alcance.
- **Evidencia:** `.opencode/agents/*.md`, `docs/06-process/subagent-protocol.md`, `docs/04-features/F05-spike-tecnico/handoff.md`.

### 2026-10-31 — F06 Contratos compartidos y permisos

- **Prompt representativo:** convertir el contrato de API en una sola fuente de verdad ejecutable (esquemas Zod, DTOs, errores, paginación y permisos puros) con tests, sin implementar endpoints ni UI, y hacerlo revisar de forma independiente antes de cerrar.
- **Propuesta de la IA:** esquemas Zod 4 por dominio en `packages/shared/src/schemas/**`; DTOs con `z.infer`; `ErrorResponse`/`ApiResult` con catálogo único de códigos; paginación genérica por cursor; `can()` pura con flags de círculo; mensajes de validación en español; tests de contratos, límites, privacidad de DTOs y matriz de permisos. `zod@4.6.7` se añade como dependencia con autorización del usuario.
- **Qué se corrigió:** la primera revisión independiente fue **no apto**: 2 bloqueantes en `can()`/`isCircleOwner()`, 4 mayores y 7 menores. Se corrigieron y la segunda revisión fue **apto con correcciones menores**, sin bloqueantes ni mayores; los menores se cerraron y se re-verificaron. Decisiones fijadas: `album.empty` es acción propia (owner, sin condición de fotos) y distinta de `album.delete` (owner y solo si está vacío); `photo.update` es autor u owner; `album.update` es owner o creador con `membersCanCreateAlbums`; el owner se decide solo por `id` (`ownerId`); `can()` falla cerrado y rechaza acciones desconocidas y recursos de otro círculo; `acceptInvitation` devuelve `{ circle, state }`; `PhotoDto.clientUploadId`; `DownloadJobDto.progress` 0–100, nullable y derivado (no persistido); `details` es array no vacío o `null` (`[]` rechazado); paginación 24 por defecto, mínimo 1 y máximo 100; contraseña 8–128 sin composición.
- **Decisión final:** F06 queda en **`review`**. Implementación y verificación reales en verde (5 archivos, 138 tests; typecheck/lint/build del paquete; Turbo 8/8 y 6/6 sin caché; validadores documentales OK), pero la aceptación del usuario y el paso a `done` siguen pendientes. Rama `main`, sin commits de F06 y sin push. Deuda trasladada: F08 (códigos del spike `PAYLOAD_TOO_LARGE`/`CLIENT_ERROR`, `details` sin `[]`, 204 sin cuerpo), F25 (validación del binario) y F33 (`errorMessage` sin PII).
- **Tema del temario:** TypeScript estricto, Zod como fuente única, DTOs inferidos, API REST, errores y códigos HTTP, paginación, autorización y permisos puros, testing unitario, revisión independiente y documentación viva.
- **Evidencia:** `packages/shared/src/schemas/**`, `packages/shared/src/{errors,pagination,permissions,validation-messages}.ts`, `packages/shared/src/*.test.ts`, `docs/03-architecture/auth.md`, `docs/03-architecture/api-contract.md`, `docs/04-features/F06-contratos-compartidos/handoff.md`.

### 2026-10-31 — F06 aceptación del usuario

- **Prompt representativo:** el usuario acepta F06 tras la re-revisión y pide registrar la aceptación sin cerrar la feature ni inventar commit, PR o CI.
- **Propuesta de la IA:** pasar F06 de `review` a `accepted`, dejar `done` a la espera de commit, merge y CI, y actualizar solo la documentación.
- **Qué se actualizó:** `spec.md` (`status: accepted` y encabezado), fila y «Situación actual» del tablero, handoff (estado, aceptación del 2026-10-31, apartado de cierre y siguiente paso), `tasks.md` (aceptación marcada; commit, push y `done` sin marcar), `docs/00-index.md`, `README.md` y esta entrada.
- **Decisión final:** F06 queda en **`accepted`**. No se marca `done`: faltan el commit en `feat/F06-contratos-compartidos`, la PR con merge y CI en verde, y el cierre posterior. No existen todavía hash, número de PR ni URL de CI de F06; no se hizo commit ni push.
- **Tema del temario:** cierre de features, trazabilidad documental, control de estado y trabajo agéntico.
- **Evidencia:** `docs/04-features/F06-contratos-compartidos/spec.md`, `docs/04-features/F06-contratos-compartidos/handoff.md`, `docs/04-features/F06-contratos-compartidos/tasks.md`, `docs/04-features/README.md`, `docs/00-index.md`, `README.md`.

### 2026-10-31 — Cierre de F06: PR, merge y CI

- **Prompt representativo:** F06 ya está mergeada en `main` y el CI está en verde; cerrar la feature como `done` y corregir la deuda documental detectada, sin abrir F07.
- **Propuesta de la IA:** registrar los datos reales del cierre (PR #2, commits `6435f9f`/`6acc7ba`, merge `b556168`, CI `41246708428`), pasar F06 a `done` y anotar la deuda de `spike-results.md` y `test-matrix.md` sin reescribir el historial.
- **Qué se actualizó:** `spec.md` (`status: done`), handoff (estado, PR, commits, merge, CI y cierre completo), `tasks.md` (commit, push, PR/merge, CI y `done`), tablero, `docs/00-index.md`, `README.md`, `coverage-map.md` (F06 → `done`), nota fechada en `spike-results.md` sobre `details` y corrección de `assertNever` → `denyUnreachable` en `test-matrix.md`.
- **Decisión final:** F06 queda **`done`** (2026-10-31). PR #2 mergeada en `main` (`b556168`), commits `6435f9f` y `6acc7ba`, CI de `main` run `41246708428` `completed/success` y CI de la PR `completed/success`. La rama remota `feat/F06-contratos-compartidos` sigue existiendo. F07 sigue en `draft` y no se abre sin permiso del usuario. Este cierre documental no se ha commiteado ni pusheado; lo hará el orquestador.
- **Tema del temario:** cierre de features, trazabilidad PR/merge/CI, documentación viva, corrección de deuda documental y control de alcance.
- **Evidencia:** `docs/04-features/F06-contratos-compartidos/handoff.md`, `docs/04-features/F06-contratos-compartidos/tasks.md`, `docs/04-features/F06-contratos-compartidos/spec.md`, `docs/04-features/README.md`, `docs/00-index.md`, `README.md`, `docs/07-curriculum/coverage-map.md`, `docs/03-architecture/spike-results.md`, `docs/05-quality/test-matrix.md`.

### 2026-11-01 — F07 Modelo de datos, migraciones y seed

- **Prompt representativo:** implementar el modelo Prisma definitivo, una migración inicial limpia, un seed determinista y tests de integración contra PostgreSQL real, sin construir endpoints ni UI, y hacerlo revisar antes de cerrar.
- **Propuesta de la IA:** 10 modelos y 5 enums con `timestamptz(3)`; migración única `20261031224916_init`; seed con ids y fechas fijas; helpers `resetDb`/`withCleanDb` con guardas; factorías tipadas; suite de integración con constraints, cascadas y doble seed; PostgreSQL real en CI.
- **Decisiones del usuario:** base de test separada `memora_test`; PostgreSQL real en CI ahora; reset de la base local autorizado con `prisma migrate reset --force`; eliminar la migración de spike y `SpikeNote`.
- **Qué se corrigió:** la primera revisión fue **no apto** por 2 bloqueantes: el seed no era determinista y `resetDb` podía truncar cualquier base. Se fijaron ids, fechas y snapshots del seed; se añadió la guarda por sufijo `_test`, host local y entorno de test, con `ALLOW_REMOTE_TEST_DB=1` limitado a relajar el host. La segunda revisión fue **apto con correcciones**; las correcciones se cerraron y se re-verificaron.
- **Decisión final:** F07 queda en **`review`** (2026-11-01). Verificación real: 4 archivos y 36 tests con `memora_test`; 23 passed + 13 skipped sin `DATABASE_URL`; la base `memora` se rechaza. CI con PostgreSQL configurado, pendiente de validar en el runner. No hay commit, PR ni run de CI de F07; F07 no se marca `accepted` ni `done`.
- **Tema del temario:** Prisma 7, PostgreSQL, migraciones, modelado y constraints, cascadas, seed determinista, testing de integración, guardas de seguridad, CI y revisión independiente.
- **Evidencia:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261031224916_init/migration.sql`, `apps/api/prisma/seed.ts`, `apps/api/src/test/db.ts`, `apps/api/src/test/factories.ts`, `apps/api/src/db.integration.test.ts`, `.github/workflows/ci.yml`, `docs/04-features/F07-modelo-datos/handoff.md`.

### 2026-11-01 — F07 aceptación del usuario

- **Prompt representativo:** el usuario acepta F07 tras la re-revisión «apto con correcciones» y pide registrar la aceptación sin cerrar la feature ni inventar commit, PR o CI.
- **Propuesta de la IA:** pasar F07 de `review` a `accepted`, dejar `done` a la espera de commit, PR/CI y merge, y actualizar solo la documentación.
- **Qué se actualizó:** `spec.md` (`status: accepted` y encabezado), fila y «Situación actual» del tablero, handoff (estado, aceptación del 2026-11-01, cierre y siguiente paso), `tasks.md` (aceptación marcada; commit, push y `done` sin marcar), `docs/00-index.md`, `README.md`, `coverage-map.md` (F07 → `accepted`) y esta entrada.
- **Decisión final:** F07 queda en **`accepted`**. No se marca `done`: faltan el commit en `feat/f07-modelo-datos`, la PR con CI (incluida la validación real del servicio PostgreSQL en el runner) y el merge. No existen todavía hash, número de PR ni run de CI de F07; no se hizo commit ni push.
- **Tema del temario:** cierre de features, trazabilidad documental, control de estado, CI con PostgreSQL y trabajo agéntico.
- **Evidencia:** `docs/04-features/F07-modelo-datos/spec.md`, `docs/04-features/F07-modelo-datos/handoff.md`, `docs/04-features/F07-modelo-datos/tasks.md`, `docs/04-features/README.md`, `docs/00-index.md`, `README.md`, `docs/07-curriculum/coverage-map.md`.

### 2026-11-01 — Cierre de F07: PR, merge y CI con PostgreSQL

- **Prompt representativo:** F07 ya está mergeada en `main` y el CI está en verde, con PostgreSQL real en el runner; cerrar la feature como `done` y actualizar la documentación sin abrir F08.
- **Propuesta de la IA:** registrar los datos reales del cierre (PR #3, commits `e94ba58`/`15b26e1`/`a936d7a`, merge `bd2769c`, CI `41254603622`), pasar F07 a `done` y sustituir la nota de «CI pendiente» por la validación real sin skips.
- **Qué se actualizó:** `spec.md` (`status: done`), handoff (estado, PR, commits, merge, CI y cierre completo), `tasks.md` (commit, push, PR/merge, CI y `done`), tablero, `docs/00-index.md`, `README.md`, `test-matrix.md` y `coverage-map.md`.
- **Decisión final:** F07 queda **`done`** (2026-11-01). PR #3 mergeada en `main` (`bd2769c`), commits `e94ba58`, `15b26e1` y `a936d7a`; CI de `main` run `41254603622` `completed/success` y CI de la PR (head `a936d7a`) `completed/success`. El run incluyó por primera vez PostgreSQL 17.11 y los tests de integración se ejecutaron contra `memora_test` en el runner, sin skips. F08 sigue en `draft` y no se abre sin permiso del usuario. Este cierre documental no se ha commiteado ni pusheado; lo hará el orquestador. *(Actualización: el usuario autorizó F08 y pasó a `review` el 2026-11-01; ver la entrada de F08.)*
- **Tema del temario:** cierre de features, trazabilidad PR/merge/CI, validación de servicios en CI, documentación viva y control de alcance.
- **Evidencia:** `docs/04-features/F07-modelo-datos/handoff.md`, `docs/04-features/F07-modelo-datos/tasks.md`, `docs/04-features/F07-modelo-datos/spec.md`, `docs/04-features/README.md`, `docs/00-index.md`, `README.md`, `docs/05-quality/test-matrix.md`, `docs/07-curriculum/coverage-map.md`.

### 2026-11-01 — F08 API core

- **Prompt representativo:** construir el esqueleto de la API (Fastify 5, config Zod, plugins, error handler, health, OpenAPI, pino y harness de tests) sin módulos de producto ni UI, y someterlo a revisión independiente antes de cerrar.
- **Propuesta de la IA:** `buildApp()` sin abrir puerto y `server.ts` como única entrada que escucha; config Zod con fallo rápido; siete plugins (cookie, CSRF, helmet, rate limit, multipart, swagger y swagger-ui); error handler canónico con `details` validados; `/api/health`; OpenAPI 3.1 generado desde Zod; Swagger UI dev-only; pino con redacción; harness `inject`; fakes de storage, email y geocoding; guardas de producción.
- **Decisiones del usuario:** autorización de seis plugins oficiales de Fastify y, después, de un séptimo (`@fastify/swagger-ui@6.1.2`); Swagger UI **solo en desarrollo**, con `/api/openapi.json` en producción; cambio de contrato autorizado: `PAYLOAD_TOO_LARGE` (413) pasa a ser código canónico para el cuerpo de petición sobredimensionado y `FILE_TOO_LARGE` queda para el límite de archivo de multipart; eliminación del spike de F05 (`apps/api/src/build-server.ts` y `apps/api/src/spike/**`), con el health real en `apps/api/src/routes/health.ts`.
- **Qué se corrigió:** tres rondas de revisión independiente. Primera: **apto con correcciones** (contrato 413 y `PAYLOAD_TOO_LARGE`, Swagger UI real dev-only, 406 de multipart → 415, multipart sin `boundary` sin 500, `details` validados, mensajes Zod en español, límites multipart explícitos, redacción ampliada, CSP de desarrollo, `dist` limpio, componente `ErrorResponse` y AC-04 con propiedades Zod). Segunda: mayores de **generación Prisma** (`build` y `db:generate` sin `DATABASE_URL`) y **multipart malformado** (400, no 500), además del 406 global y del `unsafe-inline` de scripts. Tercera: **fallback de migraciones** limitado a `generate`, guarda de servicios movida a `buildApp()` y allowlist explícita de errores de parser; `kind` documentado como frontera de código.
- **Decisión final:** F08 queda **`done`** (2026-11-01). El usuario aceptó la feature el mismo día. Tres commits (`c421e3b` `feat(shared): add PAYLOAD_TOO_LARGE canonical error`, `063661d` `feat(api): add Fastify core with config, plugins, errors and test harness`, `050a3ed` `docs: record F08 implementation, reviews and acceptance`), rama `feat/F08-api-core`, PR #4, CI de la PR run `41260851691` `completed/success`, merge `ed1f316` y CI de `main` run `41261491641` `completed/success`. Verificación real: `pnpm --filter @memora/api test` → 77 passed + 13 skipped sin `DATABASE_URL` y 90 passed con `memora_test`; `pnpm --filter @memora/shared test` → 138 passed; `typecheck`, `lint`, `build`, `docs:check` y `agents:check` en verde. El cierre operativo (PR y merge) necesitó la credencial ya guardada por Git Credential Manager para `github.com`, porque `gh` no está instalado en la máquina y no había token en el entorno. Deuda trasladada a F25/F15/F17: límites `fields`/`files` con `request.file()`, `FST_*_LIMIT` → `PAYLOAD_TOO_LARGE`, seam `config.databaseUrl` → Prisma, adaptadores reales y `ActivityType`.
- **Tema del temario:** Fastify 5, Zod 4, plugins de seguridad, errores y códigos HTTP, OpenAPI desde Zod, logging con redacción, configuración validada, testing con `inject`, fakes de servicios y revisión independiente.
- **Evidencia:** `apps/api/src/{app,server,config,errors,logging}.ts`, `apps/api/src/plugins/*`, `apps/api/src/routes/{health,docs}.ts`, `apps/api/src/test/{harness,fakes,routes}.ts`, `apps/api/src/{app,errors,logging,config}.test.ts`, `packages/shared/src/errors.ts`, `docs/03-architecture/api-contract.md`, `docs/04-features/F08-api-core/handoff.md`.

### 2026-11-01 — F09 Web core: apertura y decisiones

- **Prompt representativo:** el usuario pregunta por el estado del proyecto, pide comprobar que todo lo anterior funciona y, si es así, seguir con F09 analizando riesgos y ventajas de cada cambio y preguntando antes de decidir.
- **Verificación previa real:** `corepack pnpm --filter @memora/shared test` → 138 tests; `--filter @memora/api test` → 77 passed + 13 skipped sin `DATABASE_URL`; `--filter @memora/web test` → 15 tests; `pnpm -r typecheck` y `pnpm -r lint` → 6 workspaces sin errores; `docs:check` → 191 archivos y 431 enlaces, 0 rotos; `agents:check` → OK. `turbo lint`/`turbo typecheck` siguen fallando solo por el PATH del runner (`pnpm` no está en PATH), deuda de entorno ya documentada.
- **Propuesta de la IA:** abrir F09 con cuatro decisiones explícitas en lugar de improvisarlas: dependencia `@tanstack/react-query`, ubicación del cliente API, contrato de variables de entorno y suerte de las rutas del spike F05.
- **Decisiones del usuario:** instalar `@tanstack/react-query` con versión exacta; poner la lógica del cliente API en `packages/api-client` y dejar en `apps/web/src/lib/api-client.ts` solo la instancia; usar `VITE_API_BASE_URL` y `API_INTERNAL_URL` con valores por defecto y `.env.example`; conservar `/login`, `/circles` y `/help` como rutas de humo hasta F16/F18/F36.
- **Decisión final:** F09 pasa de `draft` a **`in-progress`** el 2026-11-01. DoR marcada en la spec. Sin commits, sin push y sin cambios en `apps/` o `packages/` todavía.
- **Tema del temario:** TanStack Start, render modes, cliente REST tipado, configuración por entorno, proveedor de datos, análisis de riesgos y control de alcance.
- **Evidencia:** `docs/04-features/F09-web-core/spec.md`, `docs/04-features/F09-web-core/tasks.md`, `docs/04-features/README.md`, `README.md`.

### 2026-11-01 — F09 Web core: implementación, dos revisiones y paso a `review`

- **Prompt representativo:** implementar la base web sobre TanStack Start —router, root layout, provider de datos, cliente API tipado, proxy `/api`, error boundary, 404, variables de entorno y rutas de humo— sin pantallas de producto, y someterla a revisión independiente antes de cerrar.
- **Propuesta de la IA:** sacar `packages/api-client` del stub con `createApiClient({ basePath?, fetch? })`, `request<T>()`, atajos por verbo, validación estructural (solo `parse`, sin `zod`), `ApiError` canónico y `ApiTransportError` con `kind` (`network`, `invalid-json`, `invalid-response`, `unexpected-error-response`); montar `QueryClientProvider` con un `QueryClient` por petición en servidor (contexto del router, sin caché compartida), `staleTime` 30 s y reintentos solo para 5xx/red; error boundary raíz con reintento y foco; 404 con foco; cliente de navegador (`VITE_API_BASE_URL`, default `/api`) y de servidor (`API_INTERNAL_URL` como origen validado, default `http://127.0.0.1:3001`, base final `${origen}/api`); conservar `/login`, `/circles` y `/help` como rutas de humo.
- **Decisiones del usuario (2026-11-01):** instalar `@tanstack/react-query@5.105.1` exacto; poner la lógica genérica del cliente en `packages/api-client` y dejar en `apps/web/src/lib/api-client.ts` solo la configuración; usar `VITE_API_BASE_URL` y `API_INTERNAL_URL` con defaults documentados en `.env.example`; conservar las rutas del spike hasta F16/F18/F36; autorizar `vitest@5.0.5` como devDependency de `packages/api-client`.
- **Qué se corrigió:** dos rondas de revisión independiente. Primera: **no apto** por **B-01** —el cliente de servidor apuntaba al origen sin `/api`, así que `serverApiClient.get('/health')` daba 404— y mayor **M-01** (falta de validación de `API_INTERNAL_URL` al arrancar); menores m-01 (fuga de `Error.message`), m-02 (foco del 404), m-03 (aborto durante la lectura del cuerpo), m-04 (READMEs contra el contrato) y m-05 (cierre documental); sugerencias S-01 (test de integración del router), S-02 (frontera de módulos), S-03 (cookies en SSR) y S-04 (AC-06). Segunda ronda: **apto con correcciones**; B-01, M-01, m-01, m-02, m-03 y S-02 verificados como corregidos, más N-01 (dos comentarios/ejemplos documentales), N-02 (evaluación perezosa de `basePath`) y N-03 (mensaje de validación incompleto). Tras aplicar N-01, N-02 y N-03 quedó **todo aplicado**; no hubo tercera ronda formal y el orquestador re-ejecutó la batería completa en verde.
- **Verificación real:** `corepack pnpm --filter @memora/shared test` → 138 passed (5 archivos); `--filter @memora/api test` → 77 passed + 13 skipped sin `DATABASE_URL` (7 + 1 archivo); `--filter @memora/api-client test` → 39 passed (3 archivos); `--filter @memora/web test` → 52 passed (13 archivos); `--filter @memora/web typecheck` y `lint` → OK; `--filter @memora/web build` → OK con client, SSR y prerender de `/help` (1 página); `pnpm -r typecheck` y `pnpm -r lint` → 6 workspaces OK; `docs:check` → 191 archivos, 431 enlaces, 0 rotos; `agents:check` → OK. Smoke real con API y web: `/api/health` 200, `/health` directo 404, proxy `localhost:3000/api/health` 200, `/login` con `h1` y `<form>`, `/circles` sin «Tus círculos», `/help` prerenderizado, ruta inexistente 404 con enlace a `/`, `dist/client` sin `API_INTERNAL_URL` ni `127.0.0.1`; cliente de servidor contra la API real (base `http://127.0.0.1:3001/api`) → `GET /health` 200; `API_INTERNAL_URL=/api` + `build` → exit 1 con mensaje seguro.
- **Decisión final:** F09 queda en **`review`** (2026-11-01). Implementación y revisión cerradas con todas las correcciones aplicadas; **solo falta la aceptación del usuario (G4)**. AC-01 a AC-05 pasan; **AC-06 es parcial**: sin navegador real ni Playwright, la hidratación solo está verificada de forma estática y su comprobación definitiva pasa a F37/F38. No hay commit, PR, merge ni run de CI de F09, y no se inventan. *(Actualización: el usuario aceptó F09 el 2026-11-01 tras probarla en Firefox real; ver la entrada siguiente.)*
- **Deuda trasladada:** AC-06 con navegador real (F37/F38); consumidor de producto del cliente de servidor y paso de la cabecera `cookie` en server functions autenticadas, porque `credentials: 'include'` no reenvía cookies en `fetch` de Node (F10/F22); multipart y binario en el cliente (F25/F33); enrutado de `/api` en producción por el servidor web o el reverse proxy (F42); `apps/web/scripts/no-tests.mjs` sigue huérfano por falta de permiso para borrarlo.
- **Tema del temario:** TanStack Start, render modes (SSR, `ssr: false`, prerender), cliente REST tipado con validación estructural, TanStack Query y caché por petición en servidor, error boundaries, configuración por entorno, separación cliente/servidor y revisión independiente.
- **Evidencia:** `packages/api-client/src/{index,constants,types,errors,url,client}.ts`, `packages/api-client/README.md`, `apps/web/src/lib/{env,env.server,api-client,api-client.server,query-client,error-message}.ts`, `apps/web/src/components/{route-error,not-found}.tsx`, `apps/web/src/routes/__root.tsx`, `apps/web/src/router.tsx`, `apps/web/vite.config.ts`, `.env.example`, `docs/04-features/F09-web-core/handoff.md`.

### 2026-11-01 — F09 Web core: aceptación del usuario y paso a `accepted`

- **Prompt representativo:** el usuario confirma que ha probado la app en un navegador real (Firefox) sobre `/login`, `/circles`, `/help` y una ruta inexistente, que todo funciona y que no aparecen errores de hidratación; pide registrar la aceptación y cerrar la documentación de F09 sin inventar commit, PR ni CI.
- **Qué se verificó en navegador:** el usuario abrió las tres rutas de humo y una ruta inexistente en Firefox real el 2026-11-01. `/login` (SSR) y `/circles` (`ssr: false`) se hidrataron sin errores, `/help` (prerender) cargó correctamente y la ruta inexistente mostró el 404. **AC-06 pasa** de «parcial» a verificado por el usuario; queda como limitación que no existe prueba automatizada de navegador, que aportarán F37 (infraestructura de tests) y F38 (E2E).
- **Aviso benigno observado y descartado:** en `/help`, Firefox muestra «El diseño se forzó antes de que la página se cargara completamente…». Es un aviso del navegador por cálculo de layout temprano; el único código propio que toca scroll es `scrollRestoration: true` del router. No es un error, no afecta a la hidratación y no se corrige: queda como **observación**, no como deuda.
- **Qué se corrigió:** `apps/web/src/routes/login.tsx` exportaba `LoginPage` además de `Route`, lo que impedía el code-splitting de TanStack Router. El componente se movió a `apps/web/src/features/spike/login-page.tsx`, la ruta dejó solo `Route` y el test importa desde la nueva ubicación. Todos los archivos de `apps/web/src/routes/` exportan ya únicamente `Route`.
- **Verificación real (2026-11-01):** `corepack pnpm --filter @memora/web test` → 13 archivos, **52 passed**; `--filter @memora/web typecheck` → OK; `--filter @memora/web lint` → OK; `--filter @memora/web build` → OK con prerender de `/help`; `--filter @memora/api-client test` → **39 passed**; `--filter @memora/shared test` → **138 passed**; `--filter @memora/api test` → **77 passed + 13 skipped** sin `DATABASE_URL`; `pnpm -r typecheck` y `pnpm -r lint` → 6 workspaces OK; `docs:check` → 191 archivos, 433 enlaces, 0 rotos; `agents:check` → OK.
- **Decisión final:** F09 queda en **`accepted`** (2026-11-01), aceptada por el usuario sin cambios solicitados. **No hay commit, push, PR, merge ni run de CI de F09**, y no se inventan: el paso a `done` queda pendiente de ese cierre operativo. *(Actualización: el cierre operativo se completó el 2026-11-01 con la PR #5, el merge `9fd987e` y CI en verde; ver la entrada siguiente.)*
- **Tema del temario:** render modes (SSR, `ssr: false`, prerender), hidratación en navegador real, code-splitting por archivo de ruta en TanStack Router, aceptación del usuario (G4) y disciplina documental sin evidencias inventadas.
- **Evidencia:** `apps/web/src/routes/login.tsx`, `apps/web/src/features/spike/login-page.tsx`, `apps/web/src/routes/login.test.tsx`, `docs/04-features/F09-web-core/{spec,tasks,handoff}.md`, `docs/04-features/README.md`, `README.md`, `docs/07-curriculum/coverage-map.md`, `docs/05-quality/test-matrix.md`.

### 2026-11-01 — F09 Web core: cierre operativo y paso a `done`

- **Prompt representativo:** con F09 `accepted` y la documentación al día, cerrar el ciclo operativo real (commit, push, PR, CI y merge) y pasar la feature de `accepted` a `done` usando solo los identificadores reales, sin inventar hashes, PR ni runs.
- **Qué ocurrió:** el trabajo se publicó en la rama `feat/F09-web-core` con tres commits —`a81dc9a` `feat(api-client): add typed HTTP client with canonical errors`, `1363e71` `feat(web): add web core with query provider and route states` y `8c4a963` `docs: record F09 implementation, review and acceptance`—, se abrió la **PR #5** y su CI terminó en `completed/success` (run `41306238454`, head `8c4a963`). El merge en `main` es `9fd987e` (`Merge pull request #5 from Luceir0/feat/F09-web-core`) y el CI de `main` sobre ese merge también quedó en verde (run `41306484717`, `completed/success`). La rama remota `feat/F09-web-core` sigue existiendo tras el merge.
- **Qué se corrigió durante la feature:** dos rondas de revisión independiente (primera **no apto** por B-01 y M-01; segunda **apto con correcciones** con N-01, N-02 y N-03 aplicados) y, después, el code-splitting de `/login`: `apps/web/src/routes/login.tsx` exportaba `LoginPage` además de `Route`, lo que impedía el code-splitting de TanStack Router; el componente se movió a `apps/web/src/features/spike/login-page.tsx`, la ruta quedó exportando solo `Route` y el test importa desde la nueva ubicación. Todos los archivos de `apps/web/src/routes/` exportan ya únicamente `Route`.
- **Aviso benigno de Firefox:** en `/help` el navegador muestra «El diseño se forzó antes de que la página se cargara completamente…». Es un aviso por cálculo de layout temprano; el único código propio que toca scroll es `scrollRestoration: true` del router. No es un error, no afecta a la hidratación y no se corrige: queda como observación, no como deuda.
- **Verificación real (local, antes del merge):** web **52 tests** (13 archivos), `api-client` **39** (3 archivos), `shared` **138** (5 archivos) y `api` **77 passed + 13 skipped** sin `DATABASE_URL`; `-r typecheck` y `-r lint` OK en 6 workspaces; `build` con prerender de `/help` (1 página); `docs:check` → 191 archivos, 433 enlaces, 0 rotos; `agents:check` OK. **AC-06** se verificó manualmente por el usuario en Firefox real sobre `/login`, `/circles`, `/help` y una ruta inexistente, sin errores de hidratación; su automatización queda en F37/F38.
- **Decisión final:** F09 queda en **`done`** (2026-11-01). El único pendiente es el AC-06 automatizado, trasladado a F37 (infraestructura de tests) y F38 (E2E), sin reabrir el criterio. F10 — Sistema visual y tema queda en `draft` y no se abre sin permiso explícito.
- **Tema del temario:** ciclo de vida de una feature y gates (G4 aceptación, G5 cierre), CI en GitHub Actions, PR y merge, revisión independiente, disciplina documental sin evidencias inventadas, render modes e hidratación.
- **Evidencia:** `docs/04-features/F09-web-core/{spec,tasks,handoff}.md`, `docs/04-features/README.md`, `README.md`, `docs/07-curriculum/coverage-map.md`, `docs/05-quality/test-matrix.md`, `docs/00-index.md`; PR [#5](https://github.com/Luceir0/lab-final--memora/pull/5), merge `9fd987e`, runs `41306238454` y `41306484717`.

### 2026-11-01 — F10 Sistema visual y tema: decisiones, implementación y dos revisiones

- **Prompt representativo:** implementar el sistema visual de Memora (tokens, Tailwind 4, tema claro/oscuro/sistema, fuente, iconos, foco y reduced motion) sin componentes de producto, y someterlo a revisión independiente antes de pedir la aceptación.
- **Decisiones del usuario (2026-11-01, «opción A» en las siete):** fuente self-hosted vendorizada (sin Google Fonts ni dependencia de fuentes); «Sistema» resuelto por un script mínimo en `<head>` para no tener destello; `lucide-react` en `apps/web` con `ThemeToggle` provisional; tokens `--color-success-text`, `--color-warning-text` y `--color-info-text`; breakpoints 480/768/1024/1280 y `h1` móvil 26/32; Vitest en `packages/ui`; rama, PR con CI en verde y merge solo con autorización.
- **Propuesta de la IA:** `packages/ui` como CSS puro (`tokens.css`, `theme.css`, `fonts.css`) con tests de contrato y contraste; `apps/web/src/lib/theme.ts` con parseo, cookie, resolución SSR/cliente y script de arranque; `ThemeProvider` que parte del `data-theme` ya pintado; `ThemeToggle` con radios nativos y estados redundantes (borde, fondo, peso y sombra, no solo color); guard anti-hex sobre `apps/web/src` y `packages/ui/src` con la única excepción de `THEME_COLORS`.
- **Qué se corrigió:** dos rondas de revisión independiente. Primera: **no apto** por **B-01** (`data-theme` divergía de `resolvedTheme`), **M-01** (frontera de `packages/ui`: el paquete no debe incorporar React ni componentes todavía) y **M-03** (estado seleccionado distinguido solo por color). Segunda: **apto con correcciones**, con **M-02** (contrato `docs/02-design/tokens.md` desalineado) y menores de documentación y guard, aplicados. Sin bloqueantes abiertos.
- **Verificación real:** `corepack pnpm --filter @memora/ui test` → 5 ficheros, **44 tests**; `--filter @memora/web test` → 17 ficheros, **88 tests**; `corepack pnpm lint` → 6/6 tareas; `typecheck` → 9/9; `build` → 5/5, con `/help` prerenderizado, `dist/client/fonts` copiado y CSS de cliente de 18,8 kB; `docs:check` → 191 archivos, 433 enlaces, 0 rotos; `agents:check` → 10 agentes, 10 comandos, 6 skills, 43 specs y 43 filas; `install --frozen-lockfile` → «Lockfile is up to date». SSR con dev en 3000: `data-theme` y `theme-color` correctos para claro y oscuro, `/circles` (`ssr:false`) resuelve por cookie, script en `<head>` antes de `<body>` y un solo `preload` (latin). CSS compilado con `@media (width>=30/48/64/80rem)`, `(width<=29.99rem)` con `--memora-text-h1:1.625rem`, `has-[:checked]:border-primary`, `--color-scheme` 1+1, sin `96rem` y sin `scroll-behavior:smooth`.
- **Decisión final:** F10 queda en **`review`** (2026-11-01). Implementación y revisión cerradas; **faltan la aceptación del usuario (G4) con revisión visual en navegador real** y el cierre operativo (commits, push, PR, CI y merge con autorización). AC-05, AC-06 y AC-07 pasan **con la limitación de que no hay navegador real**. No existen hash, PR ni run de CI de F10, y no se inventan. No se marca `accepted` ni `done`.
- **Deuda trasladada:** `ThemeToggle` a Perfil y al shell en F11/F34; CSP con nonce/hash para el script de arranque en F42; `--color-border-strong` por debajo de 3:1 sobre superficie (1,96:1 en claro, 1,82:1 en oscuro; candidato claro `#8E8CA6`, 3,25:1) para F11; `format:check` falla en **13 archivos de `apps/api`** desde F08, no modificados en esta rama y no ejecutados por CI — deuda preexistente, no fallo de F10; los README de `apps/web` y `packages/ui` (N-09/N-10) quedaron sin aplicar en este cierre documental porque el subagente no tenía permiso de escritura fuera de `docs/`.
- **Tema del temario:** Tailwind 4 CSS-first, tokens y contrato de contraste WCAG 2.2, temas claro/oscuro/sistema con SSR, cookies, scripts previos al pintado, hidratación, fuentes self-hosted, movimiento reducido y Vitest en un paquete de UI.
- **Evidencia:** `docs/02-design/tokens.md`, `packages/ui/src/styles/{tokens,theme,fonts}.css`, `packages/ui/src/styles/*.test.ts`, `packages/ui/vitest.config.ts`, `apps/web/src/lib/theme.ts`, `apps/web/src/components/{theme-provider,theme-toggle}.tsx`, `apps/web/src/routes/__root.tsx`, `apps/web/src/styles/no-hex.test.ts`, `apps/web/public/fonts/`, `docs/04-features/F10-sistema-visual/handoff.md`.
