# Handoff — F40 Rendimiento

- **Estado:** review
- **Rama:** `feat/F43-S5` (worktree `f43-s5`)
- **Fecha:** 2026-11-08
- **Implementado por:** orquestador (sesión S5, timebox de 45 min)
- **Revisado por:** pendiente (nivel V; en la recutura, revisión del delta + aceptación)

## Resultado

Medición mínima acordada: build de producción, Lighthouse móvil en `/login` y en `/circles`
(autenticada), con cifras reales, presupuestos y causas. **Performance 93/91, Accessibility
100/100 y Best Practices 100/100 cumplen; LCP 3,2 s y 3,5 s no cumple** frente a 2,5 s, aunque
el LCP **observado** es de 174 ms y 351 ms. No se ha cambiado código: el incumplimiento se
publica con su causa y con tres recomendaciones medidas.

## Cambios

- `docs/05-quality/performance-report.md` (nuevo): método, cifras, antes/después, causas,
  límites de la medición, recomendaciones y cómo reproducir.
- `docs/05-quality/lighthouse/login-mobile.report.{json,html}` y
  `circles-mobile.report.{json,html}` (nuevos): artefactos crudos de Lighthouse 13.6.0.
- `docs/04-features/F40-performance/{spec.md,tasks.md,handoff.md}`: estado y cierre.
- Sin cambios en `apps/**` ni `packages/**`.

## Verificación

- `pnpm build` → **5/5 tareas**, 5 rutas prerenderizadas.
- Lighthouse 13.6.0, preset móvil (150 ms RTT, 1,638 Mbps, CPU ×4):
  - `/login`: Performance **93**, Accessibility **100**, Best Practices **100**, SEO 90;
    FCP 0,8 s, LCP **3,2 s** (observado 174 ms), TBT 20 ms, CLS **0**.
  - `/circles`: Performance **91**, Accessibility **100**, Best Practices **100**, SEO 91;
    FCP 0,8 s, LCP **3,5 s** (observado 351 ms), TBT 20 ms, CLS **0,004**.
- JS inicial: **191,3 KB gzip** en `/login` y **206,8 KB** en `/circles` (suma de `transferSize`
  de los scripts de la corrida).
- Chunk del visor: **10,2 KB gzip**; ruta del visor ≈ **201 KB gzip** con el inicial.
- Imágenes del seed: `thumb` 1,4 KB y `display` 8,6–9,9 KB (webp), muy por debajo del
  presupuesto.
- Servidor de medición: script Node temporal **fuera del repo** que sirve `dist/client`,
  comprime con gzip y hace proxy `/api`; se declara porque `apps/web` no tiene `start`.

## Criterios de aceptación

- **AC-01 (Lighthouse móvil: Perf ≥ 85, A11y ≥ 95, BP ≥ 95):** **pasa** — 93/100/100 en
  `/login` y 91/100/100 en `/circles`.
- **AC-02 (LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms):** **falla parcial** — CLS cumple (0 y 0,004);
  **LCP no cumple en simulación** (3,2/3,5 s); **INP no es medible en laboratorio** y no hay
  evidencia de campo (TBT 20 ms como proxy).
- **AC-03 (JS inicial ≤ 250 KB gzip; visor ≤ 400 KB gzip):** **pasa** — 191,3/206,8 KB y
  ≈201 KB.
- **AC-04 (thumb ≤ 80 KB; display ≤ 400 KB):** **pasa** — 1,4 KB y 8,6–9,9 KB.
- **AC-05 (sin saltos de layout y scroll fluido):** **pasa parcial** — CLS 0/0,004; el scroll de
  la galería con cientos de fotos no se ha medido (el seed tiene 6).
- **AC-06 (informe con antes/después y presupuestos reales):** **pasa** —
  [performance-report.md](../../05-quality/performance-report.md).

## Pendiente

- **LCP en simulación**: aplicar `eager` + `fetchpriority="high"` a la primera imagen del
  collage y revisar el grafo inicial de `/login` (hoy arrastra `useSelector` y `api-client`).
  Requiere permiso, test de `auth-collage` y nueva medición.
- **INP real**: solo se puede obtener con datos de campo o una prueba con interacción
  instrumentada; hoy no hay ninguna de las dos.
- **Servidor de producción para la web**: no existe script `start`; el de medición es temporal.
- **Galería con carga**: prueba con cientos de fotos y medición de scroll.
- **Rutas del visor**: corrida de Lighthouse propia en `/photos/:photoId`.

## Riesgos y limitaciones

- La cifra de Lighthouse depende de que el servidor comprima: **sin gzip la misma app da 77**.
  Cualquier despliegue real comprime, pero el repo no incluye ese servidor.
- La medición es headless y simulada; no sustituye a un móvil real.
- El LCP simulado y el observado difieren en un factor de ~20; se publican los dos para no
  maquillar ninguna lectura.

## Documentación actualizada

- [x] `docs/05-quality/performance-report.md`
- [x] `docs/05-quality/lighthouse/**`
- [x] `docs/04-features/F40-performance/{spec.md,tasks.md,handoff.md}`
- [x] `docs/04-features/README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`

## Siguiente paso propuesto

Revisión del delta y aceptación del usuario. Si se quiere cerrar el LCP, abrir una rama corta
con el cambio del collage, su test y una nueva corrida de Lighthouse antes de tocar nada más.
