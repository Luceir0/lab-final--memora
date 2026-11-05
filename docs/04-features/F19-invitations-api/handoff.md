# Handoff — F19 Invitations API

- **Estado:** done
- **Rama:** `feat/F19-invitations-api`
- **Fecha:** 2026-11-04
- **Implementado por:** api-dev (subagente)
- **Revisado por:** reviewer independiente (auditoría **A**, dos rondas)
- **Aceptado por:** usuario, 2026-11-04 (feature de backend, sin pantalla)

## Resultado

Los cinco endpoints del contrato están implementados con sesión, CSRF, `Origin`, autorización por recurso y contrato Zod compartido: crear invitación (token en claro una sola vez), listar pendientes, revocar, preview pública y aceptar de forma idempotente. El email real se envía con `nodemailer` (Mailpit) o Resend por `fetch`, siempre como efecto secundario tolerante a fallos. La aceptación escribe membresía, `Activity` `member.joined` y la marca de aceptación en una transacción.

La revisión independiente de nivel **A** tuvo dos rondas. La primera fue **no apto** por **B-01**: el token de la invitación aparecía en claro en los logs de petición de Fastify, y el handoff anterior afirmaba lo contrario. Tras corregirlo, la segunda ronda fue **apto con correcciones**, con **N-07** (redacción en variantes de URL no canónicas) cerrado después y con test de regresión. También se corrigieron **M-01**, **M-02** y **M-03**. El usuario aceptó la feature el 2026-11-04 con la evidencia del handoff.

## Cambios

### Implementación original

