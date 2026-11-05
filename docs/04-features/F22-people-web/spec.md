---
id: F22
title: "People web"
milestone: M2
size: M
status: done
spec: complete
depends_on:
  - "F18"
  - "F19"
  - "F20"
  - "F21"
blocks:
  - "F32"
design_refs:
  - "assets/design/screens/personas-movil.png"
  - "assets/design/screens/personas-movil-sin-etiquetas.png"
  - "assets/design/screens/personas-escritorio.png"
contracts:
  - "docs/02-design/screens.md"
decisions: []
---

# F22 — People web

> **Milestone:** M2 · **Talla:** M · **Estado:** done · **Spec:** completa
> **Depende de:** F18, F19, F20, F21 · **Bloquea:** F32

## Objetivo

Construir Personas: la lista de miembros del círculo (lista en móvil, tabla en escritorio), las invitaciones pendientes y la invitación por modal, con el héroe del círculo compartido y navegación por URL real entre las pestañas.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/personas-movil.png](../../../assets/design/screens/personas-movil.png)
- [assets/design/screens/personas-movil-sin-etiquetas.png](../../../assets/design/screens/personas-movil-sin-etiquetas.png)
- [assets/design/screens/personas-escritorio.png](../../../assets/design/screens/personas-escritorio.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)
- `GET /circles/:circleId/members` y `DELETE /circles/:circleId/members/:userId` (F21)
- Invitaciones de F19/F20

### Decisiones

