/**
 * Genera los iconos de instalación de la PWA de Memora (F14).
 *
 * Uso, desde la raíz del repositorio:
 *
 *   node scripts/generate-app-icons.mjs
 *
 * Escribe en `apps/web/public/icons/`:
 *
 * - `icon-192.png` y `icon-512.png` — purpose `any`.
 * - `icon-maskable-192.png` y `icon-maskable-512.png` — purpose `maskable`.
 * - `apple-touch-icon-180.png` — 180 px, opaco, para iOS.
 *
 * Diseño: fondo `--color-primary` (#5B47E0) y punto blanco centrado, como el
 * punto del logotipo. El punto de las variantes maskable queda dentro de la
 * zona segura del 80 % (radio 18 % del lado frente al 40 % permitido).
 *
 * Sin dependencias: el PNG se codifica a mano con `node:zlib` (RGB de 8 bits,
 * sin canal alfa). Los iconos se versionan; este script solo hace falta para
 * regenerarlos si cambia el logotipo o el color primario.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

/** `--color-primary` en claro (docs/02-design/tokens.md). */
const BACKGROUND_RGB = [0x5b, 0x47, 0xe0];
/** `--color-on-primary`. */
const DOT_RGB = [0xff, 0xff, 0xff];

const ICONS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-192.png', size: 192 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon-180.png', size: 180 },
];

/** Radio del punto como fracción del lado. Muy dentro de la zona segura maskable. */
const DOT_RADIUS_RATIO = 0.18;
/** Muestras por eje para suavizar el borde del círculo. */
const SAMPLES_PER_AXIS = 4;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** `dx`/`dy` son la distancia del centro del píxel al centro del icono. */
function blendPixel(dx, dy, radius) {
  let inside = 0;

  for (let sampleY = 0; sampleY < SAMPLES_PER_AXIS; sampleY += 1) {
    for (let sampleX = 0; sampleX < SAMPLES_PER_AXIS; sampleX += 1) {
      const offsetX = (sampleX + 0.5) / SAMPLES_PER_AXIS - 0.5;
      const offsetY = (sampleY + 0.5) / SAMPLES_PER_AXIS - 0.5;

      if (Math.hypot(dx + offsetX, dy + offsetY) <= radius) {
        inside += 1;
      }
    }
  }

  const coverage = inside / (SAMPLES_PER_AXIS * SAMPLES_PER_AXIS);

  return BACKGROUND_RGB.map((channel, index) =>
    Math.round(channel * (1 - coverage) + DOT_RGB[index] * coverage),
  );
}

function createIconPng(size) {
  const radius = size * DOT_RADIUS_RATIO;
  const center = size / 2;
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // Filtro «None».

    for (let x = 0; x < size; x += 1) {
      // `blendPixel` recibe el centro del píxel: se compensa aquí el +0.5.
      const [red, green, blue] = blendPixel(x + 0.5 - center, y + 0.5 - center, radius);
      const offset = rowStart + 1 + x * 3;
      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // Profundidad de bits.
  header[9] = 2; // RGB truecolor.
  header[10] = 0; // Deflate.
  header[11] = 0; // Filtro adaptativo.
  header[12] = 0; // Sin entrelazado.

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outputDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'web',
  'public',
  'icons',
);

mkdirSync(outputDirectory, { recursive: true });

for (const { file, size } of ICONS) {
  const target = path.join(outputDirectory, file);
  writeFileSync(target, createIconPng(size));
  console.log(`Escrito ${path.relative(process.cwd(), target)} (${size}×${size}).`);
}
