# Handoff — S6 atajo local de demo y dossier técnico

- **Estado:** completada; pendiente de aceptación
- **Rama:** `feat/S6-defense` (worktree `s6-defense`), desde `main` en `de706c4`
- **Fecha:** 2026-11-08
- **Implementado por:** orquestador (sesión S6)
- **Revisado por:** pendiente (nivel **C**: gates automáticos + aceptación del usuario)
- **Nivel de auditoría:** C (documentación y tooling de demo; sin código de producto)
- **Cierre operativo:** commits `ce1af7b` y `cc4f384` y un commit de seguimiento que retira el
  `.bat` del repo; [PR #65](https://github.com/Luceir0/lab-final--memora/pull/65) **mergeada**
  en `main` (`10f1dc1`) con CI en verde. El script vive en el escritorio y no se versiona. Sin
  cambios en `apps/**` ni `packages/**`.

## Resultado

Se prepara un arranque reproducible de la demo en Windows, `demo.bat`, **en el escritorio y
fuera del repositorio**: localiza la raíz del proyecto (`MEMORA_REPO` o `MEMORA_ROOT`),
comprueba Docker, espera los healthchecks reales, prepara dependencias, variables, bucket,
Prisma, migraciones, seed e imágenes, compila los paquetes y abre API y web en dos ventanas. Se
ha probado lanzándolo desde el escritorio, con el seed completo y con `fast`, login real de
los dos usuarios y `/api/me`. Se añade el dossier técnico completo con inventario de
dependencias verificado, arquitectura, los 14 ADRs con alternativa y deuda, 30 preguntas
lógicas, 15 preguntas trampa y límites.

## Cambios

- `demo.bat` (**local, en el escritorio; no versionado**): arranque de la demo con `chcp
  65001`, rutas entrecomilladas, `call pnpm`, mensajes en español, sin dependencias nuevas y
  sin imprimir secretos. Localiza el repo con `MEMORA_REPO`/`MEMORA_ROOT`; incluye `fast`
  (salta migraciones/seed/imágenes), `single` (un solo `pnpm dev`), comprobación de puertos
  ocupados y espera de `/api/health` y `/login` con reintentos.
- `.gitattributes`: `*.bat text eol=crlf` para que `cmd.exe` reciba CRLF.
- `docs/08-delivery/technical-dossier.md` (nuevo): §1 dependencias por capa con qué/cómo/por
  qué y lo que no hay; §2 arquitectura, flujo, modelo, render, sesión/CSRF, subidas, ZIP,
  mantenimiento y despliegue; §3 ADR-0001…0014 y recortes; §4 30 preguntas con evidencia;
  §5 15 preguntas trampa; §6 límites y deudas.
- `docs/08-delivery/checklist.md`: dossier añadido a Documentación y demo local actualizada.
- `docs/08-delivery/deployment.md`: sección «Atajo local para Windows (no versionado)».
- `docs/08-delivery/demo.md` y `defense.md`: referencias al atajo y al dossier.
- `README.md`: dossier y despliegue en el índice, sin `demo.bat` en el árbol, y corrección de
  la fila de testing (sin Playwright: F37/F38 fuera).
- `docs/04-features/README.md`: nota de S6 en el tablero.
- `docs/04-features/F43-delivery-package/handoff.md`: enlace al cierre de S6, sin reabrir F43.
- `docs/06-process/remaining-plan.md`: S6 definida, decisiones y fila de sesión ejecutada.
- `docs/06-process/ai-log.md`: entrada de S6 y corrección posterior.
- `docs/07-curriculum/coverage-map.md`: sección de documentación y demo (S6).

## Verificación

- `demo.bat` **lanzado desde el escritorio** (completo) → encontró el repo con `MEMORA_REPO`;
  Docker y tres servicios `healthy`; `prisma generate`; migraciones sin pendientes; seed
  `{users:2,circles:2,memberships:4,albums:2,photos:6,tags:2,invitations:1,activities:4}`;
  imágenes `0 generadas, 6 ya tenían objeto`; 3 paquetes compilados; **Demo lista**. No se
  creó `node_modules` en el escritorio.
- `demo.bat fast` **desde el escritorio** → mismo arranque, sin migraciones/seed/imágenes;
  **Demo lista**.
- `GET http://127.0.0.1:3001/api/health` → **200**; `GET http://localhost:3000/login` →
  **200**; Mailpit `http://localhost:8025` → **200**.
- Login real `POST /api/auth/login` con `Origin` → **200** para `lucia@memora.test` y
  `mateo@memora.test`; `GET /api/me` con la cookie → **200** y el usuario correcto, ambos
  desde el arranque del script del escritorio.
- Parada verificada: procesos detenidos y `netstat` sin `:3000` ni `:3001` en `LISTENING`.
- `pnpm build` → **5/5** tareas y 5 rutas prerenderizadas.
- `pnpm typecheck` → **9/9**; `pnpm lint` → **6/6**; `pnpm format:check` → OK.
- `pnpm docs:check` → **203 archivos y 897 enlaces, 0 rotos**; `pnpm agents:check` →
  44 specs y 44 filas.
- API con `memora_test` → **27 archivos, 429 passed + 2 skipped**.
- `shared` **154**, `ui` **283** y `api-client` **39** tests.
- Web: **110 archivos y 910 tests** con `NODE_ENV=test` y
  `--maxWorkers=2 --retry=1`.
- Contraste de dependencias del dossier contra los seis `package.json`: todas las citadas
  existen en su manifiesto; `pino` **no** es dependencia directa de la API (viene con
  Fastify) y así se declara.
- Incidencia de invocación registrada: una primera pasada de la suite web exportó
  `NODE_ENV=development` desde `.env.example`; Vitest no lo sobrescribió y 109 tests
  fallaron por tiempos de espera (~2 s). Con `NODE_ENV=test` la suite pasa completa. No es
  un fallo de código ni un cambio de configuración.

## Criterios de aceptación

No hay una spec Fxx para S6; se usan los objetivos del encargo.

- **S6-01 — el atajo local comprueba Docker y espera healthchecks reales:** pasa.
- **S6-02 — dependencias, migraciones, seed e imágenes idempotentes:** pasa (seed e imágenes
  repetidos sobre la base existente).
- **S6-03 — variables sin filtrar secretos:** pasa; `.env.example` como base, `.env` encima,
  `SESSION_SECRET` generado en memoria y ningún valor impreso.
- **S6-04 — dos ventanas, 3000/3001 y navegador/Mailpit:** pasa; `single` implementado como
  alternativa.
- **S6-05 — `fast`, `chcp 65001`, rutas con espacios, `call pnpm`, resumen y `.gitattributes`:**
  pasa; sin dependencias nuevas.
- **S6-06 — probado de verdad, desde el escritorio, y documentado cómo parar:** pasa; login
  de los dos usuarios y `/api/me`.
- **S6-07 — dossier con las seis secciones mínimas:** pasa.
- **S6-08 — 25–30 preguntas lógicas con evidencia:** pasa (30).
- **S6-09 — 15 preguntas trampa con respuesta y error a evitar:** pasa (15).
- **S6-10 — límites y deudas enlazados a `defense.md`:** pasa.
- **S6-11 — dependencias del dossier verificadas y `docs:check` sin roturas:** pasa.

## Pendiente

- **Aceptación del usuario** del delta de S6 y del dossier.
- **Ensayo en navegador** con dos perfiles, móvil/escritorio y claro/oscuro (F43, AC-02/AC-07).
- **Grabación del vídeo** (F43, AC-03) y **PDF de diapositivas** si se quiere.
- **Flake de prerender en CI:** no se toca en S6; si aparece, relanzar el job.
- **Revisión independiente:** no exigida por el nivel C; si el usuario la quiere, revisar el
  script local y los enlaces del dossier.

## Riesgos y limitaciones

- El `.bat` no se puede cubrir con Vitest: la evidencia es la ejecución real. Solo se ha
  probado en este equipo Windows (`win32`) lanzándolo con `cmd` desde Git Bash; no en
  PowerShell puro, en otra versión de Windows ni en macOS/Linux.
- El script es solo Windows y **vive fuera del repo**: no hay historial de versiones ni
  revisión por CI. Si se mueve el repositorio, hay que editar `MEMORA_REPO` o definir
  `MEMORA_ROOT`.
- El parser de entorno asume el formato `CLAVE=valor` de `.env.example`; no admite `export`,
  comillas ni multilínea. Los valores actuales (incluido `EMAIL_FROM` con espacios y `<>`) sí
  funcionan.
- Se detuvieron dos servidores de desarrollo obsoletos de sesiones anteriores que ocupaban
  3000/3001 (PID 5280 y 26584). Sin eso, la comprobación de arranque no era fiable; ahora el
  script detecta puertos ocupados y se detiene con un mensaje.
- Hallazgos reales corregidos durante la prueba: faltaba `prisma generate` en un clon limpio;
  `timeout` resolvía al binario de Git Bash; Vite escucha en `localhost` (IPv6) y no en
  `127.0.0.1`; una API vieja podía dar un falso «Demo lista».
- El dossier depende de que las versiones no cambien; si se actualiza una dependencia, hay
  que actualizar §1 y el handoff. No se ha generado PDF ni capturas nuevas.
- El CI puede fallar por el prerender intermitente ya conocido (`fetch failed`/`ETIMEDOUT`);
  no se ha modificado `vite.config.ts`.

## Documentación actualizada

- [x] `.gitattributes` y script local `demo.bat` (en el escritorio, no versionado)
- [x] [technical-dossier.md](../08-delivery/technical-dossier.md)
- [x] [checklist.md](../08-delivery/checklist.md), [deployment.md](../08-delivery/deployment.md),
      [demo.md](../08-delivery/demo.md), [defense.md](../08-delivery/defense.md)
- [x] [README.md](../../README.md)
- [x] [F43/handoff.md](../04-features/F43-delivery-package/handoff.md) y
      [tablero](../04-features/README.md)
- [x] [remaining-plan.md](remaining-plan.md), [ai-log.md](ai-log.md) y
      [coverage-map.md](../07-curriculum/coverage-map.md)

## Corrección posterior (2026-11-08)

A petición del usuario, el `.bat` deja de vivir en el repositorio y pasa al escritorio, para
poder lanzarlo sin depender de la ruta del proyecto:

- El script resuelve la raíz con `MEMORA_REPO` (ruta del repo) o `MEMORA_ROOT` (variable de
  entorno) y, si no, muestra un error claro. Si se lanza desde dentro del repo, usa `%~dp0`.
- Se probó **desde el escritorio**: encontró el repo, arrancó la demo, `/api/health` y
  `/login` respondieron **200**, y el login de `lucia@memora.test` y `mateo@memora.test` y
  `/api/me` devolvieron **200**. No se creó `node_modules` en el escritorio.
- `git rm demo.bat` en un commit de seguimiento; el archivo no forma parte del repositorio.
  El resto de la entrega (dossier, docs, `.gitattributes`) no cambia.
- La documentación deja de enlazar el archivo y describe el atajo local y los pasos manuales.
  `docs:check` sigue sin enlaces rotos.
- **PR #65 mergeada en `main` (`10f1dc1`)** con CI en verde; rama y worktree de la sesión
  retirados.

## Siguiente paso propuesto

Que el usuario revise el script del escritorio y el dossier, y decida si autoriza el merge de
la PR #65 en `main`. Después queda el ensayo y la aceptación de F43/F40. **No se inicia S7 ni
otra sesión desde aquí.**
