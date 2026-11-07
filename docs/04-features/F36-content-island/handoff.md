# Handoff — F36 Content Island

- **Estado:** review
- **Rama:** `feat/f36-content-island`
- **Fecha:** 2026-11-07
- **Implementado por:** subagente UI Dev (DeepSeek V4.1 Flash)
- **Revisado por:** pendiente (nivel C: gates automáticos + aceptación del usuario)

## Resultado

Se completa el alcance reducido de F36: `/privacy` deja de ser un placeholder y lee
la página legal de slug `privacidad` del snapshot de Content Island en build. `/help`
se mantiene sin cambios funcionales. La ruta se prerenderiza y genera HTML con el
título y el cuerpo reales. Si la página legal no existe o el snapshot no se puede
leer, la lectura lanza un error explícito (falla el prerender y la navegación cliente
muestra el estado de error de la ruta), nunca una página vacía.

## Cambios

- `apps/web/src/features/spike/content.ts`: tipo `LegalPage` y server function
  `loadLegalPage()` con el mismo patrón que `loadHelpContent`.
- `apps/web/src/features/spike/content.server.ts`: `LEGAL_PAGE_SLUG`,
  `LEGAL_PAGE_MISSING_ERROR` y `readLegalPage()`, que filtran el `legalPage` por
  slug y distinguen snapshot ilegible de página ausente.
- `apps/web/src/features/spike/content.test.ts`: lectura del `legalPage` real y
  caso de snapshot sin `legalPage` (error explícito, sin filtrar la ruta).
- `apps/web/src/routes/_app.privacy.tsx`: `PrivacyContent` presentacional con
  `PageContainer`, un único `h1`, fecha de actualización y cuerpo en párrafos
  (sin `dangerouslySetInnerHTML`); loader conectado a `loadLegalPage()`.
- `apps/web/src/routes/_app.privacy.test.tsx`: render de título/cuerpo, estado
  sin cuerpo y axe.
- `apps/web/src/routes/_app.provisional.test.tsx`: se retira `/privacy` de la
  lista de placeholders; `/profile` sigue cubierto.
- `apps/web/vite.config.ts`: `/privacy` añadida al prerender.
- `docs/04-features/F36-content-island/{spec,tasks,handoff}.md`: estado y
  resultados reales.

## Verificación

- `pnpm --filter @memora/web test content` → 2 archivos, 10 tests pasan.
- `pnpm --filter @memora/web test privacy` → 1 archivo, 3 tests pasan.
- `pnpm --filter @memora/web test provisional` → 1 archivo, 3 tests pasan.
- `pnpm --filter @memora/web typecheck` → sin errores.
- `pnpm --filter @memora/web lint` → sin errores.
- `pnpm --filter @memora/web build` → build correcto; prerender de `/help`,
  `/privacy`, `/circles`, `/uploads` y `/profile` (5 páginas).
- `CONTENT_ISLAND_SNAPSHOT_PATH=<ruta inexistente> pnpm --filter @memora/web build`
  → exit 1; el prerender falla con `Failed to fetch /privacy: Internal Server Error`
  y el log de servidor muestra `ENOENT`. Después se restauró `dist` con un build normal.
- `pnpm exec prettier --check "apps/web/src/features/spike/content.ts" ... "apps/web/vite.config.ts"`
  → todos los archivos usan el estilo del repo.
- Comprobación manual del HTML generado:
  `apps/web/dist/client/privacy/index.html` contiene `<h1>Política de privacidad</h1>`
  y el cuerpo del snapshot (`Datos que tratamos`).

## Criterios de aceptación

| AC | Estado | Explicación |
| --- | --- | --- |
| AC-01 | Pasa | `LegalPage` tipado en `content.ts`; `readLegalPage()` devuelve el contenido del snapshot. |
| AC-02 | Pasa | Se usa `content-island-snapshot.json` versionado; no se modificó. |
| AC-03 | Pasa | El build prerenderiza `/privacy` y genera `dist/client/privacy/index.html` con contenido real. |
| AC-04 | Pasa | La FAQ existente usa `details`/`summary` nativos; no se tocó `/help`. |
| AC-05 | Pasa | `/privacy` lee el `legalPage` con slug `privacidad`. |
| AC-06 | Pasa | El cliente se usa en modo `snapshot` con `accessToken: ''`; no hay token en cliente ni runtime. |
| AC-07 | Pasa | Tests de snapshot ausente/no publicado y de `legalPage` ausente; el prerender depende de la lectura correcta. |

## Pendiente

- Aceptación del usuario en móvil y escritorio, claro y oscuro.
- Actualizar `docs/04-features/README.md` (tablero), `docs/06-process/ai-log.md` y
  `docs/07-curriculum/coverage-map.md`: fuera del alcance permitido en este encargo.
- Commit propuesto, sin ejecutar.

## Riesgos y limitaciones

- El cuerpo del snapshot no incluye marcado enriquecido: los títulos de sección
  («Datos que tratamos», «Tus derechos»…) se renderizan como párrafos, no como
  encabezados. Cumple el requisito de párrafos legibles, pero no reproduce el
  índice de secciones del diseño. Queda para una evolución del modelo de contenido
  o un parser explícito.
- La fecha de actualización se formatea en `es-ES` con `timeZone: 'UTC'` para que
  servidor y cliente coincidan.
- No se hizo revisión visual en navegador real; la verificación es de tests, tipos,
  lint y HTML prerenderizado.
- El error de loader en navegación cliente usa el `errorComponent` de la raíz; no
  se añadió un estado específico de `/privacy`.

## Documentación actualizada

- [x] `docs/04-features/F36-content-island/spec.md` (estado `review` y nota de alcance).
- [x] `docs/04-features/F36-content-island/tasks.md`.
- [x] `docs/04-features/F36-content-island/handoff.md`.
- [ ] `docs/04-features/README.md` (prohibido en este encargo).
- [ ] `docs/06-process/ai-log.md` (fuera del alcance permitido).
- [ ] `docs/07-curriculum/coverage-map.md` (fuera del alcance permitido).

## Siguiente paso propuesto

Aceptación del usuario de `/privacy` en móvil/escritorio y ambos temas. Después,
actualizar tablero, bitácora y cobertura, y proponer el commit (sin ejecutarlo).
