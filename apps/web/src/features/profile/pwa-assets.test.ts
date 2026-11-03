import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { INSTALL_COPY } from './install-copy';

const webRoot = process.cwd();
const publicRoot = path.join(webRoot, 'public');
const manifestPath = path.join(publicRoot, 'manifest.webmanifest');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPngHeader(file: string) {
  const buffer = readFileSync(path.join(publicRoot, file));
  const signature = buffer.subarray(0, 8).toString('hex');

  return {
    signature,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

const PNG_SIGNATURE = '89504e470d0a1a0a';

const manifestText = readFileSync(manifestPath, 'utf8');
const parsedManifest: unknown = JSON.parse(manifestText);

describe('manifiesto de la PWA', () => {
  it('es un JSON válido con los campos obligatorios', () => {
    expect(isRecord(parsedManifest)).toBe(true);

    if (!isRecord(parsedManifest)) {
      throw new Error('El manifiesto no es un objeto JSON');
    }

    expect(parsedManifest['name']).toBe('Memora');
    expect(parsedManifest['short_name']).toBe('Memora');
    expect(parsedManifest['lang']).toBe('es');
    expect(parsedManifest['start_url']).toBe('/circles');
    expect(parsedManifest['scope']).toBe('/');
    expect(parsedManifest['display']).toBe('standalone');
    expect(parsedManifest['background_color']).toBe('#F6F6FA');
    expect(parsedManifest['theme_color']).toBe('#F6F6FA');
    expect(parsedManifest).not.toHaveProperty('prefer_related_applications');
  });

  it('declara iconos any y maskable de 192 y 512', () => {
    const icons = isRecord(parsedManifest) ? parsedManifest['icons'] : undefined;

    expect(Array.isArray(icons)).toBe(true);

    if (!Array.isArray(icons)) {
      throw new Error('El manifiesto no declara iconos');
    }

    const declared = icons.map((icon: unknown) => {
      if (!isRecord(icon)) {
        throw new Error('Icono del manifiesto con formato inesperado');
      }

      return {
        src: String(icon['src']),
        sizes: String(icon['sizes']),
        type: String(icon['type']),
        purpose: String(icon['purpose']),
      };
    });

    expect(declared).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({
          src: '/icons/icon-maskable-192.png',
          sizes: '192x192',
          purpose: 'maskable',
        }),
        expect.objectContaining({
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          purpose: 'maskable',
        }),
      ]),
    );

    for (const icon of declared) {
      expect(icon.type).toBe('image/png');
    }
  });

  it('los PNG existen, son opacos y sus dimensiones reales coinciden', () => {
    const icons = isRecord(parsedManifest) ? parsedManifest['icons'] : [];

    if (!Array.isArray(icons)) {
      throw new Error('El manifiesto no declara iconos');
    }

    for (const icon of icons) {
      if (!isRecord(icon)) {
        throw new Error('Icono del manifiesto con formato inesperado');
      }

      const src = String(icon['src']);
      const expectedSize = Number.parseInt(String(icon['sizes']).split('x')[0] ?? '', 10);
      const header = readPngHeader(src);

      expect(src.startsWith('/icons/')).toBe(true);
      expect(header.signature).toBe(PNG_SIGNATURE);
      // Color type 2 = RGB sin canal alfa: el icono es opaco.
      expect(header.colorType).toBe(2);
      expect(header.bitDepth).toBe(8);
      expect(header.width).toBe(expectedSize);
      expect(header.height).toBe(expectedSize);
    }
  });

  it('incluye apple-touch-icon de 180 px', () => {
    const header = readPngHeader('/icons/apple-touch-icon-180.png');

    expect(header.signature).toBe(PNG_SIGNATURE);
    expect(header.colorType).toBe(2);
    expect(header.width).toBe(180);
    expect(header.height).toBe(180);
  });

  it('no promete funcionamiento offline', () => {
    const offlinePattern = /\b(offline|sin conexión|sin internet|funciona sin|funcionar sin)\b/i;
    const copies = Object.values(INSTALL_COPY).join(' ');

    expect(manifestText).not.toMatch(offlinePattern);
    expect(copies).not.toMatch(offlinePattern);
  });
});
