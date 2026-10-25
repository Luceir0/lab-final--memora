# ADR-0009: Actividad con tabla de eventos

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

La segunda iteración muestra “Actividad reciente” y “Ver toda la actividad”. Se puede derivar de fotos, álbumes y memberships o registrar eventos.

## Decisión

Crear una tabla `Activity` con eventos explícitos (`photo.uploaded`, `album.created`, `member.joined`). Escribir en la misma transacción que la acción.

## Alternativas

- Feed derivado con `UNION` de fotos, álbumes y memberships: sin tabla, pero consultas complejas y sin eventos futuros.
- Solo fotos subidas: suficiente para el diseño actual, pero pobre.

## Consecuencias

- Consultas simples y paginación estable.
- Un evento más por acción; hay que mantenerlo en transacción.
- Permite añadir tipos (tag, descarga, cambio de permisos) sin rehacer la API.
- Si se borra un recurso, `SetNull` evita romper el feed.

## Referencias

- `docs/03-architecture/activity.md`
- `docs/04-features/F35-activity/spec.md`
