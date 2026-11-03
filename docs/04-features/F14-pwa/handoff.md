# Handoff — F14 PWA e instalación

- **Estado:** done (aceptada por el usuario el 2026-11-03)
- **Rama:** `feat/F14-pwa` (sin commits ni push: todo el cambio vive en el árbol de trabajo)
- **Fecha:** 2026-11-03
- **Implementado por:** ui-dev (subagente, tres pasadas: Parte A PWA, Parte B shell y correcciones) y el orquestador (plan, verificación independiente y cierre)
- **Revisado por:** no aplica (nivel C; gates automáticos y aceptación del usuario)

## Resultado

Memora queda instalable en Chrome local: manifiesto válido, cinco iconos
versionados, metas de instalación en la raíz y una fila de instalación en el
Perfil provisional con sus cuatro estados. Sin service worker, por ADR-0013: no
se promete funcionar sin conexión. Se absorbieron además los pendientes que F13
trasladó: contenedor de contenido de 80rem, accesos a Ayuda y Privacidad en
móvil desde el Perfil, `<aside>` con nombre útil y logotipo con navegación SPA
sin `aria-current`. `Page.getAppManifest` no reporta errores,
`Page.getInstallabilityErrors` devuelve `[]` y no hay errores de consola ni
avisos de hidratación.

El usuario aceptó la feature el 2026-11-03 tras probarla en navegador y pidió un
cambio, ya aplicado: el destino «Subir» llevaba un círculo violeta sólido
permanente y ahora es idéntico al resto (icono en `muted` y píldora `primary-soft`
solo en activo).

## Cambios (archivos)

### PWA

- `apps/web/public/manifest.webmanifest` — `name` y `short_name` «Memora»,
  `lang: es`, `start_url: /circles`, `scope: /`, `display: standalone`,
  `background_color` y `theme_color` `#F6F6FA`, cuatro iconos `any`/`maskable` de
  192 y 512; sin `prefer_related_applications`.
- `apps/web/public/icons/` — `icon-192.png`, `icon-512.png`,
  `icon-maskable-192.png`, `icon-maskable-512.png` y `apple-touch-icon-180.png`.
- `scripts/generate-app-icons.mjs` — generador Node puro con `node:zlib`, **sin
  dependencias**: fondo `--color-primary` (`#5B47E0`) y punto blanco centrado
  (radio 0,18 del lado). Los iconos se versionan; el script solo hace falta para
  regenerarlos.
- `apps/web/src/routes/__root.tsx` — `link rel="manifest"`, `rel="icon"` que
  reutiliza `icon-192.png` (Chrome deja de pedir `/favicon.ico`),
  `apple-touch-icon`, `mobile-web-app-capable` junto a la meta de Apple (sin
  aviso de deprecación) y `apple-mobile-web-app-title`. El `theme-color` del
  documento sigue al tema; el del manifiesto no.
- `apps/web/src/features/profile/install-app-row.tsx` — fila de instalación con
  los cuatro estados, `role="status"` para el cambio de estado, botón «Instalar»
  solo en `available` y visible solo por debajo de `lg`.
- `apps/web/src/features/profile/use-install-prompt.ts` — `beforeinstallprompt`
  con `preventDefault`, `appinstalled`, `display-mode: standalone`, detección de
  iOS y `unsupported` como estado inicial para que SSR y cliente coincidan.
- `apps/web/src/features/profile/install-copy.ts` — textos de los cuatro
  estados; ninguno promete funcionar sin conexión.
- `apps/web/src/features/profile/install-app-row.test.tsx` — cuatro estados,
  botón y axe.
- `apps/web/src/features/profile/pwa-assets.test.ts` — manifiesto parseado con
  sus campos obligatorios y cabeceras PNG reales (firma, dimensiones, profundidad
  y tipo de color) de los cinco archivos.
- `apps/web/src/features/profile/profile-page.test.tsx` — Perfil provisional con
  la fila de instalación y los accesos.

### Parte B (pendientes de F13)

- `apps/web/src/components/layout/page-container.tsx` — `mx-auto w-full
  max-w-7xl px-6 py-10 lg:px-8`: 80rem centrados con gutters de 24/32 px, en un
  único sitio.
- `apps/web/src/components/layout/section-placeholder.tsx` — usa
  `PageContainer` y acepta contenido entre la cabecera y el aviso provisional.
