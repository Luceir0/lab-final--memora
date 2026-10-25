# Tasks — F13 App shell y navegación adaptativa

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F11, F12.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] AppShell
- [ ] BottomNav (Círculos, Subir, Perfil)
- [ ] Sidebar (Mis círculos, Subidas, círculos, Ayuda, Privacidad)
- [ ] TopBar
- [ ] ThemeToggle
- [ ] Safe areas
- [ ] Skip link
- [ ] Estado activo

## Criterios de aceptación

- [ ] AC-01: Móvil usa bottom nav; escritorio sidebar.
- [ ] AC-02: Subir es alcanzable con el pulgar.
- [ ] AC-03: Safe areas respetadas.
- [ ] AC-04: Ruta activa con aria-current.
- [ ] AC-05: Skip link funciona.
- [ ] AC-06: No hay dos árboles duplicados.
- [ ] AC-07: Navegación con teclado.

## Verificación

- [ ] `pnpm --filter @memora/web test`
- [ ] `Revisar 375/768/1440`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
