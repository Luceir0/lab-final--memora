---
id: F18
title: "Circles web"
milestone: M2
size: M
status: accepted
spec: complete
depends_on:
  - "F16"
  - "F17"
blocks:
  - "F22"
  - "F24"
  - "F28"
design_refs:
  - "assets/design/screens/mis-circulos-movil.png"
  - "assets/design/screens/mis-circulos-movil-vacio.png"
  - "assets/design/screens/mis-circulos-movil-cargando.png"
  - "assets/design/screens/mis-circulos-escritorio.png"
  - "assets/design/screens/mis-circulos-escritorio-error.png"
  - "assets/design/screens/circulo-movil.png"
  - "assets/design/screens/circulo-movil-sin-albumes-recien-creado.png"
  - "assets/design/screens/circulo-escritorio.png"
  - "assets/design/screens/circulo-escritorio-sin-acceso.png"
  - "assets/design/screens/crear-circulo-movil-validacion.png"
  - "assets/design/screens/crear-circulo-escritorio-guardando.png"
  - "assets/design/screens/crear-circulo-escritorio-error.png"
contracts:
  - "docs/02-design/screens.md"
decisions: []
---

# F18 — Circles web

> **Milestone:** M2 · **Talla:** M · **Estado:** accepted · **Spec:** completa
> **Depende de:** F16, F17 · **Bloquea:** F22, F24, F28

## Objetivo

Construir Mis círculos, crear círculo y detalle con estados.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/mis-circulos-movil.png](../../../assets/design/screens/mis-circulos-movil.png)
- [assets/design/screens/mis-circulos-movil-vacio.png](../../../assets/design/screens/mis-circulos-movil-vacio.png)
- [assets/design/screens/mis-circulos-movil-cargando.png](../../../assets/design/screens/mis-circulos-movil-cargando.png)
- [assets/design/screens/mis-circulos-escritorio.png](../../../assets/design/screens/mis-circulos-escritorio.png)
- [assets/design/screens/mis-circulos-escritorio-error.png](../../../assets/design/screens/mis-circulos-escritorio-error.png)
- [assets/design/screens/circulo-movil.png](../../../assets/design/screens/circulo-movil.png)
- [assets/design/screens/circulo-movil-sin-albumes-recien-creado.png](../../../assets/design/screens/circulo-movil-sin-albumes-recien-creado.png)
- [assets/design/screens/circulo-escritorio.png](../../../assets/design/screens/circulo-escritorio.png)
- [assets/design/screens/circulo-escritorio-sin-acceso.png](../../../assets/design/screens/circulo-escritorio-sin-acceso.png)
- [assets/design/screens/crear-circulo-movil-validacion.png](../../../assets/design/screens/crear-circulo-movil-validacion.png)
- [assets/design/screens/crear-circulo-escritorio-guardando.png](../../../assets/design/screens/crear-circulo-escritorio-guardando.png)
- [assets/design/screens/crear-circulo-escritorio-error.png](../../../assets/design/screens/crear-circulo-escritorio-error.png)

### Contratos

- [docs/02-design/screens.md](../../../docs/02-design/screens.md)

### Decisiones

- No aplica.

### Decisiones de F18 (2026-11-03)

- **Stats de la lista:** se piden con N+1 contra `GET /circles/:id`; no se cambia el contrato congelado. La caché de React Query comparte la clave con la página de detalle, así que abrir un círculo no repite la petición.
- **Crear círculo:** `POST /circles` acepta `settings` opcional (cambio de contrato autorizado por el usuario). Si falta `settings`, se aplican los defaults de `DEFAULT_CIRCLE_SETTINGS`; si viene, debe ser el objeto completo y se guarda sin merge. La portada del círculo se elige o edita en F28, porque al crear todavía no hay fotos.
- **Descripción:** la UI limita a 200 caracteres como el diseño; el contrato del servidor sigue en 500.
- **Detalle:** pestañas Álbumes/Personas/Ajustes. Álbumes queda activo con estado vacío hasta F24; Personas y Ajustes se muestran deshabilitadas con explicación accesible hasta F22/F28. La lista de miembros no existe todavía (F21): el detalle solo muestra `stats.membersCount`.
- **Guard de sesión:** se implementa en F18 en el layout `_app`; un `401` limpia la caché y redirige a `/login` conservando `redirect`, como decide [auth.md](../../03-architecture/auth.md).
- **Sidebar:** F18 rellena la lista de círculos, la persona autenticada de `GET /me` y el subnav del círculo activo.
- **Destacado:** primer círculo del listado (`updatedAt desc`) que tenga portada; si ninguno la tiene, fondo genérico con iniciales. El badge «+N fotos esta semana» se omite hasta F35.
- **Alta de círculo:** ruta `/circles/new` con `ResponsiveDialog`: diálogo en escritorio y hoja/pantalla completa en móvil, con URL propia para Atrás, recarga y enlace directo.
- **Portada:** el velo sobre la foto usa el token `viewer-bg` (oscuro en ambos temas) y texto `text-on-primary`, para que el texto pequeño (stats, descripción, subtítulo) mantenga contraste sobre fotos arbitrarias; el chip «Destacado» usa el mismo scrim.
- **Éxito del alta:** tras crear, se navega a `/circles/:id?created=true`, se muestra un `Toast` «Círculo creado» y se enfoca el `<h1>` del detalle.

