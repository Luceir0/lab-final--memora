# Memora

> **Todos vuestros recuerdos, por fin, en el mismo lugar.**

Memora es un archivo **privado y colaborativo** de recuerdos fotográficos. Un grupo de personas de confianza (un **círculo**) reúne sus fotos en álbumes compartidos, etiqueta quién aparece en cada una y descarga lo que quiera. No es una red social: no hay perfiles públicos, seguidores, likes ni contenido público.

Aplicación web real, con la misma calidad en **móvil** y **escritorio**, instalable en la pantalla de inicio, tema claro/oscuro/sistema, API REST propia y datos persistentes.

---

## Estado del proyecto

**Fase actual: definición, scaffold agéntico, monorepo, spike técnico y contratos compartidos completados (F01–F06). F06 está `done` desde el 2026-10-31 tras la PR #2, el merge `b556168` y CI en verde.**

Todavía **no hay lógica de producto**: F04 deja listos el monorepo, el tooling, Docker y CI; F05 valida las piezas de riesgo (render modes, Tailwind 4, Fastify + Zod, Prisma 7, sharp y el snapshot de Content Island); F06 fija en `packages/shared` los contratos Zod, los errores, la paginación y los permisos puros, con 138 tests. Las features de aplicación empiezan en F07. Este repositorio contiene la especificación viva, el sistema de diseño, los ADRs, las 43 features y la configuración de agentes que se usará para construirlo paso a paso.

| Elemento | Estado |
| --- | --- |
| Producto y alcance | Definido |
| Diseño canónico | Segunda iteración, normalizada |
| Arquitectura y ADRs | Definidos |
| Features | 43 specs con criterios de aceptación |
| Agentes, comandos y skills | Configurados |
| Monorepo y app | F04 `done`, CI en verde |
| Spike técnico | F05 `done`, CI en verde en `main` |
| Contratos compartidos | F06 `done`, PR #2, merge `b556168` y CI en verde; `@memora/shared` con Zod 4.6.7 y 138 tests |

El tablero de features está en [docs/04-features/README.md](docs/04-features/README.md). F01–F06 están `done`; F07 sigue en `draft` y no se abre sin permiso. Los resultados del spike están en [docs/03-architecture/spike-results.md](docs/03-architecture/spike-results.md) y el handoff de F06 en [docs/04-features/F06-contratos-compartidos/handoff.md](docs/04-features/F06-contratos-compartidos/handoff.md).

---

## Stack

| Capa | Elección |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Web | React 19 + TypeScript + **TanStack Start 1.169** sobre Vite 8 |
| Estilos | **Tailwind CSS 4** (CSS-first, `@theme`) + tokens en variables CSS |
| Datos remotos | TanStack Query |
| Formularios | React Hook Form + Zod 4 |
| Contratos compartidos | `@memora/shared`: Zod 4, errores, paginación y permisos puros |
| API | Node.js 24 + **Fastify 5** |
| Base de datos | PostgreSQL + **Prisma 7.10.1** |
| Archivos | S3-compatible (Silo, fork de MinIO, en local; R2/S3 en producción) + `sharp` |
| Email | Mailpit local / Resend opcional |
| Geocodificación | Nominatim (OpenStreetMap) |
| Contenido editorial | **Content Island** (Ayuda, FAQ y Privacidad) |
| Testing | Vitest, React Testing Library, MSW, Playwright, axe |
| Calidad | ESLint, Prettier, `tsc --noEmit`, GitHub Actions |

**Versiones fijadas (F04–F05):**

| Herramienta | Versión |
| --- | --- |
| Node.js | 24.21.0 (`engines >=24`) |
| pnpm | 10.34.8 (corepack) |
| TypeScript | 6.0.3 |
| Turborepo | 2.11.10 |
| Vitest | 5.0.5 |
| ESLint | 9.39.5 |
| typescript-eslint | 8.72.0 |
| Prettier | 3.9.10 |
| React / React DOM | 19.3.1 |
| TanStack Start | 1.169.4 |
| TanStack Router | 1.170.46 |
| Vite | 8.3.5 |
| `@vitejs/plugin-react` | 6.1.2 |
| `@types/react` / `@types/react-dom` | 19.3.0 |
| Tailwind CSS / `@tailwindcss/vite` | 4.3.3 |
| Fastify | 5.12.7 |
| Zod | 4.6.7 |
| `fastify-type-provider-zod` | 7.0.0 |
| Prisma CLI / Client / `@prisma/adapter-pg` | 7.10.1 |
| `pg` | 8.23.1 |
| `sharp` | 0.35.5 |
| `@content-island/api-client` | 0.26.0 |
| `@types/node` | 24.19.2 |

