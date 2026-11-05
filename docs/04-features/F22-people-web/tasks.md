# Tasks — F22 People web

**Estado:** `done` el 2026-11-05. PR #34 mergeada en `main` (`7ee702f`) con CI en verde en la PR y en `main`.

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F18, F19, F20, F21.
- [x] Comprobar Definition of Ready.
- [x] Proponer plan y esperar confirmación.
- [x] Registrar el alcance revisado del 2026-11-04: héroe compartido, invitación solo con modal y sin fotos de persona.

## Implementación

- [x] `TabLinks` en `@memora/ui`: `nav` con enlaces reales y `aria-current="page"`; sin `tablist`/`tab`; Ajustes con `aria-disabled` y razón accesible fuera del scroller; 42 px de alto y contador en píldora de 20 px. Evidencia: `packages/ui/src/components/tab-links.tsx` y `tab-links.test.tsx` (**11** tests).
- [x] Dividir el detalle: `_app.circles.$circleId.tsx` monta `CircleDetailLayout` con la query, los gates 401/404/error/carga, el provider y `<Outlet/>`; `_app.circles.$circleId.index.tsx` porta solo Álbumes. Evidencia: `apps/web/src/features/circles/circle-detail-layout.tsx` y `circle-detail-layout.test.tsx`.
- [x] `CircleDetailContext`, `CircleSectionNav`, `CircleCompactHeader` y `paths.ts`; el layout pinta migas, héroe, cabecera compacta, pestañas y modal (M-01, 2026-11-05).
- [x] Héroe compartido: `CircleDetailHero` en Álbumes y Personas con portada, nombre, descripción, stats, última subida y acciones; pendientes junto a la última subida solo para el owner.
- [x] Eliminar la cabecera reducida de Personas (`CircleSectionHeader`): archivo borrado; `circle-section-header.tsx` ya no existe.
- [x] Ruta `_app.circles.$circleId.people.tsx` con el contenido de Personas sobre el chrome del layout. Evidencia: `_app.circles.$circleId.people.test.tsx`.
- [x] Subnav del sidebar (`_app.tsx`) hacia `/circles/:circleId` y `/circles/:circleId/people`.
- [x] Álbumes: `Invitar` del héroe abre el mismo modal para el owner; `Nuevo álbum` sigue deshabilitado hasta F24 y la nota solo habla de álbumes.
- [x] `InviteDialog` con `ResponsiveDialog` en móvil y escritorio, desde `Invitar` y desde «Invitar a alguien» en móvil; padding lateral reducido y anillo de foco visible; email opcional y, tras crear, copiar o compartir el enlace. Sin card «Invitar por email».
- [x] Cliente de datos de miembros e invitaciones: claves de consulta, CSRF, errores y 401/404. Evidencia: `apps/web/src/features/members/queries.ts`.
- [x] `MemberList`: lista móvil y tabla escritorio (Persona, Rol, Aparece en, Se unió, acciones) con Rol más ancho, Persona más ajustada y total visible también en escritorio (m-02).
- [x] `PendingInvitationRow`: email o «Enlace sin correo», caducidad y retirar con botón neutro en escritorio y menú en móvil; sin copiar ni compartir.
- [x] Card «Aún no hay nadie etiquetado» sin drop-zone y con más aire antes de la tabla; botón «Etiquetar fotos» deshabilitado hasta F32.
- [x] Quitar miembro con confirmación; manejo del 409 del owner y de 403/404.
- [x] Visibilidad: un `member` no ve Invitar, ni pendientes, ni acciones de quitar; solo lista y contadores; no se piden invitaciones. Evidencia: test «solo ve la lista y no pide invitaciones».
- [x] Contadores: pestaña con `stats.membersCount`, héroe con pendientes del owner, cabecera con el total, `photosCount` por miembro y pendientes con tope «100+».
- [x] Estados: skeletons, error con reintento, 401/404 (incluido el 404 de miembros) y 429 al invitar en RTL.
- [x] Nunca mostrar el email de un miembro.
- [x] B-01 (fuera del alcance original): el enlace del correo de invitación de la API pasa a `/invite/<token>`, con test de regresión. Evidencia: `apps/api/src/modules/invitations/routes.ts` y `invitations.test.ts`.
- [x] H-03 (fuera del alcance original): skip link visible al foco en el shell. Evidencia: `apps/web/src/components/layout/skip-link.tsx` y `app-shell.test.tsx`.
- [x] Semilla de F07 ajustada: «Familia Ferrer» + «Danza» y «Lisboa en primavera» como álbum de la familia. Evidencia: `apps/api/prisma/seed.ts` y tests de re-seed en `apps/api/src/db.integration.test.ts`.

