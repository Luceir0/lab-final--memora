# Tasks — F36 Content Island

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F09, F10.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Tipos helpArticle/faqItem/legalPage
- [ ] Cliente con snapshot
- [ ] Export de snapshot
- [ ] Rutas /help y /privacy
- [ ] Accordion FAQ
- [ ] Build falla si falta snapshot
- [ ] MCP/skills

## Criterios de aceptación

- [ ] AC-01: Tipos tipados y validados.
- [ ] AC-02: Snapshot versionado.
- [ ] AC-03: SSG genera HTML.
- [ ] AC-04: FAQ accesible.
- [ ] AC-05: Privacidad con slug legalPage.
- [ ] AC-06: Token solo build.
- [ ] AC-07: Build falla sin snapshot.

## Verificación

- [ ] `pnpm --filter @memora/web build`
- [ ] `pnpm --filter @memora/web test content`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