- `apps/api/src/modules/invitations/token.ts`: token de 32 bytes base64url, hash SHA-256 hex y TTL de 7 días.
- `apps/api/src/modules/invitations/cursor.ts`: cursor keyset `(createdAt desc, id desc)` con `400` ante cursor inválido.
- `apps/api/src/modules/invitations/dto.ts`: DTOs de invitación, creada y preview; nunca expone `tokenHash`.
- `apps/api/src/modules/invitations/service.ts`: creación, listado de pendientes, revocación idempotente, estados y aceptación transaccional; captura `P2002`/`P2025`/`P2003`.
- `apps/api/src/modules/invitations/email.ts`: plantilla texto + HTML con asunto sin datos privados y `from` explícito.
- `apps/api/src/modules/invitations/routes.ts`: los cinco endpoints, tag `Invitations`, seguridad de sesión, CSRF/`Origin`, no-store en `201`/`200`, rate limit de 10/hora por usuario y aviso de email fallido sin PII/token.
- `apps/api/src/modules/invitations/invitations.test.ts`: 30 tests de integración.
- `apps/api/src/services/email.ts` → `apps/api/src/services/email/{index,mailpit,resend}.ts`: adaptador con fábrica y dos implementaciones.
- `apps/api/src/services/index.ts`: reexporta email y añade `createRuntimeServices(config)`; `kind` sigue `'unavailable'`.
- `apps/api/src/server.ts`: arranca con email real sin tocar el guard de producción.
- `apps/api/src/config.ts`: `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `SMTP_HOST` y `SMTP_PORT` con defaults y validación por entorno.
- `apps/api/src/app.ts`, `apps/api/src/plugins/swagger.ts`: registro de rutas y tag `Invitations`.
- `apps/api/src/config.test.ts`, `apps/api/src/app.test.ts`, `apps/api/src/test/harness.ts`: casos y entorno de email.
- `apps/api/package.json` + `pnpm-lock.yaml`: `nodemailer` y `@types/nodemailer`.

### Correcciones de la revisión

- `B-01`/`N-07` `apps/api/src/logging.ts`: `serializers.req` propio que decodifica la ruta de forma segura (`try/catch` de `decodeURIComponent`) y, si empieza por `/api/invitations/`, sustituye **el primer segmento** por `[REDACTED]` conservando el resto y la query. Cubre preview y accept, canónicos y variantes (barra final, `/accept/`, segmento extra, `//accept`, prefijo percent-encoded) y no toca `/api/circles/.../invitations` ni otras rutas. Conserva método, host, IP y puerto. Un objeto que no sea una petición y se loguee bajo una clave `req` conserva su forma para que sigan aplicándose las rutas de redacción de pino.
- `B-01` `apps/api/src/app.ts`: `routerOptions.maxParamLength = 512` para que un token de más de 256 caracteres llegue a Zod y devuelva `400`, no un `414` del router.
- `B-01`/`N-07` test de regresión de logs en `invitations.test.ts`: preview y accept canónicos, barra final, `/accept/`, segmento extra, `//accept`, prefijo percent-encoded y accept con query; afirma que el token no aparece, que sí aparece `[REDACTED]` y que `/api/circles/:id/invitations` sigue logueándose completa. El test de email fallido también comprueba que el aviso no contiene destinatario, token ni nombre del círculo.
- `M-01` `apps/api/src/config.ts`: en producción `EMAIL_PROVIDER` debe ser `resend`; `mailpit` se rechaza con mensaje explícito. Defaults de desarrollo/test sin cambios.
- `M-02` `apps/api/package.json`: `nodemailer@10.3.1` y `@types/nodemailer@8.0.2` fijadas sin `^`; lockfile regenerado.
- `M-03` `apps/api/src/modules/invitations/routes.ts`: la creación captura `P2003`/`P2025` y responde `404 NOT_FOUND`; test con proxy de Prisma que simula el borrado del círculo entre autorización e inserción.
- `N-02` `routes.ts`: `setPrivateNoStore` en el `201` de creación y en el `200` de aceptación; comprobado en tests.
- `N-04` handoff: el `README` lo modificó el orquestador al abrir la feature; este subagente no lo ha tocado.
- `N-05` tests nuevos: `DELETE` sin `Origin`, listado que excluye una aceptada, `from` del mensaje igual a `EMAIL_FROM` y token de más de 256 caracteres → `400`.
- `N-06` `config.ts` + `config.test.ts`: `EMAIL_FROM` acepta dirección simple, forma RFC `<email>` o `Nombre <email>`, y rechaza formatos inválidos.
- `N-07` `logging.ts` + test de logs: generalización de la redacción al primer segmento tras `/api/invitations/`, con decodificación segura y cobertura de variantes no canónicas.
- `N-10` `config.test.ts`: caso de producción sin `EMAIL_PROVIDER` y caso válido `<email>` en `EMAIL_FROM`.
- `N-11` handoff y `tasks.md`: afirmación de logs precisada y access logs del proxy inverso asignados a F42.
- `apps/api/src/services/email/*`: `EmailMessage.from` opcional; los adaptadores usan el remitente del mensaje y caen a `EMAIL_FROM` si falta.

## Verificación

Ejecutado con PostgreSQL, Mailpit y Silo levantados y `memora_test` existente. Sin `DATABASE_URL` no se ha ejecutado ninguna suite: no hay skips.

```text
pnpm --filter @memora/api add nodemailer
→ Done in 3.7s (+1)

pnpm --filter @memora/api add -D @types/nodemailer
→ Done in 3s (+1)

pnpm install --lockfile-only
→ Done in 2.4s (lockfile con versiones exactas)

DATABASE_URL="postgresql://memora:memora@localhost:5432/memora_test" pnpm --filter @memora/api test invitations
→ Test Files 1 passed (1) · Tests 30 passed (30) · Duration 3.46s

DATABASE_URL="postgresql://memora:memora@localhost:5432/memora_test" pnpm --filter @memora/api test
→ Test Files 11 passed (11) · Tests 200 passed (200) · Duration 16.00s

pnpm --filter @memora/api typecheck
→ exit 0 (prisma generate + tsc --noEmit)

pnpm --filter @memora/api lint
→ exit 0, sin hallazgos

pnpm format:check
→ All matched files use Prettier code style!
```

### Prueba real de extremo a extremo

Contra `memora_test` y Mailpit, con la API levantada:

