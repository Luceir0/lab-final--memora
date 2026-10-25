#!/usr/bin/env node
/**
 * validate-agents.mjs — consistency checker for the agentic scaffold.
 *
 * Validates:
 *   1. `opencode.jsonc` (JSONC parsed with a local cleaner): `default_agent`
 *      points to a real agent and every `instructions` entry exists.
 *   2. Agent Markdown files in `.opencode/agents`: frontmatter with
 *      description, mode and valid permissions. Only `orchestrator` may
 *      delegate (`subagent` + `allow`).
 *   3. Command Markdown files in `.opencode/commands`: description, non-empty
 *      body and existing repository paths quoted in the body.
 *   4. One `SKILL.md` per directory in `.opencode/skills`: name, description,
 *      directory match and a body of at least 20 lines.
 *   5. Feature specs under `docs/04-features`: 43 specs, coherent ids, valid
 *      status, existing dependencies without cycles and required sections.
 *   6. Board rows in the features README point to existing specs.
 *   7. Root `package.json` wires `docs:check` and `agents:check` to these
 *      scripts.
 *
 * Note: paths are described in prose instead of globs because a literal
 * "star slash" sequence would terminate this block comment early.
 *
 * Only Node builtins. Run with `pnpm agents:check` or
 * `node scripts/validate-agents.mjs`. Exit code 0 = OK, 1 = errors.
 *
 * Usage:
 *   node scripts/validate-agents.mjs [--root <dir>]
 *
 * `--root` lets the checker run against a temporary copy for negative tests.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

const AGENT_MODES = new Set(['subagent', 'primary', 'all']);
const PERMISSION_ACTIONS = new Set(['read', 'edit', 'shell', 'subagent']);
const PERMISSION_EFFECTS = new Set(['allow', 'deny', 'ask']);
const SPEC_STATUSES = new Set(['draft', 'ready', 'in-progress', 'review', 'accepted', 'done']);
const SPEC_SECTIONS = [
  '## Objetivo',
  '## Criterios de aceptación',
  '## Verificación',
  '## Definition of Ready',
  '## Handoff',
];
const FEATURE_COUNT = 43;
const MIN_SKILL_BODY_LINES = 20;

/** @type {Array<{ category: string, file: string, message: string }>} */
const errors = [];
/** @type {string[]} */
const warnings = [];

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (!value) {
        report('config', 'scripts/validate-agents.mjs', 'falta el valor de --root');
        continue;
      }
      options.root = resolve(value);
      i += 1;
    } else {
      report('config', 'scripts/validate-agents.mjs', `argumento desconocido: ${arg}`);
    }
  }
  return options;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function report(category, file, message) {
  errors.push({ category, file, message });
}

function toPosix(value) {
  return value.split(sep).join('/');
}

function existsCaseInsensitive(absolutePath) {
  if (existsSync(absolutePath)) return true;

  const segments = absolutePath.split(/[\\/]+/);
  let current = segments.shift() ?? '';
  if (current === '') current = sep;

  for (const segment of segments) {
    if (segment === '') continue;
    let entries;
    try {
      entries = readdirSync(current);
    } catch {
      return false;
    }
    const match = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
    if (!match) return false;
    current = join(current, match);
  }
  return existsSync(current);
}

