# Handoff — F22 People web

- **Estado:** accepted
- **Rama:** `feat/F22-people-web` (árbol sin commitear)
- **Fecha:** 2026-11-04 / aceptación 2026-11-05
- **Implementado por:** agentes de la sesión con el orquestador (web, UI y API)
- **Revisado por:** `reviewer` independiente (nivel **A**, dos rondas), auditoría de accesibilidad en navegador (tres rondas) y `design-auditor` independiente **con visión** (2026-11-05)
- **Aceptado por:** el usuario el **2026-11-05**, en escritorio y móvil, claro y oscuro, tras las correcciones G4-01 a G4-07. G5 (commits, PR y merge) pendiente.

## Resultado

Personas está implementada sobre la API real de F21: el detalle del círculo se divide en un layout con chrome compartido —migas, héroe, cabecera compacta, pestañas y modal de invitar— y dos secciones que solo aportan contenido (Álbumes y Personas). El layout evita remontar el héroe y el modal al cambiar de pestaña (M-01, aceptada el 2026-11-05) y `TabLinks` navega con URL real, `aria-current="page"` y Ajustes deshabilitado con razón accesible.

La revisión independiente de nivel **A** necesitó dos rondas: la primera fue **no apto** por **B-01** (el enlace del correo de invitación apuntaba a `/invitations/<token>` y daba 404) y **M-01** (chrome en el layout contra la spec), más m-02 a m-06 y n-07 a n-10. La segunda fue **apto con correcciones**, con solo **D-01 del reviewer** (este cierre documental) y dos nits ya cerrados. La auditoría de accesibilidad en Chrome 156 headless con CDP y axe-core 4.14.0 dio **0 violaciones** en 8 pasadas y cerró H-01 a H-08 en tres rondas.

La sesión de continuación del 2026-11-05 cerró los huecos que la anterior dejó abiertos: la **auditoría de diseño ya no es textual**. Se abrieron los tres PNG canónicos y 16 capturas reales, un `design-auditor` independiente emitió **apto con correcciones** (sin bloqueantes: 2 mayores, 3 menores y 2 nits) y los dos mayores y los tres menores se corrigieron y se verificaron después en navegador. Los estados vacío, de carga, el 429 real y la vista de `member` también se comprobaron en navegador, con **12 pasadas de axe sin violaciones** y consola limpia.

La **aceptación (G4) del 2026-11-05** no cerró la feature en la primera pasada: el usuario revisó la pantalla y pidió **siete correcciones** de producto y de coherencia visual. Todas se aplicaron y verificaron: card «Pendientes» visible con 0 para el owner, `member` a ancho completo, alineación vertical de la columna derecha, acciones del héroe abajo a la derecha, sidebar con el círculo resaltado en ambas secciones y un único `aria-current`, migas con la sección siempre y «Tus círculos» con el destacado incluido. Web sube a **378 tests** y el total a **1062**, con las **4 pasadas nuevas de axe** y 0 violaciones.

Tras esa ronda, el usuario probó F22 en escritorio y móvil, en claro y oscuro, y **aceptó la feature el 2026-11-05**. El estado es **`accepted`**, no `done`: queda el **G5** (commits, PR y merge), que no se ejecuta sin permiso.

## Cambios

### Componente compartido

- `packages/ui/src/components/tab-links.tsx`: `nav` con enlaces reales, `aria-current="page"`, Ajustes como `role="link"` + `aria-disabled` + razón en `VisuallyHidden` **fuera** del scroller, 42 px de alto (`min-h-[2.625rem]`), contador en píldora de 20 px (`h-5 min-w-5 px-1 rounded-full tabular-nums`) y `revealOnFocus` con `scrollIntoView` cuando la pestaña enfocada sale del área visible.
- `packages/ui/src/components/tab-links.test.tsx`: 11 tests.
- `packages/ui/src/index.ts`: export del componente.

### Detalle del círculo

