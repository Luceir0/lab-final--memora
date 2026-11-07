---
id: F44
title: "Portadas de círculo y álbum"
milestone: M4
size: S/M
status: review
spec: complete
depends_on:
  - "F23"
  - "F24"
  - "F28"
  - "F29"
blocks: []
design_refs: []
contracts:
  - "docs/03-architecture/api-contract.md"
decisions:
  - "F24 D2 — la portada del álbum se elige entre sus fotos"
  - "F28 D2 — la portada del círculo se trasladó a F29 y queda pendiente"
  - "F29 nota de invariante de portada"
---

# F44 — Portadas de círculo y álbum

> **Milestone:** M4 · **Talla:** S/M · **Estado:** review · **Spec:** completa
> **Depende de:** F23, F24, F28, F29 · **Bloquea:** —
> **Auditoría:** B (UI sobre endpoints ya auditados; sin permisos nuevos en servidor)

## Objetivo

Permitir elegir y quitar la portada de un álbum entre sus fotos, y la de un círculo
entre las fotos del círculo, usando los `PATCH` que ya existen. Hoy el bloque del
álbum está deshabilitado con un texto fijo y la portada del círculo es de solo lectura.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- [Contrato de API](../../03-architecture/api-contract.md)
- [F24 — Álbums web](../F24-albums-web/spec.md) (D2)
- [F28 — Ajustes del círculo](../F28-circle-settings/spec.md) (decisión 2)
- [F29 — Galería](../F29-gallery/spec.md) (nota de invariante de portada)

### Diseño

No hay PNG canónico de este selector. Se deriva del patrón ya auditado de la galería:
`ResponsiveDialog` (hoja en móvil, diálogo desde 768 px) + `PhotoGrid` con selección
única. En el álbum el selector se incrusta dentro de `AlbumFormDialog` para no anidar
diálogos. Se registra como decisión de patrón en el `handoff`.

### Contratos

- `PATCH /api/circles/:circleId` acepta `coverPhotoId` (foto del mismo círculo; `null`
  la quita). Sin cambios.
- `PATCH /api/albums/:albumId` acepta `coverPhotoId` (foto del mismo álbum; `null` la
  quita). Sin cambios.
- **No se añade `GET /circles/:circleId/photos`.** El selector del círculo navega por
  `GET /circles/:circleId/albums` y `GET /albums/:albumId/photos`, que ya existen.

### Decisiones del G1 (2026-11-07)

1. **Foto del círculo:** navegar por los álbumes del círculo dentro del selector. Se
   evita un contrato nuevo y se reutilizan `useAlbumListQuery` y `useAlbumPhotosQuery`.
2. **Acción del álbum:** dentro de `AlbumFormDialog`, en el bloque de portada que hoy
   está deshabilitado. Se guarda con el mismo `PATCH` del formulario.
3. **Patrón:** `PhotoGrid` + `ResponsiveDialog`; sin PNG canónico, se documenta.
4. **Guardado:** la portada forma parte del formulario del álbum y del borrador de
   Ajustes del círculo. No hay un guardado inmediato paralelo.

## Alcance

### Incluye

- Selector de portada de álbum entre las fotos del álbum, con «Quitar portada».
- Nota dinámica: sin fotos, «Sube fotos para elegir una portada»; con fotos, acción.
- Selector de portada del círculo para el owner, navegando por sus álbumes.
- Portada del círculo de solo lectura para quien no puede editar.
- Estados de carga, vacío, error con reintento, guardando y éxito.
- Invalidación de la caché del álbum, la lista, el círculo y el héroe.
- Tests de componente, permisos y accesibilidad.

### No incluye

- Endpoint nuevo `GET /circles/:circleId/photos`.
- Subida de una portada como objeto aparte (la portada sigue siendo una foto más).
- Avatar de perfil.
- Cambios en los contratos de F17/F23.

## Entregables

- `apps/web/src/features/covers/**` (selector reutilizable y hook de fotos por álbum).
- `apps/web/src/features/albums/album-form-dialog.tsx`
- `apps/web/src/features/circles/settings/owner-settings.tsx`
- Tests en `features/covers`, `features/albums` y `features/circles/settings`.

## UX y estados

- **Álbum, 0 fotos:** nota «Sube fotos para elegir una portada» y acción deshabilitada.
- **Álbum, con fotos:** miniatura actual o hueco vacío, «Elegir portada» y «Quitar
  portada» cuando hay una. El selector muestra carga, vacío, error con reintento y la
  foto marcada.