/** Markdown files of a directory, sorted; missing directory yields `[]`. */
function listMarkdown(dirAbs) {
  try {
    return readdirSync(dirAbs, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function listDirectories(dirAbs) {
  try {
    return readdirSync(dirAbs, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function countNonEmptyLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim() !== '').length;
}

/**
 * Turn a display name into a slug: "Memora API Contract" → "memora-api-contract".
 * Used to compare a skill `name` with its directory without forcing a single
 * spelling (the repo uses human-readable names in frontmatter and kebab-case
 * directories).
 */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

/* -------------------------------------------------------------------------- */
/* JSONC                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Strip `//` and block comments. String contents are respected, so URLs such as
 * `https://opencode.ai` survive untouched.
 */
function stripJsonComments(text) {
  let output = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      output += char;
      if (char === '\\') {
        output += next ?? '';
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    output += char;
  }

  return output;
}

/** Remove trailing commas before `}`/`]`, ignoring commas inside strings. */
function stripTrailingCommas(text) {
  let output = '';
  let inString = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      output += char;
      if (char === '\\') {
        output += text[i + 1] ?? '';
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ',') {
      let lookahead = i + 1;
      while (lookahead < text.length && /\s/u.test(text[lookahead])) lookahead += 1;
      if (text[lookahead] === '}' || text[lookahead] === ']') continue;
    }

    output += char;
  }

  return output;
}

function parseJsonc(text) {
  return JSON.parse(stripTrailingCommas(stripJsonComments(text)));
}

/* -------------------------------------------------------------------------- */
/* Frontmatter                                                                */
/* -------------------------------------------------------------------------- */

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value === '') return '';
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((part) => parseScalar(part));
  }
  return value;
}

/**
 * Minimal YAML frontmatter reader: top-level scalars, flow arrays (`[]`),
 * block lists of scalars and block lists of maps (used by `permissions`).
 *
 * Deliberately small: the repo only needs this subset, and a dependency-free
 * parser keeps the check reproducible in CI.
 *
 * @returns {{ data: Record<string, unknown>, body: string, error: string | null }}
 */
function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/u);
  if (lines[0]?.trim() !== '---') {
    return { data: {}, body: content, error: 'no empieza con frontmatter (---)' };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { data: {}, body: content, error: 'frontmatter sin cierre (---)' };
  }

  const data = {};
  let currentList = null;
  let currentItem = null;

  for (const rawLine of lines.slice(1, end)) {
    const line = rawLine.replace(/\s+$/u, '');
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    if (indent === 0) {
      const match = /^([A-Za-z0-9_-]+):(.*)$/u.exec(trimmed);
      if (!match) continue;
      const key = match[1];
      const rest = match[2].trim();
      currentItem = null;
      if (rest === '') {
        data[key] = [];
        currentList = data[key];
      } else {
        data[key] = parseScalar(rest);
        currentList = null;
      }
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(currentList)) continue;
      const item = trimmed.slice(2).trim();
      const match = /^([A-Za-z0-9_-]+):(.*)$/u.exec(item);
      if (match) {
        const entry = {};
        entry[match[1]] = parseScalar(match[2]);
        currentList.push(entry);
        currentItem = entry;
      } else {
        currentList.push(parseScalar(item));
        currentItem = null;
      }
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):(.*)$/u.exec(trimmed);
    if (match && currentItem && typeof currentItem === 'object') {
      currentItem[match[1]] = parseScalar(match[2]);
    }
  }

  return { data, body: lines.slice(end + 1).join('\n'), error: null };
}

/* -------------------------------------------------------------------------- */
/* Permission validation                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Validate a permission list. `owner` is the agent name, used to enforce that
 * only the orchestrator can delegate. Returns the number of valid entries.
 *
 * @returns {number}
 */
function validatePermissions(list, file, owner) {
  if (!Array.isArray(list)) {
    report('agents', file, '`permissions` debe ser una lista');
    return 0;
  }

  let valid = 0;
  list.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      report('agents', file, `permissions[${index}] no es un mapa con action/effect`);
      return;
    }

    const action = entry.action;
    const effect = entry.effect;

    if (typeof action !== 'string' || !PERMISSION_ACTIONS.has(action)) {
      report(
        'agents',
        file,
        `permissions[${index}].action inválida: ${JSON.stringify(action)} (esperado: read|edit|shell|subagent)`,
      );
      return;
    }

    if (typeof effect !== 'string' || !PERMISSION_EFFECTS.has(effect)) {
      report(
        'agents',
        file,
        `permissions[${index}].effect inválido: ${JSON.stringify(effect)} (esperado: allow|deny|ask)`,
      );
      return;
    }

    if (action === 'subagent' && effect === 'allow' && owner !== 'orchestrator') {
      report(
        'agents',
        file,
        `solo el orchestrator puede delegar en subagentes (subagent + allow en ${owner})`,
      );
      return;
    }

    valid += 1;
  });

  return valid;
}

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * @param {string} rootAbs
 * @param {string[]} agentNames
 */
