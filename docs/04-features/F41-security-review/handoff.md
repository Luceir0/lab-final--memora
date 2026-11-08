# Handoff — F41 Revisión de seguridad

- **Estado:** review
- **Rama:** `feat/F42-F41-quality` (worktree `s4-quality`)
- **Fecha:** 2026-11-08
- **Implementado por:** orquestador (sesión S4)
- **Revisado por:** pendiente (nivel V)

## Resultado

Revisión de seguridad mínima cerrada **sin hallazgos bloqueantes ni mayores**. La suite de
API pasa completa contra PostgreSQL real (429 tests), los negativos de auth, CSRF, `Origin`,
rate limit, acceso cruzado, permisos de descarga, subida y borrado responden con los códigos
esperados, las cabeceras de Helmet están activas, los logs redactan PII y no hay secretos en
el repositorio. Queda **un hallazgo menor abierto** (dependencias de Swagger UI) y una nota
informativa (rate limit en memoria). La purga programada y la limpieza de datos de prueba
cerraron H-02 y H-04 durante el cierre.

## Cambios

- `docs/05-quality/security-report.md`: informe con alcance, método, evidencias reales,
  verificación por área, 5 hallazgos, riesgos aceptados, limitaciones y recomendaciones.
- `docs/05-quality/security-checklist.md`: checklist completo, con evidencia. H-02 se cerró con el
  mantenimiento periódico de la API.
- No se corrige código: no había bloqueantes. `pnpm audit` no se toca (H-01 exige permiso
  para actualizar dependencias).

## Verificación

- `DATABASE_URL=…/memora_test pnpm --filter @memora/api test` → **27 archivos y 429 tests
  passed**, 2 skipped (integraciones de storage sin credenciales), incluidos los 5 de
  `maintenance/cleanup`.
- `pnpm --filter @memora/web exec vitest run --maxWorkers=2 --retry=1` → **110 archivos y
  910 tests passed**.
- `pnpm audit --audit-level=moderate` → **2 moderadas** (`glob`, `minimatch` vía
  `@fastify/swagger-ui` → `@fastify/static`); Swagger UI no se sirve en producción.
- Pruebas HTTP reales contra la API arrancada con la base de desarrollo:
  - login **200**, `/api/me` **200**, sin `Origin` **403**, contraseña errónea **401**;
  - rate limit de login: **401 ×5 → 429 ×2**;
  - mutación sin CSRF **403** y sin `Origin` **403**;
  - círculo ajeno **404**;
  - `original` de un miembro sin `membersCanDownload` **403**; borrado por no autor **403**;
  - etiquetado sin `membersCanTag` **403**; subida sin `membersCanUpload` **403**;
  - `original` sin sesión **401**;
  - subida **201** → `original` **200** → borrado **204** → `original` **404**;
  - cabeceras: CSP, `Referrer-Policy`, `nosniff`, `X-Frame-Options`.
- Email de invitación con Mailpit: **201**, correo con el enlace `/invite/<token>` y el nombre
  del círculo, sin fotos; revocación **204**.
- Logs: 131 líneas del log de desarrollo con **0** apariciones de email, contraseña, cookie,
  CSRF o token de invitación.
- `rg` de claves privadas y tokens (`AKIA`, `ghp_`, `sk_live_`, `xox`, `BEGIN … PRIVATE KEY`)
  → sin coincidencias; `git ls-files` de `.env` → solo `.env.example`.
- `pnpm typecheck` **9/9**, `pnpm lint` **6/6**, `pnpm build` **5/5**, `format:check`,
  `docs:check` (198 archivos, 661 enlaces) y `agents:check` (44/44) → OK.

## Criterios de aceptación

- **AC-01 (checklist completo):** **pasa**. Todos los ítems están marcados y con evidencia.
- **AC-02 (tests negativos pasan):** **pasa**.
- **AC-03 (sin secretos en repo):** **pasa**.
- **AC-04 (logs redactados):** **pasa**.
- **AC-05 (headers correctos):** **pasa** en local; HSTS, TLS y cookies `Secure` no se pueden
  comprobar sin despliegue.
- **AC-06 (informe con riesgos):** **pasa**.

## Pendiente

- **H-01** `[Menor]`: 2 moderadas de `pnpm audit` en la cadena de Swagger UI. Aceptadas; si se
  decide corregir, va en rama aparte con permiso y reverificación.
- **H-05** `[Informativa]`: rate limit en memoria, no compartido entre instancias.
- **Excepción de dependencia:** F41 depende de F38, que está en `draft` por la recutura del
  2026-11-08 (registrada en `remaining-plan.md`). Sin E2E, la evidencia de flujo real es manual.
- Sin pentest externo ni infraestructura real.

## Riesgos y limitaciones

- La revisión es de **una instancia local**, sin TLS ni servicios gestionados.
- No se han auditado dependencias más allá de `pnpm audit` ni el contenido de los objetos.
- `pnpm test` sin límite de workers agota los 5 s por test en esta máquina (110 workers); la
  batería web se ejecuta con `--maxWorkers=2 --retry=1`, como fija el plan de sesión.
- La evidencia de frontend es estática y de tests de componentes: no hay pruebas de navegador
  automatizadas (F37/F38 no se ejecutan).

## Documentación actualizada

- [x] `docs/05-quality/security-report.md` (nuevo)
- [x] `docs/05-quality/security-checklist.md`
- [x] `docs/04-features/F41-security-review/handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`

## Siguiente paso propuesto

Revisión independiente de nivel V del informe y del checklist, y aceptación del usuario.
Opcional antes de F43: decidir H-01 y limpiar los datos de prueba de la demo con permiso.
