import type { InvitationPreviewDto } from '@memora/shared';

import type { InvitationPageData, InvitationViewer } from './page-data';

export const testInvitationToken = 'tok_familia_garcia';

export const testViewer: InvitationViewer = {
  name: 'Sofía Martín',
  email: 'sofia.martin@correo.es',
};

export const validPreview: InvitationPreviewDto = {
  circleName: 'Familia García',
  inviterName: 'Lucas Vidal',
  expiresAt: '2026-10-24T20:00:00.000Z',
  state: 'valid',
};

export function previewWithState(state: InvitationPreviewDto['state']): InvitationPreviewDto {
  return { ...validPreview, state };
}

export function invitationData(
  preview: InvitationPreviewDto = validPreview,
  viewer: InvitationViewer | null = testViewer,
): InvitationPageData {
  return {
    kind: 'preview',
    token: testInvitationToken,
    origin: 'https://memora.test',
    preview,
    viewer,
  };
}

export const invalidInvitationData: InvitationPageData = {
  kind: 'invalid',
  token: testInvitationToken,
  origin: 'https://memora.test',
};

export const failedInvitationData: InvitationPageData = {
  kind: 'error',
  token: testInvitationToken,
  origin: 'https://memora.test',
};