function validateConfig(rootAbs, agentNames) {
  const configAbs = join(rootAbs, 'opencode.jsonc');
  if (!existsSync(configAbs)) {
    report('config', 'opencode.jsonc', 'falta el archivo de configuración');
    return;
  }

  let config;
  try {
    config = parseJsonc(readFileSync(configAbs, 'utf8'));
  } catch (error) {
    report('config', 'opencode.jsonc', `JSON inválido tras limpiar JSONC: ${error.message}`);
    return;
  }

  const defaultAgent = config.default_agent;
  if (typeof defaultAgent !== 'string' || defaultAgent.trim() === '') {
    report('config', 'opencode.jsonc', '`default_agent` ausente o vacío');
  } else if (!agentNames.includes(defaultAgent)) {
    report(
      'config',
      'opencode.jsonc',
      `\`default_agent\` apunta a un agente inexistente: ${defaultAgent}`,
    );
  }

  if (!Array.isArray(config.instructions)) {
    report('config', 'opencode.jsonc', '`instructions` debe ser una lista');
  } else if (config.instructions.length === 0) {
    report('config', 'opencode.jsonc', '`instructions` está vacía');
  } else {
    for (const entry of config.instructions) {
      if (typeof entry !== 'string' || entry.trim() === '') {
        report('config', 'opencode.jsonc', '`instructions` contiene una entrada no textual');
        continue;
      }
      if (!existsCaseInsensitive(join(rootAbs, entry))) {
        report(
          'config',
          'opencode.jsonc',
          `\`instructions\` apunta a un archivo inexistente: ${entry}`,
        );
      }
    }
  }

  // Global permissions share the agent schema; validating them catches typos
  // that would otherwise be silently ignored by the runtime.
  if (config.permissions !== undefined) {
    validatePermissions(config.permissions, 'opencode.jsonc', 'orchestrator');
  }
}

/* -------------------------------------------------------------------------- */
/* Agents                                                                     */
/* -------------------------------------------------------------------------- */

/** @returns {string[]} agent names (file names without `.md`). */
function validateAgents(rootAbs) {
  const agentsAbs = join(rootAbs, '.opencode/agents');
  const files = listMarkdown(agentsAbs);
  const names = files.map((file) => basename(file, '.md'));

  if (files.length === 0) {
    report('agents', '.opencode/agents', 'no hay agentes definidos');
  }

  const seen = new Set();
  for (const file of files) {
    const relativeFile = toPosix(join('.opencode/agents', file));
    const name = basename(file, '.md');

    const key = name.toLowerCase();
    if (seen.has(key)) {
      report('agents', relativeFile, `nombre de agente duplicado: ${name}`);
    }
    seen.add(key);

    const { data, error } = parseFrontmatter(readFileSync(join(agentsAbs, file), 'utf8'));
    if (error) {
      report('agents', relativeFile, error);
      continue;
    }

    if (typeof data.description !== 'string' || data.description.trim() === '') {
      report('agents', relativeFile, '`description` ausente o vacía');
    }

    if (typeof data.mode !== 'string' || !AGENT_MODES.has(data.mode)) {
      report(
        'agents',
        relativeFile,
        `\`mode\` inválido: ${JSON.stringify(data.mode)} (esperado: subagent|primary|all)`,
      );
    }

    if (!Array.isArray(data.permissions) || data.permissions.length === 0) {
      report('agents', relativeFile, '`permissions` ausente o vacía');
    } else {
      validatePermissions(data.permissions, relativeFile, name);
    }
  }

  if (!names.includes('orchestrator')) {
    report('agents', '.opencode/agents', 'falta el agente `orchestrator`');
  }

  return names;
}

/* -------------------------------------------------------------------------- */
/* Commands                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Repository paths quoted in a command body. Only unambiguously concrete paths
 * are checked: placeholders (`$ARGUMENTS`, `{ }`, `*`, `<...>`) and prose
 * fragments are skipped. Paths under `docs/`, `.opencode/` and `scripts/` are
 * the ones that rot silently, so those are enforced.
 */
