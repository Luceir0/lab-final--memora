/**
 * Genera y sube los binarios de las fotos del seed.
 *
 * El seed crea filas `Photo` con claves de storage, pero no escribe objetos.
 * Este script recorre las fotos, usa la imagen local `assets/demo/seed/<id>.*`
 * si existe y, si no, genera un JPEG determinista con `sharp`. Después aplica
 * el mismo pipeline que la subida real (original + display + thumb) y actualiza
 * la fila con las dimensiones y el tamaño reales.
 *
 * Las imágenes locales se vuelven a subir en cada ejecución para que un cambio
 * de archivo se refleje sin borrar objetos. Las generadas son idempotentes: si
 * el objeto ya existe, se saltan. No borra datos.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../src/config.ts';
import { createPrismaClient } from '../src/db.ts';
import { processImage, processOriginal } from '../src/services/images.ts';
import { createS3StorageService } from '../src/services/storage-s3.ts';

const WIDTH = 1600;
const HEIGHT = 1067;

/**
 * Local, unversioned source images. They are ignored by git and keep the
 * repository free of third-party photos; when the folder is absent the script
 * falls back to the deterministic gradient used before.
 */
const SEED_IMAGES_DIR = fileURLToPath(new URL('../../../assets/demo/seed/', import.meta.url));
const SEED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

async function loadSeedImage(id: string): Promise<Buffer | null> {
  for (const extension of SEED_IMAGE_EXTENSIONS) {
    const path = join(SEED_IMAGES_DIR, `${id}.${extension}`);

    if (existsSync(path)) {
      return readFile(path);
    }
  }

  return null;
}

/** Color estable por foto para que dos ejecuciones den el mismo binario. */
function colorFromId(id: string): { r: number; g: number; b: number } {
  let hash = 0;

  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }

  const h = hash / 360;
  const s = 0.42;
  const l = 0.45;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let value = t;

    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;

    return p;
  };

  return {
    r: Math.round(channel(h + 1 / 3) * 255),
    g: Math.round(channel(h) * 255),
    b: Math.round(channel(h - 1 / 3) * 255),
  };
}

async function buildJpeg(id: string): Promise<Buffer> {
  const { default: sharp } = await import('sharp');
  const base = colorFromId(id);
  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${base.r},${base.g},${base.b})"/>
      <stop offset="100%" stop-color="rgb(${Math.round(base.r * 0.45)},${Math.round(base.g * 0.45)},${Math.round(base.b * 0.45)})"/>
    </linearGradient></defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
    <circle cx="${WIDTH * 0.72}" cy="${HEIGHT * 0.28}" r="${HEIGHT * 0.16}" fill="#fff" opacity="0.18"/>
    <circle cx="${WIDTH * 0.2}" cy="${HEIGHT * 0.78}" r="${HEIGHT * 0.22}" fill="#fff" opacity="0.10"/>
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

async function main(): Promise<void> {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);

  if (
    config.s3Endpoint === undefined ||
    config.s3Bucket === undefined ||
    config.s3AccessKeyId === undefined ||
    config.s3SecretAccessKey === undefined
  ) {
    throw new Error('Faltan S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID o S3_SECRET_ACCESS_KEY.');
  }

  const storage = createS3StorageService({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    bucket: config.s3Bucket,
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    forcePathStyle: config.s3ForcePathStyle,
  });

  const photos = await prisma.photo.findMany({
    select: { id: true, thumbKey: true, displayKey: true, originalKey: true },
  });

  let created = 0;
  let skipped = 0;
  let fromFiles = 0;

  for (const photo of photos) {
    const existing = await storage.get(photo.thumbKey);
    const source = await loadSeedImage(photo.id);

    if (source === null && existing !== null) {
      skipped += 1;
      continue;
    }

    if (source !== null) {
      fromFiles += 1;
    }

    const input = source ?? (await buildJpeg(photo.id));
    const original = await processOriginal(input, 'image/jpeg');
    const variants = await processImage(input);

    await storage.put(photo.originalKey, original.buffer, original.mimeType);
    await storage.put(photo.displayKey, variants.display.buffer, 'image/webp');
    await storage.put(photo.thumbKey, variants.thumb.buffer, 'image/webp');

    await prisma.photo.update({
      where: { id: photo.id },
      data: {
        mimeType: original.mimeType,
        size: original.buffer.length,
        width: original.width,
        height: original.height,
      },
    });

    created += 1;
  }

  await prisma.$disconnect();
  // eslint-disable-next-line no-console -- script de línea de comandos
  console.log(
    `seed-images: ${created} subidas (${fromFiles} desde assets/demo/seed), ${skipped} ya tenian objeto.`,
  );
}

await main();