| Paso | Resultado |
| --- | --- |
| Login del owner | `200` |
| Crear invitación | `201` con token de 43 caracteres |
| Correo en Mailpit | recibido, asunto «Te han invitado a un círculo en Memora» |
| Preview sin sesión | `valid` |
| Preview con owner | `already_member` |
| Aceptar siendo owner | `already_member` con rol `owner` |
| Revocar | `204` |
| Preview tras revocar | `revoked` |
| Aceptar revocada | `409 CONFLICT` |
| Logs de la prueba | token **0** veces, `[REDACTED]` **5** veces |

## Criterios de aceptación

- **AC-01 — pasa.** Token de 43 caracteres base64url, `tokenHash` = SHA-256 del token y distinto del token, caducidad a 7 días, `cache-control: private, no-store`, `tokenHash` ausente de la respuesta. Token de 257 caracteres → `400 VALIDATION_ERROR`. En la prueba real, el token solo se devolvió en el `201`.
- **AC-02 — pasa.** Caducada: fuera del listado, preview `expired`, aceptar `409 CONFLICT`. Revocada: `204` idempotente, preview `revoked`, aceptar `409`. Aceptada: fuera del listado; revocarla es `204` sin cambios y sin expulsar. Verificado en tests y en la prueba real (revocar `204`, preview `revoked`, aceptar `409`).
- **AC-03 — pasa.** Repetir aceptación da `already_member`; una sola membresía y actividad. Dos aceptaciones simultáneas del mismo usuario también acaban en una única membresía.
- **AC-04 — pasa.** Miembro existente recibe `already_member` con rol real y sin actividad; el propietario recibe rol `owner`. Verificado en tests y en la prueba real (preview y aceptación con el owner → `already_member` y rol `owner`).
- **AC-05 — pasa.** Con email que lanza, la creación responde `201` y la invitación queda persistida; el aviso de fallo no registra destinatario, token ni nombre del círculo. El mensaje capturado lleva `from = EMAIL_FROM`. El correo real se recibió en Mailpit con el asunto previsto.
- **AC-06 — pasa.** Miembro `403`, ajeno `404`, revocación cruzada `404`; mutaciones sin CSRF/`Origin` `403` (incluido `DELETE` sin `Origin`); sin sesión `401`; límite 10/hora por usuario sin afectar a otros. Borrado del círculo en carrera durante la creación → `404`, nunca `500` (**M-03**).
- **AC-07 — pasa.** Preview con exactamente cuatro campos; sin token, hash, email, ids, miembros, fotos ni álbumes. Los listados no incluyen token ni hash. **Corrección B-01/N-07:** la afirmación anterior de «sin token en logs» era falsa; ahora el serializador redacta el token en preview y accept, tanto en la ruta canónica como en variantes (barra final, `/accept/`, segmento extra, `//accept`, prefijo percent-encoded) y con query string, y un test de regresión lo verifica. En la prueba real el token apareció **0** veces y `[REDACTED]` **5**. Los access logs del proxy inverso quedan fuera de esta feature: se revisarán en **F42**, ya que el token va en el path por contrato.

## Pendiente

- `[Menor]` **N-03**: el envío de email es síncrono y espera hasta 10 s de timeout antes de responder, aunque el fallo no rompe la creación. Mejora futura: cola o envío diferido.
- `[Menor]` **N-09**: `@types/nodemailer` major 8 convive con runtime major 10; no hay tipos empaquetados y `typecheck` pasa.
- **F42**: redactar los access logs del proxy inverso; el token va en el path por contrato.
- **F20**: confirmar la decisión de que revocar una invitación ya aceptada es no-op y el enlace sigue siendo reutilizable hasta caducar.
- `Services.kind` sigue `'unavailable'`; el guard de producción no se ha debilitado. Storage/geocoding reales llegan en **F25/F42**.
- `[Menor]` Sin tests unitarios de `mailpit.ts`/`resend.ts`: los tests no llaman servicios externos; la selección está cubierta por `config.test.ts` y el envío por el fake.

