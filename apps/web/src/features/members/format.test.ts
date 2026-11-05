import { describe, expect, it } from 'vitest';

import {
  buildInviteUrl,
  formatInvitationTiming,
  formatJoinedAt,
  formatMemberPhotos,
  formatPendingCount,
  formatPendingLabel,
  formatRole,
  invitationExpiryDays,
} from './format';

describe('formatJoinedAt', () => {
  it('devuelve mes y año en UTC', () => {
    expect(formatJoinedAt('2024-03-15T23:30:00.000Z')).toBe('mar 2024');
    expect(formatJoinedAt('2025-01-01T00:30:00.000Z')).toBe('ene 2025');
  });

  it('devuelve una cadena vacía con una fecha inválida', () => {
    expect(formatJoinedAt('no-es-fecha')).toBe('');
  });
});

describe('formatInvitationTiming', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');

  it('usa «hoy» y «en 5 días»', () => {
    expect(
      formatInvitationTiming(
        { createdAt: '2026-11-04T08:00:00.000Z', expiresAt: '2026-11-09T12:00:00.000Z' },
        now,
      ),
    ).toBe('Enviada hoy · caduca en 5 días');
  });

  it('usa «en 2 días» con unidad', () => {
    expect(
      formatInvitationTiming(
        { createdAt: '2026-11-03T12:00:00.000Z', expiresAt: '2026-11-06T12:00:00.000Z' },
        now,
      ),
    ).toBe('Enviada hace 1 día · caduca en 2 días');
  });

  it('calcula los días de caducidad para el icono de aviso', () => {
    expect(invitationExpiryDays('2026-11-05T12:00:00.000Z', now)).toBe(1);
    expect(invitationExpiryDays('2026-11-09T12:00:00.000Z', now)).toBe(5);
  });

  it('usa «hace 2 días» y «mañana»', () => {
    expect(
      formatInvitationTiming(
        { createdAt: '2026-11-02T12:00:00.000Z', expiresAt: '2026-11-05T12:00:00.000Z' },
        now,
      ),
    ).toBe('Enviada hace 2 días · caduca mañana');
  });

  it('usa el singular de un día', () => {
    expect(
      formatInvitationTiming(
        { createdAt: '2026-11-03T12:00:00.000Z', expiresAt: '2026-11-05T12:00:00.000Z' },
        now,
      ),
    ).toBe('Enviada hace 1 día · caduca mañana');
  });

  it('trata una caducidad pasada como «caduca hoy»', () => {
    expect(
      formatInvitationTiming(
        { createdAt: '2026-11-01T12:00:00.000Z', expiresAt: '2026-11-03T12:00:00.000Z' },
        now,
      ),
    ).toBe('Enviada hace 3 días · caduca hoy');
  });
});

describe('formatMemberPhotos', () => {
  it('distingue sin etiquetas, singular y plural', () => {
    expect(formatMemberPhotos(0)).toBe('Sin etiquetas');
    expect(formatMemberPhotos(1)).toBe('1 foto');
    expect(formatMemberPhotos(142)).toBe('142 fotos');
    expect(formatMemberPhotos(1240)).toBe('1.240 fotos');
  });
});

describe('formatRole', () => {
  it('traduce owner y member', () => {
    expect(formatRole('owner')).toBe('Administrador');
    expect(formatRole('member')).toBe('Miembro');
  });
});

describe('buildInviteUrl', () => {
  it('compone origen y token codificado', () => {
    expect(buildInviteUrl('https://memora.test', 'tok_1')).toBe('https://memora.test/invite/tok_1');
    expect(buildInviteUrl('https://memora.test/', 'a/b c')).toBe(
      'https://memora.test/invite/a%2Fb%20c',
    );
  });
});

describe('contadores de pendientes', () => {
  it('muestra el número y «100+» cuando hay más páginas', () => {
    expect(formatPendingCount(2, false)).toBe('2');
    expect(formatPendingCount(100, true)).toBe('100+');
    expect(formatPendingLabel(2, false)).toBe('2 invitaciones pendientes');
    expect(formatPendingLabel(1, false)).toBe('1 invitación pendiente');
    expect(formatPendingLabel(100, true)).toBe('100+ invitaciones pendientes');
  });
});