- **Círculo, owner:** el bloque de portada de Ajustes añade «Elegir portada» y «Quitar
  portada». El selector pide primero el álbum y después sus fotos.
- **Círculo, member:** solo la portada, sin acciones.
- **Guardando:** botón con `loading`, formulario `aria-busy` y región viva sin anunciar
  porcentajes.
- **Éxito:** toast existente («Álbum actualizado» / «Ajustes guardados»).
- **Error:** `InlineAlert` con reintento o mensaje del servidor; nunca se pierde el
  borrador.

## Criterios de aceptación

- **AC-01.** En el formulario del álbum, el bloque de portada muestra la portada actual
  (o un hueco vacío) y una nota dinámica: con 0 fotos, «Sube fotos para elegir una
  portada» y acción deshabilitada; con fotos, la acción está disponible.
- **AC-02.** «Elegir portada» abre, dentro del mismo formulario, una rejilla con las
  fotos del álbum. La rejilla tiene estados de carga, vacío, error con reintento y
  selección única visible.
- **AC-03.** Al guardar el formulario con una foto elegida, se envía
  `coverPhotoId: <id>` en el `PATCH` del álbum y la miniatura se actualiza sin recargar.
- **AC-04.** «Quitar portada» envía `coverPhotoId: null` en el mismo `PATCH` y deja el
  álbum sin portada sin recargar.
- **AC-05.** Solo el owner o el creador del álbum con `membersCanCreateAlbums` pueden
  elegir o quitar la portada del álbum; el resto la ve en solo lectura. La regla es
  espejo de `canEditAlbum` y el servidor la vuelve a comprobar.
- **AC-06.** En Ajustes del círculo, el owner ve «Elegir portada» y «Quitar portada».
  El selector permite navegar por los álbumes del círculo y elegir una foto de
  cualquiera de ellos.
- **AC-07.** Quien no es owner ve la portada del círculo en solo lectura, sin botón ni
  enlace muerto.
- **AC-08.** La portada del círculo forma parte del borrador de Ajustes: cuenta como un
  cambio («portada»), se envía con el `PATCH` de «Guardar cambios» y se revierte con
  «Descartar».
- **AC-09.** Tras guardar una portada se invalidan y refrescan el detalle del álbum, la
  lista de álbumes, el detalle del círculo (héroe) y la lista de círculos. Las fotos no
  se recargan si no cambian.
- **AC-10.** Los estados de carga, vacío, error y éxito cumplen axe sin violaciones en
  los estados tocados, se recorren por teclado, anuncian la selección y devuelven el
  foco al disparador.
- **AC-11.** El flujo se revisa a 375 px y desde 1280 px, en tema claro y oscuro, solo
  con tokens y componentes de `@memora/ui`.

## Pruebas

- Selector: carga, vacío, error y reintento, selección única, quitar, teclado y axe.
- Álbum: nota con 0 y N fotos, payload con `coverPhotoId` y `null`, invalidez de caché,
  permiso de owner/creador y solo lectura para el resto.
- Círculo: owner edita, member no; portada en el borrador, resumen y descarte;
  navegación álbum → fotos; payload con `coverPhotoId` y `null`.
- Regresión: `test albums` y `test circle-settings`.

## Archivos previstos

- `apps/web/src/features/covers/**`
- `apps/web/src/features/albums/album-form-dialog.tsx`
- `apps/web/src/features/albums/albums-form.test.tsx`
- `apps/web/src/features/circles/settings/owner-settings.tsx`
- `apps/web/src/features/circles/settings/**/*.test.tsx`

## Verificación

```bash
pnpm --filter @memora/web test covers
pnpm --filter @memora/web test albums
pnpm --filter @memora/web test circle-settings
pnpm --filter @memora/web test --maxWorkers=2 --retry=1
pnpm typecheck
pnpm lint
pnpm build
pnpm format:check
pnpm docs:check
pnpm agents:check
```

## Definition of Ready

- [x] Dependencias `done` (F23, F24, F28, F29).
- [x] Decisiones resueltas en el G1 del 2026-11-07.
- [x] Contratos congelados: solo se usan `PATCH` existentes.
- [x] Diseño: patrón derivado de `PhotoGrid` + `ResponsiveDialog`, registrado en el
      handoff (no hay PNG canónico).
- [x] Datos de prueba: seed con círculos, álbumes y fotos.
- [x] Nivel de auditoría declarado: **B**.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin
permiso.

## Preguntas abiertas

Ninguna. La portada sigue siendo una foto más del álbum o del círculo; no se sube un
objeto aparte ni se añade endpoint nuevo.
