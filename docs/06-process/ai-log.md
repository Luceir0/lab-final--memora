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
- **Decisión final:** F05 `accepted`; `done` se decidirá después del merge y CI, como en F04. El commit local está pendiente de ejecución inmediata y no se ha hecho `push`.
- **Tema del temario:** cierre de features, trazabilidad documental, control de estado, verificación y trabajo agéntico.
- **Evidencia:** `docs/04-features/F05-spike-tecnico/spec.md`, `docs/04-features/README.md`, `docs/04-features/F05-spike-tecnico/handoff.md`, `docs/00-index.md`, `README.md`.

### 2026-10-26 — Proceso: presupuesto de pasos x5

- **Prompt representativo:** el presupuesto de pasos se agotaba antes de cerrar tareas con documentación y verificación; valorar un cambio de proceso.
- **Propuesta de la IA:** multiplicar por 5 el presupuesto de los 10 agentes y sustituir la reserva fija de 5 pasos por un checkpoint al 50 % y una reserva del 10 % (mínimo 8 pasos).
- **Qué se corrigió:** `.opencode/agents/**` pasa de 20–50 a 100–250 pasos según el rol; `docs/06-process/subagent-protocol.md` documenta el checkpoint, la reserva y que un presupuesto alto es un techo, no una cuota.
- **Decisión final:** cambio de proceso autorizado por el usuario, **fuera del alcance funcional de F05**. Debe ir en un commit separado, propuesto como `chore(agents): raise step budget and document checkpoint protocol`; no se mezcla con el commit de F05.
- **Tema del temario:** IA agente, protocolo de subagentes, planificación y control de alcance.
- **Evidencia:** `.opencode/agents/*.md`, `docs/06-process/subagent-protocol.md`, `docs/04-features/F05-spike-tecnico/handoff.md`.
