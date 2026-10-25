# Tasks — F31 Metadatos y lugar

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F30.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Formulario de metadatos
- [ ] PATCH photo
- [ ] Permisos
- [ ] placeName editable
- [ ] Fecha
- [ ] Estados

## Criterios de aceptación

- [ ] AC-01: Solo autor/owner/permiso edita.
- [ ] AC-02: Validación compartida.
- [ ] AC-03: placeName se muestra y edita.
- [ ] AC-04: No se guardan coordenadas.
- [ ] AC-05: Cambios persisten.
- [ ] AC-06: Cancelar restaura.

## Verificación

- [ ] `pnpm --filter @memora/web test metadata`
- [ ] `pnpm --filter @memora/api test photos`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