Imágenes locales: `postgres:17.11-alpine`, `pgsty/silo` por tag y digest (solo local) y `axllent/mailpit:v1.32.0`. Prisma 8 sigue en RC y no se usa. F05 fija Prisma 7.10.1 y crea una migración de spike con el modelo temporal `SpikeNote`; F07 la sustituirá por el modelo definitivo.

**Snapshot de Content Island:** `content-island-snapshot.json` en la raíz, exportado el 2026-10-26 (`schemaVersion: 1`; 6 artículos de ayuda, 8 FAQs y 1 página legal en `es`). El build lo lee sin token; si falta, falla con un mensaje que incluye la ruta esperada. Regenerarlo requiere un token que no se versiona.

---

## Estructura del repositorio

```text
memora/
├── AGENTS.md                  # constitución para agentes
├── opencode.jsonc             # configuración de OpenCode V2
├── CLAUDE.md                  # puente para Claude Code
├── .opencode/                 # agentes, comandos y skills
├── .github/
│   └── workflows/             # CI: install, docs, agents, lint, typecheck, test y build
├── apps/
│   ├── web/                   # TanStack Start sobre Vite
│   └── api/                   # Fastify
├── packages/
│   ├── shared/
│   ├── api-client/
│   ├── ui/
│   └── config/
├── scripts/                   # check-docs, validate-agents
├── docker-compose.yml         # Postgres, Silo (S3) y Mailpit locales
├── content-island-snapshot.json # contenido editorial para SSG
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── assets/
│   ├── design/                # diseños canónicos normalizados
│   ├── archive/design-v1/     # primera iteración (histórico)
│   └── demo/                  # fotos de demostración con licencia
└── docs/
    ├── 00-index.md
    ├── 01-product/
    ├── 02-design/
    ├── 03-architecture/
    ├── 04-features/
    ├── 05-quality/
    ├── 06-process/
    ├── 07-curriculum/
    ├── 08-delivery/
    └── archive/
```

---

## Documentación

| Documento | Para qué |
| --- | --- |
| [docs/00-index.md](docs/00-index.md) | Índice general y orden de lectura |
| [docs/01-product/scope.md](docs/01-product/scope.md) | Qué entra y qué no |
| [docs/02-design/screens.md](docs/02-design/screens.md) | Inventario de las 54 vistas y enlaces |
| [docs/03-architecture/overview.md](docs/03-architecture/overview.md) | Arquitectura, render modes y límites |
| [docs/03-architecture/spike-results.md](docs/03-architecture/spike-results.md) | Resultados y deudas del spike F05 |
| [docs/03-architecture/api-contract.md](docs/03-architecture/api-contract.md) | Contrato REST |
| [docs/04-features/README.md](docs/04-features/README.md) | Tablero de las 43 features |
| [docs/05-quality/definition-of-done.md](docs/05-quality/definition-of-done.md) | Cuándo se considera terminada una feature |
| [docs/05-quality/audits/2026-10-25-audit.md](docs/05-quality/audits/2026-10-25-audit.md) | Auditoría del proyecto y plan de corrección |
| [docs/06-process/workflow.md](docs/06-process/workflow.md) | Ciclo de trabajo y gates |
| [docs/06-process/subagent-protocol.md](docs/06-process/subagent-protocol.md) | Cómo trabaja un subagente |
| [docs/07-curriculum/coverage-map.md](docs/07-curriculum/coverage-map.md) | Cobertura del temario |
| [docs/08-delivery/defense.md](docs/08-delivery/defense.md) | Guion de la defensa |
| [docs/archive/spec-v1.md](docs/archive/spec-v1.md) | Especificación original (histórico) |

---

## Alcance

### MVP

