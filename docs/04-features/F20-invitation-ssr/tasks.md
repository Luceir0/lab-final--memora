# Tasks — F20 Invitación SSR + compartir

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F16, F19.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Ruta SSR
- [ ] Open Graph
- [ ] Preview mínima
- [ ] Web Share/copy
- [ ] Estados inválida/caducada/ya miembro
- [ ] Redirect tras login
- [ ] Aceptar

## Criterios de aceptación

- [ ] AC-01: SSR genera OG con nombre del círculo.
- [ ] AC-02: No muestra fotos/miembros.
- [ ] AC-03: Compartir/copiar funciona.
- [ ] AC-04: Login conserva token.
- [ ] AC-05: Aceptar une al círculo.
- [ ] AC-06: Estados caducada/revocada/ya miembro.
- [ ] AC-07: Open Graph validado.

## Verificación

- [ ] `pnpm --filter @memora/web test invitations`
- [ ] `curl -s /invite/token | rg "og:"`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
