import { describe, expect, it } from 'vitest';

import {
  buildInvitationHead,
  invitationHeadCopy,
  invitationLoginHref,
  invitationPageUrl,
} from './page-data';
import {
  failedInvitationData,
  invitationData,
  invalidInvitationData,
  previewWithState,
  testInvitationToken,
} from './test-fixtures';

function metaContent(
  head: ReturnType<typeof buildInvitationHead>,
  key: 'property' | 'name',
  value: string,
): string | undefined {
  return head.meta.find((tag) => tag[key] === value)?.content;
}

function expectNoIndex(head: ReturnType<typeof buildInvitationHead>): void {
  expect(metaContent(head, 'name', 'robots')).toBe('noindex');
}

describe('metadatos Open Graph de la invitación', () => {
  it('usa el nombre del círculo en og:title y genera URLs absolutas', () => {
    const head = buildInvitationHead(invitationData());

    expect(metaContent(head, 'property', 'og:title')).toBe(
      'Lucas Vidal te invita a Familia García',
    );
    expect(metaContent(head, 'property', 'og:description')).toContain('círculo privado');
    expect(metaContent(head, 'property', 'og:image')).toBe('https://memora.test/og/invite.png');
    expect(metaContent(head, 'property', 'og:url')).toBe(
      `https://memora.test/invite/${testInvitationToken}`,
    );
    expect(metaContent(head, 'property', 'og:type')).toBe('website');
    expect(metaContent(head, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(metaContent(head, 'name', 'twitter:image')).toBe('https://memora.test/og/invite.png');
    expectNoIndex(head);
  });

  it('mantiene el nombre del círculo en estados no aceptables', () => {
    for (const state of ['expired', 'revoked', 'already_member'] as const) {
      const head = buildInvitationHead(invitationData(previewWithState(state)));

      expect(invitationHeadCopy(invitationData(previewWithState(state))).title).toContain(
        'Familia García',
      );
      expect(metaContent(head, 'property', 'og:title')).toContain('Familia García');
      expectNoIndex(head);
    }
  });

  it('usa metadatos genéricos para un enlace desconocido', () => {
    const head = buildInvitationHead(invalidInvitationData);

    expect(metaContent(head, 'property', 'og:title')).toBe(
      'Enlace de invitación no válido · Memora',
    );
    expect(metaContent(head, 'property', 'og:image')).toBe('https://memora.test/og/invite.png');
    expect(metaContent(head, 'property', 'og:url')).toBe(
      `https://memora.test/invite/${testInvitationToken}`,
    );
    expectNoIndex(head);
  });

  it('genera metadatos absolutos también cuando la API falla', () => {
    const head = buildInvitationHead(failedInvitationData);

    expect(metaContent(head, 'property', 'og:url')).toBe(
      `https://memora.test/invite/${testInvitationToken}`,
    );
    expect(metaContent(head, 'name', 'twitter:card')).toBe('summary_large_image');
    expectNoIndex(head);
  });

  it('marca noindex incluso si el head se evalúa sin datos', () => {
    expectNoIndex(buildInvitationHead(undefined));
  });

  it('construye el redirect de login con el token codificado', () => {
    const data = {
      ...invalidInvitationData,
      token: 'tok con espacios/uno',
    };

    expect(invitationLoginHref(data)).toBe(
      `/login?redirect=${encodeURIComponent('/invite/tok%20con%20espacios%2Funo')}`,
    );
    expect(invitationPageUrl(data)).toBe('https://memora.test/invite/tok%20con%20espacios%2Funo');
  });
});
