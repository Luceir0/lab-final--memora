# Scripts de validación

Scripts Node 24 en ESM que usan **solo builtins** (`node:fs`, `node:path`, `node:url`, `node:process`). No hay dependencias nuevas: se ejecutan con `node` directamente y sirven tanto en local como en CI.

| Script                | Comando             | Qué valida                                                  |
| --------------------- | ------------------- | ----------------------------------------------------------- |
| `check-docs.mjs`      | `pnpm docs:check`   | Enlaces relativos y estructura documental                   |
| `validate-agents.mjs` | `pnpm agents:check` | Configuración de agentes, comandos, skills, specs y tablero |

## `check-docs.mjs`

Comprueba dos cosas:

1. **Enlaces.** Recorre `README.md`, `AGENTS.md`, `CLAUDE.md` y `docs/**/*.md` (excluye `docs/archive/`, `node_modules`, `dist`, `.turbo`, `.output`, `.tanstack`, `coverage` y `.git`). Extrae enlaces e imágenes `[texto](destino)` / `![alt](destino)` y verifica que el destino existe.
   - Ignora `http://`, `https://`, `mailto:`, `tel:`, `#ancla`, destinos vacíos y bloques de código cercados (dentro de un fence no hay enlaces reales).
   - Quita `#ancla` y `?query` antes de resolver.
   - Resuelve rutas relativas contra el directorio del archivo; `/ruta` se resuelve contra la raíz del repo.
   - Decodifica `%20` y compara sin distinguir mayúsculas ni separadores, para no generar falsos positivos entre Windows y Linux.
   - Acepta enlaces a directorios.
   - Reporta `archivo:línea → destino` de cada enlace roto.
2. **Estructura mínima.**
   - Existe `docs/00-index.md`.
   - Existen `docs/01-product`, `02-design`, `03-architecture`, `04-features`, `05-quality`, `06-process`, `07-curriculum` y `08-delivery`.
   - Existen las 43 carpetas `docs/04-features/F01-…` a `F43-…`, cada una con `spec.md`, `tasks.md` y `handoff.md`, sin prefijos duplicados.
   - Existe `docs/04-features/_template`.

Salida: resumen con archivos revisados, enlaces comprobados, estructura OK/FALLA y número de rotos. Exit `0` si todo está bien; `1` con el listado de fallos.

## `validate-agents.mjs`

Valida el andamiaje agéntico y falla con exit `1` si algo no cumple:

1. **`opencode.jsonc`.** Se parsea con un limpiador JSONC propio: elimina comentarios `//` y `/* */` respetando el contenido de las cadenas y quita comas finales (también sin tocar cadenas). Comprueba que `default_agent` existe entre los agentes y que cada entrada de `instructions` apunta a un archivo real. Las `permissions` globales usan el mismo esquema que las de agente y también se validan.
2. **Agentes** (`.opencode/agents`). Frontmatter con `description` no vacía, `mode` ∈ `subagent|primary|all` y `permissions` con `action` ∈ `read|edit|shell|subagent` y `effect` ∈ `allow|deny|ask`. Nombres de archivo únicos. Solo `orchestrator` puede tener `action: subagent` con `effect: allow`: el resto de agentes no delega.
3. **Comandos** (`.opencode/commands`). `description` en frontmatter y cuerpo no vacío. Las rutas entre backticks que empiezan por `docs/`, `.opencode/` o `scripts/` deben existir.
   - Criterio: solo se comprueban rutas **concretas**. Se omiten plantillas y fragmentos de prosa (`$ARGUMENTS`, `*`, `{…}`, `<…>` o texto con espacios). Esas rutas son las que se rompen en silencio al mover documentación; las de `apps/` o `packages/` cambian con más frecuencia y generarían ruido en comandos que describen trabajo futuro.
4. **Skills** (un `SKILL.md` por carpeta de `.opencode/skills`). `name` y `description` en frontmatter, cuerpo de al menos 20 líneas no vacías.
   - **Criterio de nombre:** se compara el `name` **normalizado a slug** con el directorio (`Memora API Contract` → `memora-api-contract`). La regla literal "name igual al directorio" sería demasiado estricta: este repo usa nombres legibles en frontmatter y carpetas en kebab-case, y lo que importa es que no se puedan desincronizar (un `name` de otra skill sí falla). El slug solo cambia mayúsculas, acentos y separadores, así que sigue detectando un nombre equivocado.
5. **Specs** (`docs/04-features`). Exactamente 43 carpetas `Fxx-…`; `id` del frontmatter igual al prefijo de la carpeta (`F04-monorepo-tooling` → `F04`); ids únicos; `status` ∈ `{draft, ready, in-progress, review, accepted, done}`; `depends_on` solo referencia ids existentes y sin ciclos; secciones obligatorias `## Objetivo`, `## Criterios de aceptación`, `## Verificación`, `## Definition of Ready` y `## Handoff`.
6. **Tablero.** Cada fila de `docs/04-features/README.md` enlaza un `spec.md` existente y de su propia feature. No se exige que el estado del tablero coincida con el de la spec (eso se ajusta al cerrar cada feature).
7. **Scripts raíz.** `package.json` declara `docs:check` → `scripts/check-docs.mjs` y `agents:check` → `scripts/validate-agents.mjs`.

Salida: resumen por categoría (`config`, `agentes`, `comandos`, `skills`, `specs`, `tablero`) y errores con ruta. Exit `0` o `1`.

## Uso

```bash
pnpm docs:check
pnpm agents:check

# Equivalente directo
node scripts/check-docs.mjs
node scripts/validate-agents.mjs
```

Ambos aceptan `--root <dir>` para validar otra copia del repositorio. Sirve para pruebas negativas sin tocar el repo:

```bash
node scripts/check-docs.mjs --root /ruta/a/copia-temporal
node scripts/validate-agents.mjs --root /ruta/a/copia-temporal
```

`check-docs.mjs` acepta además `--quiet` para ocultar avisos no bloqueantes.

## Cuándo se ejecutan

- **Local:** antes de entregar un handoff y al cerrar una feature.
- **Cierre de feature:** `docs/04-features/Fxx/handoff.md` debe citar la salida real de ambos comandos.
- **CI:** sí. El workflow `.github/workflows/ci.yml` ejecuta `pnpm docs:check` (paso "Docs check") y `pnpm agents:check` (paso "Agents check") en cada push y pull request a `main`.
- **Lint:** `pnpm lint` incluye `lint:root`, que ejecuta `eslint scripts eslint.config.mjs`. Los scripts están cubiertos por ESLint además de por Prettier.

No edites a mano el resultado: si un validador falla, se corrige la causa real (enlace, spec, agente o script) o se reporta como hallazgo.
