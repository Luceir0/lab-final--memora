# Tasks — F37 Infraestructura de tests

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F06, F09.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Config Vitest
- [ ] Setup RTL
- [ ] MSW handlers
- [ ] Fixtures/factories
- [ ] BD de test
- [ ] Playwright desktop/mobile
- [ ] axe
- [ ] CI matrix
- [ ] Cobertura

## Criterios de aceptación

- [ ] AC-01: pnpm test ejecuta todos los niveles.
- [ ] AC-02: MSW reutiliza contratos.
- [ ] AC-03: Playwright arranca web+api.
- [ ] AC-04: axe corre en páginas clave.
- [ ] AC-05: CI reproduce local.
- [ ] AC-06: Cobertura se reporta.

## Verificación

- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `CI`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