- Registro, inicio y cierre de sesión; rutas protegidas.
- Círculos privados con invitación por enlace (vista previa Open Graph) y email opcional.
- Álbumes colaborativos.
- Subida desde galería, cámara y arrastrar y soltar, con progreso, reintento y cancelación.
- Galería, visor de foto, metadatos y geocodificación.
- Etiquetado de miembros y filtro «Fotos de esta persona».
- Descarga individual, de selección y de álbum completo (ZIP).
- Perfil, tema claro/oscuro/sistema, permisos por círculo.
- PWA instalable.
- Ayuda, FAQ y Privacidad desde Content Island, generadas en build.
- API REST propia, PostgreSQL y almacenamiento de objetos reales.
- Tests, accesibilidad, rendimiento y seguridad.

### Extras acordados

- **Subidas globales** (`/uploads`) con cola compartida.
- **Actividad** por círculo y global.
- **Privacidad** también gestionada en Content Island.

### Fuera del MVP (documentado)

Offline y subidas en segundo plano; pagos reales; búsqueda avanzada; recuperación de fotos borradas, exportación integral y backups; notificaciones push; internacionalización; apps nativas; verificación de email; recuperación de contraseña.

Detalle y justificación en [docs/01-product/scope.md](docs/01-product/scope.md).

---

## Cómo se trabaja

Cada feature tiene una spec autocontenida en `docs/04-features/Fxx-.../spec.md` con:

- objetivo, contexto y dependencias;
- alcance incluido y excluido;
- contrato de API y modelo de datos;
- estados de UI y criterios de aceptación numerados;
- plan de pruebas, archivos previstos y comandos de verificación;
- handoff y preguntas abiertas.

Flujo:

```text
draft → ready → in-progress → review → accepted → done
```

Reglas principales:

1. El agente **propone antes de escribir** y espera confirmación.
2. Un subagente = una feature = una rama = un `handoff.md`.
3. El implementador no se autoaprueba; el `reviewer` revisa sin editar.
4. Si falta una decisión, se para y pregunta.
5. Nada de secretos, dependencias, migraciones, commits o `push` sin permiso.

Todo está en [AGENTS.md](AGENTS.md) y [docs/06-process/workflow.md](docs/06-process/workflow.md).

---

## Diseño

- Fuente canónica: [assets/design/screens/](assets/design/screens/) (segunda iteración, 54 vistas).
- Índice visual: [assets/design/indice-de-pantallas.png](assets/design/indice-de-pantallas.png).
- Sistema de diseño v0.1: [assets/design/design-system-v0.1.png](assets/design/design-system-v0.1.png).
- Tokens y componentes: [docs/02-design/tokens.md](docs/02-design/tokens.md) y [docs/02-design/components.md](docs/02-design/components.md).
- Primera iteración: [assets/archive/design-v1/](assets/archive/design-v1/) (solo histórico).

Los nombres de archivo están normalizados a ASCII kebab-case. El manifest original está en [assets/design/manifest.json](assets/design/manifest.json).

---

## Uso de IA

La IA forma parte del proyecto y deja rastro en [docs/06-process/ai-log.md](docs/06-process/ai-log.md): prompt representativo, propuesta, corrección y decisión. Cada feature actualiza también el [mapa de cobertura del temario](docs/07-curriculum/coverage-map.md).

Herramientas:

- OpenCode V2 con agentes especializados.
- Content Island MCP y skills para el contenido editorial.
- Revisión humana de todo cambio.

---

## Próximos pasos

1. **F07** — modelo de datos, migraciones y seed; siguiente paso, sin abrir hasta que el usuario lo autorice.
2. **F08–F14** — API/web core, sistema visual y UI kit.
3. **F15–F22** — auth, círculos, invitaciones y personas.
4. **F23–F28** — álbumes, subidas y ajustes.
5. **F29–F35** — galería, visor, metadatos, etiquetas, descargas, perfil y actividad.
6. **F36–F43** — Content Island, tests, accesibilidad, rendimiento, seguridad, despliegue y defensa.

F05 queda `done` tras el merge `8dfae5f` y el CI en verde ([run 40371999132](https://github.com/Luceir0/lab-final--memora/actions/runs/40371999132)). F06 se cerró el 2026-10-31 con la PR #2, el merge `b556168` y el CI en verde (run `41246708428`, `completed/success`). F07 no se abre sin permiso del usuario.

---

## Licencia y datos

- Código: licencia pendiente de decidir.
- Fotografías de demostración: Unsplash/Pexels, con créditos en [assets/demo/README.md](assets/demo/README.md). Nunca fotos privadas reales sin consentimiento.
- Los datos de la demo son ficticios.