### Decisión de F18 (2026-11-04) — Alta sin portada y layout del formulario

- **El alta no muestra portada.** `createCircleRequestSchema` y `POST /circles` no aceptan `coverPhotoId`, y ninguna feature prevista permite subir o elegir portada en ese punto: la portada se elige o edita en F28. Se retira del formulario la etiqueta «Portada», la vista previa `CircleCover`, el contenedor discontinuo y el texto «Se usará una imagen genérica hasta que añadas fotos.» para no simular una acción que no existe. Se anula el bloque de portada de las capturas de alta: el contenedor discontinuo con «Elegir una foto» en móvil y la foto con «Cambiar» en escritorio. La portada se edita en F28.
- **Campos en una sola columna; permisos 2+2 desde `lg`.** Nombre y descripción se apilan en todos los tamaños. Los cuatro permisos quedan en una columna con `max-w-md` centrada con `mx-auto` por debajo de `lg` y, desde `lg`, pasan a una rejilla de dos columnas a ancho completo (`lg:max-w-none`) con 2 interruptores en cada una y un separador vertical con `border-border` entre ambas. El `ResponsiveDialog` sigue en `size="lg"` y no se ensancha.
- **Atajo `Esc`:** alineado abajo a la izquierda del pie con `md:self-end` y `md:mr-auto`, sin hueco inferior. No se modifica `overlayFooterClasses` ni el pie compartido de `packages/ui`.

## Alcance

### Incluye

- Lista y destacado
- Crear círculo
- Detalle con pestañas
- Cabecera compacta
- Estados vacío/carga/error
- Sin acceso
- Stats
- Guard de sesión y `401` → `/login`
- Sidebar: lista de círculos, usuario y subnav del círculo activo

### No incluye

- Álbumes (F24)
- Ajustes (F28)
- Actividad (F35)
- Lista de miembros (F21/F22)
- Portada editable y permisos posteriores a la creación (F28)

## Entregables

- apps/web/src/routes/_app/circles/**
- features/circles/**

## UX y estados

- vacío
- cargando
- error
- guardando
- sin acceso

## Criterios de aceptación

- **AC-01.** ✅ **Aceptado por el usuario el 2026-11-04.** Móvil una columna; escritorio rejilla en lista y detalle. El alta mantiene los campos en una columna en todos los tamaños; los permisos son una columna hasta `lg` y 2+2 con separador vertical desde `lg` (decisión 2026-11-04).
- **AC-02.** Estado vacío guía a crear.
- **AC-03.** Crear valida y guarda.
- **AC-04.** Detalle muestra miembros/stats.
- **AC-05.** Cabecera compacta al hacer scroll.
- **AC-06.** Sin acceso no filtra datos.
- **AC-07.** ✅ **Aceptado por el usuario el 2026-11-04.** Todo con teclado.

### Nota de aceptación (2026-11-04)

El usuario aceptó la feature el 2026-11-04 («todo aprobado») tras la revisión visual y de teclado que estaba pendiente. La aceptación cubre AC-01 (layout de lista, detalle y alta a 375/1440, claro y oscuro) y AC-07 (recorrido con teclado, foco, `Esc` y pestañas). El estado pasa a `accepted`; el paso a `done` queda pendiente del commit, la PR, el merge y el CI, que aún no se han ejecutado.

## Pruebas

- RTL lista/crear/detalle
- MSW
- Responsive
- Estados
- axe (jsdom en componentes y navegador real en la revisión)
- Teclado: foco, `Esc` en el diálogo y pestañas
- `401` → redirección y `404` → sin acceso

## Archivos previstos

- `apps/web/src/routes/_app/circles/**`
- `apps/web/src/features/circles/**`
- `apps/web/src/routes/_app.tsx` (guard y datos del shell)
- `apps/web/src/components/layout/**` (solo si el subnav lo exige)
- `packages/shared/src/schemas/circles.ts` (solo `settings` en creación)
- `apps/api/src/modules/circles/**` (solo `settings` en creación)

## Verificación

- `pnpm --filter @memora/web test circles`
- `pnpm --filter @memora/web typecheck`
- `pnpm --filter @memora/web lint`
- `pnpm --filter @memora/web build`
- `DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test circles`
- `pnpm docs:check`
- Revisar 375/1440, claro y oscuro

## Definition of Ready

- [x] Dependencias `done`: F16 y F17 cerradas.
- [x] Decisiones resueltas: ver «Decisiones de F18».
- [x] Contratos congelados: el único cambio autorizado es `settings` en `POST /circles`.
- [x] Diseño enlazado: 13 capturas en `design_refs`.
- [x] Datos de prueba: `apps/api/prisma/seed.ts` crea dos círculos con miembros y fotos.
- [x] Sin preguntas bloqueantes.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Ninguna. La actividad se añade en F35 y la lista de miembros en F21/F22.