- `apps/web/src/routes/_app.profile.tsx` — Perfil provisional con
  `InstallAppRow` y `ProfileQuickLinks`.
- `apps/web/src/features/profile/profile-quick-links.tsx` — `nav
  aria-label="Más secciones"` con filas a `/help` y `/privacy`, solo
  `lg:hidden`.
- `apps/web/src/routes/_app.help.tsx` y
  `apps/web/src/features/spike/circles-page.tsx` — pasan por `PageContainer` y
  conservan su `<h1>` de contexto.
- `apps/web/src/components/layout/sidebar.tsx` — `<aside aria-label="Navegación">`
  y el bloque de cuenta como `<section aria-label="Cuenta y apariencia">`,
  oculto en móvil.
- `apps/web/src/components/layout/logo.tsx` — `<a href="/circles">` con
  `router.navigate` en el clic primario sin modificadores, `aria-current="false"`
  y área táctil de 44 px. Conserva abrir en pestaña nueva y el menú contextual.
- `apps/web/src/components/layout/primary-nav.tsx` y
  `apps/web/src/components/layout/navigation.ts` — «Subir» sin círculo sólido:
  icono de 20 px en `muted` sin fondo y píldora `primary-soft` solo en activo,
  como el resto de destinos.
- `apps/web/src/routes/_app.provisional.test.tsx` — `Link` sustituido por un
  ancla equivalente para poder montar Perfil, Subidas y Privacidad sin router.

Sin dependencias nuevas, sin tocar `packages/ui`, `apps/api` ni contratos, y sin
commit ni push.

## Verificación (comando → resultado real)

- `pnpm --filter @memora/web test` → **24 archivos, 141 tests**, todos en verde.
- `pnpm --filter @memora/web lint` → sin hallazgos.
- `pnpm --filter @memora/web typecheck` → sin hallazgos.
- `pnpm --filter @memora/web build` → sin hallazgos; **5 rutas prerenderizadas**.
- `pnpm typecheck` → **9/9**.
- `pnpm lint` → **6/6**.
- `pnpm lint:root` → OK.
- `pnpm docs:check` → **191 archivos, 456 enlaces, 0 rotos**.
- `pnpm agents:check` → **43 specs, 43 filas**.
- `pnpm format:check` → OK.

Chrome real (CDP):

- `Page.getAppManifest` → `errors: []`; `start_url` →
  `http://localhost:3000/circles`; iconos 192/512 `any` y `maskable`
  detectados.
- `Page.getInstallabilityErrors` → `[]`.
- Sin service worker (ADR-0013).
- **0 errores de consola y 0 avisos de hidratación**, sin 404 de
  `/favicon.ico` ni aviso de `apple-mobile-web-app-capable` tras la corrección.

Medición y accesibilidad:

- Contenedor: 375 px → 375, 768 px → 1024 y 1184 px → 1440; a 1920 px el tope de
  1280; gutters de 24 px y 32 px desde `lg`.
- `InstallAppRow` y las filas de Ayuda y Privacidad visibles a 375 px y ocultas a
  1024 y 1440.
- Árbol de accesibilidad: `complementary` «Navegación», `navigation` «Navegación
  principal», `region` «Cuenta y apariencia» solo en escritorio y `navigation`
  «Más secciones» en móvil.
- Clic en el logotipo: cambia a `/circles` sin recarga (`navigations: 1` y el
  centinela intacto) y `aria-current` sigue en `false`.

Ajuste pedido en la aceptación (2026-11-03), medido a 375 px:

- Inactivo `#5E5D78` en claro y `#A3A9C2` en oscuro; activo `#4A37C9` con
  `#EEEBFE` de píldora en claro y `#A99CFF` con `#241F4D` en oscuro.
- Área táctil de 44 × 44 px y barra de 72 px.

## Criterios de aceptación