- `apps/web/src/routes/_app.circles.$circleId.tsx`: ruta SPA (`ssr: false`) que monta `CircleDetailLayout` alrededor del `<Outlet/>`.
- `apps/web/src/features/circles/circle-detail-layout.tsx`: query del detalle, gates 401/404/error/carga, `CircleDetailProvider`, migas, héroe, `CircleCompactHeader`, `CircleSectionNav` y `InviteDialog`; el héroe y el modal no se remontan al cambiar de pestaña.
- `apps/web/src/routes/_app.circles.$circleId.index.tsx` (Álbumes) y `_app.circles.$circleId.people.tsx` (Personas): solo contenido.
- `circle-detail-context.tsx`, `circle-section-nav.tsx` (con `sectionNavigationState`), `use-section-focus.ts` (con `useSectionFocusRequest`), `link-click.ts` y `paths.ts`.
- `circle-detail-hero.tsx`: pendientes del owner junto a la última subida; `circle-compact-header.tsx`.
- `circle-detail-page.tsx`: queda como sección Álbumes; se elimina `circle-detail-tabs.tsx` y el árbol no contiene `circle-section-header.tsx`.
- `apps/web/src/styles/app.css`: alturas del chrome sticky (`--app-circle-compact-header-height`, `--app-circle-section-nav-height`) y `scroll-padding` para que el foco no quede tapado por la cabecera compacta, las pestañas y la barra inferior.
- `apps/web/src/routes/_app.tsx`: subnav del sidebar por sección (`isCircleSectionPath`).

### Personas

- `apps/web/src/features/members/people-page.tsx`, `member-list.tsx`, `invite-form.tsx`, `pending-invitations.tsx`, `untagged-card.tsx`, `queries.ts` y `format.ts`.
- `member-list.tsx`: lista en móvil y tabla semántica en escritorio (Persona, Rol, Aparece en, Se unió, acciones), con total en la cabecera de escritorio (m-02) y sin email.
- `invite-form.tsx`: `InviteDialog` con `ResponsiveDialog`, email opcional, copiar/compartir el enlace `/invite/:token` y errores 400/429 sin perder contexto.

### Correcciones de la auditoría de diseño (2026-11-05)

- `packages/ui/src/components/tab-links.tsx` (**D-01, Mayor**): `px-2` y `gap-1` en móvil (`sm:px-3`, `sm:gap-1.5`), conservando 42 px de alto y la píldora de 20 px. Medido a 375: `scrollWidth` 359 = `clientWidth` 359, sin desborde; «Ajustes» se lee completa.
- `apps/web/src/features/circles/circle-cover.tsx` (**D-02, Mayor**): callback `onImageError` para saber si la portada cargó.
- `apps/web/src/features/circles/circle-detail-hero.tsx` (**D-02, Mayor**): el scrim de escritorio solo se pinta con foto cargada; con la reserva, texto normal y degradado legible (antes ≈1,2:1 sobre las iniciales).
- `apps/web/src/features/members/people-page.tsx` (**D-03, Menor**): `lg:max-w-4xl` (56 rem) cuando no hay pendientes; con pendientes se mantiene la rejilla de dos columnas. Medido 894 px en escritorio. **Sustituido en la aceptación** por el ancho completo del `member` (G4-02).
- `apps/web/src/features/members/member-list.tsx` (**D-04, Menor**): hueco fijo `size-11` para la acción en todas las filas móviles, tenga o no menú; contadores de fotos alineados.
- `apps/web/src/features/members/untagged-card.tsx` (**D-05, Menor**): `bg-surface` con `border-border` normal, como la card blanca del diseño; antes usaba `surface-2`.
- Tests actualizados o añadidos: `packages/ui/src/components/tab-links.test.tsx`, `apps/web/src/features/circles/circle-detail-layout.test.tsx` y `apps/web/src/features/members/people-page.test.tsx`.
- Nits abiertos: **D-06** («días» parte de línea en la meta de una pendiente en escritorio) y **D-07** (skeleton de carga genérico, probablemente el fallback previo a la hidratación).

### Correcciones de la aceptación (2026-11-05)

