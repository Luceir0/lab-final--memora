# Tasks — F06 Contratos compartidos y permisos

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F05.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Esquemas Zod 4 de auth, círculos, álbumes, fotos, tags, invitaciones, descargas y actividad
- [ ] DTOs con z.infer
- [ ] ErrorResponse y ApiResult
- [ ] Paginación por cursor
- [ ] Función can() pura
- [ ] Tests unitarios

## Criterios de aceptación

- [ ] AC-01: Cada endpoint del contrato tiene request/response Zod.
- [ ] AC-02: Los DTOs no exponen objectKey ni tokens.
- [ ] AC-03: can() cubre owner/member × flags × acciones.
- [ ] AC-04: Los errores tienen code/message/details.
- [ ] AC-05: La paginación es genérica y testeada.
- [ ] AC-06: No hay any.

## Verificación

- [ ] `pnpm --filter @memora/shared test`
- [ ] `pnpm typecheck`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
