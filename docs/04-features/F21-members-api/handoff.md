# Handoff — F21 Members API

- **Estado:** `done` (aceptada el 2026-11-04; merge `1b3215d` en `main` y CI en verde en la PR y en `main`)
- **Rama:** `feat/F21-members-api`
- **Fecha:** 2026-11-04
- **Implementado por:** `api-dev`
- **Revisado por:** `reviewer` (nivel A, una ronda: **apto con correcciones**, sin bloqueantes ni mayores)

## Resultado

El módulo `members` implementa el listado paginado de miembros del círculo con contador de fotos etiquetadas, la expulsión solo para el propietario, la salida del propio miembro y el listado de fotos de una persona acotado al círculo (`AC-07`). La autorización se resuelve contra la membresía y `Circle.ownerId`, de modo que un extraño recibe `404` y nunca se revela la existencia de usuarios de otros círculos. `MemberDto` incorpora `photosCount` —fotos **de ese círculo** en las que la persona está etiquetada— y no expone el email de nadie.

La revisión independiente de nivel **A** cerró en **apto con correcciones**, sin bloqueantes ni mayores: **6 Menores** y **5 Nits** quedan en `Pendiente` y no reabren la revisión según el protocolo. El usuario aceptó la feature el **2026-11-04**; el cierre documental está completo y el commit queda **propuesto, sin ejecutar**.

## Decisiones de G1 (2026-11-04)

| # | Decisión |
| --- | --- |
| D1 | `MemberDto` incorpora `photosCount`: fotos **del círculo** donde la persona está etiquetada; corresponde a «Aparece en» del diseño. |
| D2 | **Sin email** de miembros. Desviación consciente del mock de escritorio por minimización de datos; `UserDto` sigue sin email. |
| D3 | Se incluye `GET /circles/:circleId/members/:userId/photos` en F21 porque ninguna otra feature lo reclamaba y F22 lo necesita. Se añade AC-07. |
| D4 | Invitaciones pendientes cubiertas por F19 (`GET /circles/:circleId/invitations`, owner-only); no se implementa nada nuevo. |
| D5 | Solo roles `owner` y `member`; no existe promoción a administrador. Se registra para F22. |

## Cambios (archivos)

- `packages/shared/src/schemas/dto.ts`: `MemberDto.photosCount`.
- `packages/shared/src/schemas/contracts.test.ts`: fixture y tests del contrato de miembro.
- `apps/api/src/modules/members/cursor.ts` (nuevo): cursor keyset `(joinedAt, id)` para el listado y `(createdAt, id)` para las fotos de persona.
- `apps/api/src/modules/members/dto.ts` (nuevo): `toUserDto` sin email, `toMemberDto` con rol resuelto contra `Circle.ownerId` y `photosCount`, y mapeo de fotos a `PhotoDto`.
- `apps/api/src/modules/members/service.ts` (nuevo): listado con contador agrupado por círculo, expulsión y salida transaccionales con borrado de etiquetas acotado, y fotos de persona aisladas por círculo.
- `apps/api/src/modules/members/routes.ts` (nuevo): los cuatro endpoints con sesión, CSRF y `Origin`.
- `apps/api/src/modules/members/members.test.ts` (nuevo): **18 tests** de integración.
- `apps/api/src/app.ts`: registro de `registerMemberRoutes`.
- `docs/03-architecture/api-contract.md`: semántica de miembros, orden y cursor, `photosCount` y fotos de persona.
- `docs/03-architecture/data-model.md`: contador derivado y borrado de etiquetas acotado al círculo.
- `docs/04-features/F21-members-api/{spec,tasks}.md`: alcance, AC-07 y decisiones de G1.

## Verificación (comandos y resultados reales)

Ejecutado contra PostgreSQL 17.11 con `memora_test` migrada y la API arrancada cuando la prueba lo requiere.

```text
DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test members
→ 18/18

DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm --filter @memora/api test
→ 218/218 en 12 archivos

pnpm --filter @memora/shared test
→ 145/145

pnpm typecheck
→ 9/9

pnpm lint
→ 6/6

pnpm format:check
→ OK

pnpm docs:check
→ 191 archivos, 481 enlaces, 0 rotos

pnpm docs:check (tras este cierre documental)
→ 191 archivos, 493 enlaces, 0 rotos

pnpm agents:check
→ 43 specs y 43 filas, OK
```

### Prueba HTTP real

