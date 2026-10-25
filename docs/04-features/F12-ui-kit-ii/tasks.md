# Tasks — F12 UI kit II: overlays y feedback

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F10.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Dialog, ConfirmDialog
- [ ] BottomSheet, ResponsiveDialog
- [ ] Menu, Tabs, Accordion
- [ ] Toast, InlineAlert
- [ ] EmptyState, Breadcrumb, Tooltip
- [ ] VisuallyHidden

## Criterios de aceptación

- [ ] AC-01: Dialog tiene aria-modal, foco inicial y retorno.
- [ ] AC-02: BottomSheet tiene alternativa con botón.
- [ ] AC-03: Menu funciona con flechas y Esc.
- [ ] AC-04: Tabs usa tablist/tab/tabpanel.
- [ ] AC-05: Accordion usa aria-expanded/controls.
- [ ] AC-06: Toast es status; error es alert.
- [ ] AC-07: axe sin errores.

## Verificación

- [ ] `pnpm --filter @memora/ui test`
- [ ] `Revisar con teclado`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
