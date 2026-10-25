# Tasks — F34 Perfil y preferencias

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F16.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] ProfileCard
- [ ] Edición de nombre (email inmutable; avatar con iniciales)
- [ ] ThemeToggle
- [ ] InstallAppRow
- [ ] StorageMeter demo
- [ ] Logout
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: Editar nombre valida y guarda.
- [ ] AC-02: El email se muestra pero no se edita en el MVP.
- [ ] AC-03: El avatar usa iniciales; no hay subida en el MVP.
- [ ] AC-04: Tema persiste.
- [ ] AC-05: Instalar explica iOS/Android.
- [ ] AC-06: Almacenamiento marcado demo.
- [ ] AC-07: Logout redirige.

## Verificación

- [ ] `pnpm --filter @memora/web test profile`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