- 2026-11-04: alcance revisado al abrir la feature; bloque al final, en [Preguntas abiertas](#preguntas-abiertas).
- 2026-11-05: el chrome del detalle vive en el layout (M-01) y el contador es una píldora de alto fijo; la auditoría de diseño empezó como contrato textual y ese mismo día se completó **con visión** (apto con correcciones, sin bloqueantes); detalle en [Decisiones del 2026-11-05](#decisiones-del-2026-11-05).

## Alcance

### Incluye

- `CircleDetailHero` compartido en Álbumes y Personas (y en Ajustes desde F28): portada, nombre, descripción, stats, última subida y acciones. El owner ve además el número de invitaciones pendientes junto a la última subida.
- `MemberList`: lista en móvil (avatar, nombre, rol y contador de fotos) y tabla en escritorio (Persona, Rol, Aparece en, Se unió y acciones), con Rol más ancho para que «Administrador» quepa y Persona más ajustada.
- `InviteDialog` con `ResponsiveDialog` en móvil y escritorio, desde `Invitar` del héroe y desde «Invitar a alguien» en móvil. Sin card «Invitar por email». En móvil reduce el padding lateral y no recorta el anillo de foco de los inputs.
- Email opcional; el correo enlaza a `/invite/:token`; tras crear la invitación se copia o comparte el mismo enlace `/invite/:token`.
- `PendingInvitationRow`: email o «Enlace sin correo», caducidad y retirar (botón neutro en escritorio, menú en móvil). No copia ni comparte: el token solo lo devuelve el `POST`.
- Personas con contador de fotos y card «Aún no hay nadie etiquetado» sin drop-zone y con más aire antes de la tabla.
- Estados de carga, vacío y error.
- Quitar miembro (solo owner) con confirmación.
- `TabLinks` en `@memora/ui`: navegación por URL con más padding lateral, 42 px de alto (2 px menos que el diseño) y contador en una píldora de alto fijo de 20 px que crece en horizontal.
- Un `member` solo ve la lista y los contadores: sin botón Invitar, sin pendientes y sin acciones de quitar.

### No incluye

- Fotos de esta persona (F29).
- Etiquetado (F32).
- Ajustes del círculo (F28).
- Cambio de rol: solo existe owner/member.
- Reenvío de invitación: no hay endpoint; pendiente de F19.
- Email de los miembros: el contrato no lo expone.

## Entregables

- `apps/web/src/routes/_app.circles.$circleId.tsx`: ruta SPA (`ssr: false`) que monta `CircleDetailLayout` alrededor del `<Outlet/>` y valida `?created`.
- `apps/web/src/features/circles/circle-detail-layout.tsx`: chrome compartido del círculo —query del detalle, gates 401/404/error/carga, `CircleDetailProvider`, migas, héroe, cabecera compacta, pestañas y `InviteDialog`—; no se remonta al cambiar de pestaña.
- `apps/web/src/routes/_app.circles.$circleId.index.tsx`: solo el contenido de Álbumes.
- `apps/web/src/routes/_app.circles.$circleId.people.tsx`: solo el contenido de Personas (tabla, pendientes y card de etiquetas).
- `apps/web/src/features/members/**`
- `apps/web/src/features/circles/**` (héroe, contexto, layout, navegación de sección, cabecera compacta, foco de sección y rutas)
- `packages/ui/src/components/tab-links.tsx` y su export en `packages/ui/src/index.ts`

## UX y estados

- lista de miembros en móvil y tabla en escritorio
- card «Aún no hay nadie etiquetado» sin drop-zone
- cargando (skeletons)
- error con reintento
- sin acceso (401/404), igual que el detalle del círculo
- invitación pendiente
- invitación sin correo («Enlace sin correo»)
- confirmación al quitar un miembro
- 429 al invitar, sin perder el contexto

## Disposición

- **Héroe compartido:** Álbumes, Personas (y Ajustes en F28) mantienen el mismo héroe con portada, nombre, descripción, stats, última subida y acciones. El owner ve el número de invitaciones pendientes junto a la última subida; un `member` no. La cabecera reducida de Personas desaparece.
- **Chrome en el layout (M-01):** migas, héroe, cabecera compacta, pestañas y modal de invitar los pinta `CircleDetailLayout`; las rutas de sección solo aportan su contenido. Así el héroe y el modal no se remontan ni pierden estado al cambiar de pestaña.
- **Móvil:** héroe y, al hacer scroll, su cabecera compacta; pestañas debajo; en Personas, «Invitar a alguien», pendientes (owner), card de etiquetas y lista de miembros. La sección de pendientes se oculta si está vacía.
- **Escritorio:** migas (siempre con la sección actual), héroe, pestañas y, en Personas, dos columnas `1fr + 22rem` para el owner —tabla y pendientes— aunque haya 0 pendientes; un `member` no tiene columna derecha y la tabla ocupa todo el ancho. No hay card de invitar; el `Invitar` del héroe abre el modal.
- **Álbumes:** conserva el héroe y sus acciones, alineadas abajo a la derecha con el borde inferior del contenido. `Invitar` abre el modal para el owner; `Nuevo álbum` sigue deshabilitado hasta F24 y su nota solo habla de álbumes.
- **Sidebar:** el círculo activo se resalta en Álbumes y en Personas (`bg-primary-soft font-semibold text-primary-text`) y la sección actual va en negrita sin píldora, con un único `aria-current="page"`.
- **«Tus círculos»:** la lista incluye también el círculo destacado, así que el contador de círculos cuadra con las cards pintadas.

## Criterios de aceptación

- **AC-01.** El héroe del círculo se mantiene en Álbumes y Personas (y en Ajustes desde F28) con portada, nombre, descripción, stats, última subida y acciones; el owner ve las invitaciones pendientes junto a la última subida y un `member` no. No hay cabecera reducida propia de Personas.
- **AC-02.** En móvil, Personas es una lista con avatar, nombre, rol, contador de fotos o «Sin etiquetas» y acción de owner; en escritorio, una tabla con columnas Persona, Rol, Aparece en, Se unió y acciones, con Rol ensanchado para que «Administrador» quepa y Persona más ajustada.
- **AC-03.** El owner invita con `ResponsiveDialog` en móvil y escritorio desde `Invitar` del héroe y, en móvil, desde «Invitar a alguien»; no hay card «Invitar por email»; en móvil el modal reduce el padding lateral y no recorta el anillo de foco de los inputs; con email opcional se envía un correo cuyo enlace apunta a `/invite/:token` de la web (B-01: antes apuntaba a `/invitations/<token>` y daba 404), cubierto por un test de regresión en la API; tras crear, se copia o comparte el enlace `/invite/:token`; los errores de red y el 429 se muestran sin perder el contexto.
- **AC-04.** Solo el owner ve el botón Invitar y las pendientes (en el héroe y en la sección), y puede retirarlas; en escritorio la card «Pendientes» se muestra también con 0; un miembro no ve el botón ni las pendientes, y la lista ni se pide; el servidor sigue siendo la defensa real.
- **AC-05.** Contadores: pestaña Personas = `stats.membersCount`; héroe = invitaciones pendientes solo para el owner; cabecera de miembros = total, visible en móvil y en escritorio (m-02: la tabla de escritorio también lo muestra); cada miembro = `photosCount`; pendientes = invitaciones vigentes (máximo 100, «100+» si hay más).
- **AC-06.** Estados de carga (skeletons), error con reintento, card «Aún no hay nadie etiquetado» sin drop-zone y con más aire antes de la tabla, y 404/401 igual que el detalle del círculo.
- **AC-07.** El owner quita a un miembro no-owner con confirmación y un `member` no ve esas acciones; el 409 del owner y los 403/404 se manejan sin romper la lista; nunca se muestra el email de un miembro.
- **AC-08.** La pestaña Personas y el subnav del sidebar llevan a `/circles/:circleId/people` con URL real; la pestaña activa usa `aria-current="page"`; Ajustes sigue deshabilitado. En el sidebar, el círculo activo se resalta en Álbumes y en Personas y la sección actual va en negrita sin píldora, con un único `aria-current="page"`. `TabLinks` renderiza un `nav` con enlaces reales, sin `tablist`/`tab`; el elemento deshabilitado usa `aria-disabled` y una razón accesible fuera del scroller; las pestañas tienen más padding lateral, 42 px de alto (2 px menos que el diseño) y el contador en una píldora de alto fijo de 20 px que crece en horizontal. Al enfocar una pestaña fuera de la vista, el scroller la revela con `scrollIntoView`.

## Desviaciones de diseño

| Diseño | Implementación F22 | Motivo |
| --- | --- | --- |
| «Fotos de esta persona» y chevron por miembro | No se entrega; la fila no navega | El endpoint de imagen y los álbumes llegan en F29/F23 |
| Dos «Administradores» y «Hacer administradora» | Un «Administrador» (owner) y el resto «Miembro»; sin cambio de rol | Solo existe owner/member |
| «Reenviar» | Oculto | Sin endpoint; pendiente de F19 |
| Email del miembro en la fila | No se muestra | El contrato de miembros no expone email |
| Invitación sin correo | «Enlace sin correo» | Estado inferido; `invitedEmail` puede ser `null` |
| «Retirar» | Botón neutro en escritorio y menú en móvil | Acción poco frecuente y confirmada; el rojo se reserva al confirmar |
| «Etiquetar fotos» | Deshabilitado con nota | El etiquetado llega en F32 |
| «Invitar por email» | Fuera: solo `ResponsiveDialog` en móvil y escritorio | Un único flujo y menos ruido en la página |
| Card de etiquetas | Sin borde discontinuo y con más aire antes de la tabla | No es una zona de carga, es un estado informativo |
| Tabs y tabla | Tabs de 42 px de alto (2 px menos), contador en píldora de 20 px de alto fijo que crece en horizontal, Rol más ancho y Persona más ajustada | Legibilidad de «Administrador» y de contadores de 3+ cifras (`100+`, `1.240`) sin recortar |
| Pestañas con padding lateral del diseño | `px-2` y `gap-1` en móvil (`sm:px-3`, `sm:gap-1.5`), con 42 px de alto y píldora de 20 px | «Ajustes» se cortaba a «Ajus» a 375 px (D-01) |
| Portada de reserva del héroe de escritorio | Sin scrim mientras no hay foto cargada; texto normal sobre el degradado | El scrim sobre las iniciales dejaba ≈1,2:1 de contraste (D-02) |
| Tabla de miembros cuando no hay pendientes | Un `member` no tiene columna derecha y la tabla ocupa todo el ancho (medido 1118 px en 1184); el owner mantiene `1fr + 22rem` aunque haya 0 pendientes | Decisión de la aceptación (G4-02), que revierte el `lg:max-w-4xl` propuesto por la auditoría de diseño (D-03) |
| Card de pendientes del owner con 0 invitaciones | En escritorio se muestra «Pendientes 0» con badge y textos suaves, «No hay invitaciones pendientes» en `text-muted`, fondo `surface-2` y borde normal; en móvil se sigue ocultando si está vacía | Decisión de la aceptación (G4-01): el owner debe ver siempre el bloque |
| «Tus círculos» sin el destacado | El destacado aparece también como card en la lista | Decisión de la aceptación (G4-07): la lista incluye todos los círculos y el contador cuadra; un lector de pantalla oye dos enlaces al mismo círculo |
| Chrome del detalle | Migas, héroe, cabecera compacta, pestañas y modal de invitar se pintan en `CircleDetailLayout` | No remontar el héroe ni el modal al cambiar de pestaña (M-01, 2026-11-05) |

## Pruebas

- Héroe compartido: mismo héroe en Álbumes y Personas, con pendientes del owner junto a la última subida y sin cabecera reducida.
- Chrome en el layout: migas, héroe, cabecera compacta, pestañas y modal viven en `CircleDetailLayout` y no se remontan al cambiar de pestaña.
- RTL de lista y tabla: columnas, total en la cabecera de escritorio, Rol ensanchado para «Administrador» y Persona ajustada.
- Invitar: `ResponsiveDialog` en móvil y escritorio desde `Invitar` y desde «Invitar a alguien» en móvil, con padding reducido y foco visible; copiar y compartir tras crear; sin card fija.
- Correo de invitación: test de regresión en la API de que el enlace del email es `/invite/<token>` y no `/invitations/<token>` (B-01).
- Pendientes y retirar: email o «Enlace sin correo», caducidad, botón neutro en escritorio y menú en móvil; sin copiar ni compartir.
- Quitar miembro y visibilidad de un `member`: sin Invitar, pendientes ni acciones.
- Estados: carga, error, card de etiquetas sin drop-zone, 401/404 (incluido el 404 de miembros) y 429.
- Auditoría de diseño con visión: comparación de los tres PNG canónicos con 16 capturas reales y veredicto independiente; las correcciones D-01 a D-05 se comprueban después en navegador.
- Estados en navegador: vacío, carga con latencia emulada de 3 s, 429 real inducido en el modal y vista de `member`, con 0 violaciones de axe.
- Aceptación (G4): card «Pendientes» con 0 para el owner en escritorio y oculta en móvil; alineación del aside con la primera card izquierda; `member` a ancho completo; acciones del héroe abajo; sidebar con el círculo resaltado en ambas secciones y un único `aria-current`; migas con sección; «Tus círculos» con el destacado incluido.
- Navegación y URL: `TabLinks` (`nav`, enlaces reales, `aria-current`, Ajustes con `aria-disabled`, razón fuera del scroller, `revealOnFocus`), contador en píldora y subnav del sidebar.

### Limitaciones de la verificación

- **Auditoría de diseño con visión (actualizada el 2026-11-05).** Ya no aplica la limitación anterior: el motor sí puede abrir imágenes. Se abrieron los tres PNG canónicos y 16 capturas reales de la implementación, y un `design-auditor` independiente emitió **apto con correcciones**, sin bloqueantes (2 mayores, 3 menores y 2 nits, corregidos los mayores y menores; ver [Correcciones de la auditoría de diseño](#correcciones-de-la-auditoría-de-diseño-2026-11-05)). El pixel final de la aceptación lo sigue validando el usuario.
- **Sin lector de pantalla real:** NVDA/VoiceOver/TalkBack no se han ejecutado. La cobertura es axe-core 4.14.0 en Chrome 156 headless con CDP, que no sustituye a un lector.
- **Zoom de texto al 200 % en la nav sticky:** no se volvió a medir; puede crecer por encima de `--app-circle-section-nav-height`.
- **Nits abiertos:** «días» parte de línea en la meta de una invitación pendiente en escritorio, y el skeleton de la captura de carga es genérico (probablemente el fallback previo a la hidratación).
- **Duplicidad del círculo destacado:** al incluir el destacado también en «Tus círculos», el mismo círculo aparece dos veces y un lector de pantalla oye dos enlaces. Es una decisión del usuario en la aceptación, no un defecto de implementación; el contador cuadra.
- **`activeOptions={{ exact: true }}`** en el enlace del círculo del sidebar: cualquier enlace futuro a un subpath de `/circles/:id` debe revisarse para no dejar dos `aria-current` en la misma navegación.

## Archivos previstos

- `apps/web/src/routes/_app.circles.$circleId.tsx`
- `apps/web/src/routes/_app.circles.$circleId.index.tsx`
- `apps/web/src/routes/_app.circles.$circleId.people.tsx`
- `apps/web/src/routes/_app.tsx`
- `apps/web/src/features/members/**`
- `apps/web/src/features/circles/circle-detail-context.tsx`
- `apps/web/src/features/circles/circle-detail-layout.tsx`
- `apps/web/src/features/circles/circle-detail-hero.tsx`
- `apps/web/src/features/circles/circle-section-nav.tsx`
- `apps/web/src/features/circles/circle-compact-header.tsx`
- `apps/web/src/features/circles/use-section-focus.ts`
- `apps/web/src/features/circles/paths.ts`
- `packages/ui/src/components/tab-links.tsx`
- `packages/ui/src/index.ts`

## Verificación

- `DATABASE_URL=postgresql://memora:memora@127.0.0.1:5432/memora_test pnpm test`
- `pnpm typecheck` y `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm --filter @memora/web test members`
- `pnpm --filter @memora/web test circle-detail`
- `pnpm --filter @memora/web test circle-list`
- `pnpm --filter @memora/web test sidebar`
- `pnpm --filter @memora/ui test tab-links`
- `pnpm docs:check` y `pnpm agents:check`

Resultados reales en [handoff.md](handoff.md).

## Definition of Ready

- [x] Dependencias `done`: F18, F19, F20 y F21.
- [x] Decisiones resueltas: G1 del 2026-11-04 y decisiones del 2026-11-05 (M-01, contador y auditoría de diseño, que pasó de contrato textual a visión con correcciones).
- [x] Contratos congelados: `MemberDto` de F21, invitaciones de F19 y enlace de F20.
- [x] Diseño enlazado: las tres pantallas de Personas y la tabla de desviaciones.
- [x] Datos de prueba: semilla de F07 y factorías de F21.
- [x] Sin preguntas bloqueantes.

## Handoff

Aceptada por el usuario el 2026-11-05 y cerrada en `done` el mismo día tras el G5: PR #34, merge `7ee702f` en `main` y CI en verde en la PR (run `42004835096`) y en `main` (run `42006326244`). El handoff completo, con la verificación real y los pendientes, está en [handoff.md](handoff.md).

## Decisiones del 2026-11-05

1. **M-01 — chrome en el layout (aceptada).** El layout comparte migas, héroe, cabecera compacta, pestañas y el modal de invitar, para no remontar el héroe ni el modal al cambiar de pestaña. Sustituye la redacción anterior de esta spec («el layout no pinta héroe, migas ni pestañas»), que describía una organización descartada.
2. **Contador en píldora.** El contador de la pestaña es una píldora de 20 px de alto fijo que crece en horizontal (`h-5 min-w-5 px-1 rounded-full tabular-nums`), no un círculo cerrado. Es una desviación mínima de AC-08 (antes «círculo de tamaño fijo») para que `100+`, `1.240` y el zoom al 200 % no recorten el texto.
3. **B-01 — enlace del correo de invitación.** La API construye el enlace del email como `/invite/<token>` (página SSR de la web), no `/invitations/<token>`, que daba 404. Es la corrección de un bug heredado de F19/F20, sin cambio del contrato de API y con test de regresión en `apps/api/src/modules/invitations/invitations.test.ts`.
4. **Auditoría de diseño: de contrato textual a visión (actualizada el 2026-11-05).** La primera sesión del 2026-11-05 la degradó a contrato textual porque el motor, en ese momento, no abría imágenes. La sesión de continuación lo corrigió: se abrieron los tres PNG canónicos de Personas y 16 capturas reales de la implementación, y el `design-auditor` independiente emitió **apto con correcciones**, sin bloqueantes. El pixel final lo sigue validando el usuario en la aceptación.
5. **Nivel de auditoría A.** Se mantiene: la pantalla muestra membresías e invitaciones y permite mutarlas.
6. **Correcciones fuera del alcance original.** B-01 (email de F19) y H-03 (skip link invisible al foco, del shell de F13) se arreglan dentro de esta rama, pero se registran como correcciones transversales, no como alcance de F22.
7. **Correcciones de la auditoría de diseño (2026-11-05).** Los dos hallazgos mayores y los tres menores se corrigieron y se verificaron después en navegador; los dos nits quedan abiertos. Detalle en [Correcciones de la auditoría de diseño](#correcciones-de-la-auditoría-de-diseño-2026-11-05).
8. **Card «Pendientes» siempre visible para el owner en escritorio (G4-01).** También con 0: «Pendientes 0», badge y textos suaves, «No hay invitaciones pendientes» en `text-muted`, fondo `surface-2` y borde normal. En móvil la sección sigue oculta si está vacía.
9. **Member a ancho completo (G4-02).** Se retira el `lg:max-w-4xl` de la auditoría de diseño: un `member` no tiene columna derecha y la tabla ocupa todo el ancho (medido 1118 px en 1184). Con owner se mantiene `1fr + 22rem` aunque haya 0 pendientes.
10. **Alineación vertical del aside (G4-03).** El borde superior de la card «Pendientes» coincide con el de la primera card izquierda: 549 = 549 px en Danza (owner, sin etiquetas) y 533 = 533 en Familia Ferrer (con pendientes). Causa: el `mt-6` de la card de etiquetas frente al aside sin margen.
11. **Acciones del héroe abajo a la derecha (G4-04).** «Invitar» y «Nuevo álbum» se alinean con el borde inferior del contenido (la nota de álbumes) respetando `lg:p-8`: bottom de acciones 402 = bottom de la nota 402, héroe 434 (32 px de padding). Móvil intacto. Causa: la nota quedaba fuera de la fila flex.
12. **Sidebar coherente (G4-05).** El nombre del círculo se resalta en Álbumes y en Personas (`bg-primary-soft font-semibold text-primary-text`) y la sección actual va en negrita sin píldora. Un único `aria-current="page"`: en el overview lo lleva el círculo y en Personas el enlace de Personas (`activeOptions={{ exact: true }}`).
13. **Migas con la sección siempre (G4-06).** «Mis círculos / Danza / Álbumes» y «Mis círculos / Danza / Personas».
14. **«Tus círculos» incluye el destacado (G4-07).** La lista pinta todos los círculos, también el destacado: 2 cards + «Crear un círculo» y el contador «2 círculos» cuadra. Antes `rest` filtraba el destacado y con 2 círculos solo se pintaba uno.
15. **Aceptación de G4 (2026-11-05).** El usuario probó la feature en escritorio y móvil, claro y oscuro, y la **aceptó** después de la ronda G4-01 a G4-07. El estado pasa a `accepted`; el G5 (commits, PR y merge) queda pendiente y no se ejecuta sin permiso.
16. **Cierre operativo y `done` (2026-11-05).** G5 completado en la rama `docs/F22-done`: PR #34 `feat(web): People web with shared circle chrome (F22)` mergeada en `main` con el merge commit `7ee702f82f1f1715517cbc891fab5b1d369c082f`; CI en la PR run **42004835096** y CI en `main` tras el merge run **42006326244**, ambos `completed/success`. Commits de la rama: `56fca50`, `3e719ed`, `8219d1f`, `97b45be` y el merge `7ee702f`. La feature pasa a `done` con las cifras del cierre: 8/8 tareas, **1062 tests** (shared 145, api-client 39, ui 281, web 378, api 219), typecheck 9/9, lint 6/6, build 5/5, docs:check y agents:check en verde, y 16 pasadas de axe con 0 violaciones.

## Correcciones de la auditoría de diseño (2026-11-05)

El `design-auditor` independiente abrió los tres PNG canónicos y 16 capturas reales. Veredicto: **apto con correcciones**, sin bloqueantes. Los siete hallazgos y su estado (los identificadores `D-0x` son de esta auditoría y no coinciden con el `D-01` del `reviewer`):

| ID | Severidad | Hallazgo | Corrección | Estado |
| --- | --- | --- | --- | --- |
| D-01 | Mayor | «Ajustes» se cortaba a «Ajus» a 375 px | `tab-links.tsx`: `px-2` y `gap-1` en móvil (`sm:px-3`, `sm:gap-1.5`), conservando 42 px y la píldora de 20 px | Corregido; medido a 375: `scrollWidth` 359 = `clientWidth` 359, sin desborde |
| D-02 | Mayor | Portada de reserva del héroe de escritorio ilegible: el scrim tapaba las iniciales (≈1,2:1) | `circle-cover.tsx` expone `onImageError` y `circle-detail-hero.tsx` solo pinta el scrim de escritorio con foto cargada; con reserva, texto normal y degradado legible | Corregido y verificado en navegador |
| D-03 | Menor | Vista de `member` sin pendientes: tabla a todo el ancho y columnas desequilibradas | `people-page.tsx`: `lg:max-w-4xl` (56 rem) cuando no hay pendientes; con pendientes, rejilla de dos columnas | Corregido y medido 894 px, pero **sustituido en la aceptación del 2026-11-05**: un `member` pasa a ancho completo y el owner mantiene `1fr + 22rem` (G4-02) |
| D-04 | Menor | Contadores de fotos desalineados en móvil (la fila del owner no tiene menú) | `member-list.tsx`: hueco fijo `size-11` para la acción en todas las filas móviles | Corregido |
| D-05 | Menor | Card «Aún no hay nadie etiquetado» con `surface-2` gris; el diseño es card blanca | `untagged-card.tsx`: `bg-surface` + `border-border` normal | Corregido |
| D-06 | Nit | «días» parte de línea en la meta de una invitación pendiente en escritorio | Sin corregir | Abierto |
| D-07 | Nit | El skeleton de la captura de carga es genérico | Sin corregir; probablemente es el fallback previo a la hidratación | Abierto |

Tests tocados por las correcciones: `tab-links.test.tsx`, `circle-detail-layout.test.tsx` y `people-page.test.tsx`.

## Correcciones de la aceptación (2026-11-05)

El usuario revisó la feature en G4 y pidió siete ajustes. Todos se aplicaron y se verificaron; los identificadores `G4-0x` son de esta ronda y no tienen relación con los `D-0x` de la auditoría de diseño.

| ID | Corrección | Causa | Verificación |
| --- | --- | --- | --- |
| G4-01 | Card «Pendientes» del owner siempre visible en escritorio, también con 0: «Pendientes 0», badge y textos suaves, «No hay invitaciones pendientes» en `text-muted`, `surface-2` y borde normal; en móvil sigue oculta si está vacía | El owner no veía el bloque cuando no había invitaciones | Capturas 40 y 41 (Danza owner con 0, claro y oscuro) y 42 (Familia owner); 0 violaciones de axe |
| G4-02 | `member` sin columna derecha y a ancho completo; se retira `lg:max-w-4xl`; el owner mantiene `1fr + 22rem` con 0 pendientes | El usuario prefiere aprovechar todo el ancho cuando no hay aside | Tabla medida 1118 px dentro de 1184; captura 46; `people-page.test.tsx` |
| G4-03 | Borde superior de la card «Pendientes» = borde superior de la primera card izquierda | `mt-6` de la card de etiquetas frente al aside sin margen | 549 = 549 px en Danza y 533 = 533 en Familia Ferrer |
| G4-04 | «Invitar» y «Nuevo álbum» abajo a la derecha, alineados con el borde inferior de la nota, respetando `lg:p-8`; móvil intacto | La nota quedaba fuera de la fila flex | Bottom de acciones 402 = bottom de la nota 402; héroe 434 (32 px de padding) |
| G4-05 | Sidebar: círculo resaltado en Álbumes y Personas y sección actual en negrita sin píldora, con un único `aria-current="page"` (`activeOptions={{ exact: true }}` en Personas) | El círculo solo se resaltaba en el overview y Personas usaba píldora | `sidebar` 6 tests; árbol de accesibilidad revisado en navegador |
| G4-06 | Migas con la sección siempre: «Mis círculos / Danza / Álbumes» y «Mis círculos / Danza / Personas» | Faltaba el tramo de sección | `circle-detail` 17 tests |
| G4-07 | «Tus círculos» pinta todos los círculos, incluido el destacado: 2 cards + «Crear un círculo»; contador «2 círculos» | `rest` filtraba el destacado y con 2 círculos solo se pintaba uno | `circle-list` 9 tests; captura 45 |

## Preguntas abiertas

Ninguna. Decisiones del **2026-11-04**:

1. «Fotos de esta persona» se mueve a F29: el endpoint de imagen llega con la galería, los nombres de álbum con F23 y la descarga con F33. En F22 la fila no navega.
2. Solo existen owner y member. El owner se muestra como «Administrador» y el resto como «Miembro»; no hay cambio de rol.
3. «Reenviar» se oculta: no hay endpoint y queda pendiente de F19.
4. Las pestañas del círculo son navegación con URL real (`/circles/:circleId` y `/circles/:circleId/people`) mediante `TabLinks` en `@memora/ui`. Ajustes sigue deshabilitado hasta F28.
5. El héroe del círculo (portada, nombre, descripción, stats, última subida y acciones) se comparte en Álbumes y Personas, y en Ajustes desde F28. Las pendientes se muestran junto a la última subida solo para el owner. La cabecera reducida de Personas desaparece.
6. La invitación se hace solo con `ResponsiveDialog`, en móvil y escritorio, desde `Invitar` del héroe y desde «Invitar a alguien» en móvil. Se elimina la card «Invitar por email».
7. La card «Aún no hay nadie etiquetado» se mantiene sin drop-zone y con más aire antes de la tabla; la tabla reequilibra Persona/Rol y las tabs ganan padding lateral, 2 px menos de alto y contador en píldora de alto fijo (precisado el 2026-11-05, ver [Decisiones del 2026-11-05](#decisiones-del-2026-11-05)).
8. Los círculos son grupos de personas (familia, amistades, pareja, afición) y los viajes/eventos son álbumes. La semilla pasa a «Familia Ferrer» y «Danza», con «Lisboa en primavera» dentro de la familia.
