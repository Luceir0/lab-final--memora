---
name: Content Island
description: Integración de Content Island para Ayuda, FAQ y Privacidad con snapshot y SSG.
---

# Content Island en Memora

## Uso

Solo contenido editorial:

- `helpArticle`: título, slug, cuerpo, orden.
- `faqItem`: pregunta, respuesta, categoría, orden.
- `legalPage`: título, slug, cuerpo, fecha de actualización.

Páginas: `/help` y `/privacy` (slug `privacidad`).

## Integración

- Cliente `@content-island/api-client` en `apps/web`, solo en build.
- Token de lectura en variable de entorno; nunca en el navegador.
- `npx content-island export --access-token <token>` genera el snapshot.
- Cliente en `mode: 'snapshot'` para SSG.
- Snapshot versionado para builds reproducibles.
- Si el snapshot falta o es inválido, el build falla con mensaje claro.

## MCP y skills

Usa el MCP de Content Island para consultar tipos y crear/editar entradas. Usa sus skills para respetar las buenas prácticas del cliente.

## Referencias

- `docs/03-architecture/external-services.md`
- `docs/03-architecture/adr/ADR-0010-content-island.md`
- `docs/04-features/F36-content-island/spec.md`
