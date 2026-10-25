# Tasks — F23 Albums API

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F17.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] Listar/crear/detalle/editar/borrar
- [ ] Borrar solo owner y solo si está vacío
- [ ] Vaciar álbum owner con confirmación
- [ ] Pertenencia al círculo
- [ ] Portada
- [ ] Fecha
- [ ] Permisos por flag
- [ ] Tests

## Criterios de aceptación

- [ ] AC-01: Álbum pertenece a un círculo.
- [ ] AC-02: Solo miembros ven.
- [ ] AC-03: Crear requiere permiso.
- [ ] AC-04: Editar requiere owner o permiso; borrar solo owner.
- [ ] AC-05: Portada validada.
- [ ] AC-06: No se filtra información.
- [ ] AC-07: Borrar álbum con fotos devuelve `409 ALBUM_NOT_EMPTY`.
- [ ] AC-08: Vaciar álbum elimina fotos, objetos y tags con confirmación.

## Verificación

- [ ] `pnpm --filter @memora/api test albums`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
