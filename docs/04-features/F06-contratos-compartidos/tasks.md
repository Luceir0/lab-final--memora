# Tasks — F06 Contratos compartidos y permisos

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F05 `done` (merge `8dfae5f`, CI en verde).
- [x] Comprobar Definition of Ready (feature abierta con permiso del usuario).
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Esquemas Zod 4 de auth, círculos, álbumes, fotos, tags, invitaciones, descargas y actividad — `packages/shared/src/schemas/**`.
- [x] DTOs con `z.infer` — `packages/shared/src/schemas/dto.ts`.
- [x] `ErrorResponse` y `ApiResult` — `packages/shared/src/errors.ts`.
- [x] Paginación por cursor — `packages/shared/src/pagination.ts` (default 24, mínimo 1, máximo 100, cursor 512).
- [x] Función `can()` pura — `packages/shared/src/permissions.ts`; `album.empty`, `photo.update` y `album.update` incluidos.
- [x] Mensajes de validación en español — `packages/shared/src/validation-messages.ts`.
- [x] Tests unitarios — `packages/shared/src/*.test.ts` y `packages/shared/src/schemas/contracts.test.ts`.

## Criterios de aceptación

- [x] AC-01: cada endpoint del contrato tiene request/response Zod. Evidencia: registro de endpoints en `packages/shared/src/schemas/contracts.test.ts`; solo los tres binarios (`file` de subida, imagen y ZIP de descarga) quedan sin respuesta JSON y se documentan como tal.
- [x] AC-02: los DTOs no exponen `objectKey` ni tokens. Evidencia: tests de privacidad de DTOs en `contracts.test.ts`; `PhotoDto`, `AlbumDto`, `CircleDto` e `InvitationDto` no incluyen claves de almacenamiento ni `tokenHash`.
- [x] AC-03: `can()` cubre owner/member × flags × acciones. Evidencia: `packages/shared/src/permissions.test.ts`; incluye `album.empty`, `album.delete`, `album.update`, `photo.update`, acciones desconocidas y recursos de otro círculo.
- [x] AC-04: los errores tienen `code`/`message`/`details`. Evidencia: `packages/shared/src/errors.test.ts`; `details` es array no vacío o `null` y `[]` se rechaza.
- [x] AC-05: la paginación es genérica y testeada. Evidencia: `packages/shared/src/pagination.test.ts`; `createPageSchema`, `pageQuerySchema` y `buildPageQuery`.
- [x] AC-06: no hay `any`. Evidencia: `typecheck` y `lint` del paquete en exit 0; `rg` sobre `packages/shared/src` no encuentra usos de `any`, `as any`, `@ts-ignore` ni `@ts-expect-error`.

## Verificación

- [x] `corepack pnpm --filter @memora/shared test` → 5 archivos, 138 tests, todos en verde.
- [x] `typecheck`, `lint` y `build` del paquete `@memora/shared` → exit 0.
- [x] `pnpm exec turbo run typecheck --force` → 8/8 tareas, 0 cached.
- [x] `pnpm exec turbo run lint --force` → 6/6 tareas, 0 cached.
- [x] `corepack pnpm docs:check` → 191 archivos, 426 enlaces, 0 rotos (tras esta actualización documental).
- [x] `corepack pnpm agents:check` → OK (10 agentes, 10 comandos, 6 skills, 43 specs, 43 filas de tablero).

## Revisión

- [x] Revisión independiente, primera iteración: **no apto** — 2 bloqueantes en `can()`/`isCircleOwner()`, 4 mayores y 7 menores.
- [x] Correcciones de bloqueantes y mayores aplicadas.
- [x] Re-revisión: **apto con correcciones menores**, sin bloqueantes ni mayores abiertos.
- [x] Menores cerrados y re-verificados.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.

## Cierre

- [x] Aceptación del usuario (2026-10-31).
- [ ] `done` (tras commit, merge y CI).
- [ ] Commit propuesto (sin ejecutar).
- [ ] Push (sin ejecutar).

Notas: rama actual `main`, sin commits de F06. F06 queda en `accepted`; no se marca `done` hasta el merge y el CI.