El usuario revisó la feature en G4 y pidió siete ajustes. Todos están aplicados y verificados; detalle con medida y causa en la [spec](spec.md#correcciones-de-la-aceptación-2026-11-05).

- **G4-01 — Pendientes con 0.** En escritorio la card «Pendientes» del owner se muestra también sin invitaciones: «Pendientes 0», badge y textos suaves, «No hay invitaciones pendientes» en `text-muted`, fondo `surface-2` y borde normal. En móvil la sección sigue oculta si está vacía.
- **G4-02 — Member a ancho completo.** Se retira el `lg:max-w-4xl` de la ronda de diseño; un `member` no tiene columna derecha y la tabla ocupa todo el ancho (1118 px dentro de 1184). El owner mantiene `1fr + 22rem` aunque haya 0 pendientes.
- **G4-03 — Alineación de la columna derecha.** El borde superior del aside de pendientes coincide con el de la primera card izquierda: 549 = 549 px en Danza y 533 = 533 en Familia Ferrer. Causa: el `mt-6` de la card de etiquetas frente al aside sin margen.
- **G4-04 — Acciones del héroe abajo.** «Invitar» y «Nuevo álbum» quedan alineados con el borde inferior de la nota de álbumes respetando `lg:p-8`: bottom de acciones 402 = bottom de la nota 402, héroe 434. Móvil intacto. Causa: la nota quedaba fuera de la fila flex.
- **G4-05 — Sidebar coherente.** El nombre del círculo se resalta en Álbumes y en Personas (`bg-primary-soft font-semibold text-primary-text`) y la sección actual va en negrita sin píldora. Un único `aria-current="page"`: en el overview lo lleva el círculo y en Personas el enlace de Personas (`activeOptions={{ exact: true }}`).
- **G4-06 — Migas con la sección.** «Mis círculos / Danza / Álbumes» y «Mis círculos / Danza / Personas».
- **G4-07 — «Tus círculos» con el destacado.** La lista incluye también el círculo destacado: 2 cards + «Crear un círculo» y el contador «2 círculos» cuadra. Antes `rest` filtraba el destacado y con 2 círculos solo se pintaba uno.
- Tests de la ronda: `people-page.test.tsx` (Personas y ancho), `circle-detail-layout.test.tsx` (migas) y `circle-sidebar-nav.test.tsx` (sidebar); `pnpm --filter @memora/web test circle-detail` → 17 en 2 archivos.

### Correcciones transversales

- `packages/ui/src/components/bottom-sheet.tsx`: padding lateral `px-4` en móvil y `px-1` en el cuerpo para que el anillo de foco de los inputs del modal no se recorte (afecta a todas las hojas).
- `apps/web/src/components/layout/skip-link.tsx`: **H-03**, el skip link queda visible al foco con zoom de texto; es un bug del shell de F13, fuera del alcance original de F22.
- `apps/api/src/modules/invitations/routes.ts`: **B-01**, el enlace del email pasa a `/invite/<token>`; sin cambio de contrato de API. Test de regresión en `invitations.test.ts`.

### Semilla (F07)

- `apps/api/prisma/seed.ts`: «Familia Ferrer» y «Danza» (hereda la configuración de solo lectura); «Viaje a Lisboa» desaparece como círculo y sus fotos pasan a «Familia Ferrer» como álbum «Lisboa en primavera».
- `apps/api/src/db.integration.test.ts`: re-seed idempotente y renombrado en sitio del círculo heredado.

## Verificación

Ejecutada por el orquestador y los agentes. Resultados reales:

```text
DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm test
→ 8/8 tareas, 1062 tests
  @memora/shared    145 tests (5 archivos)
  @memora/api-client 39 tests (3 archivos)
  @memora/ui        281 tests (14 archivos)
  @memora/web       378 tests (54 archivos)
  @memora/api       219 tests (12 archivos)
  sin skips

pnpm typecheck   → 9/9
pnpm lint        → 6/6
pnpm format:check → limpio
pnpm build       → 5/5, con /help, /circles, /profile, /privacy y /uploads prerenderizadas
pnpm agents:check → 43 specs, 43 filas
pnpm --filter @memora/web test members → 51 tests en 3 archivos
pnpm --filter @memora/web test circle-detail → 17 tests en 2 archivos
pnpm --filter @memora/web test circle-list → 9 tests
pnpm --filter @memora/web test sidebar → 6 tests
pnpm --filter @memora/ui test tab-links → 11 tests
```

La web pasa de 377 a 378 tests; el acumulado de la rama es 373 → 378.

### Verificación en navegador de estados (2026-11-05)

Chrome 156.0.8078.80 headless + CDP + axe-core 4.14.0:

- **12 pasadas de axe, 0 violaciones**: Personas móvil y escritorio en claro, móvil y escritorio en oscuro, estado vacío, vista `member`, modal móvil claro, modal oscuro a 320, modal de escritorio, modal con 429 y las cuatro pasadas posteriores a las correcciones. Consola sin errores ni warnings.
- **429 real inducido**: en el 10.º envío el modal muestra «No hemos podido crear la invitación / Demasiadas peticiones…», conserva el correo escrito y el contexto del héroe. Después se borraron las 10 invitaciones de prueba (`rate-limit-*@memora.test`) de la base de desarrollo, con permiso del usuario.
- **Vacío**: Danza (0 fotos, 0 etiquetas) muestra «Aún no hay nadie etiquetado». **Carga**: skeleton capturado con latencia emulada de 3 s.
- **Vista de `member`** (Mateo): sin botón Invitar, sin sección de pendientes y sin acciones de quitar; 0 violaciones de axe.
- **Cabecera compacta** confirmada a 375×420 al superar el héroe; a 812 no se activaba porque con 3 miembros la página no da para tanto scroll.
- **Ronda de aceptación (2026-11-05): 4 pasadas nuevas, 0 violaciones**: Danza owner con 0 pendientes en claro y oscuro, Familia Ferrer owner en claro y `member` a ancho completo. Consola limpia. Capturas nuevas: 40 y 41 (Danza owner 0 pendientes), 42 (Familia owner), 45 (lista con 2 círculos), 46 (member a ancho completo) y 47 (móvil owner); temporales, no versionadas.
- Capturas en `C:/Users/lucia/AppData/Local/Temp/opencode/f22-audit/shots/` (temporales, no versionadas). Las de la ronda anterior: 19-mobile-light-fixed, 20-mobile-compact-fixed, 21-desktop-light-fixed, 22-desktop-dark-fixed, 23-empty-mobile-fixed y 24-member-desktop-light-fixed.

### Auditoría de diseño con visión (2026-11-05)

El motor abrió los tres PNG canónicos y 16 capturas reales de la implementación. Veredicto de un `design-auditor` independiente: **apto con correcciones**, sin bloqueantes. Los identificadores `D-0x` de esta tabla son de la auditoría de diseño y no coinciden con el `D-01` del reviewer.

| ID | Severidad | Hallazgo | Estado |
| --- | --- | --- | --- |
| D-01 | Mayor | «Ajustes» se cortaba a «Ajus» a 375 px | Corregido; medido 359 = 359 sin desborde |
| D-02 | Mayor | Portada de reserva del héroe de escritorio ilegible (scrim sobre iniciales, ≈1,2:1) | Corregido y verificado en claro y oscuro |
| D-03 | Menor | Vista de `member` sin pendientes con la tabla a todo el ancho | Corregido con `lg:max-w-4xl`, medido 894 px; **sustituido en la aceptación**: `member` a ancho completo (G4-02) |
| D-04 | Menor | Contadores de fotos desalineados en móvil | Corregido con hueco fijo `size-11` |
| D-05 | Menor | Card de etiquetas en `surface-2` gris en vez de card blanca | Corregido a `bg-surface` |
| D-06 | Nit | «días» parte de línea en la meta de una pendiente en escritorio | Abierto |
| D-07 | Nit | Skeleton de carga genérico | Abierto; probablemente el fallback previo a la hidratación |

Después de esta auditoría, la aceptación del mismo día añadió las correcciones G4-01 a G4-07, entre ellas el cambio de D-03.

Cierre documental (2026-11-05), tras estas ediciones:

```text
pnpm docs:check   → 191 archivos, 510 enlaces, 0 rotos
pnpm agents:check → 43 specs, 43 filas
```

### Accesibilidad en navegador

Chrome 156 headless + CDP + axe-core 4.14.0, a 375 y 1440, claro y oscuro, más 320, error y modal:

- **Primera ronda:** 0 violaciones en 8 pasadas y tres mayores: H-01 reflow de `TabLinks` (`scrollWidth` 384 a 375 y 320), H-02 contador de 20 px que no admite `100+` ni `1.240` y H-03 skip link invisible al foco (bug del shell, F13). También H-04 (CTA tapada por la barra a 320×640), H-05 (anillo recortado), H-06 (fila de miembro desborda al 200 %), H-07 (pestañas desaparecen al 200 %) y H-08 (40 px).
- **Segunda ronda:** H-01, H-02, H-03, H-04, H-07 y H-08 cerrados; H-05 parcial y H-06 abierto.
- **Tercera ronda:** H-06 cerrado (`document.scrollWidth === innerWidth` al 200 %) y H-05 cerrado en Chrome a 375 y 320 (`scrollLeft` 37/92, 4 px de margen, anillo completo y sin scroll de página).

Contraste medido: `primary-text`/`primary-soft` 6,70/6,45; `primary-text`/`surface-active` 6,16/5,21; `on-primary`/`viewer-bg` 19,76; `muted`/`surface` 6,10; anillo 3,40–3,97 en claro y 4,76 en oscuro.

## Criterios de aceptación

Todos verificados y **aceptados por el usuario el 2026-11-05** en escritorio y móvil, claro y oscuro.

| AC | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 | Pasa | Héroe compartido en `CircleDetailLayout` para Álbumes y Personas, con pendientes del owner y sin cabecera reducida; test «usa el héroe compartido, migas y navegación de sección»; cabecera compacta confirmada en navegador a 375×420, portada de reserva legible tras D-02 y acciones alineadas abajo con la nota (G4-04: 402 = 402) |
| AC-02 | Pasa | Lista móvil y tabla de escritorio con Rol ensanchado, Persona ajustada y total en la cabecera; RTL de `member-list`; contadores alineados en móvil (D-04); un `member` usa todo el ancho, medido 1118 px en 1184 (G4-02), y el owner conserva `1fr + 22rem` |
| AC-03 | Pasa, con 429 real | `ResponsiveDialog` desde héroe y desde «Invitar a alguien», sin card, copiar/compartir y errores sin perder contexto. **Tras B-01**, el correo enlaza a `/invite/<token>`, con test de regresión en la API. **El 2026-11-05 se indujo el 429 real**: al 10.º envío el modal muestra «No hemos podido crear la invitación / Demasiadas peticiones…», conserva el correo y el contexto del héroe |
| AC-04 | Pasa, con navegador y G4 | Solo el owner ve Invitar y pendientes; el `member` no las pide (0 peticiones de invitaciones). Vista de `member` (Mateo) auditada en navegador: sin Invitar, sin pendientes, sin acciones de quitar y 0 violaciones de axe. En escritorio el owner ve la card «Pendientes 0» y en móvil se oculta si está vacía (G4-01) |
| AC-05 | Pasa | Pestaña con `stats.membersCount`, héroe con pendientes del owner, total en móvil y escritorio (m-02), `photosCount` por miembro y «100+»; la lista «Tus círculos» pinta todos los círculos, destacado incluido, y su contador cuadra (G4-07) |
| AC-06 | Pasa, con navegador | Skeletons, error con reintento, 404 de miembros y card de etiquetas sin drop-zone (ahora card blanca, D-05); **vacío y carga capturados en navegador**, el vacío con Danza (0 fotos, 0 etiquetas) y la carga con latencia emulada de 3 s |
| AC-07 | Pasa | Quitar con confirmación, 409 del owner y 403/404 sin romper la lista; sin acciones para un `member`; sin email |
| AC-08 | Pasa, con G4 | `nav` + enlaces + `aria-current="page"`, Ajustes con `aria-disabled` y razón accesible fuera del scroller, 42 px, contador en píldora y `revealOnFocus`; `tab-links.test.tsx` (11). A 375 px el scroller no desborda (359 = 359) y «Ajustes» se lee completa (D-01). Sidebar: círculo resaltado en Álbumes y Personas, sección en negrita sin píldora y un único `aria-current="page"` (G4-05); migas con la sección (G4-06) |

## Pendiente

- **Lector de pantalla real** (NVDA/VoiceOver/TalkBack) no ejecutado; axe no lo sustituye.
- **Zoom de texto al 200 %** en la nav sticky no vuelto a medir: puede crecer por encima de `--app-circle-section-nav-height`.
- **`[Nit]` D-06**: «días» parte de línea en la meta de una invitación pendiente en escritorio. Sin corregir.
- **`[Nit]` D-07**: el skeleton de la captura de carga es genérico; probablemente es el fallback previo a la hidratación. Sin corregir.
- El anillo de foco de la última pestaña quedaba a **0 px** del borde del scroller (visible, sin holgura); no se volvió a medir en esta sesión.
- **Fuera del alcance de F22 (shell, F13)**: la barra inferior móvil tiene 3 destinos sin «Ayuda» frente a los 4 del diseño. El doble destino activo del sidebar quedó resuelto en G4-05.
- **Duplicidad del círculo destacado**: al incluir el destacado en «Tus círculos», el mismo círculo aparece dos veces y un lector de pantalla oye dos enlaces. Es una decisión del usuario (G4-07), no un defecto de implementación; el contador cuadra.
- **`activeOptions={{ exact: true }}`** en el enlace del círculo del sidebar: cualquier enlace futuro a un subpath de `/circles/:id` debe revisarse para no duplicar `aria-current`.
- Los `[Menor]`/`[Nit]` de la revisión de código quedan cerrados o anotados en `tasks.md`; no reabren la revisión.

## Riesgos y limitaciones

- **B-01** y **H-03** son correcciones de features ya cerradas (F19 y F13) hechas dentro de esta rama: no cambian contratos ni alcance, pero conviene registrarlas como transversales en el cierre.
- El cambio de `BottomSheet` (padding lateral) es global: mejora el foco del modal de F22 y altera todas las hojas; los tests de `overlays` siguen en verde.
- La auditoría de diseño ya se hizo **con visión** y las correcciones se verificaron en navegador; lo que queda es el juicio final del usuario sobre el pixel y sobre el contenido real, que ninguna captura sustituye.
- Quedan dos nits visuales abiertos (D-06 y D-07) y una observación de shell (3 destinos frente a 4 en la barra inferior) que no son de F22.
- **Duplicidad intencional del destacado:** el círculo aparece en el bloque destacado y en «Tus círculos» (G4-07). Un lector de pantalla oye dos enlaces al mismo destino; si molesta en F39, se resuelve ocultando el destacado de la lista o marcándolo como `aria-hidden` con una sola entrada navegable.
- **`activeOptions={{ exact: true }}`** en el enlace del círculo: es lo que evita que el círculo quede activo también en `/circles/:id/people`. Un enlace futuro a un subpath debe revisarse para no acabar con dos `aria-current` en la misma navegación.
- La cobertura de navegador es puntual y manual (Chrome headless + CDP): la automatización sigue en F37/F38 y la revisión con lector de pantalla en F39.
- El contador es una desviación mínima de AC-08 (píldora en vez de círculo) aceptada para que `100+` y el zoom no recorten el texto.

## Documentación actualizada

- `docs/04-features/F22-people-web/spec.md`: `status: accepted`, M-01, AC-03 tras B-01, AC-05 con total en escritorio, AC-08 con píldora, 42 px y sidebar con un único `aria-current`, decisiones del 2026-11-05 (auditoría de diseño con visión, correcciones G4-01 a G4-07 y aceptación), tablas de correcciones D y G4, desviaciones, pruebas y limitaciones de la verificación.
- `docs/04-features/F22-people-web/tasks.md`: estado `accepted`, implementación y verificación marcadas con evidencia; secciones de la auditoría de diseño, de la verificación en navegador de estados y de la ronda de aceptación; aceptación marcada y G5 pendiente.
- `docs/04-features/F22-people-web/handoff.md`: este documento.
- `docs/04-features/README.md`: fila de F22 en `accepted` y situación con la aceptación.
- `docs/06-process/ai-log.md`: entradas del 2026-11-05 (auditoría de diseño, ronda de aceptación y aceptación) y nota de superación en la del 2026-11-04/05.
- `docs/07-curriculum/coverage-map.md`: competencias de auditoría de diseño con visión, verificación de estados en navegador y cifras al día.
- `docs/04-features/F07-modelo-datos/tasks.md`: ajuste de semilla marcado.
- `docs/04-features/F19-invitations-api/handoff.md`: nota de la corrección B-01.
- `README.md`: próximos pasos con F22 aceptada y el estado del cierre.

## Siguiente paso propuesto

G5, cierre operativo: con permiso explícito, los cuatro commits propuestos —`feat(web)` de F22 con `TabLinks`, `feat(api)` de la semilla de F07, `fix(api)` del enlace del email de F19 y `docs` del cierre—, la PR y el merge. No hay commit ni push hasta que se autorice; después, el tablero puede pasar la fila a `done`.

## Estado al 2026-11-05

La rama `feat/F22-people-web` sigue **sin commitear** y el tablero marca F22 en **`accepted`**. Nada se ha commiteado ni empujado.

Comprobado hoy, tras las correcciones de la aceptación:

- `pnpm test` con `memora_test` → 8/8 tareas y **1062 tests** (shared 145, api-client 39, ui 281, web 378, api 219), sin skips.
- `typecheck` 9/9, `lint` 6/6, `format:check` limpio, `build` 5/5 con cinco rutas prerenderizadas.
- `docs:check` y `agents:check` en verde (ver Verificación).
- Auditoría de diseño con visión cerrada en apto con correcciones y correcciones verificadas en navegador.
- G4 revisada por el usuario: siete correcciones aplicadas y verificadas con 4 pasadas nuevas de axe sin violaciones; **aceptada el 2026-11-05** en escritorio y móvil, claro y oscuro.
- Las 10 invitaciones de prueba del 429 real (`rate-limit-*@memora.test`) se borraron de la base de desarrollo con permiso del usuario.

Para reanudar el cierre:

```bash
docker compose up -d                                   # postgres, minio y mailpit
DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora pnpm dev
```

Después, G5 con los cuatro commits propuestos, la PR y el merge. Sin `push` hasta que se autorice.