function extractCommandPaths(body) {
  const paths = [];
  const pattern = /`([^`\n]+)`/gu;
  let match;

  while ((match = pattern.exec(body)) !== null) {
    const span = match[1].trim();
    if (span === '') continue;
    if (/[$<>{}*]/u.test(span)) continue;
    if (/\s/u.test(span)) continue;
    if (!/^(docs\/|\.opencode\/|scripts\/)/u.test(span)) continue;

    const token = span.replace(/[.,;:]+$/u, '');
    paths.push(token);
  }

  return paths;
}

function validateCommands(rootAbs) {
  const commandsAbs = join(rootAbs, '.opencode/commands');
  const files = listMarkdown(commandsAbs);

  if (files.length === 0) {
    report('commands', '.opencode/commands', 'no hay comandos definidos');
  }

  for (const file of files) {
    const relativeFile = toPosix(join('.opencode/commands', file));
    const { data, body, error } = parseFrontmatter(readFileSync(join(commandsAbs, file), 'utf8'));
    if (error) {
      report('commands', relativeFile, error);
      continue;
    }

    if (typeof data.description !== 'string' || data.description.trim() === '') {
      report('commands', relativeFile, '`description` ausente o vacía');
    }

    if (body.trim() === '') {
      report('commands', relativeFile, 'el cuerpo del comando está vacío');
      continue;
    }

    for (const path of extractCommandPaths(body)) {
      if (!existsCaseInsensitive(join(rootAbs, path))) {
        report('commands', relativeFile, `ruta citada inexistente: ${path}`);
      }
    }
  }

  return files.length;
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

function validateSkills(rootAbs) {
  const skillsAbs = join(rootAbs, '.opencode/skills');
  const directories = listDirectories(skillsAbs);

  if (directories.length === 0) {
    report('skills', '.opencode/skills', 'no hay skills definidas');
  }

  for (const directory of directories) {
    const relativeFile = toPosix(join('.opencode/skills', directory, 'SKILL.md'));
    const skillAbs = join(skillsAbs, directory, 'SKILL.md');

    if (!existsSync(skillAbs)) {
      report('skills', relativeFile, 'falta SKILL.md');
      continue;
    }

    const { data, body, error } = parseFrontmatter(readFileSync(skillAbs, 'utf8'));
    if (error) {
      report('skills', relativeFile, error);
      continue;
    }

    if (typeof data.name !== 'string' || data.name.trim() === '') {
      report('skills', relativeFile, '`name` ausente o vacío');
    } else if (slugify(data.name) !== slugify(directory)) {
      report(
        'skills',
        relativeFile,
        `\`name\` (${data.name}) no corresponde al directorio (${directory})`,
      );
    }

    if (typeof data.description !== 'string' || data.description.trim() === '') {
      report('skills', relativeFile, '`description` ausente o vacía');
    }

    const bodyLines = countNonEmptyLines(body);
    if (bodyLines < MIN_SKILL_BODY_LINES) {
      report(
        'skills',
        relativeFile,
        `el cuerpo tiene ${bodyLines} líneas no vacías; mínimo ${MIN_SKILL_BODY_LINES}`,
      );
    }
  }

  return directories.length;
}

/* -------------------------------------------------------------------------- */
/* Specs                                                                      */
/* -------------------------------------------------------------------------- */

function detectCycles(graph) {
  const state = new Map(); // 0 = unvisited, 1 = visiting, 2 = done
  const cycles = [];

  const visit = (id, trail) => {
    const current = state.get(id) ?? 0;
    if (current === 2) return;
    if (current === 1) {
      const start = trail.indexOf(id);
      cycles.push([...trail.slice(start), id]);
      return;
    }

    state.set(id, 1);
    for (const dependency of graph.get(id) ?? []) {
      visit(dependency, [...trail, id]);
    }
    state.set(id, 2);
  };

  for (const id of graph.keys()) visit(id, []);
  return cycles;
}

