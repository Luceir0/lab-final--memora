# Tasks — F11 UI kit I: controles y datos

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F10.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Button, IconButton, LinkButton
- [ ] TextField, TextArea, SearchField
- [ ] Checkbox, Switch, SegmentedControl
- [ ] Avatar, AvatarGroup, Badge, Chip
- [ ] Card, ProgressBar, Spinner, Skeleton

## Criterios de aceptación

- [ ] AC-01: Cada componente tiene estados y accesibilidad.
- [ ] AC-02: Button usa button real y aria-busy.
- [ ] AC-03: TextField asocia label/hint/error.
- [ ] AC-04: Checkbox/Switch usan controles nativos o roles correctos.
- [ ] AC-05: Avatar tiene alt o iniciales.
- [ ] AC-06: ProgressBar tiene progressbar y label.
- [ ] AC-07: Tests por rol.

## Verificación

- [ ] `pnpm --filter @memora/ui test`
- [ ] `pnpm typecheck`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
