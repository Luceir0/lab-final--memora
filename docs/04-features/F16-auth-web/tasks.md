# Tasks — F16 Auth web

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F13, F15.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] LoginForm
- [ ] RegisterForm
- [ ] AuthLayout
- [ ] RHF + Zod
- [ ] Errores
- [ ] Autocomplete
- [ ] Redirect
- [ ] Rutas SSR

## Criterios de aceptación

- [ ] AC-01: Formularios etiquetados y accesibles.
- [ ] AC-02: Validación cliente y servidor con el mismo schema.
- [ ] AC-03: Errores comprensibles y no filtran existencia.
- [ ] AC-04: Autocomplete correcto.
- [ ] AC-05: Teclado móvil no tapa botón/errores.
- [ ] AC-06: Tras login vuelve a redirect o /circles.
- [ ] AC-07: SSR funciona.

## Verificación

- [ ] `pnpm --filter @memora/web test auth`
- [ ] `Revisar 390x844`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