## Criterios de aceptación

- [x] AC-01: héroe compartido en Álbumes y Personas, pendientes del owner junto a la última subida y sin cabecera reducida.
- [x] AC-02: lista móvil y tabla escritorio con Rol ensanchado, Persona ajustada y total en la cabecera de escritorio; un `member` usa todo el ancho (G4-02) y el owner conserva la rejilla de dos columnas.
- [x] AC-03: invitación con `ResponsiveDialog` en móvil y escritorio desde héroe y «Invitar a alguien»; sin card; el correo enlaza a `/invite/:token` (B-01); copiar/compartir; errores en RTL y **429 real inducido en navegador**.
- [x] AC-04: solo el owner ve Invitar y pendientes; un miembro no ve ninguno ni se pide la lista (RTL), y la vista de `member` se auditó en navegador; el owner ve la card «Pendientes 0» en escritorio (G4-01).
- [x] AC-05: contadores de pestaña, héroe, cabecera (móvil y escritorio), miembros y pendientes (máximo «100+»); «Tus círculos» cuenta todos los círculos, destacado incluido (G4-07).
- [x] AC-06: carga, error con reintento, card de etiquetas suavizada y 401/404 en RTL; **vacío y carga capturados en navegador** con latencia emulada.
- [x] AC-07: quitar miembro no-owner con confirmación; 409/403/404 sin romper la lista; un miembro no ve las acciones; sin email.
- [x] AC-08: tabs y subnav con URL real; `nav` + enlaces + `aria-current`; Ajustes con `aria-disabled`; 42 px y contador en píldora; `revealOnFocus`; en el sidebar hay un único `aria-current` y el círculo se resalta en Álbumes y Personas (G4-05).

## Verificación

- [x] `DATABASE_URL=…/memora_test pnpm test` → **8/8 tareas**, **1062 tests**: shared **145** (5 archivos), api-client **39** (3), ui **281** (14), web **378** (54), api **219** (12), sin skips.
- [x] `pnpm typecheck` → **9/9**.
- [x] `pnpm lint` → **6/6**.
- [x] `pnpm format:check` → limpio.
- [x] `pnpm build` → **5/5**, con `/help`, `/circles`, `/profile`, `/privacy` y `/uploads` prerenderizadas.
- [x] `pnpm docs:check` → **191 archivos y 516 enlaces**, 0 rotos.
- [x] `pnpm agents:check` → **43 specs y 43 filas**, OK.
- [x] `pnpm --filter @memora/web test members` → **51** tests en 3 archivos.
- [x] `pnpm --filter @memora/web test circle-detail` → **17** tests en 2 archivos.
- [x] `pnpm --filter @memora/web test circle-list` → **9** tests.
- [x] `pnpm --filter @memora/web test sidebar` → **6** tests.
- [x] `pnpm --filter @memora/ui test tab-links` → **11** tests.
- [x] Auditoría de accesibilidad en navegador (Chrome 156 headless + CDP + axe-core 4.14.0), tres rondas: 0 violaciones en 8 pasadas; H-01 a H-08 cerrados salvo los pendientes de abajo.

## Auditoría de diseño y correcciones (2026-11-05)

