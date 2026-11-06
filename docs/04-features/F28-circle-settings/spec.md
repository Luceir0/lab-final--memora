---
id: F28
title: "Ajustes del círculo"
milestone: M3
size: M
status: review
spec: complete
depends_on:
  - "F18"
blocks:
  - "F35"
design_refs:
  - "assets/design/screens/ajustes-movil.png"
  - "assets/design/screens/ajustes-movil-eliminar.png"
  - "assets/design/screens/ajustes-movil-sin-permisos.png"
  - "assets/design/screens/ajustes-escritorio-guardando.png"
  - "assets/design/screens/ajustes-escritorio-eliminar.png"
contracts:
  - "docs/03-architecture/auth.md"
  - "docs/03-architecture/data-model.md"
decisions:
  - "ADR-0005"
---

# F28 — Ajustes del círculo

> **Milestone:** M3 · **Talla:** M · **Estado:** review · **Spec:** completa
> **Depende de:** F18 · **Bloquea:** F35

> **Revisión y auditorías (2026-11-06):** implementación completa y verificada. El `reviewer` da **apto con correcciones** (sin bloqueantes) y `a11y-auditor` da **no apto** por dos bloqueantes de solape/foco en navegador real. El detalle consolidado y el plan de corrección están en [review.md](review.md). La auditoría de diseño queda pendiente de relanzar.

## Objetivo

Construir ajustes de círculo, permisos y zona de peligro.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/ajustes-movil.png](../../../assets/design/screens/ajustes-movil.png)
- [assets/design/screens/ajustes-movil-eliminar.png](../../../assets/design/screens/ajustes-movil-eliminar.png)
- [assets/design/screens/ajustes-movil-sin-permisos.png](../../../assets/design/screens/ajustes-movil-sin-permisos.png)
- [assets/design/screens/ajustes-escritorio-guardando.png](../../../assets/design/screens/ajustes-escritorio-guardando.png)
- [assets/design/screens/ajustes-escritorio-eliminar.png](../../../assets/design/screens/ajustes-escritorio-eliminar.png)

### Contratos

- [docs/03-architecture/auth.md](../../../docs/03-architecture/auth.md)
- [docs/03-architecture/data-model.md](../../../docs/03-architecture/data-model.md)

### Decisiones

- ADR-0005

### Decisiones registradas (G1, 2026-11-06)

El usuario resolvió las contradicciones entre la spec y los PNG antes de empezar:

1. **Confirmación de borrado:** palabra fija **`ELIMINAR`**, igual en móvil y escritorio. Sustituye al nombre del círculo del PNG de escritorio y al texto del AC-03 original. Se implementa con `ConfirmDialog` y `confirmPhrase="ELIMINAR"`; el botón permanece deshabilitado hasta que la palabra coincide.
2. **Portada:** **solo lectura en F28**. No se pinta «Cambiar portada» ni una acción muerta. El selector se traslada a **F29**, que ya construye la galería y la selección de fotos; usará `PATCH /circles/:circleId` con `coverPhotoId` (contrato de F17) y no necesitará endpoint nuevo. Se anota en la spec de F29.
3. **Vista de miembro:** el owner edita y borra; el miembro **accede en modo lectura** y ve «Lo que puedes hacer aquí» con Permitido/No permitido. El AC-01 se reinterpreta en consecuencia. El miembro puede **salir del círculo** con confirmación (`POST /circles/:circleId/leave`, API de F21); el owner no ve esa acción.
4. **Descarga del círculo:** el bloque «Descarga el círculo completo antes» del diálogo de borrado **se omite hasta F33**. El diálogo avisa del borrado y de que no se puede deshacer, sin enlaces que aún no funcionan.
5. **Nombre del owner:** se muestra el nombre real del owner obtenido de `GET /circles/:circleId/members` («Pídeselo a <nombre>»). El modelo solo admite un owner; si la petición falla, se usa una copy genérica.
6. **Guardado:** **explícito por lote**. Los cambios de nombre, descripción y permisos se acumulan; la barra fija resume cuántos hay («Guardando N cambios: …») y guarda todo en un único `PATCH`. «Descartar» vuelve a los valores guardados. No hay autoguardado.

Decisiones derivadas:

7. **Chrome:** en `/settings` no se pinta el héroe del círculo. La miga termina en «Ajustes», el H1 es «Ajustes de <círculo>» (visible en escritorio y `sr-only` en móvil, donde manda la cabecera compacta) y el foco de sección va a ese H1. La pestaña Ajustes y el subnav del sidebar pasan a enlaces reales.
8. **Salir del círculo** pide confirmación con `ConfirmDialog` aunque el PNG no la muestre: perder el acceso no debe ocurrir por un toque accidental.
9. **Nada de API nueva.** Se reutilizan `PATCH`/`DELETE /circles/:circleId`, `POST /circles/:circleId/leave` y `GET /circles/:circleId/members`.

## Alcance

### Incluye

