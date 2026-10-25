# ADR-0010: Content Island + snapshot SSG

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Ayuda, FAQ y Privacidad son contenido editorial que debe poder cambiar sin desplegar código. El proyecto tiene Content Island PRO y quiere usar su MCP y skills.

## Decisión

- Tipos `helpArticle`, `faqItem`, `legalPage`.
- Páginas `/help` y `/privacy`, generadas en build.
- Cliente `@content-island/api-client` en modo snapshot.
- Snapshot versionado en el repo.
- Token de lectura solo en build.
- MCP/skills para crear tipos y contenido.

## Alternativas

- Markdown local: simple, pero no cumple el requisito de CMS.
- CMS propio: demasiado alcance.
- Fetch en runtime: más lento y dependiente de red.

## Consecuencias

- Cambiar contenido requiere regenerar snapshot y build.
- Build reproducible y sin llamadas de red.
- Si el snapshot falta, el build falla; no se publica una página vacía.
- El token nunca llega al navegador.

## Referencias

- `docs/03-architecture/external-services.md`
- `docs/04-features/F36-content-island/spec.md`
- `.opencode/skills/content-island/SKILL.md`
