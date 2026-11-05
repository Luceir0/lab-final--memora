# Tasks — F29 Galería

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F21, F24, F26.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] PhotoGrid
- [ ] PhotoTile
- [ ] TanStack Query infinito
- [ ] srcset/sizes
- [ ] Lazy
- [ ] Selección
- [ ] SelectionBar
- [ ] PersonFilter
- [ ] Scroll restaurado
- [ ] Estados
- [ ] Página «Fotos de esta persona»: ruta, cabecera con total y álbumes, chips por álbum, estado vacío, enlace de vuelta y entrada «Ver sus fotos»

## Criterios de aceptación

- [ ] AC-01: Móvil 3 columnas; escritorio 4–7.
- [ ] AC-02: Scroll infinito por cursor.
- [ ] AC-03: Filtro por persona solo del círculo.
- [ ] AC-04: Selección con clic/Shift/Ctrl.
- [ ] AC-05: Scroll restaurado.
- [ ] AC-06: Imágenes adaptadas.
- [ ] AC-07: Página de persona solo con fotos del círculo, cabecera y vuelta.
- [ ] AC-08: Chips «Todos» y por álbum con conteo.
- [ ] AC-09: Estado vacío de persona.
- [ ] AC-10: Scroll infinito y teclado en la página de persona.
- [ ] AC-11: F29 añade la entrada «Ver sus fotos» en la fila de miembro o en su cabecera.

## Verificación

- [ ] `pnpm --filter @memora/web test gallery`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
