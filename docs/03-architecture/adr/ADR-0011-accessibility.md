# ADR-0011: Accesibilidad AA + AAA viable

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

El objetivo del proyecto es WCAG 2.2 AAA “siempre que sea posible”. AAA exige contraste 7:1 en texto normal y criterios que no siempre aplican.

## Decisión

- **AA obligatorio** en toda la app.
- **AAA donde sea viable**, especialmente texto principal y componentes críticos.
- Auditar contraste y ajustar tokens si no rompe la identidad.
- Documentar excepciones con criterio y alternativa.
- No declarar “AAA completo” si hay excepciones.

## Alternativas

- Solo AA: menos ambicioso, pero realista.
- AAA estricto: obligaría a cambiar la paleta y algunos patrones visuales; no todos los criterios aplican.

## Consecuencias

- La paleta puede ajustarse (por ejemplo, `muted` más oscuro) tras la auditoría.
- Hay que probar teclado, foco, zoom, orientación y lector de pantalla.
- Las excepciones son parte de la entrega, no un fallo oculto.

## Referencias

- `docs/02-design/accessibility.md`
- `docs/05-quality/a11y-checklist.md`
- `docs/04-features/F39-accessibility/spec.md`