- [x] Abrir los tres PNG canónicos de Personas y 16 capturas reales de la implementación. Evidencia: `assets/design/screens/personas-{movil,movil-sin-etiquetas,escritorio}.png`.
- [x] Veredicto del `design-auditor` independiente: **apto con correcciones**, sin bloqueantes; 2 mayores, 3 menores y 2 nits.
- [x] **[Mayor] D-01**: «Ajustes» se cortaba a «Ajus» a 375 px. `tab-links.tsx` pasa a `px-2` y `gap-1` en móvil (`sm:px-3`, `sm:gap-1.5`), con 42 px de alto y píldora de 20 px. Medido a 375: `scrollWidth` 359 = `clientWidth` 359, sin desborde. Test: `tab-links.test.tsx`.
- [x] **[Mayor] D-02**: portada de reserva del héroe de escritorio ilegible (scrim sobre las iniciales, ≈1,2:1). `circle-cover.tsx` expone `onImageError` y `circle-detail-hero.tsx` solo pinta el scrim de escritorio con foto cargada. Test: `circle-detail-layout.test.tsx`.
- [x] **[Menor] D-03**: vista de `member` sin pendientes con la tabla a todo el ancho. `people-page.tsx` usa `lg:max-w-4xl` (56 rem) sin pendientes; con pendientes sigue la rejilla de dos columnas. Medido 894 px. Test: `people-page.test.tsx`. Sustituido en la aceptación por G4-02 (member a ancho completo).
- [x] **[Menor] D-04**: contadores de fotos desalineados en móvil. `member-list.tsx` reserva un hueco fijo `size-11` para la acción en todas las filas móviles, tenga o no menú.
- [x] **[Menor] D-05**: card «Aún no hay nadie etiquetado» con `surface-2` gris. `untagged-card.tsx` pasa a `bg-surface` con `border-border` normal, como la card blanca del diseño.
- [x] Correcciones verificadas en navegador: 19-mobile-light-fixed, 20-mobile-compact-fixed, 21-desktop-light-fixed, 22-desktop-dark-fixed, 23-empty-mobile-fixed y 24-member-desktop-light-fixed (capturas temporales, no versionadas).

## Verificación en navegador de estados (2026-11-05)

- [x] **12 pasadas de axe, 0 violaciones**: Personas móvil/escritorio en claro y oscuro, estado vacío, vista `member`, modal móvil claro, modal oscuro a 320, modal de escritorio, modal con 429 y las cuatro pasadas posteriores a las correcciones. Consola sin errores ni warnings.
- [x] **429 real inducido**: al 10.º envío, el modal muestra «No hemos podido crear la invitación / Demasiadas peticiones…», conserva el correo escrito y el contexto del héroe. Las 10 invitaciones de prueba (`rate-limit-*@memora.test`) se borraron después de la base de desarrollo con permiso del usuario.
- [x] **Estado vacío**: Danza (0 fotos, 0 etiquetas) muestra «Aún no hay nadie etiquetado».
- [x] **Estado de carga**: skeleton capturado con latencia emulada de 3 s (genérico; ver D-07).
- [x] **Vista de `member`** (Mateo): sin botón Invitar, sin pendientes y sin acciones de quitar; 0 violaciones de axe.
- [x] **Cabecera compacta** confirmada a 375×420 al superar el héroe (a 812 no se activaba porque la página no da para tanto scroll con 3 miembros).

## Correcciones de la aceptación (2026-11-05)