function validateSpecs(rootAbs) {
  const featuresAbs = join(rootAbs, 'docs/04-features');
  const folders = listDirectories(featuresAbs).filter((name) => /^F\d{2}-/u.test(name));

  if (folders.length !== FEATURE_COUNT) {
    report(
      'specs',
      'docs/04-features',
      `se esperaban ${FEATURE_COUNT} carpetas de spec (F01…F${FEATURE_COUNT}); hay ${folders.length}`,
    );
  }

  const specs = new Map(); // id -> { folder, dependencies }
  const duplicateIds = new Map();

  for (const folder of folders) {
    const relativeFile = toPosix(join('docs/04-features', folder, 'spec.md'));
    const specAbs = join(featuresAbs, folder, 'spec.md');

    if (!existsSync(specAbs)) {
      report('specs', relativeFile, 'falta spec.md');
      continue;
    }

    const { data, error, body } = parseFrontmatter(readFileSync(specAbs, 'utf8'));
    if (error) {
      report('specs', relativeFile, error);
      continue;
    }

    const expectedId = folder.slice(0, 3);
    const id = data.id;
    if (typeof id !== 'string' || id.trim() === '') {
      report('specs', relativeFile, '`id` ausente en el frontmatter');
    } else if (id !== expectedId) {
      report(
        'specs',
        relativeFile,
        `\`id\` (${id}) no coincide con el prefijo de la carpeta (${expectedId})`,
      );
    }

    if (typeof data.status !== 'string' || !SPEC_STATUSES.has(data.status)) {
      report('specs', relativeFile, `\`status\` inválido: ${JSON.stringify(data.status)}`);
    }

    const dependencies = Array.isArray(data.depends_on) ? data.depends_on.map(String) : [];
    if (data.depends_on !== undefined && !Array.isArray(data.depends_on)) {
      report('specs', relativeFile, '`depends_on` debe ser una lista');
    }

    for (const section of SPEC_SECTIONS) {
      const heading = new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*$`, 'mu');
      if (!heading.test(body)) {
        report('specs', relativeFile, `falta la sección obligatoria \`${section}\``);
      }
    }

    if (typeof id === 'string' && id.trim() !== '') {
      if (specs.has(id)) {
        duplicateIds.set(id, [...(duplicateIds.get(id) ?? [specs.get(id).folder]), folder]);
      } else {
        specs.set(id, { folder, dependencies });
      }
    }
  }

  for (const [id, foldersWithId] of duplicateIds) {
    report('specs', 'docs/04-features', `id duplicado ${id} en: ${foldersWithId.join(', ')}`);
  }

  // Dependencies must exist and must not form cycles.
  const graph = new Map();
  for (const [id, spec] of specs) {
    const relativeFile = toPosix(join('docs/04-features', spec.folder, 'spec.md'));
    for (const dependency of spec.dependencies) {
      if (!specs.has(dependency)) {
        report('specs', relativeFile, `\`depends_on\` referencia un id inexistente: ${dependency}`);
      }
    }
    graph.set(
      id,
      spec.dependencies.filter((dependency) => specs.has(dependency)),
    );
  }

  for (const cycle of detectCycles(graph)) {
    report('specs', 'docs/04-features', `dependencias circulares: ${cycle.join(' → ')}`);
  }

  return folders.length;
}

/* -------------------------------------------------------------------------- */
/* Board                                                                      */
/* -------------------------------------------------------------------------- */

