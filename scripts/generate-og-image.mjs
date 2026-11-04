/**
 * Genera la imagen Open Graph genérica de Memora (F20).
 *
 * Uso, desde la raíz del repositorio:
 *
 *   node scripts/generate-og-image.mjs
 *
 * Escribe `apps/web/public/og/invite.png`, 1200×630, sin texto. La imagen es
 * deliberadamente genérica (decisión D2 de F20): fondo primario, los anillos
 * concéntricos del héroe de círculo y el punto rosa del logotipo. El nombre
 * del círculo viaja en `og:title`, nunca en la imagen, y jamás se usa la
 * portada del círculo.
 *
 * Sin dependencias: el PNG se codifica a mano con `node:zlib` (RGB de 8 bits,
 * sin canal alfa). La imagen se versiona; este script solo hace falta para
 * regenerarla si cambian los tokens de color o el motivo del logotipo.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Tokens de `docs/02-design/tokens.md`.
 *
 * `PRIMARY`, `PRIMARY_SOFT` y `ACCENT_PINK` son valores del tema claro. El
 * anillo interior usa el valor **oscuro** de `--color-on-primary-soft`
 * (`#C9C0FF`), no el claro (`#2E2390`): sobre el fondo primario necesita
 * claridad y el color oscuro del token sería casi invisible.
 */
const PRIMARY = [0x5b, 0x47, 0xe0]; // --color-primary (claro)
const PRIMARY_SOFT = [0xee, 0xeb, 0xfe]; // --color-primary-soft (claro)
const ON_PRIMARY_SOFT = [0xc9, 0xc0, 0xff]; // --color-on-primary-soft (oscuro)
const ACCENT_PINK = [0xfa, 0xd4, 0xe1]; // --color-accent-pink (claro)

/** Anillos concéntricos: radio, grosor y color. */
const RINGS = [
  { radius: 300, width: 44, color: PRIMARY_SOFT },
  { radius: 220, width: 38, color: ON_PRIMARY_SOFT },
  { radius: 130, width: 0, color: PRIMARY_SOFT },
];

/** Punto rosa del logotipo, descentrado como en el héroe. */
const DOT = { x: WIDTH * 0.68, y: HEIGHT * 0.3, radius: 26, color: ACCENT_PINK };

/** Muestras por eje para suavizar los bordes. */
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

/**
 * Color del píxel `(x, y)` muestreado 4×4.
 *
 * `coverage` se aplica en orden: cada capa se compone sobre la anterior. Los
 * anillos se dibujan del exterior al interior y el punto al final.
 */
function colorAt(x, y) {
  let color = PRIMARY;

  for (const ring of RINGS) {
    let coverage = 0;

    for (let sampleY = 0; sampleY < SAMPLES_PER_AXIS; sampleY += 1) {
      for (let sampleX = 0; sampleX < SAMPLES_PER_AXIS; sampleX += 1) {
        const offsetX = (sampleX + 0.5) / SAMPLES_PER_AXIS - 0.5;
        const offsetY = (sampleY + 0.5) / SAMPLES_PER_AXIS - 0.5;
        const distance = Math.hypot(x + offsetX - WIDTH / 2, y + offsetY - HEIGHT / 2);

        const inside =
          ring.width === 0
            ? distance <= ring.radius
            : distance <= ring.radius && distance >= ring.radius - ring.width;

        if (inside) {
          coverage += 1;
        }
      }
    }

    color = blend(color, ring.color, coverage / SAMPLES_PER_AXIS ** 2);
  }

  let dotCoverage = 0;

  for (let sampleY = 0; sampleY < SAMPLES_PER_AXIS; sampleY += 1) {
    for (let sampleX = 0; sampleX < SAMPLES_PER_AXIS; sampleX += 1) {
      const offsetX = (sampleX + 0.5) / SAMPLES_PER_AXIS - 0.5;
      const offsetY = (sampleY + 0.5) / SAMPLES_PER_AXIS - 0.5;

      if (Math.hypot(x + offsetX - DOT.x, y + offsetY - DOT.y) <= DOT.radius) {
        dotCoverage += 1;
      }
    }
  }

  return blend(color, DOT.color, dotCoverage / SAMPLES_PER_AXIS ** 2);
}

function blend(base, overlay, coverage) {
  return base.map((channel, index) =>
    Math.round(channel * (1 - coverage) + overlay[index] * coverage),
  );
}

function createOpenGraphPng() {
  const stride = WIDTH * 3 + 1;
  const raw = Buffer.alloc(stride * HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // Filtro «None».

    for (let x = 0; x < WIDTH; x += 1) {
      const [red, green, blue] = colorAt(x, y);
      const offset = rowStart + 1 + x * 3;
      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
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
  'og',
);

mkdirSync(outputDirectory, { recursive: true });

const target = path.join(outputDirectory, 'invite.png');
writeFileSync(target, createOpenGraphPng());
console.log(`Escrito ${path.relative(process.cwd(), target)} (${WIDTH}×${HEIGHT}).`);
