import { describe, expect, it, vi } from 'vitest';

import { shareInvitation } from './share';

const INVITE_URL = 'https://memora.test/invite/tok_1';

describe('compartir y copiar invitaciones', () => {
  it('usa la hoja nativa y devuelve shared', async () => {
    const share = vi.fn(() => Promise.resolve());

    await expect(
      shareInvitation(
        { title: 'Familia García', text: 'Te invito a mi círculo', url: INVITE_URL },
        { share, writeText: vi.fn() },
      ),
    ).resolves.toBe('shared');

    expect(share).toHaveBeenCalledWith({
      title: 'Familia García',
      text: 'Te invito a mi círculo',
      url: INVITE_URL,
    });
  });

  it('devuelve cancelled si el usuario cierra la hoja nativa', async () => {
    const share = vi.fn(() => {
      const error = new Error('Cerrado');
      error.name = 'AbortError';
      return Promise.reject(error);
    });
    const writeText = vi.fn(() => Promise.resolve());

    await expect(shareInvitation({ url: INVITE_URL }, { share, writeText })).resolves.toBe(
      'cancelled',
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it('cae al portapapeles si share falla por permisos', async () => {
    const share = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    const writeText = vi.fn(() => Promise.resolve());

    await expect(shareInvitation({ url: INVITE_URL }, { share, writeText })).resolves.toBe(
      'copied',
    );
    expect(writeText).toHaveBeenCalledWith(INVITE_URL);
  });

  it('copia directamente si el navegador no tiene share', async () => {
    const writeText = vi.fn(() => Promise.resolve());

    await expect(shareInvitation({ url: INVITE_URL }, { writeText })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(INVITE_URL);
  });

  it('devuelve unsupported sin ninguna API disponible', async () => {
    await expect(shareInvitation({ url: INVITE_URL }, {})).resolves.toBe('unsupported');
  });

  it('devuelve unsupported si el portapapeles falla', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('Bloqueado')));

    await expect(shareInvitation({ url: INVITE_URL }, { writeText })).resolves.toBe('unsupported');
  });
});