function validateBoard(rootAbs) {
  const boardAbs = join(rootAbs, 'docs/04-features/README.md');
  if (!existsSync(boardAbs)) {
    report('board', 'docs/04-features/README.md', 'falta el tablero de features');
    return 0;
  }

  const content = readFileSync(boardAbs, 'utf8');
  const featuresAbs = join(rootAbs, 'docs/04-features');

  // Rows look like: | F04 | [Title](F04-monorepo-tooling/spec.md) | ...
  const rows = content.split(/\r?\n/u).filter((line) => /^\|\s*F\d{2}\s*\|/u.test(line));

  for (const row of rows) {
    const cells = row.split('|').map((cell) => cell.trim());
    const id = cells[1];
    const link = /\[[^\]]*\]\(([^)]+)\)/u.exec(cells[2] ?? '');

    if (!link) {
      report('board', 'docs/04-features/README.md', `la fila ${id} no enlaza su spec.md`);
      continue;
    }

    const target = link[1].trim();
    if (!existsCaseInsensitive(join(featuresAbs, target))) {
      report(
        'board',
        'docs/04-features/README.md',
        `la fila ${id} enlaza un spec inexistente: ${target}`,
      );
      continue;
    }

    if (!target.startsWith(`${id}-`)) {
      report(
        'board',
        'docs/04-features/README.md',
        `la fila ${id} enlaza una carpeta de otra feature: ${target}`,
      );
    }
  }

  return rows.length;
}

/* -------------------------------------------------------------------------- */
/* Root scripts                                                               */
/* -------------------------------------------------------------------------- */

function validateRootScripts(rootAbs) {
  const packageAbs = join(rootAbs, 'package.json');
  if (!existsSync(packageAbs)) {
    report('config', 'package.json', 'falta package.json en la raíz');
    return;
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packageAbs, 'utf8'));
  } catch (error) {
    report('config', 'package.json', `JSON inválido: ${error.message}`);
    return;
  }

  const scripts = pkg.scripts ?? {};
  const expected = [
    ['docs:check', 'scripts/check-docs.mjs'],
    ['agents:check', 'scripts/validate-agents.mjs'],
  ];

  for (const [name, target] of expected) {
    const command = scripts[name];
    if (typeof command !== 'string' || command.trim() === '') {
      report('config', 'package.json', `falta el script \`${name}\``);
    } else if (!command.includes(target)) {
      report('config', 'package.json', `el script \`${name}\` no apunta a ${target}: ${command}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rootAbs = options.root;

  if (!existsSync(rootAbs) || !statSync(rootAbs).isDirectory()) {
    process.stderr.write(`No existe el directorio raíz: ${rootAbs}\n`);
    process.exitCode = 2;
    return;
  }

  const agentNames = validateAgents(rootAbs);
  validateConfig(rootAbs, agentNames);
  const commandCount = validateCommands(rootAbs);
  const skillCount = validateSkills(rootAbs);
  const specCount = validateSpecs(rootAbs);
  const boardRows = validateBoard(rootAbs);
  validateRootScripts(rootAbs);

  const ok = errors.length === 0;

  process.stdout.write('validate-agents — agentes, comandos, skills y specs\n');
  process.stdout.write(`  raíz:       ${toPosix(rootAbs)}\n`);
  process.stdout.write(`  config:     ${hasErrors('config') ? 'FALLA' : 'OK'}\n`);
  process.stdout.write(
    `  agentes:    ${hasErrors('agents') ? 'FALLA' : 'OK'} (${agentNames.length})\n`,
  );
  process.stdout.write(
    `  comandos:   ${hasErrors('commands') ? 'FALLA' : 'OK'} (${commandCount})\n`,
  );
  process.stdout.write(`  skills:     ${hasErrors('skills') ? 'FALLA' : 'OK'} (${skillCount})\n`);
  process.stdout.write(`  specs:      ${hasErrors('specs') ? 'FALLA' : 'OK'} (${specCount})\n`);
  process.stdout.write(
    `  tablero:    ${hasErrors('board') ? 'FALLA' : 'OK'} (${boardRows} filas)\n`,
  );

  if (warnings.length > 0) {
    process.stdout.write('\nAvisos:\n');
    for (const warning of warnings) process.stdout.write(`  - ${warning}\n`);
  }

  if (!ok) {
    process.stdout.write(`\nErrores (${errors.length}):\n`);
    for (const item of errors) {
      process.stdout.write(`  - [${item.category}] ${item.file}: ${item.message}\n`);
    }
    process.stdout.write('\nResultado: FALLA\n');
    process.exitCode = 1;
    return;
  }

  process.stdout.write('\nResultado: OK\n');
}

function hasErrors(category) {
  return errors.some((item) => item.category === category);
}

main();
