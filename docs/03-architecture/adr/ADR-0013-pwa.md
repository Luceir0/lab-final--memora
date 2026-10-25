# ADR-0013: PWA sin service worker en el MVP

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

“Instalable en el móvil” es parte del MVP. El proyecto excluye explícitamente offline y subidas en segundo plano. Un service worker añade caché, versiones e hidratación que no son necesarias para el producto.

## Decisión

- Manifest, iconos 192/512/maskable, `display: standalone`, `start_url`, `theme_color` y `apple-touch-icon`.
- Instalación desde el navegador; en Android con `beforeinstallprompt`; en iOS con instrucciones en Perfil.
- **Sin service worker en el MVP**: no hay caché offline ni subidas en segundo plano.
- Si la instalación de Chrome exige un service worker, se añadirá uno mínimo de paso (sin caché) y se documentará.
- El tema se resuelve con cookie y `data-theme`; no depende del service worker.

## Alternativas

- Service worker con caché offline: fuera de alcance y con riesgo de datos obsoletos.
- No ser PWA: incumple el MVP.
- App nativa: fuera de alcance.

## Consecuencias

- La app no funciona sin red.
- La instalación puede variar entre navegadores; se prueba en Android real.
- Si más adelante se añade offline, se hará con un ADR nuevo y una estrategia de caché explícita.

## Referencias

- `docs/04-features/F14-pwa/spec.md`
- `docs/02-design/responsive.md`
- `docs/08-delivery/demo.md`