- [x] **G4-01** — Card «Pendientes» del owner siempre visible en escritorio, también con 0: «Pendientes 0», badge y textos suaves, «No hay invitaciones pendientes» en `text-muted`, fondo `surface-2` y borde normal. En móvil sigue oculta si está vacía. Capturas 40 y 41 (Danza owner con 0, claro y oscuro) y 42 (Familia owner).
- [x] **G4-02** — `member` sin columna derecha y a ancho completo; se retira el `lg:max-w-4xl` de la auditoría de diseño. Tabla medida 1118 px dentro de 1184; el owner mantiene `1fr + 22rem` con 0 pendientes. Captura 46.
- [x] **G4-03** — Borde superior de la card «Pendientes» = borde superior de la primera card izquierda: 549 = 549 px en Danza y 533 = 533 en Familia Ferrer. Causa: `mt-6` de la card de etiquetas frente al aside sin margen.
- [x] **G4-04** — «Invitar» y «Nuevo álbum» abajo a la derecha, alineados con el borde inferior de la nota y respetando `lg:p-8`: bottom de acciones 402 = bottom de la nota 402, héroe 434. Móvil intacto. Causa: la nota quedaba fuera de la fila flex.
- [x] **G4-05** — Sidebar: el círculo se resalta en Álbumes y en Personas (`bg-primary-soft font-semibold text-primary-text`), la sección actual va en negrita sin píldora y hay un único `aria-current="page"` (`activeOptions={{ exact: true }}` en Personas). `sidebar` → 6 tests.
- [x] **G4-06** — Migas con la sección siempre: «Mis círculos / Danza / Álbumes» y «Mis círculos / Danza / Personas». `circle-detail` → 17 tests.
- [x] **G4-07** — «Tus círculos» pinta todos los círculos, incluido el destacado: 2 cards + «Crear un círculo» y contador «2 círculos». `circle-list` → 9 tests; captura 45.
- [x] Verificación de la ronda: `pnpm test` → **8/8 tareas y 1062 tests** (web **378**); `typecheck` 9/9, `lint` 6/6, `format:check` limpio, `build` 5/5; `members` **51**, `circle-detail` **17**, `circle-list` **9**, `sidebar` **6**.
- [x] Navegador: **4 pasadas nuevas de axe, 0 violaciones** (Danza owner con 0 pendientes en claro y oscuro, Familia Ferrer owner en claro y `member` a ancho completo), consola limpia. Capturas 40, 41, 42, 45, 46 y 47 en `C:/Users/lucia/AppData/Local/Temp/opencode/f22-audit/shots/`, temporales y no versionadas.

## Pendiente (no verificado)

- [ ] Lector de pantalla real (NVDA/VoiceOver/TalkBack).
- [ ] Zoom de texto al 200 % en la nav sticky: puede crecer por encima de `--app-circle-section-nav-height`.
- [ ] **[Nit] D-06**: «días» parte de línea en la meta de una invitación pendiente en escritorio. Sin corregir.
- [ ] **[Nit] D-07**: el skeleton de la captura de carga es genérico; probablemente el fallback previo a la hidratación. Sin corregir.
- [ ] Anillo de foco de la última pestaña: quedaba a 0 px del borde del scroller (visible). No se volvió a medir en esta sesión.
- [ ] Observación fuera del alcance de F22, del shell (F13): la barra inferior móvil tiene 3 destinos sin «Ayuda» frente a los 4 del diseño. El doble destino activo del sidebar quedó resuelto en G4-05.
- [ ] **Riesgo abierto**: el círculo destacado aparece dos veces en «Tus círculos» (destacado y card), así que un lector de pantalla oye dos enlaces al mismo círculo; es una decisión del usuario (G4-07).
- [ ] **Riesgo abierto**: `activeOptions={{ exact: true }}` en el enlace del círculo del sidebar; cualquier enlace futuro a un subpath debe revisarse para no duplicar `aria-current`.

## Cierre

- [x] Revisión independiente: dos rondas (primera **no apto** por B-01, segunda **apto con correcciones** con solo **D-01 del reviewer**, que es este cierre).
- [x] Auditoría de diseño independiente **con visión**: **apto con correcciones**, sin bloqueantes; mayores y menores corregidos. Los `D-0x` de esta sección son de la auditoría de diseño y no coinciden con el `D-01` del reviewer.
- [x] Revisión de aceptación del usuario (G4, 2026-11-05): siete correcciones pedidas, aplicadas y verificadas.
- [x] Aceptación del usuario el 2026-11-05 tras las correcciones, en escritorio y móvil, claro y oscuro (estado `accepted` hasta el cierre operativo).
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] G5 — cierre operativo: commits `56fca50`, `3e719ed`, `8219d1f`, `97b45be` y merge `7ee702f`; PR #34 `feat(web): People web with shared circle chrome (F22)`; CI en la PR run `42004835096` y en `main` run `42006326244`, ambos `completed/success`. F22 queda en `done`.
