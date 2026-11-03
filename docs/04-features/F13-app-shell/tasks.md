# Tasks — F13 App shell y navegación adaptativa

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F11, F12.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación. (El usuario aprobó el plan y las dos decisiones de navegación y pantallas provisionales.)

## Implementación

- [x] AppShell
- [x] BottomNav (Círculos, Subir, Perfil)
- [x] Sidebar (Mis círculos, Subidas, círculos, Ayuda, Privacidad)
- [x] TopBar
- [x] ThemeToggle (variante compacta)
- [x] Safe areas
- [x] Skip link
- [x] Estado activo
- [x] Tema compacto en el pie del sidebar (escritorio)

## Correcciones de la revisión (2026-11-03)

- [x] Barra inferior: altura única de 72 px + safe area para barra y `<main>`.
- [x] Barra inferior: ranura de icono de 44 px en los tres destinos; línea base compartida.
- [x] Barra inferior: ancho interno limitado en tablet (`max-w-sm`).
- [x] Sidebar: píldoras de ancho completo e iguales en todos los destinos.
- [x] Estado activo: píldora móvil solo en el icono; fila completa en escritorio.
- [x] Lista de círculos entre «Subidas» y «Ayuda», como `<li>` con etiqueta `<p>`.
- [x] Tema compacto en el pie del sidebar; retirado el duplicado del spike.
- [x] `TopBar` antes que la barra en el DOM; retirado el avatar de la cabecera móvil.
- [x] `aria-current="false"` en los logotipos; `aria-current` real solo en destinos con significado.
- [x] Nombre accesible «Subir fotos» en móvil sin cambiar la etiqueta visible.
- [x] Área táctil del logotipo ≥ 44 px.
- [x] Valores fuera de escala eliminados (`py-1.5`, `size-2.5`, `tracking-wide`, `tracking-tight`).
- [x] Sidebar a 16rem y `aside` con nombre propio «Cuenta y navegación».
- [x] Estado activo visible en el bloque de cuenta de `/profile`.
- [x] Insets horizontales en barra, cabecera y `<main>`; `scroll-padding-top` de la cabecera.
- [x] Tests: router real, axe y `head` de la raíz sin leer el archivo fuente.
- [x] WCAG 1.4.4: barra con `min-height` (crece con el texto), `<main>` con la altura real vía `ResizeObserver` y comprobación a 200 % de texto.

## Criterios de aceptación

- [ ] AC-01: Móvil usa bottom nav; escritorio sidebar. **Estructural, pendiente de verificación en dispositivo.**
- [ ] AC-02: Subir es alcanzable con el pulgar. **Estructural, pendiente de verificación en dispositivo.**
- [ ] AC-03: Safe areas respetadas. **Estructural, pendiente de verificación en dispositivo** (medido con insets emulados en Chrome; falta hardware real).
- [x] AC-04: Ruta activa con aria-current. Verificado con test y HTML prerenderizado: 1 por navegación. En móvil `/help` y `/privacy` no tienen destino activo visible (decisión de 3 destinos; ver handoff).
- [ ] AC-05: Skip link funciona. **Estructural, pendiente de verificación en dispositivo**; el foco y la posición se comprobaron en Chrome.
- [x] AC-06: No hay dos árboles duplicados. Un `<nav>`, cinco destinos únicos y un `aside` con nombre.
- [ ] AC-07: Navegación con teclado. **Estructural, pendiente de verificación en dispositivo**; orden de foco y foco visible comprobados en Chrome.

## Verificación

- [x] `pnpm --filter @memora/web test` → 21 archivos, 114 tests, todos en verde.
- [x] `pnpm --filter @memora/web lint` → sin hallazgos.
- [x] `pnpm --filter @memora/web typecheck` → sin errores.
- [x] `pnpm --filter @memora/web build` → build correcto y 5 páginas prerenderizadas.
- [x] Medición real en Chrome 156 headless a 375/768/1024/1440, claro y oscuro, con insets emulados y skip link.
- [x] Zoom de texto al 200 %: texto puro emulado → barra 81 px, main 81 px, etiquetas dentro y 0 solape; fuente del navegador 200 % → 144/144 y 0 solape; 320 px sin desbordamiento.
- [ ] `Revisar 375/768/1440` en dispositivo real (safe areas físicas, zoom real y alcance del pulgar).

## Notas para F14/F37

- `/help` y `/privacy` no tienen destino activo visible en la barra móvil de 3 destinos; F14 decide si necesitan otra pista de ubicación.
- El `<aside>` «Cuenta y navegación» solo contiene la navegación en móvil (pie oculto): revisar el nombre.
- El logotipo `<a>` nativo pierde la navegación SPA; pendiente menor para F14/F16.
- Varios tests del shell afirman clases Tailwind; F37 debe llevar la geometría real (altura de barra, relleno de main, píldoras y solape 0 al 200 %) a tests de navegador.
- Axe en jsdom no cubre `color-contrast` ni `target-size`; la afirmación correcta es «0 violaciones e incompletas no dependientes de layout».

## Cierre

- [x] Revisión independiente (dos rondas: reviewer y auditorías de diseño y accesibilidad).
- [x] Aceptación del usuario (2026-11-03).
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit, PR y merge (PR #16, merge `2c2a587`, CI `41610250888`).
