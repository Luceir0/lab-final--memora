---
id: F14
title: "PWA e instalación"
milestone: M1
size: L
status: done
spec: complete
depends_on:
  - "F10"
  - "F13"
blocks: []
design_refs:
  - "assets/design/screens/perfil-movil.png"
contracts:
  - "docs/01-product/scope.md"
  - "docs/03-architecture/adr/ADR-0013-pwa.md"
decisions:
  - "ADR-0013"
---

# F14 — PWA e instalación

> **Milestone:** M1 · **Talla:** L · **Estado:** done · **Spec:** completa
> **Depende de:** F10, F13 · **Bloquea:** —

## Objetivo

Hacer la app instalable en Android con manifest, iconos y experiencia de instalación.

## Contexto mínimo

- [AGENTS.md](../../../AGENTS.md)
- [Workflow](../../06-process/workflow.md)
- Contratos y decisiones enlazados abajo.
- No cargues el README completo ni otras specs.

### Diseño

- [assets/design/screens/perfil-movil.png](../../../assets/design/screens/perfil-movil.png)

### Contratos

- [docs/01-product/scope.md](../../../docs/01-product/scope.md)
- [ADR-0013](../../../docs/03-architecture/adr/ADR-0013-pwa.md)

### Decisiones

- ADR-0013

## Alcance

### Incluye

- manifest.webmanifest
- Iconos 192/512/maskable
- apple-touch-icon
- theme-color
- display standalone
- InstallAppRow
- Detección de beforeinstallprompt
- Decisión sobre service worker

### No incluye

- Offline
- Push
- Subidas en segundo plano

## Entregables

- apps/web/public/manifest.webmanifest
- Iconos 192/512/maskable
- InstallAppRow
- Documentación de instalación

## UX y estados

- instalable
- instalada
- instrucciones iOS
- no soportado

## Criterios de aceptación

- **AC-01.** Manifest válido.
- **AC-02.** Iconos existen y son correctos.
- **AC-03.** Android ofrece instalar.
- **AC-04.** La app instalada abre en /circles.
- **AC-05.** Perfil explica cómo instalar.
- **AC-06.** No se promete offline.

### Ampliación autorizada (2026-11-03)

El usuario autorizó absorber los pendientes que F13 trasladó a esta feature. Añaden
estos criterios:

- **AC-07.** Todas las pantallas comparten un contenedor de contenido de escritorio:
  máximo 80rem, centrado, con gutters de 24 px (32 px desde `lg`).
- **AC-08.** En móvil se puede llegar a `/help` y `/privacy` desde filas del Perfil
  provisional; sus páginas conservan un `<h1>` de contexto.
- **AC-09.** El landmark del sidebar tiene un nombre que describe su contenido tanto
  en móvil como en escritorio.
- **AC-10.** El logotipo navega sin recargar (SPA) y sigue sin anunciarse como destino
  activo (`aria-current` neutralizado), verificado con router real.

Fuera de esta ampliación quedan, por seguir asignados a otras features:

- Badge de contador de «Subidas» → F27.
- Perfil real (cuenta, apariencia, almacenamiento, cierre de sesión) → F34.
- Pista de ubicación adicional para `/help` y `/privacy` en móvil: la resuelven las
  filas de AC-08 y sus cabeceras; si F34 cambia el Perfil, lo revisa.

## Pruebas

- Manifiesto: JSON válido, campos obligatorios y PNG con dimensiones reales.
- Chrome real: `Page.getAppManifest` y `Page.getInstallabilityErrors`.
- Tests de componente de `InstallAppRow` en sus cuatro estados, con axe.
- Instalación manual Android: pendiente de F42 (HTTPS).

## Verificación

- `pnpm --filter @memora/web test`
- `pnpm --filter @memora/web lint`
- `pnpm --filter @memora/web typecheck`
- `pnpm --filter @memora/web build`
- Chrome DevTools > Application > Manifest, o CDP equivalente
- Medición a 375 y 1440, claro y oscuro

## Definition of Ready

- [x] Dependencias `done` (F10 y F13).
- [x] Decisiones resueltas (las diez de arriba).
- [x] Contratos congelados (ADR-0013 y tokens; sin contratos de API).
- [x] Diseño enlazado (`perfil-movil.png`; escritorio inferido de los mockups de F13).
- [x] Datos de prueba (no aplica: no hay datos de servidor).
- [x] Sin preguntas bloqueantes.

## Archivos previstos

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/icons/**`
- `apps/web/src/features/profile/InstallAppRow.tsx`
- `apps/web/src/features/profile/install-prompt.ts`
- `apps/web/src/components/layout/page-container.tsx`
- `apps/web/src/components/layout/logo.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/routes/_app.profile.tsx`
- `scripts/generate-app-icons.mjs`

## Decisiones de arranque (2026-11-03)

Confirmadas por el usuario antes de escribir código:

1. **Alcance ampliado** con los pendientes de F13 (AC-07 a AC-10). La talla pasa de
   S/M a L y la implementación se divide en dos pasadas: PWA y shell.
2. **Icono**: fondo `--color-primary` (#5B47E0) y punto blanco centrado, coherente con
   el punto del logotipo. Se generan 192, 512, `maskable` 192/512 y `apple-touch-icon`
   de 180 px. El script es Node puro (`zlib`) y **no añade dependencias**.
3. **`InstallAppRow` solo por debajo de `lg`**, como el diseño móvil. En escritorio no
   se muestra la fila.
4. **Android físico queda para F42**: aquí se verifica con Chrome real en local
   (`localhost` es contexto seguro y expone la instalabilidad). El AC-03 se declara
   «estructural, pendiente de dispositivo real» si no hay Android con HTTPS.
5. **Sin service worker** (ADR-0013). Los criterios actuales de Chrome para
   `beforeinstallprompt` no lo exigen. Solo se añadiría uno mínimo sin caché si Chrome
   real lo rechazara, y se registraría aquí.
6. **Ayuda y Privacidad** se alcanzan en móvil desde dos filas del Perfil provisional,
   como el mockup. No se añade un cuarto destino a la barra inferior.
7. **Contenedor de escritorio**: máximo 80rem centrado, gutters 24/32 px.
8. **El tema se queda en el pie del sidebar**: no se mueve a cabeceras de página.
9. **Logotipo**: `Link` del router con `aria-current` neutralizado, verificado con un
   test de router real.
   - *Nota de implementación (2026-11-03):* `Link` inyecta `aria-current="page"`
     cuando está activo y no permite neutralizarlo con fiabilidad, así que se
     resolvió con un `<a href="/circles">` nativo que llama a `router.navigate`
     solo en el clic primario sin modificadores. El resultado es el mismo que
     pedía la decisión: navegación sin recarga, `aria-current="false"` y enlaces
     que siguen funcionando en pestaña nueva. AC-10 verificado con router real.
10. **Nivel de auditoría C**: sin revisión independiente. Gates automáticos, axe en CI
    y aceptación del usuario. Barrido de 375 y 1440 en claro y oscuro.

## Handoff

Al terminar, completa `handoff.md` y actualiza el tablero. No hagas commit ni push sin permiso.

## Preguntas abiertas

Resuelta: Chrome **no** exige service worker para ofrecer la instalación ni para disparar
`beforeinstallprompt`; los requisitos son HTTPS, manifiesto con `name`/`short_name`,
iconos de 192 y 512, `start_url`, `display` y `prefer_related_applications` ausente o
`false`, más heurísticas de interacción. Se comprobará igualmente con
`Page.getInstallabilityErrors` de Chrome antes de cerrar.