Con la API arrancada contra `memora_test`: **41/41** comprobaciones. Cubre registro de 3 usuarios, creación del círculo, invitación, aceptación, listado de miembros, roles, contadores, ausencia de email, `401`/`403`/`404`/`409`, CSRF y `Origin`, cursores inválidos, expulsión, salida, fotos de una persona vacías y `404` cruzados.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01 | Pasa | `AC-01 — listado solo del círculo`: owner y members con orden estable y contador, paginación keyset sin duplicados, extraño que pertenece a otro círculo recibe `404`, sin sesión `401`. |
| AC-02 | Pasa | `AC-02 — expulsión solo del owner`: `204` con etiquetas del círculo limpiadas; member `403`; rol `owner` falsificado en la fila no eleva permisos; objetivo inexistente o de otro círculo `404`; owner no se expulsa (`409`); extraño `404` y mutaciones con `Origin`/CSRF. |
| AC-03 | Pasa | `AC-03 — salida del member`: member sale con `204` y conserva sus fotos; owner no puede salir (`409`); quien ya no es miembro `404`; sin sesión `401`. |
| AC-04 | Pasa | El test de expulsión comprueba que las fotos y la autoría permanecen y que solo se borran los `PhotoTag` del usuario en fotos de ese círculo, en la misma transacción. |
| AC-05 | Pasa | `AC-05 — photosCount por círculo`: cuenta solo etiquetas en fotos del círculo y devuelve `0` sin etiquetas. |
| AC-06 | Pasa | Test explícito de que no se expone el email de ningún miembro; `404` para extraños y objetivos de otros círculos; `403` solo cuando el llamante sí es miembro. |
| AC-07 | Pasa | `AC-07 — fotos de esta persona`: lista solo fotos del círculo etiquetadas, paginadas y con `PhotoDto`; objetivo que no es miembro `404`; llamante que no es miembro `404`; sin sesión `401`. |

## Revisiones

- `reviewer` (nivel **A**, una ronda): **apto con correcciones**. Sin bloqueantes ni mayores. **6 Menores** (m-01…m-06) y **5 Nits** (n-01…n-05), todos en `Pendiente`; no reabren la revisión.

## Pendiente

- `[Menor]` **m-01**: el `include` de `Photo` carga claves de almacenamiento en memoria; no se serializan, pero conviene reducir el `select`.
- `[Menor]` **m-02**: el orden de etiquetas no tiene desempate por `id`.
- `[Menor]` **m-03**: faltan tests de `401` en `DELETE`, de precedencia permiso/existencia y de CSRF/`Origin` en `leave`.
- `[Menor]` **m-04**: faltan `limit=101`, cursor inválido y lista vacía en fotos de persona.
- `[Menor]` **m-05**: falta una etiqueta cruzada en el test de `leave`.
- `[Menor]` **m-06**: carrera de milisegundos entre etiquetar y expulsar; sin constraint en base. Residual para **F32**.
- `[Nit]` **n-01**: `OWNER_CONFLICT_MESSAGE` exportado solo para un test.
- `[Nit]` **n-02**: código de cursor duplicado de `circles`.
- `[Nit]` **n-03**: constructor de URL de imagen duplicado.
- `[Nit]` **n-04**: `photoDtoSchema.parse` convierte una fila corrupta en `500`; es una decisión de fallo ruidoso.
- `[Nit]` **n-05**: tablero/spec en `review` durante G3; ya corregido a `review` antes de la aceptación.

## Riesgos y limitaciones

- `thumbUrl`/`displayUrl` apuntan a `/api/photos/:photoId/image`, que llega en **F29**; hasta entonces responden `404`. Igual que la portada en F17/F18.
- `photosCount` no es transaccional con la página: puede haber un desfase de milisegundos.
- El cursor no está firmado ni ligado al círculo: solo mueve la paginación dentro del círculo; decisión consciente, igual que F17.
- Sin índices nuevos `(circleId, createdAt, id)` en `Photo` ni `(circleId, joinedAt)` en `Membership`; añadirlos exige migración y permiso, queda para **F23/F25**.
- El mock de Personas muestra emails y «Hacer administradora»; **F22** deberá asumir la desviación del email y decidir qué hace con la promoción, que no existe en el modelo.

## Documentación actualizada

- [spec.md](spec.md): `status: done` en frontmatter y encabezado; alcance sin cambios.
- [tasks.md](tasks.md): implementación, AC, verificación, revisión, aceptación y cierre documental.
- [Tablero de features](../README.md): F21 en `done` y situación actual con la aceptación del 2026-11-04.
- [Bitácora](../../06-process/ai-log.md): entrada de F21 con el ciclo completo.
- [Cobertura del temario](../../07-curriculum/coverage-map.md): API REST, autorización, contadores, minimización de datos, paginación, tests de integración y revisión independiente.
- [api-contract.md](../../03-architecture/api-contract.md) y [data-model.md](../../03-architecture/data-model.md): semántica de miembros ya registrada durante la implementación.
- [README](../../../README.md): estado, narrativa y enlace a este handoff.

## Cierre operativo

- Commits: `b69cbb6` (`feat(api): add circle members endpoints (F21)`) y `39e33f6` (`docs: record F21 implementation, review and acceptance`).
- [PR #32](https://github.com/Luceir0/lab-final--memora/pull/32), CI en verde en la PR (run `41879532946`, job `126748140089`, `completed/success`, head `39e33f6`).
- Merge `1b3215d` en `main` y CI en verde sobre el merge (run `41881097031`, `completed/success`).
- La rama `feat/F21-members-api` sigue existiendo, ya mergeada.

## Siguiente paso propuesto

F21 está cerrada y mergeada. La siguiente feature es **F22 — People web**, asumiendo la desviación del email y decidiendo qué hacer con la promoción a administrador, que no existe en el modelo.