## Cierre operativo (2026-11-04)

Rama `feat/F19-invitations-api` con dos commits: `1250e29` (feature) y `2d3cfc5` (documentación).

- **PR #28** — `feat(api): F19 invitations API`, mergeada en `main` el 2026-11-04.
- **CI de la PR:** run **41826103313**, `completed/success`.
- **Merge commit:** **`d0c4465`** en `main`.
- **CI de `main` sobre `d0c4465`:** run **41826486383**, `completed/success` (https://github.com/Luceir0/lab-final--memora/actions/runs/41826486383).

Con esto F19 pasa de `accepted` a **`done`**.

## Corrección posterior (2026-11-05)

**B-01.** En F22 se detectó que el enlace del correo de invitación apuntaba a `/invitations/<token>`, una ruta de API que el navegador no puede renderizar (404 en la web), en lugar de `/invite/<token>`, la página SSR de F20. Se corrigió en `apps/api/src/modules/invitations/routes.ts` con `new URL(`/invite/${encodeURIComponent(input.token)}`, config.appUrl)`, **sin cambio del contrato de API**: el `POST` sigue devolviendo el token y la web sigue construyendo el enlace con el mismo helper. Test de regresión en `apps/api/src/modules/invitations/invitations.test.ts`, que comprueba `/invite/<token>` en el texto y en el HTML del mensaje. El arreglo viaja en la rama `feat/F22-people-web` como corrección transversal, no como alcance de F19 ni de F22.

## Riesgos y limitaciones

- **Revocar una invitación aceptada no la desactiva** (decisión del usuario: no-op `204`). Como el enlace es reutilizable hasta caducar, el propietario no puede impedir nuevas uniones tras la primera aceptación. Recomendación: confirmar en **F20** si revocar debe marcar `revokedAt` sin expulsar al miembro.
- **Access logs del proxy inverso:** la API redacta el token en sus propios logs, pero el token viaja en el path por contrato. La redacción de los access logs del proxy se hará en **F42**.
- **Envío de email síncrono (N-03):** la creación espera al adaptador; los timeouts están acotados a 10 s y un fallo solo genera un aviso. No se ha movido a cola ni a envío diferido.
- **`Services.kind` sigue `'unavailable'`**: el email es real, pero storage/geocoding siguen fail-closed y producción mantiene el rechazo de arranque hasta **F25**. El guard no se ha debilitado.
- **Rate limit en memoria**: con varias instancias de API el límite efectivo se multiplica; no se introduce Redis en esta feature.
- **`acceptedAt` es la última aceptación**, no un histórico: el histórico real es `Activity`.
- **Sin migración**: `Invitation`, `Activity` y `ActivityType.member_joined` ya existían.
- **Producción exige `EMAIL_PROVIDER=resend`** con `RESEND_API_KEY`; Mailpit queda restringido a local.

## Documentación actualizada

- `docs/04-features/F19-invitations-api/spec.md`: `status: done` y línea «Estado».
- `docs/04-features/F19-invitations-api/tasks.md`: implementación, AC, verificación, revisión, aceptación y cierre operativo (commit, PR #28, merge `d0c4465` y CI) marcados.
- `docs/04-features/F19-invitations-api/handoff.md`: este documento, con las dos rondas de revisión, la prueba real y el cierre operativo.
- `docs/04-features/README.md`: fila F19 en `done` y «Situación actual».
- `docs/03-architecture/api-contract.md`: semántica cerrada de invitaciones.
- `docs/06-process/ai-log.md`: entrada del 2026-11-04 con el cierre operativo.
- `docs/07-curriculum/coverage-map.md`: F19 en `done` con la PR #28, el merge `d0c4465` y el CI.
- `README.md`: estado, narrativa y tabla alineados con F19 `done`, con el merge y el run.

## Siguiente paso propuesto

F20 puede consumir `GET /api/invitations/:token` para la preview SSR y debe confirmar la decisión sobre revocar invitaciones aceptadas.
