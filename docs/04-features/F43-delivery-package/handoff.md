# Handoff — F43 Paquete de entrega y defensa

- **Estado:** review
- **Rama:** `feat/F43-S5` (worktree `f43-s5`), sobre `main` con la PR #62 mergeada (`5ff213e`)
- **Fecha:** 2026-11-08
- **Implementado por:** orquestador (sesión S5)
- **Revisado por:** pendiente (nivel V)
- **Cierre operativo:** commit `76edee4`, [PR #63](https://github.com/Luceir0/lab-final--memora/pull/63)
  contra `main` (sin merge).

## Resultado

Paquete de entrega cerrado: checklist con evidencia real ítem a ítem, guion de demo de 8–10
minutos con dos usuarios y dos círculos, defensa de 15–20 minutos con 14 diapositivas Marp,
preguntas y respuestas ancladas al código, guion del vídeo de 5–8 minutos y limitaciones
explícitas. La demo se ha verificado por API de extremo a extremo (login de los dos usuarios,
negativos 401/403/404, subida, descarga, borrado y logout) y la accesibilidad se ha medido
sobre el build con 16 pasadas de axe y 0 violaciones. **No hay vídeo grabado ni ensayo en
navegador**: ambos dependen del usuario.

## Cambios

- `docs/08-delivery/checklist.md`: reescrito con evidencia por ítem; 6 ítems abiertos con
  motivo (teclado/lector, LCP, vídeo, ensayo, Android, commit).
- `docs/08-delivery/demo.md`: guion cronometrado, credenciales, datos exactos del seed, ocho
  pruebas negativas con su resultado esperado, pre-flight y fallback.
- `docs/08-delivery/defense.md`: estructura de 15–20 min, 14 diapositivas con contenido real,
  diez preguntas previsibles con respuesta y **diez limitaciones** (AC-06).
- `docs/08-delivery/slides.md` (nuevo): Marp, 14 diapositivas, exportable a PDF/HTML.
- `docs/08-delivery/video-script.md` (nuevo): escaleta de 5–8 min con planos, frases y bloque
  móvil; grabación pendiente.
- `docs/05-quality/a11y-checklist.md`: sección de la pasada de F43 (automática sobre el build y
  protocolo manual para el ensayo).
- `docs/05-quality/a11y-report.json` (nuevo): artefacto de axe (16 pasadas, 0 violaciones).
- `docs/04-features/F43-delivery-package/{spec.md,tasks.md,handoff.md}`: estado y cierre.
- Sin cambios en `apps/**` ni `packages/**`.

## Verificación

- `docker compose ps` → `postgres`, `minio` y `mailpit` **healthy**.
- `GET /api/health` (directo y por proxy) → **200**; `GET /login` → **200**.
- Login `lucia@memora.test` y `mateo@memora.test` → **200**; `GET /api/me` → el usuario correcto.
- Negativos: login sin `Origin` **403**, contraseña incorrecta **401**, `/api/me` sin sesión
  **401**, `/api/auth/csrf` sin sesión **401**, círculo ajeno **404**, mutación sin CSRF **403**,
  member borrando foto ajena **403**, member creando álbum en «Danza» **403**.
- Pipeline real: álbum temporal **201**, subida **201**, `original` **200**, borrado **204**,
  `original` tras borrar **404**, borrado del álbum **204**. Sin residuos: la BD vuelve a
  2/2/2/6/2/1 y el bucket a 18 objetos del seed (más 4 ZIP de sesiones anteriores que el
  mantenimiento purgará a las 24 h).
- Datos de demo: 2 usuarios, 2 círculos, 2 álbumes, 6 fotos, 2 etiquetas, 1 invitación y
  4 actividades tras limpiar las 2 actividades de la prueba.
- Accesibilidad: **16 pasadas** (login, help, privacy y circles × 375/1440 × claro/oscuro) con
  **0 violaciones** sobre el build; consola limpia en `/login` y `/circles`.
- Rendimiento (F40): Performance 93/91, A11y 100/100, BP 100/100, LCP 3,2/3,5 s, CLS 0/0,004.
- `pnpm build` → 5/5 tareas y 5 rutas prerenderizadas.
- Suites: `shared` **154**, `ui` **283**, `api-client` **39**, API **429 passed + 2 skipped** con
  `memora_test`, web **110 archivos y 910 tests** con `--maxWorkers=2 --retry=1`.
- `typecheck` **9/9** y `lint` **6/6** forzados sin caché (`turbo typecheck lint --force` →
  15/15), `format:check` OK, `docs:check` **731 enlaces y 0 rotos**, `agents:check` 44 specs y
  44 filas.

## Criterios de aceptación

- **AC-01 (checklist completo):** **pasa como documento**; los 6 ítems no probados están
  abiertos y justificados.
- **AC-02 (demo con dos usuarios):** **pasa en API**; el recorrido visual es el ensayo.
- **AC-03 (vídeo de respaldo):** **no pasa**: solo hay guion, por decisión del usuario en G1.
- **AC-04 (diapositivas):** **pasa** (`slides.md`, Marp, 14 diapositivas).
- **AC-05 (mapa del temario con evidencias):** **pasa**; `coverage-map.md` actualizado.
- **AC-06 (limitaciones explícitas):** **pasa**; diez limitaciones en `defense.md`.
- **AC-07 (ensayo cronometrado):** **no ejecutado**; lo hace el usuario.

## Pendiente

- **Ensayo en navegador** con dos perfiles, móvil y escritorio, claro y oscuro, sin errores de
  consola; es el gate G4 y cierra AC-02, AC-07 y los ítems de teclado/lector del checklist.
- **Grabación del vídeo** a partir de `video-script.md`.
- **Teclado y NVDA**: protocolo escrito en `a11y-checklist.md`, sin ejecutar.
- **LCP** por encima del presupuesto en simulación; ver `F40-performance/handoff.md`.
- **Android físico** e instalación real: sin dispositivo.
- **Commit y PR**: propuestos, no ejecutados.

## Riesgos y limitaciones

- El ensayo no se ha hecho: la demo está probada por API, no con dos navegadores reales.
- Las diapositivas no se han exportado a PDF (no se ha instalado Marp CLI); el Markdown es
  válido y se exporta con `npx @marp-team/marp-cli`.
- Las cifras de Lighthouse dependen de que el servidor comprima; sin gzip la misma app da 77.
- El seed deja «Danza» vacía: para enseñar una subida como owner hay que subirla antes.

## Documentación actualizada

- [x] `docs/08-delivery/{checklist,demo,defense,slides,video-script}.md`
- [x] `docs/05-quality/{a11y-checklist.md,a11y-report.json,performance-report.md}`
- [x] `docs/04-features/F43-delivery-package/{spec.md,tasks.md,handoff.md}`
- [x] `docs/04-features/F40-performance/{spec.md,tasks.md,handoff.md}`
- [x] `docs/04-features/README.md`
- [x] `docs/06-process/ai-log.md`
- [x] `docs/07-curriculum/coverage-map.md`
- [x] `docs/06-process/remaining-plan.md`

## Siguiente paso propuesto

Revisión del delta (nivel V) y ensayo del usuario. Después, commit y PR de `feat/F43-S5`.
No abrir S6 sin permiso.
