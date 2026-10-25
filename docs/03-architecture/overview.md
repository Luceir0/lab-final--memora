# Arquitectura — overview

## Contexto

Memora es una aplicación web con dos procesos desplegables —web y API— y servicios externos para almacenamiento, email, geocodificación y contenido editorial.

```text
Navegador
  │  HTTPS, cookie HttpOnly
  ▼
apps/web (TanStack Start + Node)
  │  /api (proxy o mismo dominio)
  ▼
apps/api (Fastify)
  ├── PostgreSQL (Prisma)
  ├── S3-compatible (MinIO/R2/S3)
  ├── Email (Mailpit/Resend)
  ├── Geocoding (Nominatim)
  └── Content Island (build de web)
```

## Principios

- **Autorización en el servidor** en cada recurso.
- **Contratos compartidos** con Zod; una sola fuente de verdad.
- **Separación web/API**: la web no habla directamente con la base de datos.
- **Adaptadores** para servicios externos, sustituibles en tests.
- **Mobile-first** y misma app en móvil/escritorio.
- **Privacidad por defecto**: bucket privado, sin GPS, sin PII en logs.
- **Render por ruta**: SSR, SPA selectiva y SSG con una razón concreta.

## Responsabilidades

| Capa | Hace | No hace |
| --- | --- | --- |
| `apps/web` | UI, rutas, formularios, caché, SSR/SSG, tema | Autorización definitiva, acceso directo a BD/S3 |
| `apps/api` | Validación, auth, permisos, persistencia, uploads, ZIP | Render de UI |
| `packages/shared` | Zod, DTOs, permisos puros, errores | I/O |
| `packages/api-client` | Cliente REST tipado | Reglas de negocio |
| `packages/ui` | Componentes y tokens | Dominio |
| `packages/config` | tsconfig, ESLint, Prettier | Lógica |

## Datos y seguridad

- Sesión por cookie `HttpOnly`; web y API en el mismo dominio.
- API comprueba identidad, pertenencia y permisos.
- Nunca se confía en IDs del cliente sin verificar el recurso.
- Bucket privado; imágenes servidas por API con cookie.
- Invitaciones con token hasheado y caducidad.
- Sin coordenadas GPS persistidas.

## Decisiones

- [ADR-0001 Metaframework](adr/ADR-0001-metaframework.md)
- [ADR-0002 Render modes](adr/ADR-0002-render-modes.md)
- [ADR-0003 Tailwind](adr/ADR-0003-tailwind.md)
- [ADR-0004 Prisma](adr/ADR-0004-prisma.md)
- [ADR-0005 Auth](adr/ADR-0005-auth.md)
- [ADR-0006 Image delivery](adr/ADR-0006-image-delivery.md)
- [ADR-0007 Uploads](adr/ADR-0007-uploads.md)
- [ADR-0008 Downloads](adr/ADR-0008-downloads.md)
- [ADR-0009 Activity](adr/ADR-0009-activity.md)
- [ADR-0010 Content Island](adr/ADR-0010-content-island.md)
- [ADR-0011 Accessibility](adr/ADR-0011-accessibility.md)

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| TanStack Start joven | Spike F05, docs oficiales, ADR y plan de salida |
| Procesamiento de imágenes | Adaptador y tests con S3 fake |
| ZIP grandes | Límites y job |
| Content Island en build | Snapshot versionado |
| Deriva de versiones | Pin exacto en F04 |
