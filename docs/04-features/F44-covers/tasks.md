# F44 — Tareas

> **Estado:** done · **Nivel:** B · **Rama:** `feat/F44-covers`

## G0–G1

- [x] Leer F24 D2, F28 decisión 2, F29 nota de portada y el contrato de API.
- [x] Confirmar que `PATCH /circles/:circleId` y `PATCH /albums/:albumId` ya aceptan
      `coverPhotoId` y `null`.
- [x] Decidir navegación por álbumes para las fotos del círculo (sin endpoint nuevo).
- [x] Decidir que la acción del álbum vive en `AlbumFormDialog`.
- [x] Decidir el patrón `PhotoGrid` + `ResponsiveDialog`.
- [x] Decidir guardado con el formulario y el borrador de Ajustes.

## Implementación

- [x] `features/covers`: selector reutilizable con `PhotoGrid` y `ResponsiveDialog`.
- [x] `features/covers`: navegación álbum → fotos para el círculo con los hooks de F24/F29.
- [x] `features/covers`: selección única, «Quitar portada», estados y a11y.
- [x] Álbum: sustituir el bloque deshabilitado por el selector y la nota dinámica.
- [x] Álbum: enviar `coverPhotoId` o `null` en el `PATCH` del formulario solo si cambia.
- [x] Círculo: portada editable para el owner dentro del borrador de Ajustes.
- [x] Círculo: portada de solo lectura para el resto.
- [x] Invalidación de caché del álbum, lista, círculo y héroe.

## Pruebas

- [x] Tests del selector: carga, vacío, error, selección, quitar y axe.
- [x] Tests del álbum: 0 vs N fotos, payload, permisos y solo lectura.
- [x] Tests del círculo: owner/member, borrador, resumen, descarte y payload.
- [x] Regresión de `albums` y `circle-settings` (incluida la ruta real de F28).

## Verificación

- [x] `pnpm --filter @memora/web test covers --maxWorkers=2 --retry=1` → 28 tests
- [x] `pnpm --filter @memora/web test albums --maxWorkers=2 --retry=1` → 139 tests
- [x] `pnpm --filter @memora/web test circle-settings --maxWorkers=2 --retry=1` → 9 tests
- [x] `pnpm --filter @memora/web test '_app.circles.$circleId.settings' --maxWorkers=2 --retry=1` → 34 tests
- [x] `pnpm --filter @memora/web test --maxWorkers=2 --retry=1` → 105 archivos y 866 tests
- [x] `pnpm typecheck` → 9/9
- [x] `pnpm lint` → 6/6
- [x] `pnpm build` → 5/5
- [x] `pnpm format:check` → OK
- [x] `pnpm docs:check` → 197 archivos y 646 enlaces
- [x] `pnpm agents:check` → 44 specs y 44 filas

## Cierre

- [x] Revisión independiente (nivel B), dos rondas y correcciones.
- [x] `handoff.md` completo con la decisión de patrón.
- [x] `review.md` con los hallazgos y su estado.
- [x] Tablero, bitácora y cobertura actualizados.
- [x] Commit y PR (`eb2c2d4`, PR #55).
- [x] Aceptación del usuario (G4) y merge (`15dc7c3`).
