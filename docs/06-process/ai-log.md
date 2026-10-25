# Bitácora de IA

Registro de usos relevantes de IA. No es un chat completo: es evidencia para el temario y para la defensa.

## Formato

```md
## YYYY-MM-DD — Fxx / tarea

- **Prompt representativo:** ...
- **Propuesta de la IA:** ...
- **Qué se corrigió:** ...
- **Decisión final:** ...
- **Tema del temario:** ...
- **Evidencia:** enlace a archivo/test/ADR
```

## Entradas

### 2026-10-25 — Definición del proyecto

- **Prompt representativo:** auditoría del README, detección de contradicciones y propuesta de estructura agéntica.
- **Propuesta de la IA:** segunda iteración canónica, 43 features, agentes especializados, ADRs y reglas de trabajo.
- **Qué se corrigió:** el README original tenía enlaces rotos, dos iteraciones sin fuente de verdad y decisiones pendientes; se separó en documentos pequeños y se cerró el alcance.
- **Decisión final:** alcance completo del MVP + Subidas + Actividad + Content Island para Ayuda/FAQ/Privacidad; fuera de MVP documentado.
- **Tema del temario:** organización, documentación, IA agente.
- **Evidencia:** `README.md`, `docs/00-index.md`, `docs/04-features/README.md`.

### 2026-10-25 — Estructura agéntica

- **Prompt representativo:** diseñar agentes, comandos y skills para que cada feature sea ejecutable por un subagente.
- **Propuesta de la IA:** orquestador + agentes de API/UI/tests/revisión/a11y/diseño/docs/release; specs autocontenidas.
- **Qué se corrigió:** se evitó cargar el README completo y se añadieron stop conditions y handoff obligatorio.
- **Decisión final:** OpenCode V2 + `AGENTS.md` portable + `CLAUDE.md`.
- **Tema del temario:** IA agente, organización, revisión.
- **Evidencia:** `AGENTS.md`, `.opencode/`, `docs/06-process/`.

### 2026-10-25 — F01–F03 Scaffold

- **Prompt representativo:** aplicar la estructura documental y agéntica acordada sin empezar el desarrollo de la app.
- **Propuesta de la IA:** normalizar assets, archivar la v1, escribir 11 ADRs, 43 specs, 10 agentes, 10 comandos y 6 skills.
- **Qué se corrigió:** los nombres de las capturas se normalizaron a ASCII; se detectaron y corrigieron enlaces rotos y rutas duplicadas `-png.png`; se ordenaron las reglas de permisos para que las excepciones funcionen.
- **Decisión final:** F01–F03 quedan en `review`; no se crea código de aplicación hasta F04.
- **Tema del temario:** organización, documentación, IA agente, revisión.
- **Evidencia:** `README.md`, `AGENTS.md`, `.opencode/`, `docs/04-features/`.

### 2026-10-25 — Correcciones de auditoría (R1–R4)

- **Prompt representativo:** aplicar las correcciones de la auditoría sin empezar el desarrollo.
- **Propuesta de la IA:** commit de protección, ADR-0012/0013, contrato único de errores, reglas de borrado, F34 sin email/avatar, diseño inferido y presupuestos de rendimiento.
- **Qué se corrigió:** `membersCanInvite`, códigos duplicados, borrado de álbum, health endpoint, `:circleId`, F22→F20, F32 ADR, F35 diseño, terminología y documentación de calidad.
- **Decisión final:** se mantiene el alcance; se documentan las vistas inferidas y los presupuestos.
- **Tema del temario:** organización, documentación, IA agente, revisión.
- **Evidencia:** `docs/05-quality/audits/2026-10-25-audit.md`, ADR-0012, ADR-0013, `docs/03-architecture/api-contract.md`.

### 2026-10-25 — F04 Monorepo, tooling, Docker y CI

- **Prompt representativo:** montar la base reproducible del monorepo (pnpm + Turborepo, TypeScript estricto, ESLint/Prettier, Docker Compose local y CI) sin implementar todavía lógica de producto.
- **Propuesta de la IA:** pnpm 10.34.8 con corepack y 7 proyectos de workspace; apps `web` (TanStack Start sobre Vite) y `api` (Fastify); paquetes `shared`, `api-client`, `ui` y `config`; pipeline Turbo; Postgres, MinIO y Mailpit con healthchecks; validadores documentales con `--root` para pruebas negativas; CI que ejecuta install, docs, agents, lint, typecheck, test y build.
- **Qué se corrigió:** se ajustaron los permisos de los agentes web/ui (incluida la lectura de `.env`), se fijó MinIO por tag y digest ante la retirada de las imágenes oficiales, se añadió `lint:root` para `scripts/` y `eslint.config.mjs`, se limitó Prettier a código (la documentación no se formatea), y CI pasó a ejecutar `docs:check` y `agents:check`.
- **Decisión final:** F04 queda en `review`; implementación y verificación terminadas, revisión independiente «apto con correcciones» sin bloqueantes, pendiente la aceptación del usuario.
- **Tema del temario:** entorno y tooling, TypeScript, monorepo, Docker, CI, validación documental, IA agente.
- **Evidencia:** `package.json`, `turbo.json`, `docker-compose.yml`, `.github/workflows/ci.yml`, `scripts/check-docs.mjs`, `scripts/validate-agents.mjs`, `docs/04-features/F04-monorepo-tooling/handoff.md`.
