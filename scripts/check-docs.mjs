#!/usr/bin/env node
/**
 * check-docs.mjs — documental link + structure checker for Memora.
 *
 * Two responsibilities:
 *   1. Verify every relative Markdown link/image in README.md, AGENTS.md,
 *      CLAUDE.md and docs/**\/*.md points to an existing file or directory.
 *   2. Verify the minimum documentation structure (index, sections, the 43
 *      feature folders with spec/tasks/handoff, and the template).
 *
 * Only Node builtins are used. Run with `pnpm docs:check` or
 * `node scripts/check-docs.mjs`. Exit code 0 = everything OK, 1 = failures.
 *
 * Usage:
 *   node scripts/check-docs.mjs [--root <dir>] [--quiet]
 *
 * `--root` points to another repository copy. It exists so the checker can be
 * exercised against temporary copies (negative tests) without touching docs/.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

/** Directories that are never scanned, relative to the discovered root. */
const SKIPPED_DIRS = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.git',
  '.output',
  '.tanstack',
  'coverage',
]);

/** Root Markdown files that participate in link checking. */
const ROOT_FILES = ['README.md', 'AGENTS.md', 'CLAUDE.md'];

/** Directories under docs/ whose existence is required. */
const REQUIRED_DOC_DIRS = [
  'docs/01-product',
  'docs/02-design',
  'docs/03-architecture',
  'docs/04-features',
  'docs/05-quality',
  'docs/06-process',
  'docs/07-curriculum',
  'docs/08-delivery',
];

const FEATURES_DIR = 'docs/04-features';
const FEATURE_FILE_NAMES = ['spec.md', 'tasks.md', 'handoff.md'];
const FEATURE_COUNT = 43;

/** Broken links: `{ file, line, destination }` as a display string in `where`. */
/** @type {Array<{ file: string, message: string }>} */
const failures = [];
/** Structural problems, kept apart so the summary can report both verdicts. */
/** @type {Array<{ file: string, message: string }>} */
const structureFailures = [];
/** @type {string[]} */
const warnings = [];

let filesChecked = 0;
let linksChecked = 0;

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Parse the tiny CLI surface. Unknown flags are reported instead of ignored so
 * a typo cannot silently turn the check into a no-op.
 */
function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (!value) {
        structureFail('scripts/check-docs.mjs', 'falta el valor de --root');
        continue;
      }
      options.root = resolve(value);
      i += 1;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else {
      structureFail('scripts/check-docs.mjs', `argumento desconocido: ${arg}`);
    }
  }
  return options;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fail(file, message) {
  failures.push({ file, message });
}

function structureFail(file, message) {
  structureFailures.push({ file, message });
}

function toPosix(value) {
  return value.split(sep).join('/');
}

function displayPath(root, absolutePath) {
  return toPosix(relative(root, absolutePath)) || '.';
}

/**
 * Existence check that tolerates case differences.
 *
 * Windows resolves paths case-insensitively, but CI (and contributors on
 * Linux) do not. Comparing segment by segment keeps the checker honest on any
 * platform: a wrong-case link that works locally is still reported once the
 * filesystem is case-sensitive. We accept a case-insensitive match so a link
 * is never flagged just because of capitalisation.
 */