- CircleForm: nombre, descripción (200 en UI) y portada de solo lectura.
- CirclePermissions: los cuatro flags (`membersCanCreateAlbums`, `membersCanUpload`, `membersCanDownload`, `membersCanTag`) con `Switch`.
- DangerZone: borrado del círculo con `ConfirmDialog` y `confirmPhrase="ELIMINAR"`.
- Guardado explícito por lote con barra fija, resumen de cambios, «Descartar» y estado «Guardando…».
- Edición y borrado solo para el owner; lectura para el miembro.
- Vista de miembro «Lo que puedes hacer aquí», nombre real del owner y «Salir del círculo» con confirmación.
- Estados: carga, error, guardando, guardado, error de guardado, borrando, saliendo.
- Pestaña Ajustes y subnav del sidebar como enlaces reales.
- Teclado, foco y anuncios accesibles.

### No incluye

- Transferencia de propiedad.
- Borrado de cuenta.
- Selector de portada (F29).
- Descarga del círculo completo (F33).
- Endpoints nuevos o cambios de contrato.
- Cambios en invitaciones, miembros o actividad.

## Entregables

- `apps/web/src/routes/_app.circles.$circleId.settings.tsx`
- `apps/web/src/features/circles/settings/**`
- Ajustes en el chrome compartido: `circle-section-nav.tsx`, `circle-sidebar-nav.tsx`, `circle-detail-layout.tsx`, `paths.ts`.
- Queries de actualización, borrado y salida en `features/circles/queries.ts` y `features/members/queries.ts`.
- Tests RTL, MSW y actualización de los tests que esperan Ajustes deshabilitado.

## UX y estados

- **Owner:** formulario con valores guardados; barra fija que solo aparece con cambios; resumen «Guardando N cambios: …»; «Guardando…» deshabilita las acciones; error de guardado en `InlineAlert` sin perder lo escrito; éxito con toast.
- **Miembro:** estado «Solo las personas administradoras pueden cambiar los ajustes», lista Permitido/No permitido y «Salir del círculo».
- **Borrado:** `ConfirmDialog` responsive (hoja en móvil, diálogo desde 768 px) con aviso de irreversibilidad y campo `ELIMINAR`; CTA deshabilitada hasta que coincida; error visible si falla.
- **Sin permisos:** nunca se muestra el formulario editable ni la zona de peligro.
- **Carga y error:** el layout ya resuelve 401/404/error del círculo; la sección añade su propio estado de guardado.

## Criterios de aceptación

- **AC-01.** Solo el owner puede editar y borrar; el miembro accede en modo lectura.
- **AC-02.** Guardar settings afecta a permisos reales: `PATCH` persiste los flags y la UI y la API los aplican.
- **AC-03.** Borrar exige escribir `ELIMINAR`.
- **AC-04.** La confirmación de borrado usa sheet/dialog responsive y no se puede activar por accidente.
- **AC-05.** Miembro sin permisos ve el estado de solo lectura, los permisos efectivos y el nombre del owner.
- **AC-06.** Teclado y foco: pestaña, formulario, switches, barra de guardado y diálogos; foco devuelto al disparador al cerrar.
- **AC-07.** Guardado explícito por lote: la barra resume los cambios, «Descartar» restaura y no hay autoguardado.
- **AC-08.** El miembro puede salir del círculo con confirmación; el owner no ve esa acción.
- **AC-09.** La portada se muestra en solo lectura, sin botón ni enlace muerto.
- **AC-10.** Ajustes es un enlace real en la pestaña y en el sidebar, con `aria-current` único **por navegación** y foco en el título.

## Pruebas

- RTL settings (owner, miembro, carga, error).
- Permisos: los cuatro flags y su persistencia.
- Confirmación: `ELIMINAR`, teclado y foco.
- Guardado por lote y descarte.
- Borrado y salida con navegación y toast.
- Responsive y axe en los estados principales.
- Regresión de Álbumes, Personas y chrome compartido.

## Archivos previstos

- `apps/web/src/routes/_app.circles.$circleId.settings.tsx`
- `apps/web/src/features/circles/settings/**`
- `apps/web/src/features/circles/circle-detail-layout.tsx`
- `apps/web/src/features/circles/circle-section-nav.tsx`
- `apps/web/src/features/circles/circle-sidebar-nav.tsx`
- `apps/web/src/features/circles/paths.ts`
- `apps/web/src/features/circles/queries.ts`
- `apps/web/src/features/circles/errors.ts`
- `apps/web/src/features/members/queries.ts`

## Verificación

- `pnpm --filter @memora/web test settings`
- `pnpm --filter @memora/web test -- --maxWorkers=2`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm docs:check`
- `pnpm build`
- Navegador real: owner `lucia@memora.test` sobre un círculo desechable «Pruebas F28» y miembro `mateo@memora.test` sobre «Familia Ferrer», a 375/768/1024/1440, claro y oscuro, con teclado y axe.

## Definition of Ready

- [x] Dependencias `done` (F18).
- [x] Decisiones resueltas (ver «Decisiones registradas»).
- [x] Contratos congelados: `PATCH`/`DELETE /circles/:circleId` y `POST /circles/:circleId/leave` ya existen.
- [x] Diseño enlazado: cinco PNG canónicos; el estado base de escritorio es **inferido** de `ajustes-escritorio-guardando.png` + `ajustes-movil.png` y se revisa con `design-auditor`.
- [x] Datos de prueba: seed con `lucia@memora.test` (owner) y `mateo@memora.test` (member), contraseña `memora-demo`, más un círculo desechable para el borrado.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. Las decisiones de G1 del 2026-11-06 están registradas arriba. La zona de peligro no se puede activar por accidente: exige abrir el diálogo y escribir `ELIMINAR`.