| AC | Criterio | Resultado |
| --- | --- | --- |
| AC-01 | Manifest válido | **Pasa.** JSON con los campos obligatorios en test y `Page.getAppManifest` con `errors: []`. |
| AC-02 | Iconos existen y son correctos | **Pasa.** Cinco PNG versionados; firma, dimensiones y tipo de color comprobados en test y detectados por Chrome. |
| AC-03 | Android ofrece instalar | **Parcial, estructural.** `Page.getInstallabilityErrors` devuelve `[]` en Chrome local; la comprobación en Android físico con HTTPS queda para F42. |
| AC-04 | La app instalada abre en `/circles` | **Parcial.** `start_url` `/circles` verificado en el manifiesto y en `Page.getAppManifest`; la instalación real en dispositivo queda para F42. |
| AC-05 | Perfil explica cómo instalar | **Pasa.** Cuatro estados con copy propio, botón cuando hay evento capturado y tests con axe; fila medida a 375. |
| AC-06 | No se promete offline | **Pasa.** `install-copy.ts` habla de instalar, nunca de funcionar sin conexión; sin service worker. |
| AC-07 | Contenedor de escritorio de 80rem con gutters 24/32 | **Pasa.** `PageContainer` es el único sitio con `max-w-7xl`; medido a 375/768/1024/1440/1920 (tope 1280). |
| AC-08 | Ayuda y Privacidad alcanzables en móvil desde el Perfil | **Pasa.** `ProfileQuickLinks` visible a 375 y oculto a 1024/1440; ambas páginas conservan su `<h1>`. |
| AC-09 | `<aside>` con nombre que describe su contenido | **Pasa.** `complementary` «Navegación» en móvil y escritorio; la cuenta es una `region` propia solo de escritorio. |
| AC-10 | Logotipo SPA sin `aria-current` | **Pasa.** Clic primario con `router.navigate`, `navigations: 1`, centinela intacto y `aria-current="false"`. |

## Pendiente

- **AC-03 y AC-04 en Android físico con HTTPS** → F42. Aquí solo se verificó la
  instalabilidad estructural en Chrome local.
- **Perfil provisional** → F34 reconstruye cabecera, tarjeta y filas, y revisará
  la fila de instalación y los accesos de Ayuda y Privacidad.
- **`beforeinstallprompt` anterior a la hidratación**: el evento se captura en un
  efecto posterior a la hidratación; el caso de un evento disparado antes no está
  cubierto por test de navegador.
- **Iconos `maskable`** con el mismo dibujo que los normales: el punto ya cae
  dentro de la zona segura del 80 %, así que son válidos, pero son byte a byte
  iguales a los `any`.
- **`theme_color` del manifiesto** fijo en claro (`#F6F6FA`): la pantalla de
  arranque de una instalación en oscuro será clara. El `theme-color` del
  documento sí cambia con el tema.
- **Medición**: no se midieron 390 ni 1280 explícitamente.
- **Sin service worker** por ADR-0013. No es deuda: es una decisión.
- **Sin revisión independiente** por nivel de auditoría C.

## Riesgos y limitaciones

- La instalabilidad se comprobó en Chrome local sobre `localhost` (contexto
  seguro), no en un Android real con HTTPS. «Instalable» aquí significa que
  Chrome no reporta errores, no que el flujo completo se haya recorrido en
  dispositivo.
- `_app.provisional.test.tsx` se tocó **fuera de la lista de archivos permitidos
  de la Parte B**: mockea `Link` como ancla para montar el Perfil sin router. La
  navegación real queda cubierta por los tests de integración del shell.
- Si el navegador dispara `beforeinstallprompt` antes de que el efecto se
  suscriba, el estado se queda en `unsupported` y la fila no ofrece «Instalar».
- La pantalla de arranque de la PWA en oscuro será clara por el `theme_color`
  fijo del manifiesto.
- Toda la verificación de navegador es manual sobre CDP; no hay prueba
  automatizada de navegador (F37/F38).
- Los iconos no se han probado en un lanzador Android real: solo se validó su
  firma y dimensiones y su detección por Chrome.

## Documentación actualizada

- `docs/04-features/F14-pwa/spec.md` — `status: done`.
- `docs/04-features/F14-pwa/tasks.md` — tareas, correcciones, AC y cierre.
- `docs/04-features/F14-pwa/handoff.md` — este documento.
- `docs/04-features/README.md` — F14 a `done` y párrafo de situación actual.
- `docs/06-process/ai-log.md` — entrada del 2026-11-03.
- `docs/07-curriculum/coverage-map.md` — PWA, manifiesto, iconos, instalación,
  contenedor de escritorio, landmarks y navegación SPA.

## Siguiente paso propuesto

Cerrar el ciclo operativo de F14 con autorización explícita: commits, PR y CI
sobre `feat/F14-pwa`; el árbol de trabajo está completo pero sin commit. Después,
F15 — Auth API (nivel A), que no se abre sin plan confirmado.