function existsCaseInsensitive(absolutePath) {
  if (existsSync(absolutePath)) return true;

  const parsed = absolutePath.split(/[\\/]+/);
  let current = parsed.shift() ?? '';
  if (current === '') current = sep;

  for (const segment of parsed) {
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

/**
 * Recursively collect Markdown files under `dirAbs`.
 * `docs/archive/**` is intentionally excluded: it is historical material and
 * may reference paths from the v1 specification.
 */
function collectMarkdownFiles(rootAbs, dirAbs, collected) {
  let entries;
  try {
    entries = readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return collected;
  }

  for (const entry of entries) {
    const absolute = join(dirAbs, entry.name);
    const rel = toPosix(relative(rootAbs, absolute));

    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      if (rel === 'docs/archive' || rel.startsWith('docs/archive/')) continue;
      collectMarkdownFiles(rootAbs, absolute, collected);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      collected.push(absolute);
    }
  }
  return collected;
}

/**
 * Remove fenced code blocks (``` / ~~~) while keeping line numbers stable.
 * Links written inside a fence are examples, not real links.
 */
function stripFencedCode(text) {
  const lines = text.split('\n');
  const output = [];
  let fence = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const match = /^(```+|~~~+)/.exec(trimmed);
    if (fence === null) {
      if (match) {
        fence = { marker: match[1][0], length: match[1].length };
        output.push('');
      } else {
        output.push(line);
      }
      continue;
    }

    // Inside a fence: drop everything until the closing fence.
    output.push('');
    if (match && match[1][0] === fence.marker && match[1].length >= fence.length) {
      fence = null;
    }
  }

  return output.join('\n');
}

/**
 * Extract Markdown link and image destinations.
 *
 * Implemented as a manual scan (instead of one regex) so that nested forms such
 * as `[![alt](image.png)](page.md)` yield both destinations. Returns the raw
 * destination plus the index where the opening bracket sits, which is used to
 * compute the line number.
 *
 * @returns {Array<{ destination: string, index: number }>}
 */
function extractLinks(text) {
  const links = [];
  let cursor = 0;

  while (cursor < text.length) {
    const close = text.indexOf('](', cursor);
    if (close === -1) break;

    // Walk backwards to the matching '[' of this link.
    let depth = 0;
    let open = -1;
    for (let i = close; i >= 0; i -= 1) {
      const char = text[i];
      if (char === ']') depth += 1;
      else if (char === '[') {
        depth -= 1;
        if (depth === 0) {
          open = i;
          break;
        }
      }
    }

    if (open === -1) {
      cursor = close + 2;
      continue;
    }

    // Walk forwards to the matching ')' of the destination; tolerate nested
    // parentheses in URLs (e.g. wiki-style links / file names).
    let parenDepth = 1;
    let end = -1;
    for (let i = close + 2; i < text.length; i += 1) {
      const char = text[i];
      if (char === '(') parenDepth += 1;
      else if (char === ')') {
        parenDepth -= 1;
        if (parenDepth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) {
      cursor = close + 2;
      continue;
    }

    const raw = text.slice(close + 2, end).trim();
    links.push({ destination: raw, index: open });
    cursor = end + 1;
  }

  return links;
}

/**
 * Normalise a raw Markdown destination:
 *   - `<path with spaces>` → `path with spaces`
 *   - `path "title"` / `path 'title'` → `path`
 *   - `path#anchor` / `path?query` → `path`
 *   - `%20` → space
 */
function normaliseDestination(raw) {
  let value = raw.trim();
  if (value.startsWith('<')) {
    const end = value.indexOf('>');
    if (end > 0) value = value.slice(1, end);
  } else {
    const space = value.search(/\s/);
    if (space !== -1) value = value.slice(0, space);
  }

  const pathPart = value.split('#')[0].split('?')[0];
  if (pathPart === '') return '';

  try {
    return decodeURIComponent(pathPart);
  } catch {
    return pathPart;
  }
}

/** Destinations we never resolve: absolute URLs, mail/tel and pure anchors. */
function isExternalDestination(destination) {
  if (destination === '') return true;
  if (destination.startsWith('#')) return true;
  if (destination.startsWith('//')) return true;
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(destination);
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

/* -------------------------------------------------------------------------- */
/* Link checks                                                                */
/* -------------------------------------------------------------------------- */

function checkFileLinks(rootAbs, fileAbs) {
  const content = readFileSync(fileAbs, 'utf8');
  const withoutCode = stripFencedCode(content);
  const links = extractLinks(withoutCode);

  for (const link of links) {
    const destination = normaliseDestination(link.destination);
    if (isExternalDestination(destination)) continue;

    linksChecked += 1;

    const baseDir = dirname(fileAbs);
    const target = destination.startsWith('/')
      ? resolve(rootAbs, `.${destination}`)
      : resolve(baseDir, destination);

    if (!existsCaseInsensitive(target)) {
      fail(
        `${displayPath(rootAbs, fileAbs)}:${lineOf(withoutCode, link.index)}`,
        `enlace roto → ${link.destination}`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Structure checks                                                           */
/* -------------------------------------------------------------------------- */

function checkStructure(rootAbs) {
  // 1. Index file.
  if (!existsCaseInsensitive(join(rootAbs, 'docs/00-index.md'))) {
    structureFail('docs/00-index.md', 'falta el índice de documentación');
  }

  // 2. Required documentation sections.
  for (const directory of REQUIRED_DOC_DIRS) {
    if (!existsCaseInsensitive(join(rootAbs, directory))) {
      structureFail(directory, 'falta la carpeta documental');
    }
  }

  // 3. Feature folders F01..F43 with their three files.
  const featuresAbs = join(rootAbs, FEATURES_DIR);
  let featureEntries = [];
  try {
    featureEntries = readdirSync(featuresAbs, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^F\d{2}-/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch {
    structureFail(FEATURES_DIR, 'falta la carpeta de features');
  }

  const byPrefix = new Map();
  for (const entry of featureEntries) {
    const prefix = entry.slice(0, 3);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(entry);
  }

  for (const [prefix, folders] of byPrefix) {
    if (folders.length > 1) {
      structureFail(
        `${FEATURES_DIR}/${prefix}`,
        `hay ${folders.length} carpetas con el mismo prefijo: ${folders.join(', ')}`,
      );
    }
  }

  const expected = Array.from(
    { length: FEATURE_COUNT },
    (_, index) => `F${String(index + 1).padStart(2, '0')}`,
  );

  for (const prefix of expected) {
    const folders = byPrefix.get(prefix);
    if (!folders || folders.length === 0) {
      structureFail(`${FEATURES_DIR}/${prefix}-*`, 'falta la carpeta de la feature');
      continue;
    }

    const folder = folders[0];
    for (const fileName of FEATURE_FILE_NAMES) {
      const relativeFile = `${FEATURES_DIR}/${folder}/${fileName}`;
      if (!existsCaseInsensitive(join(featuresAbs, folder, fileName))) {
        structureFail(relativeFile, 'falta el archivo obligatorio de la feature');
      }
    }
  }

  // 4. Template folder.
  if (!existsCaseInsensitive(join(featuresAbs, '_template'))) {
    structureFail(`${FEATURES_DIR}/_template`, 'falta la plantilla de features');
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

  // Root Markdown files (only those that exist: CLAUDE.md is optional by
  // convention, but a missing one is worth a warning, not a failure).
  const files = [];
  for (const name of ROOT_FILES) {
    const absolute = join(rootAbs, name);
    if (existsSync(absolute)) {
      files.push(absolute);
    } else if (name !== 'CLAUDE.md') {
      warnings.push(`falta ${name} en la raíz`);
    }
  }

  const docsAbs = join(rootAbs, 'docs');
  if (existsSync(docsAbs)) {
    collectMarkdownFiles(rootAbs, docsAbs, files);
  }

  for (const file of files) {
    filesChecked += 1;
    checkFileLinks(rootAbs, file);
  }

  checkStructure(rootAbs);

  const totalFailures = failures.length + structureFailures.length;
  const ok = totalFailures === 0;

  process.stdout.write('check-docs — validación documental\n');
  process.stdout.write(`  raíz:                 ${toPosix(rootAbs)}\n`);
  process.stdout.write(`  archivos revisados:   ${filesChecked}\n`);
  process.stdout.write(`  enlaces comprobados:  ${linksChecked}\n`);
  process.stdout.write(
    `  estructura:           ${structureFailures.length === 0 ? 'OK' : 'FALLA'}\n`,
  );
  process.stdout.write(`  rotos:                ${failures.length}\n`);

  if (warnings.length > 0 && !options.quiet) {
    process.stdout.write('\nAvisos:\n');
    for (const warning of warnings) process.stdout.write(`  - ${warning}\n`);
  }

  if (!ok) {
    process.stdout.write('\nFallos:\n');
    for (const item of failures) {
      process.stdout.write(`  - ${item.file}: ${item.message}\n`);
    }
    for (const item of structureFailures) {
      process.stdout.write(`  - ${item.file}: ${item.message}\n`);
    }
    process.stdout.write('\nResultado: FALLA\n');
    process.exitCode = 1;
    return;
  }

  process.stdout.write('\nResultado: OK\n');
}

main();
