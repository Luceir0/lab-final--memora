# Handoff — F06 Contratos compartidos y permisos

- **Estado:** `done` (cerrada tras merge y CI en verde)
- **Rama:** `feat/F06-contratos-compartidos`, mergeada en `main`; la rama remota sigue existiendo
- **Fecha de cierre:** 2026-10-31
- **Implementado por:** orquestador y subagentes de implementación de F06
- **Revisado por:** reviewer independiente — primera iteración no apto; segunda iteración apto con correcciones menores; menores cerrados y re-verificados
- **Dependencia añadida:** `zod@4.6.7` en `packages/shared`, con autorización del usuario
- **Aceptado por:** usuario (2026-10-31)
- **PR:** [#2](https://github.com/Luceir0/lab-final--memora/pull/2)
- **Commits:** `6435f9f` (`feat(shared): add contracts, errors, pagination and permissions`) y `6acc7ba` (`docs: close F06 documentation and record acceptance`)
- **Merge en `main`:** `b556168` (`Merge pull request #2 from Luceir0/feat/F06-contratos-compartidos`)
- **CI de `main`:** run `41246708428`, `completed/success`
- **CI de la PR:** head `6acc7ba`; install, docs, agents, lint, typecheck, test y build → `completed/success`

## Resultado

`packages/shared` es la fuente única de contratos: esquemas Zod 4 de auth, círculos, álbumes, fotos, tags, invitaciones, descargas y actividad; DTOs con `z.infer`; `ErrorResponse`/`ApiResult`; paginación por cursor; mensajes de validación en español y `can()` pura con `album.empty`, `photo.update` y `album.update`.

La verificación real está en verde: 5 archivos y 138 tests en el paquete, `typecheck`/`lint`/`build` del paquete en exit 0, Turbo `typecheck` 8/8 y `lint` 6/6 sin caché, y validadores documentales OK. La revisión independiente necesitó dos iteraciones: la primera fue **no apto** (2 bloqueantes en `can()`/`isCircleOwner()`, 4 mayores y 7 menores); la segunda fue **apto con correcciones menores**, sin bloqueantes ni mayores abiertos. F06 está **`done`**.

**Cierre (2026-10-31):** el usuario aceptó F06 después de la re-revisión y de cerrar los hallazgos menores. Después se crearon los commits `6435f9f` y `6acc7ba` en `feat/F06-contratos-compartidos`, se abrió la PR #2, se mergeó en `main` como `b556168` y el CI de `main` pasó en green (run `41246708428`, `completed/success`). El CI de la PR, con head `6acc7ba`, también pasó install, docs, agents, lint, typecheck, test y build. La rama remota sigue existiendo.

## Cambios (archivos)

### Código implementado (fuera de este encargo documental)

- `packages/shared/src/errors.ts`: catálogo `ErrorCode`, estado HTTP por código, mensajes por defecto, `ErrorDetail`/`ErrorResponse` y `ApiResult`.
- `packages/shared/src/pagination.ts`: `pageQuerySchema` (default 24, 1–100, cursor 512), `Page<T>`, `createPageSchema` y `buildPageQuery`.
- `packages/shared/src/permissions.ts`: `Action`, `CircleSettings`, `DEFAULT_CIRCLE_SETTINGS`, `isCircleOwner` por `ownerId` y `can()` pura que falla cerrado.
- `packages/shared/src/validation-messages.ts`: mensajes de validación en español y mensaje de rango de `limit`.
- `packages/shared/src/schemas/**`: `auth`, `circles`, `albums`, `photos`, `tags`, `invitations`, `downloads`, `activity`, `health`, `dto`, `common` e `index`.
- `packages/shared/src/index.ts`: exporta errores, paginación, permisos y esquemas.
- `packages/shared/package.json`: `zod@4.6.7` como dependencia (más `pnpm-lock.yaml`).
- Tests: `packages/shared/src/errors.test.ts`, `pagination.test.ts`, `permissions.test.ts`, `index.test.ts` y `schemas/contracts.test.ts`.

### Documentación actualizada por este encargo

- `docs/03-architecture/auth.md`: `album.empty`, diferencia con `album.delete`, `photo.update` y `album.update`, owner por `ownerId` y fallo cerrado de `can()`.
- `docs/03-architecture/api-contract.md`: `details`, aceptación de invitación `{ circle, state }`, `clientUploadId`, `progress`, límites de entrada y binario fuera de Zod.
- `docs/03-architecture/downloads.md`: `progress` derivado y cuándo es `null`.
- `docs/03-architecture/uploads.md`: contrato de subida y `clientUploadId` en `PhotoDto`.
- `docs/04-features/F06-contratos-compartidos/spec.md`: `status: done` y encabezado visible.
- `docs/04-features/F06-contratos-compartidos/tasks.md`: implementación, AC, verificación y revisión marcadas con evidencias.
- `docs/04-features/F06-contratos-compartidos/handoff.md`: este documento.
- `docs/04-features/README.md`: F06 → `done` y «Situación actual».
- `docs/00-index.md` y `README.md`: estado real y `packages/shared` con contratos y permisos.
- `docs/06-process/ai-log.md`: entrada de F06.
- `docs/07-curriculum/coverage-map.md`: sección de F06 y evidencias.

Este agente no ha escrito en `apps/**` ni en `packages/shared/src/**`. `packages/shared/README.md` no necesita cambios: solo describe el paquete y sus comandos, y el intento de ampliarlo fue rechazado por los permisos del rol documental.

## Verificación

| Comando | Resultado real |
| --- | --- |
| `corepack pnpm --filter @memora/shared test` | 5 archivos, 138 tests passed |
| `typecheck`, `lint` y `build` del paquete `@memora/shared` | exit 0 |
| `pnpm exec turbo run typecheck --force` | 8/8 tareas, 0 cached |
| `pnpm exec turbo run lint --force` | 6/6 tareas, 0 cached |
| `corepack pnpm docs:check` | 191 archivos, 427 enlaces, 0 rotos (tras el cierre documental) |
| `corepack pnpm agents:check` | OK (10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas de tablero) |
| `rg` de `any`/`@ts-ignore` en `packages/shared/src` | sin coincidencias |

No se ha ejecutado ningún comando de aceptación, commit ni push.

## Criterios de aceptación

| AC | Estado | Evidencia |
| --- | --- | --- |
| AC-01: cada endpoint del contrato tiene request/response Zod | Pasa | `packages/shared/src/schemas/contracts.test.ts` (registro de endpoints y sus partes); los tres binarios quedan sin respuesta JSON por diseño |
| AC-02: los DTOs no exponen `objectKey` ni tokens | Pasa | Tests de privacidad de DTOs en `contracts.test.ts`; `schemas/dto.ts` |
| AC-03: `can()` cubre owner/member × flags × acciones | Pasa | `packages/shared/src/permissions.test.ts` (incluye `album.empty`, `album.delete`, `album.update`, `photo.update`, acciones desconocidas y otro círculo) |
| AC-04: los errores tienen `code`/`message`/`details` | Pasa | `packages/shared/src/errors.test.ts` |
| AC-05: la paginación es genérica y testeada | Pasa | `packages/shared/src/pagination.test.ts` |
| AC-06: no hay `any` | Pasa | `typecheck` y `lint` en exit 0; `rg` sin `any`, `as any`, `@ts-ignore` ni `@ts-expect-error` |

## Pendiente

- Ninguno de F06. Deuda trasladada:
  - **F08:** sustituir los códigos del spike `PAYLOAD_TOO_LARGE` y `CLIENT_ERROR` por los del contrato compartido (`FILE_TOO_LARGE`, `VALIDATION_ERROR`…); dejar de emitir `details: []`; no enviar cuerpo en `204`.
  - **F25:** validar el binario de subida (MIME por magic bytes, tamaño y píxeles); el `file` no está en Zod.
  - **F33:** garantizar que `errorMessage` de los jobs de descarga no contenga PII.

## Riesgos y limitaciones

- Los contratos quedan congelados para API/UI; cualquier cambio posterior exige aviso y revisión.
- F06 está cerrada con el CI de `main` en verde (run `41246708428`).
- `progress` es derivado y no persistido; F33 debe calcularlo al leer el job, no añadirlo al modelo.
- `details` rechaza `[]`; el mapeo de errores de F08 debe ajustarse o los tests fallarán.
- Los DTOs de respuesta son deliberadamente laxos en longitudes para serializar datos ya persistidos; los límites duros se aplican a la entrada.
- `zod` pasa a ser dependencia de runtime de `packages/shared`; web y API deben consumir los mismos esquemas para no duplicar contratos.

## Documentación actualizada

- [x] `docs/03-architecture/auth.md`, `api-contract.md`, `downloads.md`, `uploads.md`
- [x] `docs/04-features/F06-contratos-compartidos/spec.md`, `tasks.md`, `handoff.md`
- [x] `docs/04-features/README.md`
- [x] `docs/00-index.md` y `README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/03-architecture/spike-results.md` y `docs/05-quality/test-matrix.md` (deuda documental)

## Siguiente paso propuesto

F07 — Modelo de datos, migraciones y seed. Sigue en `draft` y no se abre sin permiso del usuario.
