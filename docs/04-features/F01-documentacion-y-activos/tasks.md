# Tasks — F01 Documentación, activos y alcance v2

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: ninguna.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] README v2 como índice
- [ ] Archivar la especificación v1
- [ ] Normalizar los dos sets de diseño a ASCII kebab-case
- [ ] Conservar la segunda iteración como canónica y la primera como histórico
- [ ] Crear manifest de nombres originales
- [ ] Crear índice de pantallas
- [ ] Definir alcance, glosario y decisiones cerradas
- [ ] Dejar preparado el espacio de fotos demo

## Criterios de aceptación

- [ ] AC-01: Todos los enlaces del README resuelven a archivos existentes.
- [ ] AC-02: La segunda iteración está en assets/design/screens con 54 vistas.
- [ ] AC-03: La primera iteración está archivada y no se usa como fuente canónica.
- [ ] AC-04: No quedan rutas antiguas de imágenes (assets/design/<archivo>.png); las nuevas viven en assets/design/screens/.
- [ ] AC-05: El alcance distingue MVP, extras y fuera de MVP.
- [ ] AC-06: El glosario cubre los términos usados por las specs.
- [ ] AC-07: No se ha creado código de aplicación.

## Verificación

- [ ] `node scripts/check-docs.mjs (se creará en F04)`
- [ ] `rg -n "assets/design/(m|d)[0-9]" README.md docs`
- [ ] `ls assets/design/screens | wc -l`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
