# ADR-0003: Tailwind 4 CSS-first

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

El documento original hablaba de un “preset de Tailwind” en `packages/ui`, propio de Tailwind 3. La versión estable actual es Tailwind 4.3, que usa configuración CSS-first.

## Decisión

Usar **Tailwind 4.3** con `@theme` y `@source` en CSS. Los tokens viven en variables CSS y se exponen a utilidades mediante `@theme`.

## Alternativas

- Tailwind 3.4 LTS con preset JS: más familiar, pero deja el proyecto en una versión anterior.
- CSS Modules o vanilla-extract: buen control, pero menos alineado con el curso y el diseño.

## Consecuencias

- `packages/ui` exporta `tokens.css` y componentes, no un preset JS.
- Hay que documentar `@source` para que Tailwind detecte clases en el monorepo.
- El Anexo A original se adapta; los valores no cambian.
- Se valida en el spike F05.

## Referencias

- `docs/02-design/tokens.md`
- `docs/03-architecture/monorepo.md`
