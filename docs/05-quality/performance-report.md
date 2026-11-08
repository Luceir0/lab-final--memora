# Informe de rendimiento

> **Feature:** F40 · **Fecha:** 2026-11-08 · **Alcance:** mínimo acordado en S5 (timebox de 45 min)
> **Medido sobre:** build de producción de `apps/web` (`pnpm build`), servido en local con
> compresión gzip y proxy `/api`, contra la API real y la base de demo.
> **Herramienta:** Lighthouse **13.6.0**, preset móvil (150 ms de RTT, 1.638 Mbps, CPU ×4).
> **Sin cambios de código en esta sesión**: el presupuesto que no se cumple se publica con su causa.

## Resumen

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` (pública) | **93** | **100** | **100** | 90 | **3,2 s** | **0** | **20 ms** |
| `/circles` (autenticada) | **91** | **100** | **100** | 91 | **3,5 s** | **0,004** | **20 ms** |

| Presupuesto | Objetivo | `/login` | `/circles` | Estado |
| --- | --- | --- | --- | --- |
| Performance | ≥ 85 | 93 | 91 | **Cumple** |
| Accessibility | ≥ 95 | 100 | 100 | **Cumple** |
| Best Practices | ≥ 95 | 100 | 100 | **Cumple** |
| LCP | ≤ 2,5 s | 3,2 s | 3,5 s | **No cumple** |
| CLS | ≤ 0,1 | 0 | 0,004 | **Cumple** |
| INP | ≤ 200 ms | no medible en laboratorio | no medible en laboratorio | **Sin evidencia** |
| JS inicial | ≤ 250 KB gzip | 191,3 KB | 206,8 KB | **Cumple** |
| JS de la ruta del visor | ≤ 400 KB gzip | — | ≈ 201 KB (inicial + 10,2 KB del chunk) | **Cumple** |
| Thumb | ≤ 80 KB | 1,4 KB (webp del seed) | 1,4 KB | **Cumple** |
| Display | ≤ 400 KB | 8,6–9,9 KB (webp del seed) | 8,6–9,9 KB | **Cumple** |
| Saltos de layout en galería | 0 | 0 | 0,004 (shell, no galería) | **Cumple** |

**El único presupuesto incumplido es LCP**, y solo en la simulación de red: el LCP **observado**
en la misma corrida es de **174 ms** (`/login`) y **351 ms** (`/circles`). La diferencia entre
observado y simulado es el modelo de Lantern con 1,638 Mbps: la ruta de login descarga ~191 KB
gzip de JavaScript antes de que la imagen grande del collage acabe de pintarse.

## Método

1. `pnpm build` → 5/5 tareas, 5 rutas prerenderizadas (`/help`, `/privacy`, `/circles`,
   `/uploads`, `/profile`).
2. No existe script `start` en `apps/web` y TanStack Start no incluye servidor de producción:
   el build deja `dist/client` y `dist/server/server.js` (un *server entry* que exporta
   `fetch`). Para medir se usó un servidor Node **temporal, fuera del repo**, que:
   - sirve `dist/client` con `cache-control` inmutable para `/assets/*`;
   - comprime con gzip los estáticos de texto y el HTML del SSR;
   - hace proxy de `/api` a la API real (`127.0.0.1:3001`);
   - delega el resto en el *server entry* de TanStack Start.
3. Lighthouse móvil con `--only-categories=performance,accessibility,best-practices,seo`.
4. Artefactos: `docs/05-quality/lighthouse/login-mobile.report.{json,html}` y
   `docs/05-quality/lighthouse/circles-mobile.report.{json,html}`.

### Antes y después: la compresión del servidor de medición

La primera corrida se hizo con el mismo servidor **sin gzip**. Es el mismo código; cambia solo
cómo se sirve:

| Corrida | Performance | LCP simulado | FCP |
| --- | --- | --- | --- |
| Sin compresión | 77 | 6,3 s | 1,2 s |
| Con gzip (como cualquier despliegue real) | **93** | **3,2 s** | **0,8 s** |

Esto no es una optimización de la aplicación: es la diferencia entre servir 275 KB de JS en
crudo o 85 KB comprimidos. **Cualquier despliegue real comprime** (Caddy, nginx, Render, Fly),
así que la cifra válida es la de gzip. Queda registrado para que nadie compare peras con
manzanas.

## Causas del LCP por encima del presupuesto

1. **Peso de JavaScript en la primera ruta.** El chunk `index-CAcZUMvY.js` son 281,7 KB en crudo
   y **85,1 KB gzip**, y la ruta de login arrastra además `dist` (26,5 KB), `useSelector`
   (21 KB), `api-client` (14,9 KB) e `index.esm` (12,9 KB). Lighthouse marca **315 KB de
   JavaScript sin usar** en el grafo inicial. Con 1,638 Mbps simulados, ese JS compite con la
   imagen del collage por el ancho de banda.
2. **La imagen del collage es el elemento LCP y está en `loading="lazy"`**, sin
   `fetchpriority="high"` (`apps/web/src/features/auth/auth-collage.tsx`). El *insight*
   `lcp-discovery-insight` lo marca explícitamente: `priorityHinted: false`,
   `eagerlyLoaded: false`.
3. **CSS render-blocking**: `index-CAKRPXaC.css` son 79,3 KB (14,2 KB gzip) y Lighthouse estima
   605 ms de bloqueo en la primera pintura.

## Qué no se ha medido

- **INP** no se puede medir en laboratorio: es una métrica de campo. Se usa **TBT 20–23 ms**
  como proxy (muy por debajo de 200 ms) y se declara la limitación.
- **Scroll infinito de la galería con 500 fotos**: no se ha hecho una prueba de carga con datos
  masivos; el seed tiene 6 fotos.
- **Red real 3G/4G en dispositivo físico**: la medición es simulada en headless.
- **Rutas del visor**: el presupuesto de 400 KB gzip se comprueba por suma de chunks
  (191–207 KB iniciales + 10,2 KB del chunk del visor), no con una corrida de Lighthouse en
  `/photos/:photoId`.

## Recomendaciones (no aplicadas, requieren permiso y tests)

1. **Primera imagen del collage `eager` + `fetchpriority="high"`** en
   `apps/web/src/features/auth/auth-collage.tsx`, dejando el resto en `lazy`. Es un cambio de
   tres líneas y un test de `auth-collage.test.tsx`; ataca directamente el hallazgo 2.
2. **Revisar el grafo inicial de la ruta de login**: `useSelector` y `api-client` se cargan en
   `/login`, que no consulta la API. Mover el proveedor de consultas por debajo del layout de
   autenticación reduciría el JS inicial.
3. **Servir el build con un servidor de producción de verdad** (`@tanstack/react-start` +
   adaptador Node o un contenedor con Caddy) en lugar del script temporal de medición; hoy la
   entrega no trae ese servidor y la demo usa `pnpm dev`.

## Reproducir

```bash
pnpm build
# servir dist/client + proxy /api + gzip (script temporal, no versionado)
npx lighthouse@13.6.0 http://localhost:4000/login \
  --output=json --output=html --output-path=docs/05-quality/lighthouse/login-mobile \
  --chrome-flags="--headless=new"
```

Para la página autenticada hay que pasar la cookie de sesión con
`--extra-headers='{"Cookie":"memora_session=…"}'` tras un login real con
`lucia@memora.test` / `memora-demo`.
