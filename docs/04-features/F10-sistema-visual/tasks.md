# Tasks — F10 Sistema visual y tema

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F09.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] tokens.css
- [ ] @theme de Tailwind 4
- [ ] data-theme
- [ ] Resolución de sistema en servidor
- [ ] Cookie de tema
- [ ] theme-color
- [ ] Plus Jakarta Sans
- [ ] Lucide
- [ ] Focus visible
- [ ] prefers-reduced-motion

## Criterios de aceptación

- [ ] AC-01: Los tokens se usan vía utilidades Tailwind.
- [ ] AC-02: No hay hex sueltos en componentes.
- [ ] AC-03: El tema persiste en cookie.
- [ ] AC-04: Sistema sigue prefers-color-scheme.
- [ ] AC-05: No hay destello al cargar.
- [ ] AC-06: theme-color cambia con el tema.
- [ ] AC-07: Funciona con reduced motion.

## Verificación

- [ ] `pnpm --filter @memora/ui test`
- [ ] `pnpm --filter @memora/web test`
- [ ] `Revisar en claro/oscuro`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
