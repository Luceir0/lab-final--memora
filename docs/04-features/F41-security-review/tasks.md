# Tasks — F41 Revisión de seguridad

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F38 (excepción autorizada el 2026-11-08; F38 en `draft`).
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.

## Implementación

- [x] Tests negativos
- [x] CSRF
- [x] Rate limit
- [x] Headers
- [x] Uploads maliciosos
- [x] Acceso cruzado
- [x] Secretos
- [x] Logs
- [x] Dependencias

## Criterios de aceptación

- [x] AC-01: Checklist completo.
- [x] AC-02: Tests negativos pasan.
- [x] AC-03: Sin secretos en repo.
- [x] AC-04: Logs redactados.
- [x] AC-05: Headers correctos (en local; HSTS/TLS no probados).
- [x] AC-06: Informe con riesgos.

## Verificación

- [x] `pnpm test` (API 424 passed + 2 skipped; web 910 passed).
- [x] `pnpm audit` (2 moderadas aceptadas y documentadas).

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto (sin ejecutar).
