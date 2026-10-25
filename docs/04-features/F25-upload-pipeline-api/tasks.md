# Tasks — F25 Upload pipeline API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F07, F08, F23.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Multipart
- [ ] Magic bytes
- [ ] Límites y cuota
- [ ] S3 adapter
- [ ] sharp orientación/variantes
- [ ] EXIF fecha/GPS transitorio
- [ ] Nominatim
- [ ] Idempotencia
- [ ] Activity
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: JPEG/PNG/WebP aceptados; SVG/GIF rechazados.
- [ ] AC-02: 25 MB y 2 GB respetados.
- [ ] AC-03: Variantes correctas.
- [ ] AC-04: Orientación aplicada.
- [ ] AC-05: Sin GPS persistido.
- [ ] AC-06: placeName si geocodifica.
- [ ] AC-07: Idempotencia.
- [ ] AC-08: Fallo no publica foto.

## Verificación

- [ ] `pnpm --filter @memora/api test photos`
- [ ] `Subir fixture real`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
