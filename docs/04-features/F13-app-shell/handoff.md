# Handoff — F13 App shell y navegación adaptativa

- **Estado:** done (aceptada por el usuario el 2026-11-03; mergeada en `main` con la PR #16)
- **Rama:** `feat/F13-app-shell` (merge `2c2a587`, CI run `41610250888`)
- **Fecha:** 2026-11-03
- **Implementado por:** ui-dev (subagente)
- **Revisado por:** reviewer (G3, dos rondas: hallazgos y «apto»), auditoría de diseño (todos los hallazgos cerrados salvo VIS-07/VIS-08, asignados a F14) y auditoría de accesibilidad (sin bloqueantes ni mayores)

## Resultado

Ronda de corrección de F13 completa: barra inferior de 72 px + safe area con
altura única, línea base compartida y píldora activa solo en el icono; sidebar de
256 px con píldoras uniformes, lista de círculos entre «Subidas» y «Ayuda» y
tema compacto en el pie; orden de foco cabecera → navegación; `aria-current`
neutralizado en los logotipos; nombre accesible «Subir fotos» en móvil; insets
horizontales y `scroll-padding-top`; pruebas con router real y axe. Los 28 puntos
de la revisión quedan corregidos o documentados; no hubo ninguno fuera de
alcance.

## Cambios (archivos)

- `apps/web/src/components/layout/navigation.ts` — visibilidad de escritorio a
  `block`, sufijo accesible móvil para «Subir fotos».
- `apps/web/src/components/layout/primary-nav.tsx` — altura mínima (no fija) de
  la barra, ítems que crecen con el texto, `ResizeObserver` que publica la altura
  real en `--app-bottom-nav-height`, ranura de icono de 44 px, píldora móvil en
  el icono, ancho completo en escritorio, `max-w-sm` en tablet, lista de círculos
  como `<li>` con `<p>` entre Subidas y Ayuda, `aria-current` solo en destinos.
- `apps/web/src/components/layout/sidebar.tsx` — `<aside aria-label="Cuenta y
  navegación">`, pie con «Apariencia» + `ThemeToggle` compacto y bloque de cuenta
  de ancho completo con estado activo visible y «Página actual» oculto.
- `apps/web/src/components/layout/top-bar.tsx` — sin avatar; logo, tema compacto
  y safe areas/altura de cabecera.
- `apps/web/src/components/layout/app-shell.tsx` — `TopBar` antes que `Sidebar`
  en el DOM, grid de 16rem, `<main>` con `padding-bottom: var(--app-bottom-nav-height)`
  e insets horizontales.
- `apps/web/src/components/layout/logo.tsx` — `<a>` nativo con
  `aria-current="false"`, punto `size-2`, área táctil de 44 px y sin
  `tracking-tight`.
- `apps/web/src/components/layout/skip-link.tsx` — oculto por encima del
  viewport con `top-0`, visible al foco con inset superior, insets laterales.
- `apps/web/src/components/layout/section-placeholder.tsx`, `routes/_app.help.tsx`
  y `features/spike/circles-page.tsx` — retirado `tracking-wide`; retirada la
  tarjeta provisional de tema de `/circles`.
- `apps/web/src/styles/app.css` — `--app-topbar-height`,
  `--app-bottom-nav-min-height` (4.5rem) y `--app-bottom-nav-height` (altura real,
  inicialmente `calc(4.5rem + env(safe-area-inset-bottom))`), `scroll-padding-top`
  con reset en `lg`.
- `apps/web/src/components/layout/app-shell.test.tsx` — 15 tests del shell con
  axe, labels, orden, safe areas, cuenta activa y logotipos.
- `apps/web/src/components/layout/app-shell.router.test.tsx` — integración con
  `createRouter`/`RouterProvider` sobre `/help` y `/circles/abc?x=1`.
- `apps/web/src/routes/__root.test.ts` — aserción del `head` real de la raíz.
- `apps/web/src/routeTree.gen.ts` — regenerado por el build.
- `docs/04-features/F13-app-shell/tasks.md` y este `handoff.md`.

No se tocaron `packages/ui`, `apps/api`, `.env`, specs ni contratos. Sin
dependencias nuevas. Sin commit ni push.

## Verificación (comando → resultado real)

- `pnpm --filter @memora/web test` → **21 archivos, 114 tests, todos en verde**
  (incluye axe del shell, router real y `head` de la raíz).
- `pnpm --filter @memora/web lint` → **sin hallazgos**.
- `pnpm --filter @memora/web typecheck` → **sin errores**.
- `pnpm --filter @memora/web build` → **correcto**; prerenderiza `/help`,
  `/circles`, `/uploads`, `/profile` y `/privacy` sin errores.
- HTML prerenderizado de las 5 rutas → **1 `<nav>`**, **1 `aria-current` dentro
  del nav**, **2 logotipos con `aria-current="false"`**, 2 botones de tema en el
  documento (uno visible por breakpoint) y skip link presente.
- Axe en el shell (jsdom) → **0 violaciones e incompletas no dependientes de
  layout** (el helper desactiva `color-contrast` y filtra `target-size`; no es
  cobertura total de axe).
- Nombres accesibles medidos con el árbol AX de Chrome:
  - `/uploads` a 375 px → `Subir fotos`;
  - `/uploads` a 1024 px → `Subidas`;
  - cuenta en `/profile` a 1024 px → `Perfil y preferencias Página actual`;
  - botón de tema en el pie → `Apariencia: Oscuro. Cambiar a Sistema.`.

### Medición real en Chrome 156 headless (CDP)

Viewport móvil 375×812 y tablet 768×1024, claro y oscuro, sin insets:

| Medida | 375 | 768 |
| --- | --- | --- |
| Alto de barra | 72 px | 72 px |
| `padding-bottom` de `<main>` | 72 px | 72 px |
| Alto de cada ítem | 71 px (×3) | 71 px (×3) |
| Ancho de cada ítem | 119,7 px | 128 px |
| Ancho del `<ul>` | 359 px | 384 px (centrado) |
| `top` de las 3 etiquetas | 792,5 px (idéntico) | 1004,5 px (idéntico) |
| Alto de cabecera | 60 px | 60 px |
| `scroll-padding-top` | 60 px | 60 px |

Con insets emulados (`top:44 bottom:34 left:20 right:20`), 375×812, claro y oscuro:

| Medida | Resultado |
| --- | --- |
| Alto de barra | 106 px = 72 + 34 |
| `padding-bottom` de `<main>` | 106 px |
| Alto de cabecera | 104 px = 60 + 44 |
| `padding-left/right` de barra, cabecera y `<main>` | 20 px (máx. entre base e inset) |
| `scroll-padding-top` | 104 px |
| Etiquetas de los 3 destinos | `top` 758,5 px idéntico |
| Skip link sin foco | `bottom` −16 px (sin sliver visible) |
| Skip link con foco | `y` 60 px, alto 46 px, visible y enfocado |
| Skip → `<main>` | foco en `main-content`; `mainTop` 104 = `headerBottom` 104 |
| Contenido largo + probe al final | `probeBottom` 706 = `navTop` 706; solapamiento **0 px** |

Escritorio 1024×900 y 1440×1000, claro y oscuro:

| Medida | Resultado |
| --- | --- |
| Ancho del sidebar (`<aside>`) | 256 px (16rem) |
| Ancho de las píldoras (Mis círculos, Subidas, Ayuda, Privacidad) | 231 px todas |
| Alto de cada píldora | 44 px |
| Área táctil del logotipo | 97,6 × 44 px |
| Botón de tema en el pie | 44 × 44 px visible |
| Bloque de cuenta en `/profile` | 231 × 56 px; `bg` `#EEEBFE` claro / `#241F4D` oscuro; color `primary-text`; `aria-current="page"` |
| `aria-current` dentro del nav en `/profile` | 1 (ítem Perfil móvil, oculto en escritorio) |
| `navCurrentVisible` en escritorio `/profile` | `[]` (sin destino visible; el acceso es el bloque de cuenta, fuera del nav) |
| Toggle de tema | clic claro → oscuro; cookie `memora-theme=dark`; etiqueta actualizada |

Consola: 0 errores y 0 avisos de hidratación en las pasadas con cookie estable
(claro y oscuro).

### Zoom de texto al 200 % (WCAG 1.4.4)

La barra usa `min-height` y crece con las etiquetas; `<main>` reserva la altura
real publicada por `ResizeObserver`. Chrome headless no expone un zoom de texto
nativo (`Emulation.setEmulatedOSTextScale` no tuvo efecto en escritorio, ni con
UA Android; `Emulation.setPageScaleFactor` es zoom proporcional y no cambia el
layout CSS). Por eso se midieron dos escenarios: tamaño de fuente del navegador
al 200 % con `Page.setFontSizes` (nativo, escala `rem`) y zoom de texto puro
emulado con una hoja de estilos que duplica solo la tipografía de las etiquetas
(24 px / 32 px) sin tocar longitudes `rem`, que es el caso de fallo reportado.

| Escenario (375×812) | Barra | Etiquetas | `<main>` pb | Probe final |
| --- | --- | --- | --- | --- |
| Base | 72 px | 12 / 16 px, dentro | 72 px | — |
| Fuente del navegador 200 % (nativo) | 144 px | 24 / 32 px, dentro | 144 px | `probeBottom` 668 = `navTop` 668; 0 px |
| Texto puro 200 % (emulado) | **81 px** (mín. 72, contenido 80 + borde) | 24 / 32 px, dentro y sin recorte horizontal | **81 px** (`--app-bottom-nav-height: 81px`) | `probeBottom` 731 = `navTop` 731; 0 px |

- En el caso de texto puro, la variable pasó de 72 a **81 px** y el relleno de
  `<main>` la siguió; ninguna etiqueta («Círculos», «Subir», «Perfil») quedó
  recortada y el último enfocable quedó 0 px bajo la barra.
- A 320 px con texto al 200 %, la barra mide 81 px y «Círculos» ocupa 98,9 px
  dentro de un ítem de 101,3 px: sin desbordamiento.
- `Emulation.setPageScaleFactor(2)` no cambia las medidas CSS (zoom visual
  proporcional); no se usa como prueba del caso de fallo.

## Criterios de aceptación

- **AC-01.** **Estructural, pendiente de verificación en dispositivo.** Barra
  fija bajo `lg` (72 px + safe area) y sidebar desde `lg` (256 px), medidos en
  Chrome a 320/375/768/1024/1440. Falta dispositivo real.
- **AC-02.** **Estructural, pendiente de verificación en dispositivo.** «Subir»
  es el destino central, en la barra inferior, con ranura de 44 px y 119,7/128 px
  de ancho. El alcance físico del pulgar no se puede medir en headless.
- **AC-03.** **Estructural, pendiente de verificación en dispositivo.** Insets
  reales emulados por CDP (`safe-area-inset-*`): barra 106, cabecera 104, main
  106, laterales 20. Safe areas físicas (notch real y zoom) pendientes.
- **AC-04.** **Pasa.** Un `aria-current="page"` por navegación, verificado con
  test del shell, test de router real y HTML prerenderizado. Ver nota de
  `/profile` en escritorio.
- **AC-05.** **Estructural, pendiente de verificación en dispositivo.** Skip
  link primero, foco real en `<main>`, sin sliver oculto y sin quedar bajo la
  cabecera (Chrome). Falta teclado/dispositivo real.
- **AC-06.** **Pasa.** Un solo `<nav>`, cinco destinos únicos, sin dos árboles;
  un `<aside>` nombrado y un `<main>`.
- **AC-07.** **Estructural, pendiente de verificación en dispositivo.** Orden de
  foco cabecera → barra → contenido, enlaces nativos y foco visible. Recorrido
  manual pendiente.

## Correcciones de la revisión

| # | Hallazgo | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | F13-VIS-01 / A11Y-05 / VIS-04: etiquetas desalineadas y barra de 76 vs 72 | Corregido | Etiquetas `top` idéntico (792,5 / 1004,5 / 758,5); ítems 71 px; barra 72; main 72; con insets 106/106 |
| 2 | Último contenido tapado ~5 px | Corregido | Probe al final de contenido largo: `probeBottom` 706 = `navTop` 706, solapamiento 0 |
| 3 | F13-VIS-02: píldoras desiguales en escritorio | Corregido | 4 destinos a 231 px en 1024 y 1440 |
| 4 | VIS-05: píldora móvil icono+etiqueta | Corregido | Icono 44×44 con `primary-soft`; enlace transparente; `font-weight` 600 y color primario |
| 5 | VIS-04: ítems de 250 px a 768 | Corregido | `ul` 384 px centrado; ítems 128 px |
| 6 | VIS-06 / A11Y-12: círculos después de Ayuda y `<h2>` antes del `<h1>` | Corregido | `<li>` entre `/uploads` y `/help`; etiqueta `<p>`; cero `heading` dentro del nav |
| 7 | VIS-03 / A11Y-08: sin tema en escritorio | Corregido | Botón 44×44 visible en el pie a 1024/1440; clic cambia tema y cookie |
| 8 | A11Y-02: tabulador de abajo arriba | Corregido | `TopBar` antes de `Sidebar` en el DOM; skip → cabecera → nav → contenido; test de primer enfocable |
| 9 | A11Y-04: columna sin landmark | Corregido | `<aside aria-label="Cuenta y navegación">`; axe 0 violaciones |
| 10 | VIS-09: cuenta sin estado activo visible | Corregido | `bg-primary-soft` + `text-primary-text` en `/profile` (medido en claro y oscuro) |
| 11 | A11Y-01: `/profile` sin destino activo en el nav de escritorio | Documentado | El acceso es el bloque de cuenta, fuera del nav a propósito; `aria-current` del router + «Página actual»; sin quinto destino duplicado |
| 12 | F13-M-02: solo insets verticales | Corregido | Insets laterales 20 px en barra, cabecera y main con emulación; base 8/16/0 |
| 13 | F13-M-03: skip bajo cabecera sticky | Corregido | `scroll-padding-top` 60/104; skip oculto `bottom` −16 y visible al foco; `mainTop` = `headerBottom` |
| 14 | Avatar duplicado en `TopBar` | Corregido | Cabecera solo logo + tema; test sin enlace de perfil en el banner |
| 15 | `aria-current` en logotipos | Corregido | 2 `<a>` con `aria-current="false"`; test con router real |
| 16 | «Subir» ambiguo | Corregido | AX móvil «Subir fotos», escritorio «Subidas»; texto visible «Subir» intacto |
| 17 | Área táctil del logo ~32 px | Corregido | 97,6 × 44 px medidos |
| 18 | Valores fuera de escala | Corregido | `rg` sin `py-1.5`, `size-2.5`, `tracking-wide` ni `tracking-tight` en el shell; punto `size-2` |
| 19 | Sidebar 17rem | Corregido | 256 px medidos (16rem, dentro de 248–264) |
| 20 | Tarjeta provisional de tema en `/circles` | Corregido | Eliminada; build sin «Control provisional»; dos controles de tema (uno visible por breakpoint) |
| 21 | F13-M-04: falta integración con router real | Corregido | Test `/help` y `/circles/abc?x=1`: 1 nav, 1 `aria-current` en nav, 0 en logos |
| 22 | A11Y-09: falta axe | Corregido | `expectNoAxeViolations`: 0 violaciones e incompletas no dependientes de layout (sin `color-contrast`; `target-size` filtrado) |
| 23 | N-03: test que leía `__root.tsx` | Corregido | `__root.test.ts` llama al `head` real y comprueba `viewport-fit=cover` |
| 24 | tasks.md sobrevaloraba AC | Corregido | AC-01/02/03/05/07 sin marcar y con «estructural, pendiente de verificación en dispositivo» |
| 25 | handoff con «1 aria-current por ruta» y README | Corregido | Se habla de «1 por navegación»; README sí fue tocado por el orquestador (`in-progress`) |
| 26 | Pendientes de producto | Documentado | Badge de Subidas (F27), contenedor de escritorio (F14), cabeceras con tema (F14/F16) y verificación en dispositivo |
| 27 | Violeta en destinos inactivos | Documentado | Desviación aceptada: `muted`; `principles.md` reserva el violeta a acción principal y selección |
| 28 | WCAG 1.4.4: texto al 200 % recortado y `<main>` tapado | Corregido | `min-height` + `ResizeObserver`; texto puro 200 %: barra 81, main 81, 0 solape; fuente del navegador 200 %: 144/144, 0 solape; 320 sin desbordamiento |

## Pendiente

- Badge de contador de «Subidas»: F27.
- Contenedor de contenido de escritorio (anchos, paneles): F14.
- Cabeceras de página con `ThemeToggle variant="compact"` si F14/F16 mueven el
  control fuera del pie del sidebar.
- **Ubicación en móvil para `/help` y `/privacy`:** con los 3 destinos
  aprobados, esas dos rutas no tienen ningún destino activo en la barra inferior
  (Ayuda y Privacidad son solo de escritorio). F14 debe decidir si necesitan otra
  pista de ubicación (miga, título de contexto o cuarto destino) sin romper la
  decisión de producto.
- **Nombre del `<aside>` en móvil:** `«Cuenta y navegación»` describe el sidebar de
  escritorio, pero en móvil solo contiene la navegación (el pie de cuenta está
  oculto). Revisar el nombre en F14 si se mantiene el landmark en ambos
  breakpoints.
- **Logotipo como `<a>` nativo:** pierde la navegación SPA. Pendiente menor para
  F14/F16, que pueden valorar `Link` + `aria-current` neutralizado por otra vía.
- **Tests que afirman clases Tailwind** (`min-h-[calc(...)]`, `pb-[var(...)]`,
  `bg-primary-soft`, etc.): la geometría real se validó en Chrome; F37 debe
  convertir las mediciones clave (altura de barra, relleno de `<main>`, ancho de
  píldoras, solape 0 a 200 %) en tests de navegador.
- **`ThemeToggle variant="section"` no se monta en ninguna ruta:** queda
  reservada a Perfil (F34); F13 usa la variante compacta en todas las rutas.
- **Barrido de medición:** 320/375/768/1024/1440 con insets emulados; 390 y 1280
  no se midieron explícitamente.
- Verificación en dispositivo real: safe areas físicas, zoom de texto real al
  200/400 % y alcance del pulgar; recorrido manual de teclado y lector de
  pantalla.
- Aceptación del usuario (G4): **hecha el 2026-11-03**, sin cambios pedidos.

## Riesgos y limitaciones

- El logotipo es un `<a>` nativo (no `Link`) para poder neutralizar el
  `aria-current` que el router inyecta: una pulsación hace navegación completa.
  Es un intercambio consciente por la semántica; se puede revisar si F14 quiere
  conservar la navegación SPA y aceptar `aria-current` en el logo.
- Las etiquetas móvil/escritorio siguen siendo dos nodos con `display: none` por
  CSS. En jsdom ambos cuentan, por eso el nombre de «Subir» se resuelve con un
  sufijo `sr-only` («Subir fotos»). En navegador real el nombre es correcto en
  ambos breakpoints (verificado con el árbol AX).
- En las pasadas automatizadas aparecieron dos avisos de hidratación del entorno:
  uno al inyectar la cookie justo antes de navegar y otro al inyectar el bloque
  de 3000 px del test de solape y recargar con HMR. El stack del segundo muestra
  los nodos inyectados (`div` de 3000 px y probe), no un desajuste de la app. Con
  la cookie estable, en claro y oscuro, no se reprodujo ningún aviso
  (0 errores de consola). No se modificó `ThemeProvider`.
- El crawler de prerender sigue generando también `/circles` (ruta `ssr: false`):
  es un shell para hidratar. Valorar `crawl: false` en `vite.config.ts` si
  molesta; está fuera del alcance permitido.
- Quedan usos de `tracking-wide` en archivos fuera del shell (`not-found`,
  `route-error`, `help-content`, catálogo `/ui`); no se tocaron por ámbito.
- La verificación de safe areas usa la emulación de CDP, no hardware con notch.

## Desviaciones aceptadas

- **Destinos inactivos en `muted`, no violeta.** `docs/02-design/principles.md`:
  «El violeta se reserva para la acción principal y la selección». El mockup
  usa violeta en todos los ítems, pero el contrato manda; el estado activo se
  refuerza con píldora, color, peso y `aria-current`, nunca solo color.
- **Perfil en escritorio fuera del `<nav>`.** El acceso es el bloque de cuenta,
  como en el mockup; se refuerza con `aria-current` y «Página actual» sin añadir
  un quinto destino duplicado al sidebar.
- **`/help` y `/privacy` sin destino activo en móvil.** Con los 3 destinos
  aprobados (Círculos · Subir · Perfil), Ayuda y Privacidad son solo de
  escritorio; en móvil esas rutas no marcan un destino activo en la barra. Es una
  consecuencia autorizada de la decisión de producto, no un fallo de
  `aria-current` (el nav conserva exactamente un ítem marcado en el DOM, oculto).
  F14 decide si hace falta otra pista de ubicación.

## Documentación actualizada

- `docs/04-features/F13-app-shell/tasks.md` — correcciones, AC cualificados y
  verificación real.
- `docs/04-features/F13-app-shell/handoff.md` — este documento.
- `docs/04-features/README.md`, `docs/06-process/ai-log.md` y
  `docs/07-curriculum/coverage-map.md` — actualizados por docs-scribe (tablero,
  bitácora y cobertura).

## Siguiente paso propuesto

F14 — PWA e instalación (depende de F10 y F13, ya cerradas): monta la lista real
de círculos en `circleList` y el contenedor de contenido de escritorio. Antes de
abrirla, confirmar el plan y el nivel de auditoría (C) con el usuario.
