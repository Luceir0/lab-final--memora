# ADR-0004: Prisma 7.10.1 estable

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

La etiqueta `latest` de Prisma apunta a la 8.0.0-rc. La versión estable anterior es 7.10.1. El proyecto necesita estabilidad y documentación.

## Decisión

Fijar **Prisma 7.10.1** y PostgreSQL. No usar la RC.

## Alternativas

- Prisma 8 RC: novedades, pero riesgo de cambios y poca documentación.
- Drizzle: más ligero, pero el curso y el equipo conocen Prisma.
- SQL directo: más control, más trabajo y menos tipado.

## Consecuencias

- Se revisa la configuración de Prisma 7 en el spike F05.
- Migraciones versionadas y `prisma migrate deploy` en CI.
- Tests con Postgres real, no `pg-mem`.
- Si 8 sale estable durante el proyecto, se evalúa en un ADR nuevo; no se actualiza sin necesidad.

## Referencias

- `docs/03-architecture/data-model.md`
- `docs/04-features/F07-modelo-datos/spec.md`
