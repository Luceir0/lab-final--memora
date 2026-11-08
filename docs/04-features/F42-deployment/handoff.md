# Handoff — F42 Despliegue y observabilidad

- **Estado:** review
- **Rama:** `feat/F42-F41-quality` (worktree `s4-quality`)
- **Fecha:** 2026-11-08
- **Implementado por:** orquestador (sesión S4)
- **Revisado por:** pendiente (nivel A)

## Resultado

La demo local arranca desde cero con Docker Compose, migraciones, seed y seed de imágenes, y
se ha verificado de extremo a extremo contra la base de desarrollo: healthchecks de los tres
servicios, login real, `/api/me`, subida, descarga del original, borrado, negativos
401/403/404 y email de invitación con Mailpit. Se documentó el procedimiento real, incluida la
brecha de variables de entorno y la creación manual del bucket. La API incorpora un
mantenimiento periódico que borra sesiones caducadas, expira jobs con su ZIP y purga filas
antiguas (H-02). No se entrega `docker-compose.prod.yml` (fuera de la recutura).

## Cambios

- `turbo.json`: `globalEnv` amplía las variables de `.env.example` (S3, email, geocoding,
  cookies, Content Island, web). Sin esto, Turbo no las reenviaba a la API y la subida fallaba
  con `422 PROCESSING_FAILED` («StorageService no está configurado»). Es el único cambio de
  configuración; no hay dependencias nuevas.
- `package.json`: nuevo script raíz `db:seed:images`, que faltaba aunque `demo.md` y esta
  sesión lo daban por existente.
- `apps/api/src/maintenance/cleanup.ts` y `cleanup.test.ts` (nuevos) y `apps/api/src/server.ts`:
  mantenimiento en proceso cada 15 min —sesiones caducadas, expiración de jobs con borrado de
  su ZIP y purga de filas `expired` con 24 h de retención—, con 5 tests de integración. Se
  detiene en `onClose`, no arranca en `buildApp()` y solo loguea contadores. Cierra H-02.
- `docs/08-delivery/deployment.md`: arranque real verificado, sección de variables (nada carga
  el `.env` de la raíz; ejemplo para Git Bash y PowerShell), creación del bucket con `mc`,
  migraciones y seed, tabla de verificación real, limitaciones y checklist marcado.
- `docs/05-quality/security-report.md` y `docs/05-quality/security-checklist.md`: entregables
  de F41.
- `docs/04-features/README.md`, `docs/06-process/ai-log.md`,
  `docs/07-curriculum/coverage-map.md` y `docs/06-process/remaining-plan.md`: estado y
  evidencias.

## Verificación

- `docker compose config -q` → OK.
- `docker compose ps` → `postgres`, `minio` y `mailpit` **healthy** (13 h en marcha al empezar).
- `pnpm db:migrate` → aplicó `20261105190000_f25_photo_membership_indexes` en `memora`.
  `memora_test` ya estaba al día.
- `pnpm db:seed` → `{"users":2,"circles":2,"memberships":4,"albums":2,"photos":6,"tags":2,"invitations":1,"activities":4}`.
- `pnpm --filter @memora/api db:seed:images` → `6 generadas, 12 ya tenian objeto`.
- `pnpm build` → **5/5** tareas, 5 rutas prerenderizadas.
- Con `pnpm dev` y las variables exportadas:
  - `curl -i localhost:3001/api/health` → **200** con CSP, `Referrer-Policy`, `nosniff` y
    `X-Frame-Options`.
  - `curl localhost:3000/api/health` (proxy) → **200**.
  - Login `lucia@memora.test` / `memora-demo` → **200**; `GET /api/me` → **200**.
  - Login sin `Origin` → **403**; contraseña incorrecta → **401**; círculo ajeno → **404**.
  - Pipeline: subida **201**, `original` con sesión **200**, sin sesión **401**, borrado
    **204**, después **404**; objetos de Silo eliminados y 18 fotos en BD (sin residuos).
- `pnpm --filter @memora/api test` con `memora_test` → **27 archivos y 429 tests passed**,
  2 skipped (integraciones de storage sin credenciales), incluidos los 5 nuevos de
  `maintenance/cleanup`.
- `pnpm --filter @memora/web exec vitest run --maxWorkers=2 --retry=1` → **110 archivos y
  910 tests passed**, 0 fallos.
- Email de invitación con Mailpit → invitación **201**, correo con el enlace `/invite/<token>`
  del círculo y sin fotos; revocación **204**.
- Mantenimiento al arrancar → log `Mantenimiento de datos completado` con los tres contadores.
- Limpieza de datos de prueba → BD con los conteos del seed y Silo con 18 objetos del seed;
  los 4 ZIP de descargas vigentes se borrarán al expirar.

## Criterios de aceptación

- **AC-01 (demo local desde cero):** **pasa** con el procedimiento documentado y verificado;
  limitación: el bucket y las imágenes del seed requieren dos comandos manuales.
- **AC-02 (migraciones y seed):** **pasa**; el seed es idempotente y se aplicó la migración
  que faltaba.
- **AC-03 (healthchecks):** **pasa**; los tres contenedores `healthy` y `/api/health` 200.
- **AC-04 (logs sin PII):** **pasa**; 131 líneas de log real sin emails, contraseña, cookies,
  CSRF ni tokens de invitación, y redacción en código con tests.
- **AC-05 (guía de despliegue):** **pasa** como guía documentada; **no verificada** en cloud
  (VPS/Render/R2/Resend/Nominatim real) y sin `docker-compose.prod.yml`.
- **AC-06 (checklist):** **parcial**: los ítems de local están marcados con evidencia; HTTPS,
  cookies `Secure` y vídeo quedan abiertos y declarados.

## Pendiente

- **`docker-compose.prod.yml`** no se entrega: fuera de la recutura de S4.
- **Rate limit compartido** entre instancias (H-05): requiere Redis o una tabla propia.
- `pnpm audit`: 2 moderadas preexistentes en Swagger UI (H-01), aceptadas y documentadas.

## Riesgos y limitaciones

- La demo depende de exportar las variables en la shell: `.env` no se carga solo. La guía lo
  explica, pero es un paso manual y una fuente de error.
- `.env.example` no trae `SESSION_SECRET` (a propósito): sin uno, los tokens CSRF dejan de
  valer al reiniciar la API.
- No se ha probado nada en producción ni con servicios gestionados.
- Con varias instancias de la API, el mantenimiento periódico se ejecuta en todas: es
  idempotente, pero hace trabajo duplicado.
- La primera tanda de tests web se ejecutó con 110 workers por un mal paso de argumentos y
  produjo 50 timeouts; se repitió con `--maxWorkers=2` como pide el plan.

## Documentación actualizada

- [x] `docs/08-delivery/deployment.md`
- [x] `docs/04-features/F42-deployment/handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/06-process/remaining-plan.md`

## Siguiente paso propuesto

Revisión independiente de nivel A del diff (arranque, variables y documentación) y
aceptación del usuario con una demo desde cero. Sin commit ni push hasta tener permiso.
