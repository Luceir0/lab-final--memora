# Handoff — F01 Documentación, activos y alcance v2

- **Estado:** done
- **Rama:** `feat/f01-documentacion-y-activos`
- **Fecha:** 2026-10-25
- **Implementado por:** orquestador + docs-scribe
- **Revisado por:** pendiente

## Resultado

README v2 convertido en índice, especificación v1 archivada, diseños normalizados a ASCII y documentación de producto/alcance creada. No se ha tocado código de aplicación.

## Cambios

- `README.md`: reescrito como índice y estado del proyecto.
- `docs/archive/spec-v1.md`: copia de la especificación original.
- `assets/design/screens/`: 54 vistas de la segunda iteración con nombres kebab-case.
- `assets/archive/design-v1/`: 17 imágenes de la primera iteración.
- `assets/design/design-system-v0.1.png`, `indice-de-pantallas.png`, `temario-tecnologias.png`.
- `assets/design/manifest.json`: mapa nombre original → ruta normalizada.
- `docs/02-design/screens.md`: inventario y galería de referencia.
- `docs/01-product/*`: visión, alcance, personas, glosario y decisiones.
- `assets/demo/README.md`: reglas de licencia y créditos.

## Verificación

- `node` link checker ad-hoc → 216 archivos Markdown, 0 enlaces locales rotos (verificación final tras R1–R4).
- `ls assets/design/screens | wc -l` → 54.
- `ls assets/archive/design-v1 | wc -l` → 17.
- `rg -n "assets/design/(m|d)[0-9]" README.md docs` → sin rutas antiguas en documentación viva.
- No se ha creado `package.json`, `apps/` ni `packages/`.

## Criterios de aceptación

| AC | Resultado |
| --- | --- |
| AC-01 Enlaces del README | Pasa |
| AC-02 54 vistas canónicas | Pasa |
| AC-03 Primera iteración archivada | Pasa |
| AC-04 Sin rutas antiguas | Pasa (archivo histórico con enlaces corregidos) |
| AC-05 MVP/extras/fuera | Pasa |
| AC-06 Glosario | Pasa |
| AC-07 Sin código de app | Pasa |

## Riesgos y limitaciones

- El diseño de “Álbum · móvil” completo no existe en la segunda iteración; se usa `album-movil-subiendo.png` como referencia más cercana.
- Las fotos demo aún no están seleccionadas ni descargadas.
- El script de comprobación de enlaces se formalizará en F04.

## Documentación actualizada

- [x] README
- [x] `docs/01-product`
- [x] `docs/02-design`
- [ ] Bitácora (entrada general ya existe)
- [ ] Cobertura del temario (se actualizará al implementar)

## Siguiente paso propuesto

F01 aceptada. Continuar con F04 (monorepo y tooling) cuando el usuario lo pida.
